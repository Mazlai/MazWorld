<?php

namespace App\EventSubscriber;

use App\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;

class ApiRateLimitSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly Security $security,
        #[Autowire(service: 'limiter.api_global')]
        private readonly RateLimiterFactory $limiter,
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::REQUEST => ['onKernelRequest', -10]];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        if (!str_starts_with($event->getRequest()->getPathInfo(), '/api/')) {
            return;
        }

        $user = $this->security->getUser();
        if (!$user instanceof User) {
            return;
        }

        $limit = $this->limiter->create($user->getUserId())->consume();
        if (!$limit->isAccepted()) {
            $seconds = max(0, $limit->getRetryAfter()->getTimestamp() - time());
            $response = new JsonResponse(['error' => 'Too many requests'], Response::HTTP_TOO_MANY_REQUESTS);
            $response->headers->set('Retry-After', (string) $seconds);
            $event->setResponse($response);
        }
    }
}

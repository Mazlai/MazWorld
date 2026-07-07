<?php

namespace App\EventSubscriber;

use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTExpiredEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTInvalidEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class JwtSecurityLogSubscriber implements EventSubscriberInterface
{
    public function __construct(
        #[Autowire(service: 'monolog.logger.security')]
        private readonly LoggerInterface $securityLogger,
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            Events::JWT_INVALID => 'onJWTInvalid',
            Events::JWT_EXPIRED => 'onJWTExpired',
        ];
    }

    public function onJWTInvalid(JWTInvalidEvent $event): void
    {
        $request = $event->getRequest();
        $this->securityLogger->warning('Invalid JWT token', [
            'ip' => $request->getClientIp(),
            'path' => $request->getPathInfo(),
        ]);
    }

    public function onJWTExpired(JWTExpiredEvent $event): void
    {
        $request = $event->getRequest();
        $this->securityLogger->info('Expired JWT token', [
            'ip' => $request->getClientIp(),
            'path' => $request->getPathInfo(),
        ]);
    }
}

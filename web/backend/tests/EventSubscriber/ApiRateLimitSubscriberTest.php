<?php

namespace App\Tests\EventSubscriber;

use App\Entity\User;
use App\EventSubscriber\ApiRateLimitSubscriber;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\RateLimiter\Storage\InMemoryStorage;

use PHPUnit\Framework\Attributes\Group;
#[Group('unit')]
class ApiRateLimitSubscriberTest extends TestCase
{
    private Security&MockObject $security;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
    }

    private function makeSubscriber(int $limit = 1000, ?InMemoryStorage $storage = null): ApiRateLimitSubscriber
    {
        $factory = new RateLimiterFactory([
            'id' => 'api_test',
            'policy' => 'fixed_window',
            'limit' => $limit,
            'interval' => '1 minute',
        ], $storage ?? new InMemoryStorage());
        return new ApiRateLimitSubscriber($this->security, $factory);
    }

    private function makeEvent(string $path, bool $isMainRequest = true): RequestEvent
    {
        $kernel      = $this->createMock(HttpKernelInterface::class);
        $requestType = $isMainRequest ? HttpKernelInterface::MAIN_REQUEST : HttpKernelInterface::SUB_REQUEST;
        return new RequestEvent($kernel, Request::create($path), $requestType);
    }

    // ===== getSubscribedEvents() =====

    public function testGetSubscribedEventsListensToKernelRequest(): void
    {
        $this->assertArrayHasKey(KernelEvents::REQUEST, ApiRateLimitSubscriber::getSubscribedEvents());
    }

    // ===== onKernelRequest() =====

    public function testSkipsSubRequests(): void
    {
        $event = $this->makeEvent('/api/test', isMainRequest: false);
        $this->makeSubscriber()->onKernelRequest($event);
        $this->assertNull($event->getResponse());
    }

    public function testSkipsNonApiPaths(): void
    {
        $event = $this->makeEvent('/about');
        $this->makeSubscriber()->onKernelRequest($event);
        $this->assertNull($event->getResponse());
    }

    public function testSkipsWhenUserIsNotAuthenticated(): void
    {
        $this->security->method('getUser')->willReturn(null);

        $event = $this->makeEvent('/api/me');
        $this->makeSubscriber()->onKernelRequest($event);
        $this->assertNull($event->getResponse());
    }

    public function testDoesNothingWhenRateLimitIsAccepted(): void
    {
        $user = $this->createMock(User::class);
        $user->method('getUserId')->willReturn('42');
        $this->security->method('getUser')->willReturn($user);

        $event = $this->makeEvent('/api/inventory');
        $this->makeSubscriber(1000)->onKernelRequest($event);

        $this->assertNull($event->getResponse());
    }

    public function testSets429WithRetryAfterWhenLimitExceeded(): void
    {
        $user = $this->createMock(User::class);
        $user->method('getUserId')->willReturn('42');
        $this->security->method('getUser')->willReturn($user);

        $storage = new InMemoryStorage();
        $factory = new RateLimiterFactory([
            'id' => 'api_exceed',
            'policy' => 'fixed_window',
            'limit' => 1,
            'interval' => '1 minute',
        ], $storage);

        // Pré-épuise le quota : l'utilisateur '42' a consommé son seul token
        $factory->create('42')->consume();

        $subscriber = new ApiRateLimitSubscriber($this->security, $factory);
        $event      = $this->makeEvent('/api/shop');
        $subscriber->onKernelRequest($event);

        $response = $event->getResponse();
        $this->assertNotNull($response);
        $this->assertSame(Response::HTTP_TOO_MANY_REQUESTS, $response->getStatusCode());
        $this->assertGreaterThan(0, (int) $response->headers->get('Retry-After'));
        $this->assertArrayHasKey('error', json_decode($response->getContent(), true));
    }
}
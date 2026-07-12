<?php

namespace App\Tests\EventSubscriber;

use App\EventSubscriber\JwtSecurityLogSubscriber;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTExpiredEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTInvalidEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Exception\AuthenticationException;

#[Group('unit')]
class JwtSecurityLogSubscriberTest extends TestCase
{
    /** @var LoggerInterface&MockObject */
    private $logger;
    private JwtSecurityLogSubscriber $subscriber;

    protected function setUp(): void
    {
        $this->logger     = $this->createMock(LoggerInterface::class);
        $this->subscriber = new JwtSecurityLogSubscriber($this->logger);
    }

    // ===== getSubscribedEvents() =====

    public function testGetSubscribedEventsListensToJwtInvalidAndExpired(): void
    {
        $events = JwtSecurityLogSubscriber::getSubscribedEvents();
        $this->assertArrayHasKey(Events::JWT_INVALID, $events);
        $this->assertArrayHasKey(Events::JWT_EXPIRED, $events);
    }

    // ===== onJWTInvalid() =====

    public function testOnJwtInvalidLogsWarningWithIpAndPath(): void
    {
        $event = new JWTInvalidEvent(new AuthenticationException('Invalid token'), null, Request::create('/api/me'));

        $this->logger->expects($this->once())
            ->method('warning')
            ->with('Invalid JWT token', $this->callback(fn($ctx) => isset($ctx['ip'], $ctx['path'])));

        $this->subscriber->onJWTInvalid($event);
    }

    // ===== onJWTExpired() =====

    public function testOnJwtExpiredLogsInfoWithIpAndPath(): void
    {
        $event = new JWTExpiredEvent(new AuthenticationException('Token expired'), null, Request::create('/api/profile'));

        $this->logger->expects($this->once())
            ->method('info')
            ->with('Expired JWT token', $this->callback(fn($ctx) => isset($ctx['ip'], $ctx['path'])));

        $this->subscriber->onJWTExpired($event);
    }
}
<?php

namespace App\Tests\EventSubscriber;

use App\EventSubscriber\JwtBlacklistSubscriber;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTAuthenticatedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Cache\CacheItemInterface;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;

#[Group('unit')]
class JwtBlacklistSubscriberTest extends TestCase
{
    /** @var CacheItemPoolInterface&MockObject */
    private $cache;
    private JwtBlacklistSubscriber $subscriber;

    protected function setUp(): void
    {
        $this->cache      = $this->createMock(CacheItemPoolInterface::class);
        $this->subscriber = new JwtBlacklistSubscriber($this->cache);
    }

    private function makeEvent(array $payload): JWTAuthenticatedEvent
    {
        $event = $this->createMock(JWTAuthenticatedEvent::class);
        $event->method('getPayload')->willReturn($payload);

        return $event;
    }

    private function makeCacheItem(bool $isHit, mixed $value = null): CacheItemInterface
    {
        $item = $this->createMock(CacheItemInterface::class);
        $item->method('isHit')->willReturn($isHit);
        $item->method('get')->willReturn($value);

        return $item;
    }

    // ===== getSubscribedEvents() =====

    public function testGetSubscribedEventsListensToJwtAuthenticated(): void
    {
        $events = JwtBlacklistSubscriber::getSubscribedEvents();

        $this->assertArrayHasKey(Events::JWT_AUTHENTICATED, $events);
    }

    // ===== onJWTAuthenticated() =====

    public function testIgnoresPayloadWithoutUserId(): void
    {
        $this->cache->expects($this->never())->method('getItem');

        $this->subscriber->onJWTAuthenticated($this->makeEvent(['iat' => time()]));
    }

    public function testDoesNothingWhenNotBlacklisted(): void
    {
        $this->cache->method('getItem')->willReturn($this->makeCacheItem(false));

        // Aucune exception attendue
        $this->subscriber->onJWTAuthenticated($this->makeEvent(['user_id' => '123', 'iat' => time()]));
        $this->addToAssertionCount(1);
    }

    public function testDoesNothingWhenTokenIssuedAfterBlacklist(): void
    {
        $blacklistTime = time() - 100;
        $iat           = time();  // token émis APRÈS la blacklist → valide

        $this->cache->method('getItem')->willReturn($this->makeCacheItem(true, $blacklistTime));

        $this->subscriber->onJWTAuthenticated($this->makeEvent(['user_id' => '123', 'iat' => $iat]));
        $this->addToAssertionCount(1);
    }

    public function testThrowsAuthenticationExceptionWhenTokenRevoked(): void
    {
        $blacklistTime = time();
        $iat           = time() - 60; // token émis AVANT la blacklist → révoqué

        $this->cache->method('getItem')->willReturn($this->makeCacheItem(true, $blacklistTime));

        $this->expectException(AuthenticationException::class);
        $this->subscriber->onJWTAuthenticated($this->makeEvent(['user_id' => '123', 'iat' => $iat]));
    }
}

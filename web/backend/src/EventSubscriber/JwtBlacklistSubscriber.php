<?php

namespace App\EventSubscriber;

use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTAuthenticatedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;

class JwtBlacklistSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly CacheItemPoolInterface $cache) {}

    public static function getSubscribedEvents(): array
    {
        return [Events::JWT_AUTHENTICATED => 'onJWTAuthenticated'];
    }

    public function onJWTAuthenticated(JWTAuthenticatedEvent $event): void
    {
        $payload = $event->getPayload();
        $userId = $payload['user_id'] ?? null;
        $iat = $payload['iat'] ?? 0;

        if (!$userId) {
            return;
        }

        $item = $this->cache->getItem('jwt_blacklist_' . $userId);
        if ($item->isHit() && $iat < $item->get()) {
            throw new AuthenticationException('JWT has been revoked');
        }
    }
}

<?php

namespace App\Tests\Controller\API;

use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\BrowserKit\Cookie;

use PHPUnit\Framework\Attributes\Group;
#[Group('integration')]
class AuthControllerTest extends AbstractApiWebTestCase
{
    // ===== GET /api/auth/discord/login =====

    public function testDiscordLoginReturnsAuthorizationUrl(): void
    {
        $this->get('/api/auth/discord/login');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertArrayHasKey('authorization_url', $data);
        $this->assertArrayHasKey('state', $data);
        $this->assertStringContainsString('discord.com', $data['authorization_url']);
    }

    public function testDiscordLoginStateIs32HexChars(): void
    {
        $this->get('/api/auth/discord/login');

        $state = $this->json()['state'];
        $this->assertMatchesRegularExpression('/^[0-9a-f]{32}$/', $state);
    }

    // ===== POST /api/auth/discord/callback =====

    public function testCallbackWithMissingStateReturns400(): void
    {
        $this->post('/api/auth/discord/callback', ['code' => 'somecode']);

        $this->assertSame(400, $this->statusCode());
    }

    public function testCallbackWithInvalidStateReturns400(): void
    {
        $this->post('/api/auth/discord/callback', ['state' => 'nonexistent_state_xyz', 'code' => 'someCode']);

        $this->assertSame(400, $this->statusCode());
    }

    public function testCallbackWithValidStateButMissingCodeReturns400(): void
    {
        /** @var CacheItemPoolInterface $cache */
        $cache = static::getContainer()->get(CacheItemPoolInterface::class);
        $state = 'teststate_' . uniqid();
        $item = $cache->getItem('oauth_state_' . $state);
        $item->set(true)->expiresAfter(300);
        $cache->save($item);

        $this->post('/api/auth/discord/callback', ['state' => $state]);

        $this->assertSame(400, $this->statusCode());
    }

    // ===== POST /api/auth/refresh =====

    public function testRefreshWithNoCookieReturns401(): void
    {
        $this->post('/api/auth/refresh');

        $this->assertSame(401, $this->statusCode());
    }

    public function testRefreshWithInvalidCookieReturns401(): void
    {
        $this->client->getCookieJar()->set(
            new Cookie('mw_refresh', 'totally_invalid_token', time() + 3600, '/api/auth')
        );
        $this->post('/api/auth/refresh');

        $this->assertSame(401, $this->statusCode());
    }

    public function testRefreshWithValidCacheEntryReturns200(): void
    {
        $user = $this->createTestUser();
        $rawToken = bin2hex(random_bytes(32));

        /** @var CacheItemPoolInterface $cache */
        $cache = static::getContainer()->get(CacheItemPoolInterface::class);
        $cacheKey = 'refresh_token_' . hash('sha256', $rawToken);
        $item = $cache->getItem($cacheKey);
        $item->set($user->getUserId())->expiresAfter(604800);
        $cache->save($item);

        $this->client->getCookieJar()->set(
            new Cookie('mw_refresh', $rawToken, time() + 604800, '/api/auth')
        );
        $this->post('/api/auth/refresh');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertArrayHasKey('token', $data);
        $this->assertArrayHasKey('user', $data);
    }

    // ===== POST /api/auth/logout =====

    public function testLogoutWithoutAuthReturns401(): void
    {
        $this->post('/api/auth/logout');

        $this->assertSame(401, $this->statusCode());
    }

    public function testLogoutWithAuthCreatesBlacklistEntry(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->post('/api/auth/logout');

        $this->assertSame(200, $this->statusCode());

        /** @var CacheItemPoolInterface $cache */
        $cache = static::getContainer()->get(CacheItemPoolInterface::class);
        $item = $cache->getItem('jwt_blacklist_' . $user->getUserId());
        $this->assertTrue($item->isHit(), 'Le cache de blacklist JWT doit être créé après le logout.');
    }

    // ===== GET /api/auth/me =====

    public function testMeWithoutJwtReturns401(): void
    {
        $this->get('/api/auth/me');

        $this->assertSame(401, $this->statusCode());
    }

    public function testMeWithValidJwtReturnsUserData(): void
    {
        $user = $this->createTestUser(username: 'TestableMazlai');
        $this->auth($user);

        $this->get('/api/auth/me');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertArrayHasKey('user', $data);
        $this->assertSame('TestableMazlai', $data['user']['username']);
    }

    // ===== GET /api/auth/verify =====

    public function testVerifyWithoutJwtReturnsValidFalse(): void
    {
        $this->get('/api/auth/verify');

        $this->assertSame(200, $this->statusCode());
        $this->assertFalse($this->json()['valid']);
        $this->assertNull($this->json()['user']);
    }

    public function testVerifyWithValidJwtReturnsValidTrue(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->get('/api/auth/verify');

        $this->assertSame(200, $this->statusCode());
        $this->assertTrue($this->json()['valid']);
        $this->assertArrayHasKey('user', $this->json());
    }
}

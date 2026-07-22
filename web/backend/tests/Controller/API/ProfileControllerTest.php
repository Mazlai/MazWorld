<?php

namespace App\Tests\Controller\API;

use App\Service\Crypto\TokenEncryptorService;
use PHPUnit\Framework\Attributes\Group;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

#[Group('integration')]
class ProfileControllerTest extends AbstractApiWebTestCase
{
    // ===== GET /api/profile/me =====

    public function testGetProfileWithoutJwtReturns401(): void
    {
        $this->get('/api/profile/me');
        $this->assertSame(401, $this->statusCode());
    }

    public function testGetProfileReturnsAllExpectedKeys(): void
    {
        $user = $this->createTestUser(username: 'ProfileUser');
        $this->auth($user);

        $this->get('/api/profile/me');

        $this->assertSame(200, $this->statusCode());
        $profile = $this->json()['profile'];
        $this->assertSame('ProfileUser', $profile['username']);
        $this->assertArrayHasKey('user_id', $profile);
        $this->assertArrayHasKey('coins', $profile);
        $this->assertArrayHasKey('equipped_background', $profile);
        $this->assertArrayHasKey('equipped_badges', $profile);
        $this->assertArrayHasKey('current_city', $profile);
        $this->assertArrayHasKey('visited_cities_count', $profile);
    }

    public function testGetProfileShowsEquippedBadges(): void
    {
        $user = $this->createTestUser();
        $this->addInventory($user, 'badge_verified', 'badge');
        $this->addEquippedBadge($user, 'badge_verified', 0);
        $this->auth($user);

        $this->get('/api/profile/me');

        $this->assertSame(200, $this->statusCode());
        $badges = $this->json()['profile']['equipped_badges'];
        $this->assertContains('badge_verified', $badges);
    }

    // ===== GET /api/profile/guilds =====

    public function testGetGuildsWithoutJwtReturns401(): void
    {
        $this->get('/api/profile/guilds');
        $this->assertSame(401, $this->statusCode());
    }

    public function testGetGuildsWithNoOAuthTokenReturnsEmptyArray(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->get('/api/profile/guilds');

        $this->assertSame(200, $this->statusCode());
        $this->assertSame([], $this->json()['guilds']);
    }

    // Non-régression : même bug et même correctif que ServersController — le token
    // OAuth est stocké chiffré (TokenEncryptorService). Un test qui l'utiliserait tel
    // quel sans le déchiffrer ne détecterait pas la régression (token encore chiffré
    // envoyé à Discord, rejeté silencieusement, liste vide sans erreur visible).
    public function testGetGuildsReturnsAdminGuildsWithEncryptedTokenStoredInDb(): void
    {
        $user = $this->createTestUser();
        $tokenEncryptor = static::getContainer()->get(TokenEncryptorService::class);
        $user->setOauthAccessToken($tokenEncryptor->encrypt('discord_access_token_valide'));
        $user->setOauthTokenExpiresAt(time() + 3600);
        $this->em->flush();
        $this->auth($user);

        $response = $this->createMock(ResponseInterface::class);
        $response->method('getStatusCode')->willReturn(200);
        $response->method('toArray')->willReturn([
            ['id' => '111', 'name' => 'Guilde administrée', 'icon' => null, 'owner' => true, 'permissions' => '8', 'approximate_member_count' => 5, 'approximate_presence_count' => 1],
        ]);

        $httpClient = $this->createMock(HttpClientInterface::class);
        $httpClient->expects($this->atLeastOnce())
            ->method('request')
            ->with(
                $this->anything(),
                $this->anything(),
                $this->callback(function (array $options) {
                    $auth = $options['headers']['Authorization'] ?? null;

                    return 'Bearer discord_access_token_valide' === $auth || str_starts_with((string) $auth, 'Bot ');
                }),
            )
            ->willReturn($response);
        static::getContainer()->set(HttpClientInterface::class, $httpClient);

        $this->get('/api/profile/guilds');

        $this->assertSame(200, $this->statusCode());
        $guilds = $this->json()['guilds'];
        $this->assertCount(1, $guilds);
        $this->assertSame('Guilde administrée', $guilds[0]['name']);
    }

    // ===== POST /api/profile/equip/background =====

    public function testEquipBackgroundWithoutJwtReturns401(): void
    {
        $this->post('/api/profile/equip/background', ['item_id' => 'bg_blue']);
        $this->assertSame(401, $this->statusCode());
    }

    public function testEquipBackgroundWithMissingItemIdReturns400(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->post('/api/profile/equip/background', []);

        $this->assertSame(400, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testEquipBackgroundNotOwnedReturns403(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->post('/api/profile/equip/background', ['item_id' => 'bg_blue']);

        $this->assertSame(403, $this->statusCode());
    }

    public function testEquipBackgroundSuccess(): void
    {
        $user = $this->createTestUser();
        $this->addInventory($user, 'bg_blue', 'background');
        $this->auth($user);

        $this->post('/api/profile/equip/background', ['item_id' => 'bg_blue']);

        $this->assertSame(200, $this->statusCode());
        $this->assertTrue($this->json()['success']);
        $this->em->refresh($user);
        $this->assertSame('bg_blue', $user->getEquippedBackground());
    }

    // ===== POST /api/profile/equip/badge =====

    public function testEquipBadgeWithoutJwtReturns401(): void
    {
        $this->post('/api/profile/equip/badge', ['badge_id' => 'badge_verified', 'slot' => 0]);
        $this->assertSame(401, $this->statusCode());
    }

    public function testEquipBadgeWithMissingFieldsReturns400(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->post('/api/profile/equip/badge', ['badge_id' => 'badge_verified']);

        $this->assertSame(400, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testEquipBadgeInvalidSlotReturns400(): void
    {
        $user = $this->createTestUser();
        $this->addInventory($user, 'badge_verified', 'badge');
        $this->auth($user);

        $this->post('/api/profile/equip/badge', ['badge_id' => 'badge_verified', 'slot' => 6]);

        $this->assertSame(400, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testEquipBadgeNotOwnedReturns403(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->post('/api/profile/equip/badge', ['badge_id' => 'badge_verified', 'slot' => 0]);

        $this->assertSame(403, $this->statusCode());
    }

    public function testEquipBadgeAlreadyEquippedReturns409(): void
    {
        $user = $this->createTestUser();
        $this->addInventory($user, 'badge_verified', 'badge');
        $this->addEquippedBadge($user, 'badge_verified', 0);
        $this->auth($user);

        // Essaie d'équiper le même badge dans un slot différent — le badge est déjà équipé
        $this->post('/api/profile/equip/badge', ['badge_id' => 'badge_verified', 'slot' => 1]);

        $this->assertSame(409, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testEquipBadgeReplacesExistingBadgeInSlot(): void
    {
        $user = $this->createTestUser();
        $this->addInventory($user, 'badge_verified', 'badge');
        $this->addInventory($user, 'badge_star', 'badge');
        $this->addEquippedBadge($user, 'badge_verified', 0);
        $this->auth($user);

        // Équipe badge_star dans le slot 0 occupé par badge_verified
        $this->post('/api/profile/equip/badge', ['badge_id' => 'badge_star', 'slot' => 0]);

        $this->assertSame(200, $this->statusCode());
        $this->assertTrue($this->json()['success']);
    }

    // ===== POST /api/profile/unequip/badge =====

    public function testUnequipBadgeEmptySlotReturns404(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->post('/api/profile/unequip/badge', ['slot' => 0]);

        $this->assertSame(404, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testUnequipBadgeSuccess(): void
    {
        $user = $this->createTestUser();
        $this->addInventory($user, 'badge_verified', 'badge');
        $this->addEquippedBadge($user, 'badge_verified', 0);
        $this->auth($user);

        $this->post('/api/profile/unequip/badge', ['slot' => 0]);

        $this->assertSame(200, $this->statusCode());
        $this->assertTrue($this->json()['success']);
    }
}

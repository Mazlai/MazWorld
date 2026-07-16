<?php

namespace App\Tests\Controller\API;

use PHPUnit\Framework\Attributes\Group;

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

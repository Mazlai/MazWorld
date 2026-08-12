<?php

namespace App\Tests\Entity;

use App\Entity\City;
use App\Entity\User;
use App\Entity\UserEquippedBadge;
use App\Entity\UserInventory;
use App\Entity\VisitedCity;
use DateTime;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use ReflectionProperty;

#[Group('unit')]
class UserTest extends TestCase
{
    private User $user;

    protected function setUp(): void
    {
        $this->user = new User();
        $this->user->setUserId('123456789');
        $this->user->setUsername('Mazlai');
    }

    // ===== recordLogin() =====

    public function testRecordLoginUpdatesLastLoginAt(): void
    {
        $before = new DateTime();
        $this->user->recordLogin();

        $this->assertNotNull($this->user->getLastLoginAt());
        $this->assertGreaterThanOrEqual($before, $this->user->getLastLoginAt());
    }

    public function testRecordLoginReturnsFluentSelf(): void
    {
        $this->assertSame($this->user, $this->user->recordLogin());
    }

    // ===== isAccessTokenExpired() =====

    public function testIsAccessTokenExpiredReturnsTrueWhenNoExpiry(): void
    {
        $this->assertTrue($this->user->isAccessTokenExpired());
    }

    public function testIsAccessTokenExpiredReturnsTrueWhenExpired(): void
    {
        $this->user->setOauthTokenExpiresAt(time() - 1);

        $this->assertTrue($this->user->isAccessTokenExpired());
    }

    public function testIsAccessTokenExpiredReturnsFalseWhenValid(): void
    {
        $this->user->setOauthTokenExpiresAt(time() + 3600);

        $this->assertFalse($this->user->isAccessTokenExpired());
    }

    // ===== getAvatarUrl() — avatar Discord réel vs avatar par défaut =====

    public function testGetAvatarUrlReturnsDiscordCdnUrlForStaticAvatar(): void
    {
        $this->user->setDiscordAvatar('static_hash');

        $url = $this->user->getAvatarUrl(128);

        $this->assertStringContainsString('cdn.discordapp.com/avatars/123456789/static_hash.png', $url);
        $this->assertStringContainsString('size=128', $url);
    }

    public function testGetAvatarUrlReturnsGifForAnimatedAvatar(): void
    {
        // Discord préfixe les hash d'avatars animés par "a_" — c'est ce préfixe, et lui
        // seul, qui détermine si on sert un .gif plutôt qu'un .png.
        $this->user->setDiscordAvatar('a_animated_hash');

        $this->assertStringContainsString('a_animated_hash.gif', $this->user->getAvatarUrl());
    }

    public function testGetAvatarUrlReturnsDefaultWhenNoAvatar(): void
    {
        // Sans avatar personnalisé, Discord assigne un avatar par défaut parmi 5 selon
        // (user_id % 5) — ici 123456789 % 5 = 4.
        $url = $this->user->getAvatarUrl();

        $this->assertStringContainsString('cdn.discordapp.com/embed/avatars/', $url);
        $this->assertStringEndsWith('4.png', $url);
    }

    public function testGetAvatarUrlDefaultVariesWithUserId(): void
    {
        // Vérifie que l'index n'est pas figé à 4 : un autre user_id doit retomber sur un
        // autre avatar par défaut (1000 % 5 = 0), preuve que le modulo dépend bien de l'ID.
        $autreJoueur = new User();
        $autreJoueur->setUserId('1000');

        $this->assertStringEndsWith('0.png', $autreJoueur->getAvatarUrl());
    }

    // ===== getRoles() =====

    public function testGetRolesAlwaysIncludesRoleUser(): void
    {
        $this->assertContains('ROLE_USER', $this->user->getRoles());
    }

    public function testGetRolesDeduplicatesRoleUser(): void
    {
        $this->user->setRoles(['ROLE_USER', 'ROLE_ADMIN']);

        $roles = $this->user->getRoles();

        $this->assertSame(array_unique($roles), $roles);
        $this->assertContains('ROLE_ADMIN', $roles);
    }

    // ===== Collections — unicité (protection contre les doublons d'équipement/visite) =====

    public function testAddInventoryEnforcesUniqueness(): void
    {
        $item = $this->createMock(UserInventory::class);
        $item->method('setUser')->willReturn($item);

        $this->user->addInventory($item);
        $this->user->addInventory($item); // ajout du même item une seconde fois

        $this->assertCount(1, $this->user->getInventory());
    }

    public function testAddVisitedCityEnforcesUniqueness(): void
    {
        $visited = $this->createMock(VisitedCity::class);
        $visited->method('setUser')->willReturn($visited);

        $this->user->addVisitedCity($visited);
        $this->user->addVisitedCity($visited); // revisite de la même ville

        $this->assertCount(1, $this->user->getVisitedCities());
    }

    // ===== toArray() — sérialisation exposée à l'API =====

    public function testToArrayIncludesExpectedKeys(): void
    {
        $city = $this->createMock(City::class);
        $city->method('getCityId')->willReturn('willowbrook');
        $this->user->setCurrentCity($city);

        $data = $this->user->toArray();

        $this->assertArrayHasKey('user_id', $data);
        $this->assertArrayHasKey('username', $data);
        $this->assertArrayHasKey('discord_email', $data);
        $this->assertArrayHasKey('coins', $data);
        $this->assertArrayHasKey('current_city', $data);
        $this->assertSame('willowbrook', $data['current_city']);
    }

    // ===== getUserIdentifier() — utilisé par Symfony Security =====

    public function testGetUserIdentifierReturnsUserId(): void
    {
        $this->assertSame('123456789', $this->user->getUserIdentifier());
    }

    // ===== Badges équipés — mêmes garanties d'unicité que l'inventaire =====

    public function testAddEquippedBadgeEnforcesUniqueness(): void
    {
        $badge = $this->createMock(UserEquippedBadge::class);
        $badge->method('setUser')->willReturnSelf();

        $this->user->addEquippedBadge($badge);
        $this->user->addEquippedBadge($badge);

        $this->assertCount(1, $this->user->getEquippedBadges());
    }

    public function testRemoveEquippedBadgeDeletesFromCollection(): void
    {
        $badge = $this->createMock(UserEquippedBadge::class);
        $badge->method('setUser')->willReturnSelf();

        $this->user->addEquippedBadge($badge);
        $this->user->removeEquippedBadge($badge);

        $this->assertCount(0, $this->user->getEquippedBadges());
    }

    // ===== updateTimestamp() =====

    public function testUpdateTimestampRefreshesUpdatedAt(): void
    {
        $ref = new ReflectionProperty(User::class, 'updated_at');
        $ref->setAccessible(true);
        $ref->setValue($this->user, new DateTime('2020-01-01'));

        $this->user->updateTimestamp();

        $this->assertGreaterThan(new DateTime('2020-01-01'), $this->user->getUpdatedAt());
    }
}

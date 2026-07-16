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

    // ===== getAvatarUrl() =====

    public function testGetAvatarUrlReturnsDiscordCdnUrlForStaticAvatar(): void
    {
        $this->user->setDiscordAvatar('static_hash');

        $url = $this->user->getAvatarUrl(128);

        $this->assertStringContainsString('cdn.discordapp.com/avatars/123456789/static_hash.png', $url);
        $this->assertStringContainsString('size=128', $url);
    }

    public function testGetAvatarUrlReturnsGifForAnimatedAvatar(): void
    {
        $this->user->setDiscordAvatar('a_animated_hash');

        $this->assertStringContainsString('a_animated_hash.gif', $this->user->getAvatarUrl());
    }

    public function testGetAvatarUrlReturnsDefaultWhenNoAvatar(): void
    {
        // ID 123456789 % 5 = 4
        $url = $this->user->getAvatarUrl();

        $this->assertStringContainsString('cdn.discordapp.com/embed/avatars/', $url);
        $this->assertStringEndsWith('4.png', $url);
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

    // ===== Collections — unicité =====

    public function testAddInventoryEnforcesUniqueness(): void
    {
        $item = $this->createMock(UserInventory::class);
        $item->method('setUser')->willReturn($item);

        $this->user->addInventory($item);
        $this->user->addInventory($item); // doublon

        $this->assertCount(1, $this->user->getInventory());
    }

    public function testAddVisitedCityEnforcesUniqueness(): void
    {
        $visited = $this->createMock(VisitedCity::class);
        $visited->method('setUser')->willReturn($visited);

        $this->user->addVisitedCity($visited);
        $this->user->addVisitedCity($visited); // doublon

        $this->assertCount(1, $this->user->getVisitedCities());
    }

    // ===== toArray() =====

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

    // ===== getUserIdentifier() =====

    public function testGetUserIdentifierReturnsUserId(): void
    {
        $this->assertSame('123456789', $this->user->getUserIdentifier());
    }

    // ===== addEquippedBadge() =====

    public function testAddEquippedBadgeEnforcesUniqueness(): void
    {
        $badge = $this->createMock(UserEquippedBadge::class);
        $badge->method('setUser')->willReturnSelf();

        $this->user->addEquippedBadge($badge);
        $this->user->addEquippedBadge($badge);

        $this->assertCount(1, $this->user->getEquippedBadges());
    }

    // ===== removeEquippedBadge() =====

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

<?php

namespace App\Tests\Controller\API;

use PHPUnit\Framework\Attributes\Group;

#[Group('integration')]
class StatsControllerTest extends AbstractApiWebTestCase
{
    // ===== GET /api/stats =====

    public function testStatsWithoutJwtReturns401(): void
    {
        $this->get('/api/stats');
        $this->assertSame(401, $this->statusCode());
    }

    public function testStatsWithRegularUserReturns403(): void
    {
        $user = $this->createTestUser(roles: ['ROLE_USER']);
        $this->auth($user);

        $this->get('/api/stats');

        $this->assertSame(403, $this->statusCode());
    }

    public function testStatsWithAdminUserReturnsGlobalAndEconomy(): void
    {
        $user = $this->createTestUser(roles: ['ROLE_ADMIN']);
        $this->auth($user);

        $this->get('/api/stats');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertArrayHasKey('global', $data);
        $this->assertArrayHasKey('economy', $data);
    }

    public function testStatsGlobalBlockContainsExpectedKeys(): void
    {
        $user = $this->createTestUser(roles: ['ROLE_ADMIN']);
        $this->auth($user);

        $this->get('/api/stats');

        $global = $this->json()['global'];
        $this->assertArrayHasKey('total_users', $global);
        $this->assertArrayHasKey('total_cities', $global);
        $this->assertArrayHasKey('total_coins_circulation', $global);
        $this->assertArrayHasKey('active_users_today', $global);
        $this->assertArrayHasKey('active_users_week', $global);
    }

    public function testStatsEconomyBlockContainsExpectedKeys(): void
    {
        $user = $this->createTestUser(roles: ['ROLE_ADMIN']);
        $this->auth($user);

        $this->get('/api/stats');

        $economy = $this->json()['economy'];
        $this->assertArrayHasKey('average_coins_per_user', $economy);
        $this->assertArrayHasKey('richest_user_coins', $economy);
        $this->assertArrayHasKey('total_shop_purchases', $economy);
        $this->assertArrayHasKey('most_popular_item', $economy);
    }

    public function testStatsTotalCitiesMatchesFixtures(): void
    {
        $user = $this->createTestUser(roles: ['ROLE_ADMIN']);
        $this->auth($user);

        $this->get('/api/stats');

        // Les fixtures définissent 6 villes
        $this->assertSame(6, $this->json()['global']['total_cities']);
    }

    // ===== GET /api/stats/global =====

    public function testGlobalStatsWithoutJwtReturns401(): void
    {
        $this->get('/api/stats/global');
        $this->assertSame(401, $this->statusCode());
    }

    public function testGlobalStatsWithRegularUserReturns403(): void
    {
        $user = $this->createTestUser(roles: ['ROLE_USER']);
        $this->auth($user);

        $this->get('/api/stats/global');

        $this->assertSame(403, $this->statusCode());
    }

    public function testGlobalStatsWithAdminReturnsCorrectStructure(): void
    {
        $user = $this->createTestUser(roles: ['ROLE_ADMIN']);
        $this->auth($user);

        $this->get('/api/stats/global');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertArrayHasKey('total_users', $data);
        $this->assertArrayHasKey('total_cities', $data);
        $this->assertArrayHasKey('total_coins_circulation', $data);
        $this->assertArrayHasKey('active_users_today', $data);
        $this->assertArrayHasKey('active_users_week', $data);
        // Pas de clé 'economy' : cette route ne retourne que les stats globales
        $this->assertArrayNotHasKey('economy', $data);
    }

    public function testGlobalStatsTotalUsersIncludesCreatedUser(): void
    {
        $user = $this->createTestUser(roles: ['ROLE_ADMIN'], coins: 777);
        $this->auth($user);

        $this->get('/api/stats/global');

        $totalUsers = $this->json()['total_users'];
        $this->assertGreaterThanOrEqual(1, $totalUsers);
    }
}

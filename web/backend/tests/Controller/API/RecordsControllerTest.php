<?php

namespace App\Tests\Controller\API;

use PHPUnit\Framework\Attributes\Group;

#[Group('integration')]
class RecordsControllerTest extends AbstractApiWebTestCase
{
    // ===== GET /api/records =====

    public function testRecordsWithoutJwtReturns401(): void
    {
        $this->get('/api/records');
        $this->assertSame(401, $this->statusCode());
    }

    public function testRecordsReturnsAllFourSections(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->get('/api/records');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertArrayHasKey('coins', $data);
        $this->assertArrayHasKey('exploration', $data);
        $this->assertArrayHasKey('collection', $data);
        $this->assertArrayHasKey('activity', $data);
    }

    public function testRecordsCoinsSectionHasCorrectStructure(): void
    {
        $user = $this->createTestUser(coins: 999);
        $this->auth($user);

        $this->get('/api/records');

        $this->assertSame(200, $this->statusCode());
        $coins = $this->json()['coins'];
        $this->assertSame(999, $coins['current']);
        $this->assertIsInt($coins['rank']);
        $this->assertIsInt($coins['total_users']);
        $this->assertIsInt($coins['percentile']);
    }

    public function testRecordsRankIsOneWhenOnlyUserInDatabase(): void
    {
        $user = $this->createTestUser(coins: 500);
        $this->auth($user);

        $this->get('/api/records');

        $this->assertSame(200, $this->statusCode());
        $coins = $this->json()['coins'];
        $this->assertSame(1, $coins['rank']);
        $this->assertSame(100, $coins['percentile']);
    }

    public function testRecordsExplorationShowsVisitedCityWithDate(): void
    {
        $user = $this->createTestUser();
        $this->addVisitedCity($user, 'ironhaven');
        $this->auth($user);

        $this->get('/api/records');

        $this->assertSame(200, $this->statusCode());
        $exploration = $this->json()['exploration'];
        $this->assertSame(2, $exploration['visited_count']); // willowbrook + ironhaven
        $this->assertSame(6, $exploration['total_cities']);

        $visitedCityIds = array_column($exploration['cities'], 'city_id');
        $this->assertContains('ironhaven', $visitedCityIds);
    }

    public function testRecordsActivitySectionHasJoinedAtAndDaysActive(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->get('/api/records');

        $this->assertSame(200, $this->statusCode());
        $activity = $this->json()['activity'];
        $this->assertArrayHasKey('joined_at', $activity);
        $this->assertArrayHasKey('last_activity', $activity);
        $this->assertArrayHasKey('days_active', $activity);
        $this->assertIsInt($activity['days_active']);
    }
}

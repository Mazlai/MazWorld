<?php

namespace App\Tests\Controller\API;

use PHPUnit\Framework\Attributes\Group;

#[Group('integration')]
class LeaderboardControllerTest extends AbstractApiWebTestCase
{
    // ===== GET /api/leaderboard =====

    public function testLeaderboardWithoutAuthReturnsPublicListWithoutUserRank(): void
    {
        // Le classement est un contenu public (rang, pseudo, avatar, solde — rien de
        // sensible) : un visiteur non connecté doit pouvoir le consulter, sans son
        // propre rang évidemment puisqu'on ne sait pas qui il est.
        $this->createTestUser(coins: 100);

        $this->get('/api/leaderboard');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertNotEmpty($data['entries']);
        $this->assertNull($data['user_rank']);
    }

    public function testLeaderboardWithAuthReturnsUserRank(): void
    {
        $user = $this->createTestUser(coins: 100);
        $this->auth($user);

        $this->get('/api/leaderboard');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertNotNull($data['user_rank']);
        $this->assertIsInt($data['user_rank']);
        $this->assertGreaterThanOrEqual(1, $data['user_rank']);
    }

    public function testLeaderboardPaginationLimitsResults(): void
    {
        // Crée plusieurs utilisateurs pour avoir des données
        $user = $this->createTestUser(coins: 400);
        $this->createTestUser(userId: uniqid('lb1'), coins: 300);
        $this->createTestUser(userId: uniqid('lb2'), coins: 200);
        $this->createTestUser(userId: uniqid('lb3'), coins: 100);
        $this->auth($user);

        $this->get('/api/leaderboard?page=1&limit=2');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertCount(2, $data['entries']);
        $this->assertSame(2, $data['limit']);
        $this->assertSame(1, $data['page']);
    }

    public function testLeaderboardEntriesAreOrderedByCoinsDescending(): void
    {
        $user = $this->createTestUser(coins: 2000);
        $this->createTestUser(userId: uniqid('r1'), coins: 1000);
        $this->createTestUser(userId: uniqid('r2'), coins: 500);
        $this->auth($user);

        $this->get('/api/leaderboard?limit=50');

        $entries = $this->json()['entries'];
        $this->assertNotEmpty($entries);

        $previousCoins = PHP_INT_MAX;
        foreach ($entries as $entry) {
            $this->assertLessThanOrEqual($previousCoins, $entry['coins']);
            $previousCoins = $entry['coins'];
        }
    }

    // ===== GET /api/leaderboard/me =====

    public function testMyRankWithoutJwtReturns401(): void
    {
        $this->get('/api/leaderboard/me');
        $this->assertSame(401, $this->statusCode());
    }

    public function testMyRankReturnsPositiveInteger(): void
    {
        $user = $this->createTestUser(coins: 999);
        $this->auth($user);

        $this->get('/api/leaderboard/me');

        $this->assertSame(200, $this->statusCode());
        $rank = $this->json()['rank'];
        $this->assertIsInt($rank);
        $this->assertGreaterThanOrEqual(1, $rank);
    }
}

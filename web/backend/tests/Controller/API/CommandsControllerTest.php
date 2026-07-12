<?php

namespace App\Tests\Controller\API;

use App\Entity\City;

use PHPUnit\Framework\Attributes\Group;
#[Group('integration')]
class CommandsControllerTest extends AbstractApiWebTestCase
{
    // ===== POST /api/commands/daily =====

    public function testDailyWithoutJwtReturns401(): void
    {
        $this->post('/api/commands/daily');
        $this->assertSame(401, $this->statusCode());
    }

    public function testDailyFirstTimeGives5Coins(): void
    {
        $user = $this->createTestUser(coins: 100);
        $this->auth($user);

        $this->post('/api/commands/daily');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertTrue($data['success']);
        $this->assertSame(105, $data['coins']);
    }

    public function testDailyCooldownActiveReturns429(): void
    {
        $user = $this->createTestUser();
        $user->setLastDaily(time()); // Vient de réclamer
        $this->em->flush();
        $this->auth($user);

        $this->post('/api/commands/daily');

        $this->assertSame(429, $this->statusCode());
        $data = $this->json();
        $this->assertFalse($data['success']);
        $this->assertArrayHasKey('next_daily', $data);
    }

    public function testDailyAfterCooldownSucceeds(): void
    {
        $user = $this->createTestUser(coins: 200);
        $user->setLastDaily(time() - 86401); // Cooldown 24h dépassé
        $this->em->flush();
        $this->auth($user);

        $this->post('/api/commands/daily');

        $this->assertSame(200, $this->statusCode());
        $this->assertSame(205, $this->json()['coins']);
    }

    // ===== POST /api/commands/work =====

    public function testWorkWithoutJwtReturns401(): void
    {
        $this->post('/api/commands/work');
        $this->assertSame(401, $this->statusCode());
    }

    public function testWorkWhileTravelingReturns409(): void
    {
        $user = $this->createTestUser();
        $ironhaven = $this->em->find(City::class, 'ironhaven');
        $user->setTravelingTo($ironhaven)->setArrivalTime(time() + 3600);
        $this->em->flush();
        $this->auth($user);

        $this->post('/api/commands/work');

        $this->assertSame(409, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testWorkCooldownActiveReturns429(): void
    {
        $user = $this->createTestUser();
        $user->setLastWork(time()); // Vient de travailler
        $this->em->flush();
        $this->auth($user);

        $this->post('/api/commands/work');

        $this->assertSame(429, $this->statusCode());
        $data = $this->json();
        $this->assertFalse($data['success']);
        $this->assertArrayHasKey('next_work', $data);
    }

    public function testWorkSuccessReturnsRewardInRangeAndKeys(): void
    {
        $user = $this->createTestUser(coins: 0);
        $this->auth($user);

        $this->post('/api/commands/work');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertTrue($data['success']);
        $this->assertArrayHasKey('reward', $data);
        $this->assertGreaterThanOrEqual(20, $data['reward']);
        $this->assertLessThanOrEqual(30, $data['reward']);
        $this->assertArrayHasKey('job_name', $data);
        $this->assertArrayHasKey('task', $data);
        $this->assertSame($data['reward'], $data['coins']); // Partait de 0
    }

    // ===== POST /api/commands/coinflip =====

    public function testCoinflipWithoutJwtReturns401(): void
    {
        $this->post('/api/commands/coinflip', ['choice' => 'pile', 'amount' => 10]);
        $this->assertSame(401, $this->statusCode());
    }

    public function testCoinflipWhileTravelingReturns409(): void
    {
        $user = $this->createTestUser();
        $ironhaven = $this->em->find(City::class, 'ironhaven');
        $user->setTravelingTo($ironhaven)->setArrivalTime(time() + 3600);
        $this->em->flush();
        $this->auth($user);

        $this->post('/api/commands/coinflip', ['choice' => 'pile', 'amount' => 10]);

        $this->assertSame(409, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testCoinflipInvalidChoiceReturns400(): void
    {
        $user = $this->createTestUser(coins: 500);
        $this->auth($user);

        $this->post('/api/commands/coinflip', ['choice' => 'invalid', 'amount' => 10]);

        $this->assertSame(400, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testCoinflipAmountBelowMinimumReturns400(): void
    {
        $user = $this->createTestUser(coins: 500);
        $this->auth($user);

        $this->post('/api/commands/coinflip', ['choice' => 'pile', 'amount' => 9]); // min = 10

        $this->assertSame(400, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testCoinflipAmountAboveMaximumReturns400(): void
    {
        $user = $this->createTestUser(coins: 2000);
        $this->auth($user);

        $this->post('/api/commands/coinflip', ['choice' => 'face', 'amount' => 501]); // max = 500

        $this->assertSame(400, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testCoinflipExceedsHalfBalanceReturns400(): void
    {
        $user = $this->createTestUser(coins: 100); // max bet = 50
        $this->auth($user);

        $this->post('/api/commands/coinflip', ['choice' => 'pile', 'amount' => 51]);

        $this->assertSame(400, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testCoinflipValidBetChangesCoinsAndReturnsStructure(): void
    {
        $user = $this->createTestUser(coins: 500);
        $this->auth($user);

        $this->post('/api/commands/coinflip', ['choice' => 'pile', 'amount' => 100]);

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertTrue($data['success']);
        $this->assertIsBool($data['won']);
        $this->assertContains($data['result'], ['pile', 'face']);
        $this->assertSame(100, $data['amount']);
        // Les coins changent de ±100 depuis 500
        $this->assertContains($data['coins'], [400, 600]);
    }
}

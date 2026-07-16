<?php

namespace App\Tests\Controller\API;

use App\Entity\City;
use PHPUnit\Framework\Attributes\Group;

#[Group('integration')]
class TravelControllerTest extends AbstractApiWebTestCase
{
    // ===== GET /api/travel/status =====

    public function testStatusWithoutJwtReturns401(): void
    {
        $this->get('/api/travel/status');
        $this->assertSame(401, $this->statusCode());
    }

    public function testStatusWhenNotTravelingReturnsFalse(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->get('/api/travel/status');

        $this->assertSame(200, $this->statusCode());
        $this->assertFalse($this->json()['traveling']);
    }

    public function testStatusWhileTravelingReturnsDetails(): void
    {
        $user = $this->createTestUser();
        $ironhaven = $this->em->find(City::class, 'ironhaven');
        $user->setTravelingTo($ironhaven)->setArrivalTime(time() + 3600);
        $this->em->flush();
        $this->auth($user);

        $this->get('/api/travel/status');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertTrue($data['traveling']);
        $this->assertSame('ironhaven', $data['destination']);
        $this->assertArrayHasKey('arrival_time', $data);
    }

    public function testStatusAutoCompletesFinishedTravel(): void
    {
        $user = $this->createTestUser();
        $ironhaven = $this->em->find(City::class, 'ironhaven');
        // Arrivée dans le passé = voyage terminé
        $user->setTravelingTo($ironhaven)->setArrivalTime(time() - 10);
        $this->em->flush();
        $this->auth($user);

        $this->get('/api/travel/status');

        $this->assertSame(200, $this->statusCode());
        $this->assertFalse($this->json()['traveling']);

        // L'utilisateur est maintenant à Ironhaven
        $this->em->refresh($user);
        $this->assertSame('ironhaven', $user->getCurrentCity()->getCityId());
    }

    // ===== GET /api/travel/map =====

    public function testMapWithoutJwtReturns401(): void
    {
        $this->get('/api/travel/map');
        $this->assertSame(401, $this->statusCode());
    }

    public function testMapReturnsCurrentCityRoutesAndJobs(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->get('/api/travel/map');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertSame('willowbrook', $data['current_city']['city_id']);
        $this->assertNotEmpty($data['routes']);
        $this->assertNotEmpty($data['jobs']);
        $this->assertSame(500, $data['coins']);
    }

    public function testMapShowsEffectiveCostZeroForAlreadyVisitedCity(): void
    {
        $user = $this->createTestUser();
        $this->addVisitedCity($user, 'ironhaven');
        $this->auth($user);

        $this->get('/api/travel/map');

        $this->assertSame(200, $this->statusCode());
        $routes = $this->json()['routes'];

        $ironhavenRoute = null;
        foreach ($routes as $r) {
            if ('ironhaven' === $r['city_to']) {
                $ironhavenRoute = $r;
                break;
            }
        }
        $this->assertNotNull($ironhavenRoute, 'La route vers Ironhaven doit apparaître dans le map.');
        $this->assertSame(0, $ironhavenRoute['effective_cost']);
        $this->assertTrue($ironhavenRoute['visited']);
    }

    public function testMapShowsRealCostForUnvisitedCity(): void
    {
        $user = $this->createTestUser(); // willowbrook uniquement dans les visitées
        $this->auth($user);

        $this->get('/api/travel/map');

        $routes = $this->json()['routes'];
        $ironhavenRoute = null;
        foreach ($routes as $r) {
            if ('ironhaven' === $r['city_to']) {
                $ironhavenRoute = $r;
                break;
            }
        }
        $this->assertNotNull($ironhavenRoute);
        $this->assertSame(50, $ironhavenRoute['effective_cost']);
        $this->assertFalse($ironhavenRoute['visited']);
    }

    // ===== POST /api/travel/start =====

    public function testStartWithoutJwtReturns401(): void
    {
        $this->post('/api/travel/start', ['destination_id' => 'ironhaven']);
        $this->assertSame(401, $this->statusCode());
    }

    public function testStartWithMissingDestinationReturns400(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->post('/api/travel/start', []);

        $this->assertSame(400, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testStartWithNonExistentCityReturns404(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->post('/api/travel/start', ['destination_id' => 'nonexistent_city_xyz']);

        $this->assertSame(404, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testStartWithNoRouteToDestinationReturns404(): void
    {
        // Pas de route directe de willowbrook vers crystalport
        $user = $this->createTestUser();
        $this->auth($user);

        $this->post('/api/travel/start', ['destination_id' => 'crystalport']);

        $this->assertSame(404, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testStartWhileAlreadyTravelingReturns409(): void
    {
        $user = $this->createTestUser();
        $ironhaven = $this->em->find(City::class, 'ironhaven');
        $user->setTravelingTo($ironhaven)->setArrivalTime(time() + 3600);
        $this->em->flush();
        $this->auth($user);

        $this->post('/api/travel/start', ['destination_id' => 'goldenfields']);

        $this->assertSame(409, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testStartWithInsufficientCoinsReturns402(): void
    {
        $user = $this->createTestUser(coins: 10); // Route willowbrook→ironhaven coûte 50
        $this->auth($user);

        $this->post('/api/travel/start', ['destination_id' => 'ironhaven']);

        $this->assertSame(402, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testStartSuccessDeductsCoinsAndStartsTravel(): void
    {
        $user = $this->createTestUser(coins: 500);
        $this->auth($user);

        $this->post('/api/travel/start', ['destination_id' => 'ironhaven']); // coûte 50

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertTrue($data['success']);
        $this->assertSame(50, $data['travel_cost']);
        $this->assertSame(450, $data['coins']);
        $this->assertArrayHasKey('arrival_time', $data);
    }

    public function testStartFreeRevisitDoesNotDeductCoins(): void
    {
        $user = $this->createTestUser(coins: 100);
        $this->addVisitedCity($user, 'ironhaven'); // Déjà visitée = gratuit
        $this->auth($user);

        $this->post('/api/travel/start', ['destination_id' => 'ironhaven']);

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertTrue($data['success']);
        $this->assertSame(0, $data['travel_cost']);
        $this->assertSame(100, $data['coins']); // Inchangé
    }
}

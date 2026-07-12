<?php

namespace App\Tests\Controller\API;

use PHPUnit\Framework\Attributes\Group;
#[Group('integration')]
class RouteControllerTest extends AbstractApiWebTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $user = $this->createTestUser();
        $this->auth($user);
    }

    // ===== GET /api/routes =====

    public function testRoutesListReturns16RoutesFromFixtures(): void
    {
        $this->get('/api/routes');

        $this->assertSame(200, $this->statusCode());
        $routes = $this->json();
        $this->assertCount(16, $routes);
    }

    public function testRoutesListItemsHaveCityNames(): void
    {
        $this->get('/api/routes');

        $route = $this->json()[0];
        $this->assertArrayHasKey('route_id', $route);
        $this->assertArrayHasKey('city_from', $route);
        $this->assertArrayHasKey('city_to', $route);
        $this->assertArrayHasKey('cost', $route);
        $this->assertArrayHasKey('duration', $route);
        $this->assertArrayHasKey('from_name', $route);
        $this->assertArrayHasKey('to_name', $route);
    }

    // ===== GET /api/routes/{routeId} =====

    public function testRoutesShowReturnsRouteWithFullCityData(): void
    {
        // Récupère un ID de route depuis la DB
        $routeId = $this->em->getConnection()->fetchOne('SELECT route_id FROM routes LIMIT 1');
        $this->assertNotFalse($routeId, 'Au moins une route doit exister en base de test.');

        $this->get('/api/routes/' . $routeId);

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertArrayHasKey('route_id', $data);
        $this->assertArrayHasKey('from_name', $data);
        $this->assertArrayHasKey('to_name', $data);
        $this->assertArrayHasKey('from_theme', $data);
        $this->assertArrayHasKey('to_theme', $data);
    }

    public function testRoutesShowNonExistentReturns404(): void
    {
        $this->get('/api/routes/999999');
        $this->assertSame(404, $this->statusCode());
    }
}

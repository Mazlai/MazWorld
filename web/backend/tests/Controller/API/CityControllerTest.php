<?php

namespace App\Tests\Controller\API;

use PHPUnit\Framework\Attributes\Group;

#[Group('integration')]
class CityControllerTest extends AbstractApiWebTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $user = $this->createTestUser();
        $this->auth($user);
    }

    // ===== GET /api/cities =====

    public function testCitiesListReturnsAll6CitiesFromFixtures(): void
    {
        $this->get('/api/cities');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertCount(6, $data);

        $cityIds = array_column($data, 'city_id');
        $this->assertContains('willowbrook', $cityIds);
        $this->assertContains('ironhaven', $cityIds);
        $this->assertContains('crystalport', $cityIds);
    }

    public function testCitiesListItemsHaveExpectedKeys(): void
    {
        $this->get('/api/cities');

        $item = $this->json()[0];
        $this->assertArrayHasKey('city_id', $item);
        $this->assertArrayHasKey('name', $item);
        $this->assertArrayHasKey('emoji', $item);
        $this->assertArrayHasKey('theme', $item);
        $this->assertArrayHasKey('position_x', $item);
        $this->assertArrayHasKey('position_y', $item);
    }

    // ===== GET /api/cities/{cityId} =====

    public function testCitiesShowReturnsDetailsWithJobsAndRoutes(): void
    {
        $this->get('/api/cities/willowbrook');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertSame('willowbrook', $data['city']['city_id']);
        $this->assertSame('nature', $data['city']['theme']);
        $this->assertCount(3, $data['jobs']);
        $this->assertNotEmpty($data['routes']);
    }

    public function testCitiesShowNonExistentCityReturns404(): void
    {
        $this->get('/api/cities/nonexistent_xyz');
        $this->assertSame(404, $this->statusCode());
    }

    // ===== GET /api/cities/{cityId}/jobs =====

    public function testCitiesJobsReturnsJobsArray(): void
    {
        $this->get('/api/cities/willowbrook/jobs');

        $this->assertSame(200, $this->statusCode());
        $jobs = $this->json();
        $this->assertCount(3, $jobs);
        $this->assertArrayHasKey('name', $jobs[0]);
        $this->assertArrayHasKey('emoji', $jobs[0]);
    }

    public function testCitiesJobsNonExistentCityReturns404(): void
    {
        $this->get('/api/cities/nonexistent_xyz/jobs');
        $this->assertSame(404, $this->statusCode());
    }

    // ===== GET /api/cities/{cityId}/routes =====

    public function testCitiesRoutesReturnsRoutesArray(): void
    {
        $this->get('/api/cities/willowbrook/routes');

        $this->assertSame(200, $this->statusCode());
        $routes = $this->json();
        $this->assertNotEmpty($routes);
        $this->assertArrayHasKey('city_to', $routes[0]);
        $this->assertArrayHasKey('cost', $routes[0]);
        $this->assertArrayHasKey('duration', $routes[0]);
    }

    public function testCitiesRoutesNonExistentCityReturns404(): void
    {
        $this->get('/api/cities/nonexistent_xyz/routes');
        $this->assertSame(404, $this->statusCode());
    }
}

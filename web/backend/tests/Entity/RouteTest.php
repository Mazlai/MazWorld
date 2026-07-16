<?php

namespace App\Tests\Entity;

use App\Entity\City;
use App\Entity\Route;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;

#[Group('unit')]
class RouteTest extends TestCase
{
    // ===== toArray() =====

    public function testToArrayReturnsExpectedStructure(): void
    {
        $cityFrom = $this->createMock(City::class);
        $cityFrom->method('getCityId')->willReturn('paris');

        $cityTo = $this->createMock(City::class);
        $cityTo->method('getCityId')->willReturn('lyon');

        $route = new Route();
        $route->setCityFrom($cityFrom);
        $route->setCityTo($cityTo);
        $route->setCost(150);
        $route->setDuration(3600);

        $array = $route->toArray();

        $this->assertSame('paris', $array['city_from']);
        $this->assertSame('lyon', $array['city_to']);
        $this->assertSame(150, $array['cost']);
        $this->assertSame(3600, $array['duration']);
        $this->assertNull($array['route_id']); // non persisté
    }
}

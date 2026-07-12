<?php

namespace App\Tests\Entity;

use App\Entity\City;
use App\Entity\User;
use App\Entity\VisitedCity;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;

#[Group('unit')]
class VisitedCityTest extends TestCase
{
    // ===== __construct() =====

    public function testConstructorInitializesFirstVisitToNow(): void
    {
        $vc = new VisitedCity();
        $this->assertInstanceOf(\DateTimeInterface::class, $vc->getFirstVisit());
        $this->assertEqualsWithDelta(time(), $vc->getFirstVisit()->getTimestamp(), 2);
    }

    // ===== setUser() / getUser() =====

    public function testSetAndGetUser(): void
    {
        $user = $this->createMock(User::class);
        $vc   = (new VisitedCity())->setUser($user);

        $this->assertSame($user, $vc->getUser());
    }

    // ===== setCity() / getCity() =====

    public function testSetAndGetCity(): void
    {
        $city = $this->createMock(City::class);
        $vc   = (new VisitedCity())->setCity($city);

        $this->assertSame($city, $vc->getCity());
    }

    // ===== setFirstVisit() / getFirstVisit() =====

    public function testSetAndGetFirstVisit(): void
    {
        $date = new \DateTime('2023-06-01 08:00:00');
        $vc   = (new VisitedCity())->setFirstVisit($date);

        $this->assertSame($date, $vc->getFirstVisit());
    }
}
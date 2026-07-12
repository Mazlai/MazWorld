<?php

namespace App\Tests\Entity;

use App\Entity\City;
use App\Entity\CityJob;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;

#[Group('unit')]
class CityTest extends TestCase
{
    private City $city;

    protected function setUp(): void
    {
        $this->city = new City();
        $this->city->setCityId('paris');
        $this->city->setName('Paris');
    }

    // ===== addJob() =====

    public function testAddJobEnforcesUniqueness(): void
    {
        $job = $this->createMock(CityJob::class);
        $job->method('setCity')->willReturnSelf();

        $this->city->addJob($job);
        $this->city->addJob($job);

        $this->assertCount(1, $this->city->getJobs());
    }

    // ===== removeJob() =====

    public function testRemoveJobDeletesFromCollection(): void
    {
        $job = $this->createMock(CityJob::class);
        $job->method('setCity')->willReturnSelf();

        $this->city->addJob($job);
        $this->city->removeJob($job);

        $this->assertCount(0, $this->city->getJobs());
    }

    // ===== toArray() =====

    public function testToArrayReturnsExpectedStructure(): void
    {
        $this->city->setDescription('La ville lumière');
        $this->city->setEmoji('🗼');
        $this->city->setTheme('urban');
        $this->city->setPositionX(10);
        $this->city->setPositionY(20);

        $array = $this->city->toArray();

        $this->assertSame('paris', $array['city_id']);
        $this->assertSame('Paris', $array['name']);
        $this->assertSame('La ville lumière', $array['description']);
        $this->assertSame('🗼', $array['emoji']);
        $this->assertSame('urban', $array['theme']);
        $this->assertSame(10, $array['position_x']);
        $this->assertSame(20, $array['position_y']);
    }
}

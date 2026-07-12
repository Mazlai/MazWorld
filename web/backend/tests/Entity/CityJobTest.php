<?php

namespace App\Tests\Entity;

use App\Entity\City;
use App\Entity\CityJob;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;

#[Group('unit')]
class CityJobTest extends TestCase
{
    // ===== toArray() =====

    public function testToArrayReturnsExpectedStructure(): void
    {
        $city = $this->createMock(City::class);
        $city->method('getCityId')->willReturn('lyon');

        $job = new CityJob();
        $job->setCity($city);
        $job->setJobName('Boulanger');
        $job->setJobEmoji('🥖');
        $job->setTask1('Pétrir la pâte');
        $job->setTask2('Cuire le pain');
        $job->setTask3('Vendre le pain');

        $array = $job->toArray();

        $this->assertSame('lyon', $array['city_id']);
        $this->assertSame('Boulanger', $array['name']);
        $this->assertSame('🥖', $array['emoji']);
        $this->assertSame('Pétrir la pâte', $array['task_1']);
        $this->assertSame('Cuire le pain', $array['task_2']);
        $this->assertSame('Vendre le pain', $array['task_3']);
        $this->assertNull($array['job_id']); // non persisté
    }
}

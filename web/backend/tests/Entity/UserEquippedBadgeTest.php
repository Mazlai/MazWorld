<?php

namespace App\Tests\Entity;

use App\Entity\UserEquippedBadge;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;

#[Group('unit')]
class UserEquippedBadgeTest extends TestCase
{
    private UserEquippedBadge $badge;

    protected function setUp(): void
    {
        $this->badge = new UserEquippedBadge();
    }

    // ===== setSlotNumber() — bornes 0 à 5 (6 emplacements, cohérent avec MAX_BADGE_SLOTS côté frontend) =====

    public function testSetSlotNumberAcceptsMinBoundary(): void
    {
        $result = $this->badge->setSlotNumber(0);
        $this->assertSame(0, $this->badge->getSlotNumber());
        $this->assertSame($this->badge, $result);
    }

    public function testSetSlotNumberAcceptsMaxBoundary(): void
    {
        $this->badge->setSlotNumber(5);
        $this->assertSame(5, $this->badge->getSlotNumber());
    }

    public function testSetSlotNumberThrowsWhenBelowZero(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->badge->setSlotNumber(-1);
    }

    public function testSetSlotNumberThrowsWhenAboveFive(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->badge->setSlotNumber(6);
    }
}

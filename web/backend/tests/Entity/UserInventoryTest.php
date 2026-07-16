<?php

namespace App\Tests\Entity;

use App\Entity\User;
use App\Entity\UserInventory;
use DateTime;
use DateTimeInterface;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;

#[Group('unit')]
class UserInventoryTest extends TestCase
{
    // ===== __construct() =====

    public function testConstructorInitializesPurchasedAtToNow(): void
    {
        $inv = new UserInventory();
        $this->assertInstanceOf(DateTimeInterface::class, $inv->getPurchasedAt());
        $this->assertEqualsWithDelta(time(), $inv->getPurchasedAt()->getTimestamp(), 2);
    }

    // ===== getId() =====

    public function testGetIdReturnsNullBeforePersist(): void
    {
        $this->assertNull((new UserInventory())->getId());
    }

    // ===== setUser() / getUser() =====

    public function testSetAndGetUser(): void
    {
        $user = $this->createMock(User::class);
        $inv  = (new UserInventory())->setUser($user);

        $this->assertSame($user, $inv->getUser());
    }

    // ===== setItemType() / getItemType() =====

    public function testSetAndGetItemType(): void
    {
        $inv = (new UserInventory())->setItemType('background');
        $this->assertSame('background', $inv->getItemType());
    }

    // ===== setItemId() / getItemId() =====

    public function testSetAndGetItemId(): void
    {
        $inv = (new UserInventory())->setItemId('bg_blue');
        $this->assertSame('bg_blue', $inv->getItemId());
    }

    // ===== setPurchasedAt() / getPurchasedAt() =====

    public function testSetAndGetPurchasedAt(): void
    {
        $date = new DateTime('2024-01-15 12:00:00');
        $inv  = (new UserInventory())->setPurchasedAt($date);
        $this->assertSame($date, $inv->getPurchasedAt());
    }
}

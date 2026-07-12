<?php

namespace App\Tests\Controller\API;

use PHPUnit\Framework\Attributes\Group;
#[Group('integration')]
class InventoryControllerTest extends AbstractApiWebTestCase
{
    // ===== GET /api/inventory =====

    public function testInventoryWithoutJwtReturns401(): void
    {
        $this->get('/api/inventory');
        $this->assertSame(401, $this->statusCode());
    }

    public function testInventoryEmptyReturnsEmptyItems(): void
    {
        $user = $this->createTestUser(coins: 200);
        $this->auth($user);

        $this->get('/api/inventory');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertSame([], $data['items']);
        $this->assertSame('bg_default', $data['equipped_background']);
        $this->assertSame(200, $data['user_coins']);
    }

    public function testInventoryWithBackgroundReturnsItemDetails(): void
    {
        $user = $this->createTestUser();
        $this->addInventory($user, 'bg_blue', 'background');
        $this->auth($user);

        $this->get('/api/inventory');

        $this->assertSame(200, $this->statusCode());
        $items = $this->json()['items'];
        $this->assertCount(1, $items);
        $this->assertSame('bg_blue', $items[0]['item_id']);
        $this->assertSame('background', $items[0]['item_type']);
        $this->assertSame('Ciel Nocturne', $items[0]['name']);
        $this->assertFalse($items[0]['equipped']);
        $this->assertNull($items[0]['slot']);
    }

    public function testInventoryWithEquippedBadgeReturnsSlotAndEquippedTrue(): void
    {
        $user = $this->createTestUser();
        $this->addInventory($user, 'badge_verified', 'badge');
        $this->addEquippedBadge($user, 'badge_verified', 0);
        $this->auth($user);

        $this->get('/api/inventory');

        $this->assertSame(200, $this->statusCode());
        $items = $this->json()['items'];
        $this->assertCount(1, $items);
        $this->assertTrue($items[0]['equipped']);
        $this->assertSame(0, $items[0]['slot']);
        $this->assertSame('badge_verified', $items[0]['item_id']);
    }
}

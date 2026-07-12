<?php

namespace App\Tests\Controller\API;

use PHPUnit\Framework\Attributes\Group;
#[Group('integration')]
class ShopControllerTest extends AbstractApiWebTestCase
{
    // ===== GET /api/shop =====

    public function testGetShopWithoutAuthReturns401(): void
    {
        $this->get('/api/shop');

        $this->assertSame(401, $this->statusCode());
    }

    public function testGetShopWithAuthReturnsUserCoinsAndOwnedStatus(): void
    {
        $user = $this->createTestUser(coins: 300);
        $this->addInventory($user, 'bg_blue', 'background');
        $this->auth($user);

        $this->get('/api/shop');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertSame(300, $data['user_coins']);

        $ownedItem = null;
        foreach ($data['items'] as $item) {
            if ($item['item_id'] === 'bg_blue') {
                $ownedItem = $item;
                break;
            }
        }
        $this->assertNotNull($ownedItem);
        $this->assertTrue($ownedItem['owned']);
    }

    public function testGetShopFilterByBackgroundReturnsOnlyBackgrounds(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->get('/api/shop?type=background');

        $this->assertSame(200, $this->statusCode());
        $items = $this->json()['items'];
        $this->assertNotEmpty($items);
        foreach ($items as $item) {
            $this->assertSame('background', $item['item_type']);
        }
    }

    public function testGetShopFilterByBadgeReturnsOnlyBadges(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->get('/api/shop?type=badge');

        $this->assertSame(200, $this->statusCode());
        $items = $this->json()['items'];
        $this->assertNotEmpty($items);
        foreach ($items as $item) {
            $this->assertSame('badge', $item['item_type']);
        }
    }

    public function testGetShopInvalidTypeFilterReturnsAllItems(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->get('/api/shop?type=invalid');

        $this->assertSame(200, $this->statusCode());
        $items = $this->json()['items'] ?? [];
        $types = array_unique(array_column($items, 'item_type'));
        $this->assertContains('background', $types);
        $this->assertContains('badge', $types);
    }

    // ===== GET /api/shop/{itemId} =====

    public function testGetItemNotFoundReturns404(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->get('/api/shop/nonexistent_item_xyz');

        $this->assertSame(404, $this->statusCode());
    }

    public function testGetItemWithoutAuthReturns401(): void
    {
        $this->get('/api/shop/bg_blue');

        $this->assertSame(401, $this->statusCode());
    }

    public function testGetItemWithAuthAndOwnedReturnsOwnedTrue(): void
    {
        $user = $this->createTestUser();
        $this->addInventory($user, 'bg_blue', 'background');
        $this->auth($user);

        $this->get('/api/shop/bg_blue');

        $this->assertSame(200, $this->statusCode());
        $this->assertTrue($this->json()['item']['owned']);
    }

    public function testGetItemWithAuthAndNotOwnedReturnsOwnedFalse(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->get('/api/shop/bg_blue');

        $this->assertSame(200, $this->statusCode());
        $this->assertFalse($this->json()['item']['owned']);
    }

    // ===== POST /api/shop/purchase =====

    public function testPurchaseWithoutJwtReturns401(): void
    {
        $this->post('/api/shop/purchase', ['item_id' => 'bg_blue']);
        $this->assertSame(401, $this->statusCode());
    }

    public function testPurchaseWithMissingItemIdReturns400(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->post('/api/shop/purchase', []);

        $this->assertSame(400, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testPurchaseNonExistentItemReturns404(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->post('/api/shop/purchase', ['item_id' => 'nonexistent_item_xyz']);

        $this->assertSame(404, $this->statusCode());
    }

    public function testPurchaseAlreadyOwnedItemReturns409(): void
    {
        $user = $this->createTestUser();
        $this->addInventory($user, 'bg_blue', 'background');
        $this->auth($user);

        $this->post('/api/shop/purchase', ['item_id' => 'bg_blue']);

        $this->assertSame(409, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testPurchaseInsufficientCoinsReturns402(): void
    {
        $user = $this->createTestUser(coins: 50); // bg_blue coûte 100
        $this->auth($user);

        $this->post('/api/shop/purchase', ['item_id' => 'bg_blue']);

        $this->assertSame(402, $this->statusCode());
        $this->assertFalse($this->json()['success']);
    }

    public function testPurchaseSuccessDeductsCoinsAndAddsInventory(): void
    {
        $user = $this->createTestUser(coins: 500);
        $this->auth($user);

        $this->post('/api/shop/purchase', ['item_id' => 'bg_blue']); // coûte 100

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertTrue($data['success']);
        $this->assertSame(400, $data['new_balance']);
        $this->assertSame('bg_blue', $data['item']['item_id']);
        $this->assertTrue($data['item']['owned']);
    }
}

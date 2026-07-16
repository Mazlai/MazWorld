<?php

namespace App\Tests\Entity;

use App\Entity\ShopItem;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;

#[Group('unit')]
class ShopItemTest extends TestCase
{
    // ===== isAvailable() =====

    public function testAvailableDefaultsToTrue(): void
    {
        $this->assertTrue((new ShopItem())->isAvailable());
    }

    // ===== toArray() =====

    public function testToArrayReturnsExpectedStructure(): void
    {
        $item = new ShopItem();
        $item->setItemId('bg_forest');
        $item->setItemType('background');
        $item->setName('Forêt enchantée');
        $item->setDescription('Un fond verdoyant');
        $item->setPrice(500);
        $item->setEmoji('🌲');
        $item->setAvailable(false);

        $array = $item->toArray();

        $this->assertSame('bg_forest', $array['item_id']);
        $this->assertSame('background', $array['item_type']);
        $this->assertSame('Forêt enchantée', $array['name']);
        $this->assertSame('Un fond verdoyant', $array['description']);
        $this->assertSame(500, $array['price']);
        $this->assertSame('🌲', $array['emoji']);
        $this->assertFalse($array['available']);
    }
}

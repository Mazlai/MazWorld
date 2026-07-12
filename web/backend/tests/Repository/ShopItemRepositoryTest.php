<?php

namespace App\Tests\Repository;

use App\Repository\ShopItemRepository;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

use PHPUnit\Framework\Attributes\Group;
#[Group('integration')]
class ShopItemRepositoryTest extends KernelTestCase
{
    private ShopItemRepository $repository;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->repository = static::getContainer()->get(ShopItemRepository::class);
    }

    // ===== findAllAvailable() =====

    public function testFindAllAvailableReturns10Items(): void
    {
        $items = $this->repository->findAllAvailable();

        $this->assertCount(10, $items);
    }

    public function testFindAllAvailableReturnsOnlyAvailableItems(): void
    {
        $items = $this->repository->findAllAvailable();

        foreach ($items as $item) {
            $this->assertTrue($item->isAvailable());
        }
    }

    public function testFindAllAvailableBackgroundsBeforeBadges(): void
    {
        $items = $this->repository->findAllAvailable();
        // ORDER BY item_type ASC : 'background' < 'badge' → backgrounds en premier
        // 5 backgrounds (index 0-4), 5 badges (index 5-9)
        for ($i = 0; $i < 5; $i++) {
            $this->assertSame('background', $items[$i]->getItemType());
        }
        for ($i = 5; $i < 10; $i++) {
            $this->assertSame('badge', $items[$i]->getItemType());
        }
    }

    public function testFindAllAvailableFirstItemIsCheapestBackground(): void
    {
        $items = $this->repository->findAllAvailable();

        // bg_blue à 100 — le background le moins cher
        $this->assertSame('bg_blue', $items[0]->getItemId());
        $this->assertSame('background', $items[0]->getItemType());
        $this->assertSame(100, $items[0]->getPrice());
    }

    // ===== findByType() =====

    public function testFindByTypeBackgroundReturns5Items(): void
    {
        $items = $this->repository->findByType('background');

        $this->assertCount(5, $items);
    }

    public function testFindByTypeBackgroundReturnsOnlyBackgrounds(): void
    {
        $items = $this->repository->findByType('background');

        foreach ($items as $item) {
            $this->assertSame('background', $item->getItemType());
        }
    }

    public function testFindByTypeBackgroundOrderedByPriceAsc(): void
    {
        $items  = $this->repository->findByType('background');
        $prices = array_map(fn($i) => $i->getPrice(), $items);
        $sorted = $prices;
        sort($sorted);

        $this->assertSame($sorted, $prices);
    }

    public function testFindByTypeBadgeReturns5Items(): void
    {
        $items = $this->repository->findByType('badge');

        $this->assertCount(5, $items);
    }

    public function testFindByTypeBadgeReturnsOnlyBadges(): void
    {
        $items = $this->repository->findByType('badge');

        foreach ($items as $item) {
            $this->assertSame('badge', $item->getItemType());
        }
    }

    public function testFindByTypeBadgeOrderedByPriceAsc(): void
    {
        $items  = $this->repository->findByType('badge');
        $prices = array_map(fn($i) => $i->getPrice(), $items);
        $sorted = $prices;
        sort($sorted);

        $this->assertSame($sorted, $prices);
    }

    public function testFindByTypeUnknownReturnsEmptyArray(): void
    {
        $items = $this->repository->findByType('unknown_type_xyz');

        $this->assertSame([], $items);
    }

    // ===== findBackgrounds() =====

    public function testFindBackgroundsReturns5Items(): void
    {
        $items = $this->repository->findBackgrounds();

        $this->assertCount(5, $items);
    }

    public function testFindBackgroundsReturnsOnlyBackgrounds(): void
    {
        $items = $this->repository->findBackgrounds();

        foreach ($items as $item) {
            $this->assertSame('background', $item->getItemType());
        }
    }

    public function testFindBackgroundsMatchesFindByTypeBackground(): void
    {
        $fromMethod   = array_map(fn($i) => $i->getItemId(), $this->repository->findBackgrounds());
        $fromFindType = array_map(fn($i) => $i->getItemId(), $this->repository->findByType('background'));

        $this->assertSame($fromFindType, $fromMethod);
    }

    // ===== findBadges() =====

    public function testFindBadgesReturns5Items(): void
    {
        $items = $this->repository->findBadges();

        $this->assertCount(5, $items);
    }

    public function testFindBadgesReturnsOnlyBadges(): void
    {
        $items = $this->repository->findBadges();

        foreach ($items as $item) {
            $this->assertSame('badge', $item->getItemType());
        }
    }

    public function testFindBadgesMatchesFindByTypeBadge(): void
    {
        $fromMethod   = array_map(fn($i) => $i->getItemId(), $this->repository->findBadges());
        $fromFindType = array_map(fn($i) => $i->getItemId(), $this->repository->findByType('badge'));

        $this->assertSame($fromFindType, $fromMethod);
    }

    public function testFindBadgesFirstIsVerifiedAt200(): void
    {
        $badges = $this->repository->findBadges();

        // badge_verified est à 200 — le moins cher
        $this->assertSame('badge_verified', $badges[0]->getItemId());
        $this->assertSame(200, $badges[0]->getPrice());
    }
}
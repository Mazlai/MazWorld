<?php

namespace App\Controller\API;

use App\Repository\ShopItemRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Throwable;

#[Route('/api/inventory', name: 'api_inventory_')]
class InventoryController extends AbstractApiController
{
    public function __construct(
        private readonly ShopItemRepository $shopItemRepository,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function getInventory(): JsonResponse
    {
        try {
            $user = $this->getCurrentUser();

            if (!$user) {
                return $this->unauthorizedResponse();
            }

            $equippedBackground = $user->getEquippedBackground();

            $equippedBadgeSlots = [];
            foreach ($user->getEquippedBadges() as $badge) {
                $equippedBadgeSlots[$badge->getSlotNumber()] = $badge->getBadgeId();
            }
            ksort($equippedBadgeSlots);

            $items = [];
            foreach ($user->getInventory() as $inventoryItem) {
                $shopItem = $this->shopItemRepository->find($inventoryItem->getItemId());

                if (!$shopItem) {
                    continue;
                }

                $slot = null;
                $equipped = false;

                if ('background' === $inventoryItem->getItemType()) {
                    $equipped = $inventoryItem->getItemId() === $equippedBackground;
                } elseif ('badge' === $inventoryItem->getItemType()) {
                    $slot = array_search($inventoryItem->getItemId(), $equippedBadgeSlots);
                    $equipped = false !== $slot;
                    $slot = $equipped ? (int) $slot : null;
                }

                $items[] = [
                    'item_id'      => $inventoryItem->getItemId(),
                    'item_type'    => $inventoryItem->getItemType(),
                    'name'         => $shopItem->getName(),
                    'description'  => $shopItem->getDescription(),
                    'emoji'        => $shopItem->getEmoji(),
                    'equipped'     => $equipped,
                    'slot'         => $slot,
                    'purchased_at' => $inventoryItem->getPurchasedAt()->format('c'),
                ];
            }

            usort($items, fn ($a, $b) => $b['equipped'] <=> $a['equipped'] ?: strcmp($a['item_type'], $b['item_type']));

            return new JsonResponse([
                'items'            => $items,
                'equipped_background' => $equippedBackground,
                'equipped_badges'  => $equippedBadgeSlots,
                'user_coins'       => $user->getCoins(),
            ]);
        } catch (Throwable $e) {
            return $this->serverErrorResponse($e);
        }
    }
}

<?php

namespace App\Controller\API;

use App\Entity\ShopItem;
use App\Entity\UserInventory;
use App\Repository\ShopItemRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/shop', name: 'api_shop_')]
class ShopController extends AbstractApiController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ShopItemRepository $shopItemRepository
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function getShopItems(Request $request): JsonResponse
    {
        try {
            $user = $this->getCurrentUser();
            $type = $request->query->get('type');

            $qb = $this->shopItemRepository->createQueryBuilder('s')
                ->where('s.available = :available')
                ->setParameter('available', true)
                ->orderBy('s.item_type', 'ASC')
                ->addOrderBy('s.price', 'ASC');

            if ($type && in_array($type, ['background', 'badge'])) {
                $qb->andWhere('s.item_type = :type')->setParameter('type', $type);
            }

            $shopItems = $qb->getQuery()->getResult();

            $ownedItemIds = [];
            $equippedBackground = null;
            $equippedBadgeIds = [];

            if ($user) {
                foreach ($user->getInventory() as $inventoryItem) {
                    $ownedItemIds[] = $inventoryItem->getItemId();
                }
                $equippedBackground = $user->getEquippedBackground();
                foreach ($user->getEquippedBadges() as $equippedBadge) {
                    $equippedBadgeIds[] = $equippedBadge->getBadgeId();
                }
            }

            $items = array_map(function (ShopItem $item) use ($ownedItemIds, $equippedBackground, $equippedBadgeIds) {
                $itemData = $item->toArray();
                $itemData['owned'] = in_array($item->getItemId(), $ownedItemIds);
                $itemData['equipped'] = match ($item->getItemType()) {
                    'background' => $item->getItemId() === $equippedBackground,
                    'badge' => in_array($item->getItemId(), $equippedBadgeIds),
                    default => false,
                };
                return $itemData;
            }, $shopItems);

            return new JsonResponse([
                'items' => $items,
                'user_coins' => $user?->getCoins() ?? 0,
            ]);
        } catch (\Throwable $e) {
            return $this->serverErrorResponse($e);
        }
    }

    #[Route('/purchase', name: 'purchase', methods: ['POST'])]
    public function purchaseItem(Request $request): JsonResponse
    {
        try {
            $user = $this->getCurrentUser();

            if (!$user) {
                return $this->unauthorizedResponse();
            }

            $data = json_decode($request->getContent(), true);
            $itemId = $data['item_id'] ?? null;

            if (!$itemId) {
                return $this->failureResponse('Item ID requis');
            }

            $item = $this->shopItemRepository->find($itemId);

            if (!$item) {
                return $this->failureResponse("Cet item n'existe pas", Response::HTTP_NOT_FOUND);
            }

            if (!$item->isAvailable()) {
                return $this->failureResponse("Cet item n'est plus disponible");
            }

            foreach ($user->getInventory() as $inventoryItem) {
                if ($inventoryItem->getItemId() === $itemId) {
                    return $this->failureResponse('Vous possédez déjà cet item', Response::HTTP_CONFLICT);
                }
            }

            if ($user->getCoins() < $item->getPrice()) {
                return new JsonResponse([
                    'success' => false,
                    'message' => sprintf("Vous n'avez pas assez d'argent. (%d€ / %d€)", $user->getCoins(), $item->getPrice()),
                ], Response::HTTP_PAYMENT_REQUIRED);
            }

            $this->entityManager->beginTransaction();

            try {
                $user->setCoins($user->getCoins() - $item->getPrice());

                $inventoryEntry = new UserInventory();
                $inventoryEntry->setUser($user);
                $inventoryEntry->setItemType($item->getItemType());
                $inventoryEntry->setItemId($item->getItemId());

                $this->entityManager->persist($inventoryEntry);
                $this->entityManager->flush();
                $this->entityManager->commit();

                return new JsonResponse([
                    'success' => true,
                    'message' => sprintf('Vous avez acheté %s pour %d€ !', $item->getName(), $item->getPrice()),
                    'new_balance' => $user->getCoins(),
                    'item' => array_merge($item->toArray(), ['owned' => true]),
                ]);
            } catch (\Throwable $e) {
                $this->entityManager->rollback();
                throw $e;
            }
        } catch (\Throwable $e) {
            return $this->serverErrorResponse($e);
        }
    }

    #[Route('/{itemId}', name: 'get', methods: ['GET'])]
    public function getItem(string $itemId): JsonResponse
    {
        try {
            $user = $this->getCurrentUser();
            $item = $this->shopItemRepository->find($itemId);

            if (!$item) {
                return $this->notFoundResponse('Item not found');
            }

            $itemData = $item->toArray();

            if ($user) {
                $owned = false;
                foreach ($user->getInventory() as $inventoryItem) {
                    if ($inventoryItem->getItemId() === $itemId) {
                        $owned = true;
                        break;
                    }
                }
                $itemData['owned'] = $owned;
                $itemData['equipped'] = ($item->getItemType() === 'background' && $item->getItemId() === $user->getEquippedBackground());
            }

            return new JsonResponse(['item' => $itemData]);
        } catch (\Throwable $e) {
            return $this->serverErrorResponse($e);
        }
    }
}

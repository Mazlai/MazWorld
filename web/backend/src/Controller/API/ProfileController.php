<?php

namespace App\Controller\API;

use App\Entity\UserEquippedBadge;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/profile', name: 'api_profile_')]
class ProfileController extends AbstractApiController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {}

    #[Route('/me', name: 'me', methods: ['GET'])]
    public function getProfile(): JsonResponse
    {
        try {
            $user = $this->getCurrentUser();

            if (!$user) {
                return new JsonResponse(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
            }

            $equippedBadges = [];
            foreach ($user->getEquippedBadges() as $badge) {
                $equippedBadges[$badge->getSlotNumber()] = $badge->getBadgeId();
            }
            ksort($equippedBadges);

            $currentCity = $user->getCurrentCity();

            return new JsonResponse(['profile' => [
                'user_id' => $user->getUserId(),
                'username' => $user->getUsername(),
                'discord_avatar' => $user->getDiscordAvatar(),
                'coins' => $user->getCoins(),
                'equipped_background' => $user->getEquippedBackground(),
                'equipped_badges' => array_values($equippedBadges),
                'current_city' => $currentCity?->getCityId(),
                'current_city_name' => $currentCity?->getName() ?? 'Unknown',
                'traveling_to' => $user->getTravelingTo()?->getCityId(),
                'arrival_time' => $user->getArrivalTime(),
                'created_at' => $user->getCreatedAt()->format('c'),
                'visited_cities_count' => $user->getVisitedCities()->count(),
                'inventory_count' => $user->getInventory()->count(),
            ]]);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => 'Internal error', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/equip/background', name: 'equip_background', methods: ['POST'])]
    public function equipBackground(Request $request): JsonResponse
    {
        try {
            $user = $this->getCurrentUser();

            if (!$user) {
                return new JsonResponse(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
            }

            $data = json_decode($request->getContent(), true);
            $itemId = $data['item_id'] ?? null;

            if (!$itemId) {
                return new JsonResponse(['success' => false, 'message' => 'Item ID requis'], Response::HTTP_BAD_REQUEST);
            }

            $ownsItem = false;
            foreach ($user->getInventory() as $inventoryItem) {
                if ($inventoryItem->getItemId() === $itemId && $inventoryItem->getItemType() === 'background') {
                    $ownsItem = true;
                    break;
                }
            }

            if (!$ownsItem) {
                return new JsonResponse(['success' => false, 'message' => 'Vous ne possédez pas ce background'], Response::HTTP_FORBIDDEN);
            }

            $user->setEquippedBackground($itemId);
            $this->entityManager->flush();

            return new JsonResponse(['success' => true, 'message' => 'Background équipé avec succès']);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => 'Internal error', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/equip/badge', name: 'equip_badge', methods: ['POST'])]
    public function equipBadge(Request $request): JsonResponse
    {
        try {
            $user = $this->getCurrentUser();

            if (!$user) {
                return new JsonResponse(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
            }

            $data = json_decode($request->getContent(), true);
            $badgeId = $data['badge_id'] ?? null;
            $slot = $data['slot'] ?? null;

            if (!$badgeId || $slot === null) {
                return new JsonResponse(['success' => false, 'message' => 'Badge ID et slot requis'], Response::HTTP_BAD_REQUEST);
            }

            if ($slot < 0 || $slot > 5) {
                return new JsonResponse(['success' => false, 'message' => 'Slot invalide (0-5)'], Response::HTTP_BAD_REQUEST);
            }

            $ownsItem = false;
            foreach ($user->getInventory() as $inventoryItem) {
                if ($inventoryItem->getItemId() === $badgeId && $inventoryItem->getItemType() === 'badge') {
                    $ownsItem = true;
                    break;
                }
            }

            if (!$ownsItem) {
                return new JsonResponse(['success' => false, 'message' => 'Vous ne possédez pas ce badge'], Response::HTTP_FORBIDDEN);
            }

            foreach ($user->getEquippedBadges() as $equippedBadge) {
                if ($equippedBadge->getBadgeId() === $badgeId) {
                    return new JsonResponse(['success' => false, 'message' => 'Ce badge est déjà équipé'], Response::HTTP_CONFLICT);
                }
            }

            foreach ($user->getEquippedBadges() as $equippedBadge) {
                if ($equippedBadge->getSlotNumber() === $slot) {
                    $this->entityManager->remove($equippedBadge);
                    break;
                }
            }

            $newEquippedBadge = new UserEquippedBadge();
            $newEquippedBadge->setUser($user);
            $newEquippedBadge->setBadgeId($badgeId);
            $newEquippedBadge->setSlotNumber($slot);

            $this->entityManager->persist($newEquippedBadge);
            $this->entityManager->flush();

            return new JsonResponse(['success' => true, 'message' => 'Badge équipé avec succès']);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => 'Internal error', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/unequip/badge', name: 'unequip_badge', methods: ['POST'])]
    public function unequipBadge(Request $request): JsonResponse
    {
        try {
            $user = $this->getCurrentUser();

            if (!$user) {
                return new JsonResponse(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
            }

            $data = json_decode($request->getContent(), true);
            $slot = $data['slot'] ?? null;

            if ($slot === null) {
                return new JsonResponse(['success' => false, 'message' => 'Slot requis'], Response::HTTP_BAD_REQUEST);
            }

            $found = false;
            foreach ($user->getEquippedBadges() as $equippedBadge) {
                if ($equippedBadge->getSlotNumber() === (int)$slot) {
                    $this->entityManager->remove($equippedBadge);
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                return new JsonResponse(['success' => false, 'message' => 'Aucun badge dans ce slot'], Response::HTTP_NOT_FOUND);
            }

            $this->entityManager->flush();

            return new JsonResponse(['success' => true, 'message' => 'Badge déséquipé avec succès']);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => 'Internal error', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}

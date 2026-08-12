<?php

namespace App\Controller\API;

use App\Entity\UserEquippedBadge;
use App\Service\Crypto\TokenEncryptorService;
use App\Service\Discord\DiscordOAuthService;
use App\Service\User\UserService;
use Doctrine\ORM\EntityManagerInterface;
use Exception;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Throwable;

#[Route('/api/profile', name: 'api_profile_')]
class ProfileController extends AbstractApiController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly DiscordOAuthService $discordOAuth,
        private readonly TokenEncryptorService $tokenEncryptor,
        private readonly UserService $userService,
    ) {
    }

    #[Route('/me', name: 'me', methods: ['GET'])]
    public function getProfile(): JsonResponse
    {
        try {
            $user = $this->getCurrentUser();

            if (!$user) {
                return $this->unauthorizedResponse();
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
        } catch (Throwable $e) {
            return $this->serverErrorResponse($e);
        }
    }

    #[Route('/guilds', name: 'guilds', methods: ['GET'])]
    public function getAdminGuilds(): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        $accessToken = $user->getOauthAccessToken();

        if (!$accessToken) {
            return new JsonResponse(['guilds' => []]);
        }
        $accessToken = $this->tokenEncryptor->decrypt($accessToken);

        try {
            if ($user->isAccessTokenExpired() && $user->getOauthRefreshToken()) {
                $newTokens = $this->discordOAuth->refreshTokens($this->tokenEncryptor->decrypt($user->getOauthRefreshToken()));
                $this->userService->updateUserTokens($user, $newTokens);
                $this->entityManager->flush();

                $accessToken = $newTokens->accessToken;
            }

            $allGuilds = $this->discordOAuth->getDiscordUserGuilds($accessToken, true);

            $adminGuilds = array_filter($allGuilds, fn ($guild) => $guild->owner || (((int) $guild->permissions & 0x8) === 0x8));

            return new JsonResponse(['guilds' => array_values(array_map(fn ($guild) => [
                'id' => $guild->id,
                'name' => $guild->name,
                'icon' => $guild->icon,
                'owner' => $guild->owner,
                'permissions' => $guild->permissions,
                'member_count' => $guild->approximate_member_count,
                'presence_count' => $guild->approximate_presence_count,
                'has_bot' => $this->discordOAuth->isBotInGuild($guild->id),
            ], $adminGuilds))]);
        } catch (Exception $e) {
            return $this->serverErrorResponse($e);
        }
    }

    #[Route('/equip/background', name: 'equip_background', methods: ['POST'])]
    public function equipBackground(Request $request): JsonResponse
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

            $ownsItem = false;
            foreach ($user->getInventory() as $inventoryItem) {
                if ($inventoryItem->getItemId() === $itemId && 'background' === $inventoryItem->getItemType()) {
                    $ownsItem = true;
                    break;
                }
            }

            if (!$ownsItem) {
                return $this->failureResponse('Vous ne possédez pas ce background', Response::HTTP_FORBIDDEN);
            }

            $user->setEquippedBackground($itemId);
            $this->entityManager->flush();

            return new JsonResponse(['success' => true, 'message' => 'Background équipé avec succès']);
        } catch (Throwable $e) {
            return $this->serverErrorResponse($e);
        }
    }

    #[Route('/equip/badge', name: 'equip_badge', methods: ['POST'])]
    public function equipBadge(Request $request): JsonResponse
    {
        try {
            $user = $this->getCurrentUser();

            if (!$user) {
                return $this->unauthorizedResponse();
            }

            $data = json_decode($request->getContent(), true);
            $badgeId = $data['badge_id'] ?? null;
            $slot = $data['slot'] ?? null;

            if (!$badgeId || null === $slot) {
                return $this->failureResponse('Badge ID et slot requis');
            }

            if ($slot < 0 || $slot > 5) {
                return $this->failureResponse('Slot invalide (0-5)');
            }

            $ownsItem = false;
            foreach ($user->getInventory() as $inventoryItem) {
                if ($inventoryItem->getItemId() === $badgeId && 'badge' === $inventoryItem->getItemType()) {
                    $ownsItem = true;
                    break;
                }
            }

            if (!$ownsItem) {
                return $this->failureResponse('Vous ne possédez pas ce badge', Response::HTTP_FORBIDDEN);
            }

            foreach ($user->getEquippedBadges() as $equippedBadge) {
                if ($equippedBadge->getBadgeId() === $badgeId) {
                    return $this->failureResponse('Ce badge est déjà équipé', Response::HTTP_CONFLICT);
                }
            }

            foreach ($user->getEquippedBadges() as $equippedBadge) {
                if ($equippedBadge->getSlotNumber() === $slot) {
                    $equippedBadge->setBadgeId($badgeId);
                    $this->entityManager->flush();

                    return new JsonResponse(['success' => true, 'message' => 'Badge équipé avec succès']);
                }
            }

            $newEquippedBadge = new UserEquippedBadge();
            $newEquippedBadge->setUser($user);
            $newEquippedBadge->setBadgeId($badgeId);
            $newEquippedBadge->setSlotNumber($slot);

            $this->entityManager->persist($newEquippedBadge);
            $this->entityManager->flush();

            return new JsonResponse(['success' => true, 'message' => 'Badge équipé avec succès']);
        } catch (Throwable $e) {
            return $this->serverErrorResponse($e);
        }
    }

    #[Route('/unequip/badge', name: 'unequip_badge', methods: ['POST'])]
    public function unequipBadge(Request $request): JsonResponse
    {
        try {
            $user = $this->getCurrentUser();

            if (!$user) {
                return $this->unauthorizedResponse();
            }

            $data = json_decode($request->getContent(), true);
            $slot = $data['slot'] ?? null;

            if (null === $slot) {
                return $this->failureResponse('Slot requis');
            }

            $found = false;
            foreach ($user->getEquippedBadges() as $equippedBadge) {
                if ($equippedBadge->getSlotNumber() === (int) $slot) {
                    $this->entityManager->remove($equippedBadge);
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                return $this->failureResponse('Aucun badge dans ce slot', Response::HTTP_NOT_FOUND);
            }

            $this->entityManager->flush();

            return new JsonResponse(['success' => true, 'message' => 'Badge déséquipé avec succès']);
        } catch (Throwable $e) {
            return $this->serverErrorResponse($e);
        }
    }
}

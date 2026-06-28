<?php

namespace App\Controller\API;

use App\Entity\ShopItem;
use App\Entity\UserInventory;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/records', name: 'api_records_')]
class RecordsController extends AbstractApiController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager
    ) {}

    #[Route('', name: 'me', methods: ['GET'])]
    public function getMyRecords(): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            $em = $this->entityManager;

            // ===== COINS =====
            $totalUsers = (int)$em->createQuery('SELECT COUNT(u) FROM App\Entity\User u')->getSingleScalarResult();
            $rank = (int)$em->createQuery('SELECT COUNT(u) FROM App\Entity\User u WHERE u.coins > :coins')
                ->setParameter('coins', $user->getCoins())
                ->getSingleScalarResult() + 1;
            $percentile = $totalUsers > 1
                ? (int)round((($totalUsers - $rank) / ($totalUsers - 1)) * 100)
                : 100;

            // ===== EXPLORATION =====
            $allCities = $em->createQuery('SELECT c FROM App\Entity\City c ORDER BY c.name ASC')->getResult();
            $totalCities = count($allCities);

            $visitedMap = [];
            foreach ($user->getVisitedCities() as $vc) {
                $visitedMap[$vc->getCity()->getCityId()] = $vc->getFirstVisit()->format('c');
            }

            $visitedCities = [];
            $allCitiesData = [];
            foreach ($allCities as $city) {
                $cid = $city->getCityId();
                $isVisited = isset($visitedMap[$cid]);
                $entry = [
                    'city_id'     => $cid,
                    'name'        => $city->getName(),
                    'emoji'       => $city->getEmoji(),
                    'theme'       => $city->getTheme(),
                    'visited'     => $isVisited,
                    'first_visit' => $isVisited ? $visitedMap[$cid] : null,
                ];
                $allCitiesData[] = $entry;
                if ($isVisited) {
                    $visitedCities[] = $entry;
                }
            }
            usort($visitedCities, fn($a, $b) => $a['first_visit'] <=> $b['first_visit']);

            // ===== COLLECTION =====
            $inventoryCount = (int)$em->createQuery('SELECT COUNT(i) FROM App\Entity\UserInventory i WHERE i.user = :user')
                ->setParameter('user', $user)
                ->getSingleScalarResult();

            $badgesCount = $user->getEquippedBadges()->count();

            $recentItem = null;
            try {
                $latestInventory = $em->createQuery('
                    SELECT i FROM App\Entity\UserInventory i
                    WHERE i.user = :user
                    ORDER BY i.purchased_at DESC
                ')->setParameter('user', $user)->setMaxResults(1)->getOneOrNullResult();

                if ($latestInventory instanceof UserInventory) {
                    $shopItem = $em->getRepository(ShopItem::class)->findOneBy(['item_id' => $latestInventory->getItemId()]);
                    $recentItem = $shopItem?->getName();
                }
            } catch (\Throwable) {}

            // ===== ACTIVITY =====
            $joinedAt = $user->getCreatedAt()->format('c');
            $lastActivity = ($user->getUpdatedAt() ?? $user->getCreatedAt())->format('c');
            $joinedDate = new \DateTime($joinedAt);
            $daysActive = (int)$joinedDate->diff(new \DateTime())->days;

            return new JsonResponse([
                'coins' => [
                    'current'     => $user->getCoins(),
                    'rank'        => $rank,
                    'total_users' => $totalUsers,
                    'percentile'  => $percentile,
                ],
                'exploration' => [
                    'visited_count' => count($visitedCities),
                    'total_cities'  => $totalCities,
                    'cities'        => $allCitiesData,
                ],
                'collection' => [
                    'inventory_count' => $inventoryCount,
                    'badges_count'    => $badgesCount,
                    'recent_item'     => $recentItem,
                ],
                'activity' => [
                    'joined_at'     => $joinedAt,
                    'last_activity' => $lastActivity,
                    'days_active'   => $daysActive,
                ],
            ]);
        } catch (\Throwable $e) {
            return new JsonResponse(
                ['error' => 'Internal error', 'message' => $e->getMessage()],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }
}
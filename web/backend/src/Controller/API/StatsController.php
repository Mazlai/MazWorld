<?php

namespace App\Controller\API;

use App\Entity\ShopItem;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Throwable;

#[Route('/api/stats', name: 'api_stats_')]
#[IsGranted('ROLE_ADMIN')]
class StatsController extends AbstractApiController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager
    ) {
    }

    #[Route('', name: 'all', methods: ['GET'])]
    public function getAllStats(): JsonResponse
    {
        try {
            return new JsonResponse([
                'global' => $this->getGlobalStatsData(),
                'economy' => $this->getEconomyStatsData(),
            ]);
        } catch (Throwable $e) {
            return $this->serverErrorResponse($e);
        }
    }

    #[Route('/global', name: 'global', methods: ['GET'])]
    public function getGlobalStats(): JsonResponse
    {
        try {
            return new JsonResponse($this->getGlobalStatsData());
        } catch (Throwable $e) {
            return $this->serverErrorResponse($e);
        }
    }

    private function getGlobalStatsData(): array
    {
        $em = $this->entityManager;

        $totalUsers = (int) $em->createQuery('SELECT COUNT(u) FROM App\Entity\User u')->getSingleScalarResult();
        $totalCities = (int) $em->createQuery('SELECT COUNT(c) FROM App\Entity\City c')->getSingleScalarResult();
        $totalCoins = (int) $em->createQuery('SELECT COALESCE(SUM(u.coins), 0) FROM App\Entity\User u')->getSingleScalarResult();

        $today = new DateTime('-24 hours');
        $activeToday = (int) $em->createQuery('SELECT COUNT(u) FROM App\Entity\User u WHERE u.updated_at >= :today')
            ->setParameter('today', $today)->getSingleScalarResult();

        $weekAgo = new DateTime('-7 days');
        $activeWeek = (int) $em->createQuery('SELECT COUNT(u) FROM App\Entity\User u WHERE u.updated_at >= :weekAgo')
            ->setParameter('weekAgo', $weekAgo)->getSingleScalarResult();

        return [
            'total_users' => $totalUsers,
            'total_cities' => $totalCities,
            'total_coins_circulation' => $totalCoins,
            'active_users_today' => $activeToday,
            'active_users_week' => $activeWeek,
        ];
    }

    private function getEconomyStatsData(): array
    {
        $em = $this->entityManager;

        $avgCoins = (float) $em->createQuery('SELECT COALESCE(AVG(u.coins), 0) FROM App\Entity\User u')->getSingleScalarResult();
        $richestCoins = (int) $em->createQuery('SELECT COALESCE(MAX(u.coins), 0) FROM App\Entity\User u')->getSingleScalarResult();
        $totalPurchases = (int) $em->createQuery('SELECT COUNT(i) FROM App\Entity\UserInventory i')->getSingleScalarResult();

        $mostPopularItem = 'N/A';
        try {
            $result = $em->createQuery('
                SELECT i.item_id, COUNT(i) as purchase_count
                FROM App\Entity\UserInventory i
                GROUP BY i.item_id
                ORDER BY purchase_count DESC
            ')->setMaxResults(1)->getOneOrNullResult();

            if ($result) {
                $shopItem = $em->getRepository(ShopItem::class)->findOneBy(['item_id' => $result['item_id']]);
                if ($shopItem) {
                    $mostPopularItem = $shopItem->getName();
                }
            }
        } catch (Throwable) {
        }

        return [
            'average_coins_per_user' => (int) round($avgCoins),
            'richest_user_coins' => $richestCoins,
            'total_shop_purchases' => $totalPurchases,
            'most_popular_item' => $mostPopularItem,
        ];
    }
}

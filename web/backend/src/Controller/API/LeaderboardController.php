<?php

namespace App\Controller\API;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/leaderboard', name: 'api_leaderboard_')]
class LeaderboardController extends AbstractApiController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserRepository $userRepository
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function getLeaderboard(Request $request): JsonResponse
    {
        try {
            $page = max(1, (int)$request->query->get('page', 1));
            $limit = min(50, max(1, (int)$request->query->get('limit', 20)));
            $offset = ($page - 1) * $limit;

            $total = (int)$this->entityManager
                ->createQuery('SELECT COUNT(u.user_id) FROM App\Entity\User u')
                ->getSingleScalarResult();

            $results = $this->entityManager
                ->createQueryBuilder()
                ->select('u')
                ->from(User::class, 'u')
                ->orderBy('u.coins', 'DESC')
                ->setFirstResult($offset)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $entries = [];
            $rank = $offset + 1;

            foreach ($results as $user) {
                $entries[] = [
                    'rank' => $rank++,
                    'discord_id' => $user->getUserId(),
                    'username' => $user->getUsername(),
                    'avatar' => $user->getDiscordAvatar(),
                    'coins' => $user->getCoins(),
                ];
            }

            $userRank = null;
            $currentUser = $this->getCurrentUser();
            if ($currentUser) {
                $userRank = $this->getUserRank($currentUser);
            }

            return new JsonResponse([
                'entries' => $entries,
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'user_rank' => $userRank,
            ]);
        } catch (\Throwable $e) {
            return $this->serverErrorResponse($e);
        }
    }

    #[Route('/me', name: 'user_rank', methods: ['GET'])]
    public function getMyRank(): JsonResponse
    {
        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->unauthorizedResponse();
        }

        return new JsonResponse(['rank' => $this->getUserRank($currentUser)]);
    }

    private function getUserRank(User $user): int
    {
        return ((int)$this->entityManager
            ->createQueryBuilder()
            ->select('COUNT(u.user_id)')
            ->from(User::class, 'u')
            ->where('u.coins > :userCoins')
            ->setParameter('userCoins', $user->getCoins())
            ->getQuery()
            ->getSingleScalarResult()) + 1;
    }
}

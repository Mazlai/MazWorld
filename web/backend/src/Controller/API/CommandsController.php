<?php

namespace App\Controller\API;

use App\Entity\CityJob;
use App\Repository\CityJobRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/commands', name: 'api_commands_')]
class CommandsController extends AbstractApiController
{
    private const DAILY_COOLDOWN = 86400;
    private const WORK_COOLDOWN = 3600;
    private const DAILY_REWARD = 5;
    private const WORK_MIN_REWARD = 20;
    private const WORK_MAX_REWARD = 30;
    private const COINFLIP_MIN = 10;
    private const COINFLIP_MAX = 500;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CityJobRepository $cityJobRepository
    ) {}

    #[Route('/daily', name: 'daily', methods: ['POST'])]
    public function daily(): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        $lastDaily = $user->getLastDaily();
        $now = time();

        if ($lastDaily > 0) {
            $timeSince = $now - $lastDaily;

            if ($timeSince < self::DAILY_COOLDOWN) {
                $remaining = self::DAILY_COOLDOWN - $timeSince;

                return $this->failureResponse(
                    sprintf('⏱️ Vous avez déjà réclamé votre récompense. Revenez dans %dh %dm.', floor($remaining / 3600), floor(($remaining % 3600) / 60)),
                    Response::HTTP_TOO_MANY_REQUESTS,
                    ['next_daily' => $lastDaily + self::DAILY_COOLDOWN]
                );
            }
        }

        $user->setCoins($user->getCoins() + self::DAILY_REWARD);
        $user->setLastDaily($now);
        $this->entityManager->flush();
        $this->logCoinTransaction($user, 'daily', self::DAILY_REWARD, $user->getCoins());

        return new JsonResponse([
            'success' => true,
            'message' => '🎁 Vous avez reçu votre récompense quotidienne de ' . self::DAILY_REWARD . '€ !',
            'coins' => $user->getCoins(),
        ]);
    }

    #[Route('/work', name: 'work', methods: ['POST'])]
    public function work(): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        if ($user->getTravelingTo() !== null && $user->getArrivalTime() !== null && time() < $user->getArrivalTime()) {
            return $this->failureResponse('🚂 Vous êtes en voyage ! Vous ne pouvez pas travailler pendant un déplacement.', Response::HTTP_CONFLICT);
        }

        $now = time();
        $lastWork = $user->getLastWork();

        if ($lastWork > 0) {
            $timeSince = $now - $lastWork;

            if ($timeSince < self::WORK_COOLDOWN) {
                $remaining = self::WORK_COOLDOWN - $timeSince;

                return $this->failureResponse(
                    sprintf('⏱️ Vous êtes fatigué ! Reposez-vous encore %dh %dm avant de retravailler.', floor($remaining / 3600), floor(($remaining % 3600) / 60)),
                    Response::HTTP_TOO_MANY_REQUESTS,
                    ['next_work' => $lastWork + self::WORK_COOLDOWN]
                );
            }
        }

        $currentCity = $user->getCurrentCity();

        if (!$currentCity) {
            return $this->failureResponse("❌ Vous n'êtes dans aucune ville.");
        }

        $jobs = $this->cityJobRepository->findBy(['city' => $currentCity]);

        if (empty($jobs)) {
            return $this->failureResponse("❌ Aucun travail n'est disponible à {$currentCity->getEmoji()} {$currentCity->getName()}.", Response::HTTP_NOT_FOUND);
        }

        /** @var CityJob $randomJob */
        $randomJob = $jobs[array_rand($jobs)];
        $tasks = [$randomJob->getTask1(), $randomJob->getTask2(), $randomJob->getTask3()];
        $task = $tasks[array_rand($tasks)];
        $reward = random_int(self::WORK_MIN_REWARD, self::WORK_MAX_REWARD);

        $user->setCoins($user->getCoins() + $reward);
        $user->setLastWork($now);
        $this->entityManager->flush();
        $this->logCoinTransaction($user, 'work', $reward, $user->getCoins());

        return new JsonResponse([
            'success' => true,
            'message' => "{$randomJob->getJobEmoji()} Vous avez travaillé comme {$randomJob->getJobName()} et avez gagné {$reward}€ !\n\n📋 Tâche : {$task}",
            'job_name' => $randomJob->getJobName(),
            'job_emoji' => $randomJob->getJobEmoji(),
            'task' => $task,
            'reward' => $reward,
            'coins' => $user->getCoins(),
            'next_work' => $now + self::WORK_COOLDOWN,
        ]);
    }

    #[Route('/coinflip', name: 'coinflip', methods: ['POST'])]
    public function coinflip(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        if ($user->getTravelingTo() !== null && $user->getArrivalTime() !== null && time() < $user->getArrivalTime()) {
            return $this->failureResponse('🚂 Vous êtes en voyage ! Vous ne pouvez pas jouer pendant un déplacement.', Response::HTTP_CONFLICT);
        }

        $data = json_decode($request->getContent(), true);
        $choice = $data['choice'] ?? null;
        $amount = (int)($data['amount'] ?? 0);

        if (!in_array($choice, ['pile', 'face'])) {
            return $this->failureResponse('❌ Choix invalide. Choisissez "pile" ou "face".');
        }

        if ($amount < self::COINFLIP_MIN || $amount > self::COINFLIP_MAX) {
            return $this->failureResponse(sprintf('❌ La mise doit être entre %d€ et %d€.', self::COINFLIP_MIN, self::COINFLIP_MAX));
        }

        $maxBet = (int)min(floor($user->getCoins() / 2), self::COINFLIP_MAX);
        if ($amount > $maxBet) {
            return $this->failureResponse("⚠️ Mise trop élevée ! Vous pouvez parier jusqu'à {$maxBet}€ (50% de votre solde ou 500€ max).");
        }

        $this->entityManager->beginTransaction();
        try {
            $this->entityManager->lock($user, \Doctrine\DBAL\LockMode::PESSIMISTIC_WRITE);
            $this->entityManager->refresh($user);

            if ($user->getCoins() < $amount) {
                $this->entityManager->rollback();
                return $this->failureResponse("❌ Vous n'avez pas assez d'argent. Solde actuel : {$user->getCoins()}€", Response::HTTP_PAYMENT_REQUIRED);
            }

            $result = random_int(0, 1) === 0 ? 'pile' : 'face';
            $won = $result === $choice;

            $delta = $won ? $amount : -$amount;
            $user->setCoins($user->getCoins() + $delta);
            $this->entityManager->flush();
            $this->entityManager->commit();
            $this->logCoinTransaction($user, 'coinflip', $delta, $user->getCoins());

            return new JsonResponse([
                'success' => true,
                'won' => $won,
                'result' => $result,
                'amount' => $amount,
                'message' => $won
                    ? "🎉 La pièce est tombée sur {$result} ! Vous gagnez {$amount}€ !"
                    : "😢 La pièce est tombée sur {$result}. Vous perdez {$amount}€.",
                'coins' => $user->getCoins(),
            ]);
        } catch (\Throwable $e) {
            $this->entityManager->rollback();
            return $this->serverErrorResponse($e);
        }
    }
}

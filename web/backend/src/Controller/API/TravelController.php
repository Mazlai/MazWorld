<?php

namespace App\Controller\API;

use App\Entity\VisitedCity;
use App\Repository\CityRepository;
use App\Repository\RouteRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/travel', name: 'api_travel_')]
class TravelController extends AbstractApiController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CityRepository $cityRepository,
        private readonly RouteRepository $routeRepository,
    ) {}

    #[Route('/status', name: 'status', methods: ['GET'])]
    public function status(): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        $travelingTo = $user->getTravelingTo();
        $arrivalTime = $user->getArrivalTime();

        if (!$travelingTo || !$arrivalTime) {
            return new JsonResponse(['traveling' => false]);
        }

        if (time() >= $arrivalTime) {
            $this->completeTravel($user);
            return new JsonResponse(['traveling' => false]);
        }

        return new JsonResponse([
            'traveling' => true,
            'destination' => $travelingTo->getCityId(),
            'destination_name' => $travelingTo->getName(),
            'destination_emoji' => $travelingTo->getEmoji(),
            'arrival_time' => $arrivalTime,
        ]);
    }

    #[Route('/map', name: 'map', methods: ['GET'])]
    public function map(): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        if ($user->getTravelingTo() && $user->getArrivalTime() && time() >= $user->getArrivalTime()) {
            $this->completeTravel($user);
        }

        $city = $user->getCurrentCity();

        $visitedIds = [];
        foreach ($user->getVisitedCities() as $vc) {
            $visitedIds[] = $vc->getCity()->getCityId();
        }

        $routes = array_map(function ($route) use ($visitedIds) {
            $dest = $route->getCityTo();
            $visited = in_array($dest->getCityId(), $visitedIds, true);
            return [
                'route_id' => $route->getRouteId(),
                'city_to' => $dest->getCityId(),
                'destination_name' => $dest->getName(),
                'destination_emoji' => $dest->getEmoji(),
                'cost' => $route->getCost(),
                'duration' => $route->getDuration(),
                'visited' => $visited,
                'effective_cost' => $visited ? 0 : $route->getCost(),
            ];
        }, $city->getRoutesFrom()->toArray());

        $jobs = array_map(function ($job) {
            return [
                'job_id' => $job->getJobId(),
                'job_name' => $job->getJobName(),
                'job_emoji' => $job->getJobEmoji(),
                'task_1' => $job->getTask1(),
                'task_2' => $job->getTask2(),
                'task_3' => $job->getTask3(),
            ];
        }, $city->getJobs()->toArray());

        return new JsonResponse([
            'current_city' => [
                'city_id' => $city->getCityId(),
                'name' => $city->getName(),
                'description' => $city->getDescription(),
                'emoji' => $city->getEmoji(),
                'theme' => $city->getTheme(),
            ],
            'coins' => $user->getCoins(),
            'routes' => $routes,
            'jobs' => $jobs,
        ]);
    }

    #[Route('/start', name: 'start', methods: ['POST'])]
    public function start(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        if ($user->getTravelingTo() && $user->getArrivalTime() && time() < $user->getArrivalTime()) {
            return $this->failureResponse('🚂 Vous êtes déjà en voyage !', Response::HTTP_CONFLICT);
        }

        $data = json_decode($request->getContent(), true);
        $destinationId = $data['destination_id'] ?? null;

        if (!$destinationId) {
            return $this->failureResponse('destination_id requis');
        }

        $destination = $this->cityRepository->find($destinationId);

        if (!$destination) {
            return $this->failureResponse("Cette ville n'existe pas.", Response::HTTP_NOT_FOUND);
        }

        $currentCity = $user->getCurrentCity();
        $route = $this->routeRepository->findOneBy(['city_from' => $currentCity, 'city_to' => $destination]);

        if (!$route) {
            return $this->failureResponse("Aucune route vers {$destination->getName()} depuis {$currentCity->getName()}.", Response::HTTP_NOT_FOUND);
        }

        $alreadyVisited = false;
        foreach ($user->getVisitedCities() as $vc) {
            if ($vc->getCity()->getCityId() === $destinationId) {
                $alreadyVisited = true;
                break;
            }
        }

        $travelCost = $alreadyVisited ? 0 : $route->getCost();

        $this->entityManager->beginTransaction();
        try {
            $this->entityManager->lock($user, \Doctrine\DBAL\LockMode::PESSIMISTIC_WRITE);
            $this->entityManager->refresh($user);

            if ($user->getTravelingTo() && $user->getArrivalTime() && time() < $user->getArrivalTime()) {
                $this->entityManager->rollback();
                return $this->failureResponse('🚂 Vous êtes déjà en voyage !', Response::HTTP_CONFLICT);
            }

            if ($travelCost > 0 && $user->getCoins() < $travelCost) {
                $this->entityManager->rollback();
                return $this->failureResponse("❌ Vous n'avez pas assez d'argent. ({$user->getCoins()}€ / {$travelCost}€)", Response::HTTP_PAYMENT_REQUIRED);
            }

            if ($travelCost > 0) {
                $user->setCoins($user->getCoins() - $travelCost);
            }

            $arrivalTime = time() + $route->getDuration();
            $user->setTravelingTo($destination);
            $user->setArrivalTime($arrivalTime);
            $this->entityManager->flush();
            $this->entityManager->commit();

            return new JsonResponse([
                'success' => true,
                'message' => "Voyage commencé !",
                'arrival_time' => $arrivalTime,
                'travel_cost' => $travelCost,
                'coins' => $user->getCoins(),
            ]);
        } catch (\Throwable $e) {
            $this->entityManager->rollback();
            return $this->serverErrorResponse($e);
        }
    }

    private function completeTravel(\App\Entity\User $user): void
    {
        $destination = $user->getTravelingTo();
        if (!$destination) return;

        $user->setCurrentCity($destination);
        $user->setTravelingTo(null);
        $user->setArrivalTime(null);

        $alreadyVisited = false;
        foreach ($user->getVisitedCities() as $vc) {
            if ($vc->getCity()->getCityId() === $destination->getCityId()) {
                $alreadyVisited = true;
                break;
            }
        }

        if (!$alreadyVisited) {
            $visitedCity = new VisitedCity();
            $visitedCity->setUser($user);
            $visitedCity->setCity($destination);
            $this->entityManager->persist($visitedCity);
        }

        $this->entityManager->flush();
    }
}

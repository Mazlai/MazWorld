<?php

namespace App\Controller\API;

use App\Repository\CityRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/cities', name: 'api_cities_')]
class CityController extends AbstractController
{
    public function __construct(
        private CityRepository $cityRepository
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $cities = $this->cityRepository->findAll();

        $data = array_map(function ($city) {
            return [
                'city_id' => $city->getCityId(),
                'name' => $city->getName(),
                'description' => $city->getDescription(),
                'emoji' => $city->getEmoji(),
                'theme' => $city->getTheme(),
                'position_x' => $city->getPositionX(),
                'position_y' => $city->getPositionY(),
            ];
        }, $cities);

        return $this->json($data);
    }

    #[Route('/{cityId}', name: 'show', methods: ['GET'])]
    public function show(string $cityId): JsonResponse
    {
        $city = $this->cityRepository->findOneWithDetails($cityId);

        if (!$city) {
            return $this->json(['error' => 'City not found'], Response::HTTP_NOT_FOUND);
        }

        $jobs = array_map(function ($job) {
            return [
                'job_id' => $job->getJobId(),
                'name' => $job->getJobName(),
                'emoji' => $job->getJobEmoji(),
                'task_1' => $job->getTask1(),
                'task_2' => $job->getTask2(),
                'task_3' => $job->getTask3(),
            ];
        }, $city->getJobs()->toArray());

        $routes = array_map(function ($route) {
            return [
                'route_id' => $route->getRouteId(),
                'city_to' => $route->getCityTo()->getCityId(),
                'destination_name' => $route->getCityTo()->getName(),
                'destination_emoji' => $route->getCityTo()->getEmoji(),
                'cost' => $route->getCost(),
                'duration' => $route->getDuration(),
            ];
        }, $city->getRoutesFrom()->toArray());

        return $this->json([
            'city' => [
                'city_id' => $city->getCityId(),
                'name' => $city->getName(),
                'description' => $city->getDescription(),
                'emoji' => $city->getEmoji(),
                'theme' => $city->getTheme(),
                'position_x' => $city->getPositionX(),
                'position_y' => $city->getPositionY(),
            ],
            'jobs' => $jobs,
            'routes' => $routes,
        ]);
    }

    #[Route('/{cityId}/jobs', name: 'jobs', methods: ['GET'])]
    public function jobs(string $cityId): JsonResponse
    {
        $city = $this->cityRepository->find($cityId);

        if (!$city) {
            return $this->json(['error' => 'City not found'], Response::HTTP_NOT_FOUND);
        }

        $jobs = array_map(function ($job) {
            return [
                'job_id' => $job->getJobId(),
                'city_id' => $job->getCity()->getCityId(),
                'name' => $job->getJobName(),
                'emoji' => $job->getJobEmoji(),
                'task_1' => $job->getTask1(),
                'task_2' => $job->getTask2(),
                'task_3' => $job->getTask3(),
            ];
        }, $city->getJobs()->toArray());

        return $this->json($jobs);
    }

    #[Route('/{cityId}/routes', name: 'routes', methods: ['GET'])]
    public function routes(string $cityId): JsonResponse
    {
        $city = $this->cityRepository->find($cityId);

        if (!$city) {
            return $this->json(['error' => 'City not found'], Response::HTTP_NOT_FOUND);
        }

        $routes = array_map(function ($route) {
            return [
                'route_id' => $route->getRouteId(),
                'city_from' => $route->getCityFrom()->getCityId(),
                'city_to' => $route->getCityTo()->getCityId(),
                'destination_name' => $route->getCityTo()->getName(),
                'destination_emoji' => $route->getCityTo()->getEmoji(),
                'cost' => $route->getCost(),
                'duration' => $route->getDuration(),
            ];
        }, $city->getRoutesFrom()->toArray());

        return $this->json($routes);
    }
}

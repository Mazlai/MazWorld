<?php

namespace App\Controller\API;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/routes', name: 'api_routes_')]
class RouteController extends AbstractApiController
{
    public function __construct(
        private Connection $connection
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $routes = $this->connection->fetchAllAssociative('
            SELECT
                r.route_id,
                r.city_from_id as city_from,
                r.city_to_id as city_to,
                r.cost,
                r.duration,
                cf.name as from_name,
                cf.emoji as from_emoji,
                ct.name as to_name,
                ct.emoji as to_emoji
            FROM routes r
            JOIN cities cf ON cf.city_id = r.city_from_id
            JOIN cities ct ON ct.city_id = r.city_to_id
            ORDER BY r.city_from_id, r.city_to_id
        ');

        return $this->json($routes);
    }

    #[Route('/{routeId}', name: 'show', methods: ['GET'])]
    public function show(int $routeId): JsonResponse
    {
        $route = $this->connection->fetchAssociative('
            SELECT
                r.route_id,
                r.city_from_id as city_from,
                r.city_to_id as city_to,
                r.cost,
                r.duration,
                cf.name as from_name,
                cf.emoji as from_emoji,
                cf.theme as from_theme,
                ct.name as to_name,
                ct.emoji as to_emoji,
                ct.theme as to_theme
            FROM routes r
            JOIN cities cf ON cf.city_id = r.city_from_id
            JOIN cities ct ON ct.city_id = r.city_to_id
            WHERE r.route_id = :routeId
        ', ['routeId' => $routeId]);

        if (!$route) {
            return $this->notFoundResponse('Route not found');
        }

        return $this->json($route);
    }
}

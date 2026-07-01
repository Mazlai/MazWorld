<?php

namespace App\Controller\API;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/jobs', name: 'api_jobs_')]
class JobController extends AbstractApiController
{
    public function __construct(
        private Connection $connection
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $jobs = $this->connection->fetchAllAssociative('
            SELECT
                j.job_id,
                j.city_id,
                j.job_name as name,
                j.job_emoji as emoji,
                j.task_1,
                j.task_2,
                j.task_3,
                c.name as city_name,
                c.emoji as city_emoji,
                c.theme as city_theme
            FROM city_jobs j
            JOIN cities c ON c.city_id = j.city_id
            ORDER BY j.city_id, j.job_name
        ');

        return $this->json($jobs);
    }

    #[Route('/{jobId}', name: 'show', methods: ['GET'])]
    public function show(int $jobId): JsonResponse
    {
        $job = $this->connection->fetchAssociative('
            SELECT
                j.job_id,
                j.city_id,
                j.job_name as name,
                j.job_emoji as emoji,
                j.task_1,
                j.task_2,
                j.task_3,
                c.name as city_name,
                c.emoji as city_emoji,
                c.theme as city_theme,
                c.description as city_description
            FROM city_jobs j
            JOIN cities c ON c.city_id = j.city_id
            WHERE j.job_id = :jobId
        ', ['jobId' => $jobId]);

        if (!$job) {
            return $this->notFoundResponse('Job not found');
        }

        return $this->json($job);
    }

    #[Route('/theme/{theme}', name: 'by_theme', methods: ['GET'])]
    public function byTheme(string $theme): JsonResponse
    {
        $jobs = $this->connection->fetchAllAssociative('
            SELECT
                j.job_id,
                j.city_id,
                j.job_name as name,
                j.job_emoji as emoji,
                j.task_1,
                j.task_2,
                j.task_3,
                c.name as city_name,
                c.emoji as city_emoji
            FROM city_jobs j
            JOIN cities c ON c.city_id = j.city_id
            WHERE c.theme = :theme
            ORDER BY c.name, j.job_name
        ', ['theme' => $theme]);

        return $this->json($jobs);
    }
}

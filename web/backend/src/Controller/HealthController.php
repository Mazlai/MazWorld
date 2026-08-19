<?php

namespace App\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Throwable;

class HealthController extends AbstractController
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    #[Route('/api/healthz', name: 'health_check', methods: ['GET'])]
    public function check(): JsonResponse
    {
        try {
            $this->entityManager->getConnection()->executeQuery('SELECT 1');
        } catch (Throwable) {
            return new JsonResponse(['status' => 'error', 'database' => 'unreachable'], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        return new JsonResponse(['status' => 'ok', 'database' => 'ok']);
    }
}

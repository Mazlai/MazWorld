<?php

namespace App\Controller\API;

use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

abstract class AbstractApiController extends AbstractController
{
    protected function getCurrentUser(): ?User
    {
        $user = $this->getUser();
        return $user instanceof User ? $user : null;
    }

    protected function requireUser(): User
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            throw new \RuntimeException('User not authenticated');
        }
        return $user;
    }

    protected function errorResponse(string $message, int $statusCode = Response::HTTP_BAD_REQUEST): JsonResponse
    {
        return new JsonResponse(['error' => $message], $statusCode);
    }

    protected function successResponse(array $data, int $statusCode = Response::HTTP_OK): JsonResponse
    {
        return new JsonResponse($data, $statusCode);
    }

    protected function unauthorizedResponse(string $message = 'Not authenticated'): JsonResponse
    {
        return $this->errorResponse($message, Response::HTTP_UNAUTHORIZED);
    }

    protected function notFoundResponse(string $message = 'Resource not found'): JsonResponse
    {
        return $this->errorResponse($message, Response::HTTP_NOT_FOUND);
    }
}

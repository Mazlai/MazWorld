<?php

namespace App\Controller\API;

use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use DateTimeInterface;

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

    protected function tooManyRequestsResponse(?DateTimeInterface $retryAfter = null): JsonResponse
    {
        $response = $this->errorResponse('Too many requests', Response::HTTP_TOO_MANY_REQUESTS);

        if ($retryAfter !== null) {
            $seconds = max(0, $retryAfter->getTimestamp() - time());
            $response->headers->set('Retry-After', (string) $seconds);
        }

        return $response;
    }
}

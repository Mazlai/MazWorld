<?php

namespace App\Controller\API;

use App\Entity\User;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Contracts\Service\Attribute\Required;

abstract class AbstractApiController extends AbstractController
{
    protected LoggerInterface $logger;
    protected LoggerInterface $securityLogger;

    #[Required]
    public function setLogger(LoggerInterface $logger): void
    {
        $this->logger = $logger;
    }

    #[Required]
    public function setSecurityLogger(
        #[Autowire(service: 'monolog.logger.security')]
        LoggerInterface $securityLogger
    ): void {
        $this->securityLogger = $securityLogger;
    }

    protected function logCoinTransaction(User $user, string $type, int $delta, int $balanceAfter): void
    {
        $this->securityLogger->info('Coin transaction', [
            'user_id' => $user->getUserId(),
            'type' => $type,
            'delta' => $delta,
            'balance_after' => $balanceAfter,
        ]);
    }

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

    protected function serverErrorResponse(\Throwable $e): JsonResponse
    {
        $this->logger->error($e->getMessage(), [
            'exception' => $e,
            'user' => $this->getCurrentUser()?->getUserId(),
        ]);

        return new JsonResponse(['error' => 'Une erreur est survenue'], Response::HTTP_INTERNAL_SERVER_ERROR);
    }

    protected function failureResponse(string $message, int $statusCode = Response::HTTP_BAD_REQUEST, array $extra = []): JsonResponse
    {
        return new JsonResponse(['success' => false, 'message' => $message] + $extra, $statusCode);
    }
}

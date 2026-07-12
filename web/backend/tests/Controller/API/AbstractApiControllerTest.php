<?php

namespace App\Tests\Controller\API;

use App\Controller\API\AbstractApiController;
use App\Entity\User;
use DateTime;
use DateTimeInterface;
use LogicException;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Sous-classe concrète exposant les méthodes protégées pour les tests.
 * Aucun container Symfony n'est nécessaire car les helpers testés
 * se limitent à construire des JsonResponse sans dépendances.
 */
class ConcreteController extends AbstractApiController
{
    public function callErrorResponse(string $msg, int $code = 400)
    {
        return $this->errorResponse($msg, $code);
    }

    public function callSuccessResponse(array $data, int $code = 200)
    {
        return $this->successResponse($data, $code);
    }

    public function callUnauthorizedResponse(string $msg = 'Not authenticated')
    {
        return $this->unauthorizedResponse($msg);
    }

    public function callNotFoundResponse(string $msg = 'Resource not found')
    {
        return $this->notFoundResponse($msg);
    }

    public function callFailureResponse(string $msg, int $code = 400, array $extra = [])
    {
        return $this->failureResponse($msg, $code, $extra);
    }

    public function callTooManyRequestsResponse(?DateTimeInterface $retryAfter = null)
    {
        return $this->tooManyRequestsResponse($retryAfter);
    }

    public function callServerErrorResponse(Throwable $e)
    {
        return $this->serverErrorResponse($e);
    }

    protected function getCurrentUser(): ?User
    {
        return null;
    }
}

#[Group('unit')]
class AbstractApiControllerTest extends TestCase
{
    private ConcreteController $controller;

    protected function setUp(): void
    {
        $this->controller = new ConcreteController();
        $this->controller->setLogger($this->createMock(LoggerInterface::class));
        $this->controller->setSecurityLogger($this->createMock(LoggerInterface::class));
    }

    // ===== errorResponse() =====

    public function testErrorResponseReturnsJsonWithErrorKey(): void
    {
        $response = $this->controller->callErrorResponse('Something went wrong', 400);

        $this->assertSame(400, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertSame('Something went wrong', $data['error']);
    }

    // ===== successResponse() =====

    public function testSuccessResponseReturnsDataWithStatus200ByDefault(): void
    {
        $response = $this->controller->callSuccessResponse(['coins' => 500]);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(500, json_decode($response->getContent(), true)['coins']);
    }

    // ===== unauthorizedResponse() =====

    public function testUnauthorizedResponseReturns401(): void
    {
        $response = $this->controller->callUnauthorizedResponse();

        $this->assertSame(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());
        $this->assertSame('Not authenticated', json_decode($response->getContent(), true)['error']);
    }

    // ===== notFoundResponse() =====

    public function testNotFoundResponseReturns404(): void
    {
        $response = $this->controller->callNotFoundResponse('User not found');

        $this->assertSame(Response::HTTP_NOT_FOUND, $response->getStatusCode());
        $this->assertSame('User not found', json_decode($response->getContent(), true)['error']);
    }

    // ===== failureResponse() =====

    public function testFailureResponseContainsSuccessFalseAndMessage(): void
    {
        $response = $this->controller->callFailureResponse('Insufficient coins', 400);

        $data = json_decode($response->getContent(), true);
        $this->assertFalse($data['success']);
        $this->assertSame('Insufficient coins', $data['message']);
    }

    public function testFailureResponseMergesExtraData(): void
    {
        $response = $this->controller->callFailureResponse('Cooldown active', 429, ['retry_after' => 42]);

        $data = json_decode($response->getContent(), true);
        $this->assertSame(42, $data['retry_after']);
    }

    // ===== tooManyRequestsResponse() =====

    public function testTooManyRequestsResponseReturns429(): void
    {
        $response = $this->controller->callTooManyRequestsResponse();

        $this->assertSame(Response::HTTP_TOO_MANY_REQUESTS, $response->getStatusCode());
    }

    public function testTooManyRequestsResponseAddsRetryAfterHeader(): void
    {
        $retryAfter = new DateTime('+60 seconds');
        $response   = $this->controller->callTooManyRequestsResponse($retryAfter);

        $header = (int) $response->headers->get('Retry-After');
        $this->assertGreaterThan(0, $header);
        $this->assertLessThanOrEqual(60, $header);
    }

    // ===== serverErrorResponse() =====

    public function testServerErrorResponseReturns500(): void
    {
        $response = $this->controller->callServerErrorResponse(new RuntimeException('DB crashed'));

        $this->assertSame(Response::HTTP_INTERNAL_SERVER_ERROR, $response->getStatusCode());
    }

    public function testServerErrorResponseReturnsGenericMessage(): void
    {
        $response = $this->controller->callServerErrorResponse(new LogicException('Internal failure'));

        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('error', $data);
        // Le message d'erreur interne n'est pas exposé au client
        $this->assertNotSame('Internal failure', $data['error']);
    }
}

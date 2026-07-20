<?php

namespace App\Tests\EventSubscriber;

use App\EventSubscriber\SecurityHeadersSubscriber;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\KernelEvents;

#[Group('unit')]
class SecurityHeadersSubscriberTest extends TestCase
{
    private SecurityHeadersSubscriber $subscriber;

    protected function setUp(): void
    {
        $this->subscriber = new SecurityHeadersSubscriber();
    }

    private function construireEvenementReponse(string $path, bool $isMainRequest = true): array
    {
        $response    = new Response();
        $request     = Request::create($path);
        $kernel      = $this->createMock(HttpKernelInterface::class);
        $requestType = $isMainRequest
            ? HttpKernelInterface::MAIN_REQUEST
            : HttpKernelInterface::SUB_REQUEST;

        return [new ResponseEvent($kernel, $request, $requestType, $response), $response];
    }

    // ===== getSubscribedEvents() =====

    public function testGetSubscribedEventsListensToKernelResponse(): void
    {
        $this->assertArrayHasKey(KernelEvents::RESPONSE, SecurityHeadersSubscriber::getSubscribedEvents());
    }

    // ===== onKernelResponse() =====

    public function testSkipsSubRequests(): void
    {
        [$event, $response] = $this->construireEvenementReponse('/api/test', isMainRequest: false);
        $this->subscriber->onKernelResponse($event);

        $this->assertNull($response->headers->get('X-Frame-Options'));
    }

    public function testSetsSecurityHeadersOnEveryMainRequest(): void
    {
        [$event, $response] = $this->construireEvenementReponse('/some-page');
        $this->subscriber->onKernelResponse($event);

        $this->assertSame('nosniff', $response->headers->get('X-Content-Type-Options'));
        $this->assertSame('DENY', $response->headers->get('X-Frame-Options'));
        $this->assertSame('strict-origin-when-cross-origin', $response->headers->get('Referrer-Policy'));
        $this->assertStringContainsString('max-age=31536000', $response->headers->get('Strict-Transport-Security'));
        $this->assertNotNull($response->headers->get('Content-Security-Policy'));
    }

    public function testSetsCacheControlNoStoreOnApiPath(): void
    {
        [$event, $response] = $this->construireEvenementReponse('/api/user/me');
        $this->subscriber->onKernelResponse($event);

        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }

    public function testDoesNotForceCacheControlOnNonApiPath(): void
    {
        [$event, $response] = $this->construireEvenementReponse('/about');
        $this->subscriber->onKernelResponse($event);

        $this->assertNotSame('no-store', $response->headers->get('Cache-Control'));
    }
}

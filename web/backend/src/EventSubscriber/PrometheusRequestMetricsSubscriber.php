<?php

namespace App\EventSubscriber;

use Prometheus\CollectorRegistry;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\TerminateEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class PrometheusRequestMetricsSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly CollectorRegistry $registry)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::TERMINATE => 'onKernelTerminate'];
    }

    public function onKernelTerminate(TerminateEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $route = $request->attributes->get('_route') ?? 'unmatched';

        if ('metrics' === $route) {
            return;
        }

        $method = $request->getMethod();
        $status = (string) $event->getResponse()->getStatusCode();

        $this->registry
            ->getOrRegisterCounter('mazworld', 'http_requests_total', 'Nombre de requêtes HTTP par route', ['route', 'method', 'status'])
            ->inc([$route, $method, $status]);

        $requestTime = $request->server->get('REQUEST_TIME_FLOAT');
        if (is_numeric($requestTime)) {
            $duration = microtime(true) - (float) $requestTime;

            $this->registry
                ->getOrRegisterHistogram(
                    'mazworld',
                    'http_request_duration_seconds',
                    'Durée des requêtes HTTP par route',
                    ['route', 'method'],
                    [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
                )
                ->observe($duration, [$route, $method]);
        }
    }
}

<?php

namespace App\Metrics;

use Prometheus\CollectorRegistry;
use Prometheus\Storage\APC;
use Prometheus\Storage\InMemory;

class PrometheusRegistryFactory
{
    public static function create(): CollectorRegistry
    {
        // APCu est disponible dans l'image Docker (Dockerfile) mais pas forcément en CLI locale
        // (tests PHPUnit, `symfony server:start` sans Docker) : on retombe sur un stockage en
        // mémoire plutôt que de faire planter chaque requête en dehors du conteneur.
        $storage = extension_loaded('apcu') ? new APC() : new InMemory();

        return new CollectorRegistry($storage);
    }
}

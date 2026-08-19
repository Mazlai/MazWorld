<?php

namespace App\Metrics;

use Prometheus\CollectorRegistry;
use Prometheus\Storage\APC;
use Prometheus\Storage\InMemory;

class PrometheusRegistryFactory
{
    public static function create(): CollectorRegistry
    {
        // extension_loaded('apcu') ne suffit pas : l'extension peut être chargée mais désactivée
        // pour le SAPI courant (apc.enable_cli=0 par défaut en CLI, cas des runners CI et de
        // `symfony server:start` sans Docker) — apcu_enabled() est le contrôle que la librairie
        // elle-même applique avant d'utiliser APCu (Prometheus\Storage\APC::__construct). On
        // retombe sur un stockage en mémoire plutôt que de faire planter chaque requête.
        $storage = extension_loaded('apcu') && apcu_enabled() ? new APC() : new InMemory();

        return new CollectorRegistry($storage);
    }
}

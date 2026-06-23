<?php

namespace App\DataFixtures;

use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        // Les fixtures seront implémentées au fur et à mesure de la création des entités :
        // - Villes et routes
        // - Items de la boutique
        // - Données de test utilisateurs

        $manager->flush();
    }
}

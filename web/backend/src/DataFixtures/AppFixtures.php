<?php

namespace App\DataFixtures;

use App\Entity\City;
use App\Entity\CityJob;
use App\Entity\Route;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $cities = $this->createCities($manager);
        $this->createRoutes($manager, $cities);
        $manager->flush();
    }

    /**
     * @return array<string, City>
     */
    private function createCities(ObjectManager $manager): array
    {
        $data = [
            'willowbrook' => [
                'name'        => 'Willowbrook',
                'description' => 'Une paisible bourgade nichée entre les collines, point de départ idéal pour tout voyageur.',
                'emoji'       => '🌿',
                'theme'       => 'nature',
                'position_x'  => 200,
                'position_y'  => 350,
                'jobs'        => [
                    ['🌾', 'Fermier',    'Semer les champs',      'Arroser les cultures',  'Récolter les légumes'],
                    ['🪵', 'Bûcheron',   'Abattre des arbres',    'Débiter les troncs',    'Livrer le bois'],
                    ['🧺', 'Artisan',    'Tisser des paniers',    'Tanner le cuir',        'Vendre en marché'],
                ],
            ],
            'ironhaven' => [
                'name'        => 'Ironhaven',
                'description' => 'Une cité industrielle dont les forges illuminent la nuit, réputée pour ses artisans du métal.',
                'emoji'       => '⚒️',
                'theme'       => 'industrial',
                'position_x'  => 500,
                'position_y'  => 200,
                'jobs'        => [
                    ['🔨', 'Forgeron',   'Fondre le minerai',     'Forger les lames',      'Polir les pièces'],
                    ['⚙️', 'Mécanicien', 'Réparer les machines',  'Lubrifier les rouages', 'Tester les mécanismes'],
                    ['🏗️', 'Ouvrier',    'Couler le béton',       'Monter les échafaudages', 'Finir les façades'],
                ],
            ],
            'crystalport' => [
                'name'        => 'Crystalport',
                'description' => 'Un port animé où se croisent marchands et marins. Les eaux azurées reflètent les voiles colorées.',
                'emoji'       => '⚓',
                'theme'       => 'maritime',
                'position_x'  => 750,
                'position_y'  => 400,
                'jobs'        => [
                    ['🎣', 'Pêcheur',    'Lancer les filets',     'Trier les poissons',    'Vendre au marché'],
                    ['🚢', 'Marin',      'Hisser les voiles',     'Naviguer au large',     'Décharger la cargaison'],
                    ['🏪', 'Commerçant', 'Négocier les prix',     'Emballer les produits', 'Enregistrer les ventes'],
                ],
            ],
            'shadowpeak' => [
                'name'        => 'Shadowpeak',
                'description' => 'Un village perché dans les montagnes brumeuses, gardien de secrets anciens.',
                'emoji'       => '🏔️',
                'theme'       => 'mountain',
                'position_x'  => 400,
                'position_y'  => 100,
                'jobs'        => [
                    ['⛏️', 'Mineur',     'Creuser les galeries',  'Extraire les cristaux', 'Trier les minerais'],
                    ['🧙', 'Alchimiste', 'Cueillir les herbes',   'Distiller les potions', 'Analyser les effets'],
                    ['🏹', 'Chasseur',   'Poser des pièges',      'Traquer le gibier',     'Dépouiller les prises'],
                ],
            ],
            'goldenfields' => [
                'name'        => 'Goldenfields',
                'description' => 'De vastes plaines dorées à perte de vue, grenier du royaume et terre de prospérité.',
                'emoji'       => '🌾',
                'theme'       => 'plains',
                'position_x'  => 650,
                'position_y'  => 550,
                'jobs'        => [
                    ['🐄', 'Éleveur',    'Nourrir le bétail',     'Traire les vaches',     'Soigner les animaux'],
                    ['🌽', 'Agriculteur', 'Labourer les champs',   'Planter les graines',   'Moissonner les épis'],
                    ['🧑‍🍳', 'Cuisinier', 'Éplucher les légumes',  'Cuisiner les plats',    'Servir les convives'],
                ],
            ],
            'neonhub' => [
                'name'        => 'NeonHub',
                'description' => 'La métropole high-tech, cœur technologique du monde MazWorld, toujours en effervescence.',
                'emoji'       => '🌆',
                'theme'       => 'cyber',
                'position_x'  => 900,
                'position_y'  => 250,
                'jobs'        => [
                    ['💻', 'Développeur', 'Écrire du code',         'Corriger des bugs',     'Déployer en production'],
                    ['📡', 'Technicien', 'Câbler les serveurs',   'Tester la connexion',   'Surveiller le réseau'],
                    ['🤖', 'Ingénieur',  'Concevoir les systèmes', 'Tester les prototypes', 'Rédiger la documentation'],
                ],
            ],
        ];

        $cities = [];
        foreach ($data as $id => $cfg) {
            $city = (new City())
                ->setCityId($id)
                ->setName($cfg['name'])
                ->setDescription($cfg['description'])
                ->setEmoji($cfg['emoji'])
                ->setTheme($cfg['theme'])
                ->setPositionX($cfg['position_x'])
                ->setPositionY($cfg['position_y']);

            foreach ($cfg['jobs'] as [$emoji, $name, $t1, $t2, $t3]) {
                $job = (new CityJob())
                    ->setCity($city)
                    ->setJobEmoji($emoji)
                    ->setJobName($name)
                    ->setTask1($t1)
                    ->setTask2($t2)
                    ->setTask3($t3);
                $manager->persist($job);
            }

            $manager->persist($city);
            $cities[$id] = $city;
        }

        return $cities;
    }

    /**
     * @param array<string, City> $c
     */
    private function createRoutes(ObjectManager $manager, array $c): void
    {
        $routes = [
            // [from, to, cost, duration_minutes]
            ['willowbrook',  'ironhaven',    50,  60],
            ['ironhaven',    'willowbrook',  50,  60],
            ['willowbrook',  'goldenfields', 40,  45],
            ['goldenfields', 'willowbrook',  40,  45],
            ['ironhaven',    'shadowpeak',   80, 120],
            ['shadowpeak',   'ironhaven',    80, 120],
            ['ironhaven',    'crystalport',  60,  90],
            ['crystalport',  'ironhaven',    60,  90],
            ['crystalport',  'neonhub',      70,  75],
            ['neonhub',      'crystalport',  70,  75],
            ['crystalport',  'goldenfields', 55,  65],
            ['goldenfields', 'crystalport',  55,  65],
            ['goldenfields', 'neonhub',      90, 100],
            ['neonhub',      'goldenfields', 90, 100],
            ['shadowpeak',   'neonhub',     120, 150],
            ['neonhub',      'shadowpeak',  120, 150],
        ];

        foreach ($routes as [$from, $to, $cost, $duration]) {
            $route = (new Route())
                ->setCityFrom($c[$from])
                ->setCityTo($c[$to])
                ->setCost($cost)
                ->setDuration($duration);
            $manager->persist($route);
        }
    }
}

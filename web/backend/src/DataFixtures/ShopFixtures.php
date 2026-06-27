<?php

namespace App\DataFixtures;

use App\Entity\ShopItem;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Persistence\ObjectManager;

class ShopFixtures extends Fixture implements FixtureGroupInterface
{
    public static function getGroups(): array
    {
        return ['shop'];
    }

    public function load(ObjectManager $manager): void
    {
        $items = [
            // Backgrounds
            [
                'item_id'   => 'bg_blue',
                'item_type' => 'background',
                'name'      => 'Ciel Nocturne',
                'description' => 'Un ciel étoilé aux teintes bleues profondes.',
                'price'     => 100,
                'emoji'     => '🌌',
            ],
            [
                'item_id'   => 'bg_purple',
                'item_type' => 'background',
                'name'      => 'Nuit Stellaire',
                'description' => 'Les reflets violets d\'une nuit sans fin.',
                'price'     => 150,
                'emoji'     => '🔮',
            ],
            [
                'item_id'   => 'bg_green',
                'item_type' => 'background',
                'name'      => 'Forêt Mystique',
                'description' => 'Les profondeurs d\'une forêt enchantée.',
                'price'     => 120,
                'emoji'     => '🌿',
            ],
            [
                'item_id'   => 'bg_red',
                'item_type' => 'background',
                'name'      => 'Volcan Ardent',
                'description' => 'La lave incandescente d\'un volcan en éruption.',
                'price'     => 180,
                'emoji'     => '🌋',
            ],
            [
                'item_id'   => 'bg_orange',
                'item_type' => 'background',
                'name'      => 'Désert Doré',
                'description' => 'Les dunes infinies d\'un désert au coucher du soleil.',
                'price'     => 130,
                'emoji'     => '🏜️',
            ],

            // Badges
            [
                'item_id'   => 'badge_verified',
                'item_type' => 'badge',
                'name'      => 'Voyageur Vérifié',
                'description' => 'Récompense les explorateurs reconnus.',
                'price'     => 200,
                'emoji'     => '✅',
            ],
            [
                'item_id'   => 'badge_star',
                'item_type' => 'badge',
                'name'      => 'Étoile Montante',
                'description' => 'Pour ceux qui brillent dans MazWorld.',
                'price'     => 250,
                'emoji'     => '⭐',
            ],
            [
                'item_id'   => 'badge_heart',
                'item_type' => 'badge',
                'name'      => 'Âme Généreuse',
                'description' => 'Décerné aux joueurs au grand cœur.',
                'price'     => 220,
                'emoji'     => '❤️',
            ],
            [
                'item_id'   => 'badge_fire',
                'item_type' => 'badge',
                'name'      => 'Explorateur Ardent',
                'description' => 'Pour les aventuriers qui ne s\'arrêtent jamais.',
                'price'     => 300,
                'emoji'     => '🔥',
            ],
            [
                'item_id'   => 'badge_diamond',
                'item_type' => 'badge',
                'name'      => 'Diamant MazWorld',
                'description' => 'Le badge ultime, réservé aux légendes.',
                'price'     => 500,
                'emoji'     => '💎',
            ],
        ];

        foreach ($items as $data) {
            $item = (new ShopItem())
                ->setItemId($data['item_id'])
                ->setItemType($data['item_type'])
                ->setName($data['name'])
                ->setDescription($data['description'])
                ->setPrice($data['price'])
                ->setEmoji($data['emoji'])
                ->setAvailable(true);

            $manager->persist($item);
        }

        $manager->flush();
    }
}

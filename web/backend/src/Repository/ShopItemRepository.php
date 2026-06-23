<?php

namespace App\Repository;

use App\Entity\ShopItem;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ShopItem>
 */
class ShopItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ShopItem::class);
    }

    public function findAllAvailable(): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.available = :available')
            ->setParameter('available', true)
            ->orderBy('s.item_type', 'ASC')
            ->addOrderBy('s.price', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByType(string $type): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.item_type = :type')
            ->andWhere('s.available = :available')
            ->setParameter('type', $type)
            ->setParameter('available', true)
            ->orderBy('s.price', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findBackgrounds(): array
    {
        return $this->findByType('background');
    }

    public function findBadges(): array
    {
        return $this->findByType('badge');
    }
}

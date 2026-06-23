<?php

namespace App\Repository;

use App\Entity\City;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<City>
 */
class CityRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, City::class);
    }

    public function findAllWithJobs(): array
    {
        return $this->createQueryBuilder('c')
            ->leftJoin('c.jobs', 'j')
            ->addSelect('j')
            ->orderBy('c.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findOneWithDetails(string $cityId): ?City
    {
        return $this->createQueryBuilder('c')
            ->leftJoin('c.jobs', 'j')
            ->addSelect('j')
            ->leftJoin('c.routes_from', 'rf')
            ->addSelect('rf')
            ->leftJoin('rf.city_to', 'ct')
            ->addSelect('ct')
            ->where('c.city_id = :cityId')
            ->setParameter('cityId', $cityId)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findByTheme(string $theme): array
    {
        return $this->createQueryBuilder('c')
            ->where('c.theme = :theme')
            ->setParameter('theme', $theme)
            ->orderBy('c.name', 'ASC')
            ->getQuery()
            ->getResult();
    }
}

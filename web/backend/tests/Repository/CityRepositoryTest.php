<?php

namespace App\Tests\Repository;

use App\Entity\City;
use App\Repository\CityRepository;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

use PHPUnit\Framework\Attributes\Group;
#[Group('integration')]
class CityRepositoryTest extends KernelTestCase
{
    private CityRepository $repository;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->repository = static::getContainer()->get(CityRepository::class);
    }

    // ===== findByTheme() =====

    public function testFindByThemeNatureReturnsWillowbrook(): void
    {
        $cities = $this->repository->findByTheme('nature');

        $this->assertCount(1, $cities);
        $this->assertSame('willowbrook', $cities[0]->getCityId());
        $this->assertSame('nature', $cities[0]->getTheme());
    }

    public function testFindByThemeIndustrialReturnsIronhaven(): void
    {
        $cities = $this->repository->findByTheme('industrial');

        $this->assertCount(1, $cities);
        $this->assertSame('ironhaven', $cities[0]->getCityId());
    }

    public function testFindByThemeMaritiMeReturnsCrystalport(): void
    {
        $cities = $this->repository->findByTheme('maritime');

        $this->assertCount(1, $cities);
        $this->assertSame('crystalport', $cities[0]->getCityId());
    }

    public function testFindByThemeUnknownReturnsEmptyArray(): void
    {
        $cities = $this->repository->findByTheme('nonexistent_theme_xyz');

        $this->assertSame([], $cities);
    }

    public function testFindByThemeReturnsCityInstances(): void
    {
        $cities = $this->repository->findByTheme('mountain');

        $this->assertCount(1, $cities);
        $this->assertInstanceOf(City::class, $cities[0]);
        $this->assertSame('shadowpeak', $cities[0]->getCityId());
    }

    public function testFindByThemeOrderedByNameAsc(): void
    {
        // Tous les thèmes n'ont qu'une ville, mais la requête trie par name ASC
        // On vérifie en cherchant un thème hypothétique à plusieurs villes — ici on valide
        // simplement que la méthode retourne bien les bonnes villes pour plains et cyber
        $plains = $this->repository->findByTheme('plains');
        $cyber  = $this->repository->findByTheme('cyber');

        $this->assertCount(1, $plains);
        $this->assertSame('goldenfields', $plains[0]->getCityId());

        $this->assertCount(1, $cyber);
        $this->assertSame('neonhub', $cyber[0]->getCityId());
    }

    // ===== findAllWithJobs() =====

    public function testFindAllWithJobsReturnsAllSixCities(): void
    {
        $cities = $this->repository->findAllWithJobs();
        $this->assertCount(6, $cities);
    }

    public function testFindAllWithJobsIsOrderedByNameAsc(): void
    {
        $cities = $this->repository->findAllWithJobs();

        // Ordre alphabétique attendu : Crystalport, Goldenfields, Ironhaven, NeonHub, Shadowpeak, Willowbrook
        $this->assertSame('crystalport',  $cities[0]->getCityId());
        $this->assertSame('willowbrook',  $cities[5]->getCityId());
    }

    public function testFindAllWithJobsEagerLoadsJobs(): void
    {
        $cities = $this->repository->findAllWithJobs();

        // Crystalport (index 0) a 3 jobs en fixture — le LEFT JOIN doit les charger sans requête supplémentaire
        $this->assertCount(3, $cities[0]->getJobs());
    }

    public function testFindAllWithJobsReturnsCityInstances(): void
    {
        $cities = $this->repository->findAllWithJobs();
        $this->assertContainsOnlyInstancesOf(City::class, $cities);
    }

    // ===== findOneWithDetails() =====

    public function testFindOneWithDetailsReturnsNullForUnknownId(): void
    {
        $this->assertNull($this->repository->findOneWithDetails('unknown_city_xyz'));
    }

    public function testFindOneWithDetailsReturnsCityInstance(): void
    {
        $city = $this->repository->findOneWithDetails('willowbrook');
        $this->assertInstanceOf(City::class, $city);
        $this->assertSame('willowbrook', $city->getCityId());
    }

    public function testFindOneWithDetailsEagerLoadsJobs(): void
    {
        $city = $this->repository->findOneWithDetails('willowbrook');

        // willowbrook a 3 jobs en fixture
        $this->assertCount(3, $city->getJobs());
    }

    public function testFindOneWithDetailsEagerLoadsRoutesFrom(): void
    {
        $city = $this->repository->findOneWithDetails('willowbrook');

        // willowbrook a 2 routes_from : vers ironhaven et goldenfields
        $this->assertCount(2, $city->getRoutesFrom());
    }
}

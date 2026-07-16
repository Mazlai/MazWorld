<?php

namespace App\Tests\Controller\API;

use App\Entity\City;
use App\Entity\User;
use App\Entity\UserEquippedBadge;
use App\Entity\UserInventory;
use App\Entity\VisitedCity;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

abstract class AbstractApiWebTestCase extends WebTestCase
{
    protected KernelBrowser $client;
    protected EntityManagerInterface $em;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
        $this->em->getConnection()->beginTransaction();
    }

    protected function tearDown(): void
    {
        $this->em->getConnection()->rollBack();
        parent::tearDown();
    }

    protected function createTestUser(
        string $userId = '',
        string $username = 'TestUser',
        int $coins = 500,
        array $roles = ['ROLE_USER'],
        string $cityId = 'willowbrook',
    ): User {
        if ('' === $userId) {
            $userId = uniqid('u');
        }

        /** @var City $city */
        $city = $this->em->find(City::class, $cityId);

        $user = (new User())
            ->setUserId($userId)
            ->setUsername($username)
            ->setCoins($coins)
            ->setRoles($roles)
            ->setCurrentCity($city);

        $this->em->persist($user);

        $visited = (new VisitedCity())->setCity($city);
        $user->addVisitedCity($visited);

        $this->em->flush();

        return $user;
    }

    protected function addInventory(User $user, string $itemId, string $type): UserInventory
    {
        $inv = (new UserInventory())
            ->setItemId($itemId)
            ->setItemType($type);
        $user->addInventory($inv);
        $this->em->flush();

        return $inv;
    }

    protected function addEquippedBadge(User $user, string $badgeId, int $slot): UserEquippedBadge
    {
        $badge = (new UserEquippedBadge())
            ->setBadgeId($badgeId)
            ->setSlotNumber($slot);
        $user->addEquippedBadge($badge);
        $this->em->flush();

        return $badge;
    }

    protected function addVisitedCity(User $user, string $cityId): void
    {
        /** @var City $city */
        $city = $this->em->find(City::class, $cityId);
        $visited = (new VisitedCity())->setCity($city);
        $user->addVisitedCity($visited);
        $this->em->flush();
    }

    protected function getJwt(User $user): string
    {
        /** @var JWTTokenManagerInterface $jwtManager */
        $jwtManager = static::getContainer()->get(JWTTokenManagerInterface::class);

        return $jwtManager->create($user);
    }

    protected function auth(User $user): void
    {
        $this->client->setServerParameter(
            'HTTP_AUTHORIZATION',
            'Bearer '.$this->getJwt($user),
        );
    }

    protected function unauth(): void
    {
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');
    }

    protected function get(string $url): void
    {
        $this->client->request('GET', $url);
    }

    protected function post(string $url, array $body = []): void
    {
        $this->client->request(
            'POST',
            $url,
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($body),
        );
    }

    protected function statusCode(): int
    {
        return $this->client->getResponse()->getStatusCode();
    }

    protected function json(): array
    {
        $content = $this->client->getResponse()->getContent();

        return json_decode($content, true) ?? [];
    }
}

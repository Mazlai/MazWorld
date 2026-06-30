<?php

namespace App\Security;

use App\Entity\City;
use App\Entity\User;
use App\Entity\UserInventory;
use App\Entity\VisitedCity;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

class BotAuthenticator extends AbstractAuthenticator
{
    private const DEFAULT_CITY_ID = 'willowbrook';
    private const DEFAULT_BACKGROUND_ID = 'bg_default';

    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
        #[Autowire(env: 'BOT_API_SECRET')]
        private readonly string $botApiSecret,
    ) {}

    public function supports(Request $request): ?bool
    {
        return $request->headers->has('X-Bot-Secret');
    }

    public function authenticate(Request $request): Passport
    {
        $secret = $request->headers->get('X-Bot-Secret');
        $discordUserId = $request->headers->get('X-Discord-User-Id');
        $discordUsername = $request->headers->get('X-Discord-Username', 'Unknown');

        if (!$secret || !hash_equals($this->botApiSecret, $secret)) {
            throw new CustomUserMessageAuthenticationException('Invalid bot secret.');
        }

        if (!$discordUserId) {
            throw new CustomUserMessageAuthenticationException('Discord user ID required.');
        }

        return new SelfValidatingPassport(
            new UserBadge($discordUserId, function (string $userId) use ($discordUsername) {
                $user = $this->userRepository->find($userId);

                if (!$user) {
                    $user = $this->createUserForBot($userId, $discordUsername);
                }

                return $user;
            })
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse([
            'success' => false,
            'message' => $exception->getMessage(),
        ], Response::HTTP_UNAUTHORIZED);
    }

    private function createUserForBot(string $userId, string $username): User
    {
        $defaultCity = $this->entityManager->find(City::class, self::DEFAULT_CITY_ID);

        if (!$defaultCity) {
            throw new \RuntimeException('Default city not found: ' . self::DEFAULT_CITY_ID);
        }

        $user = new User();
        $user->setUserId($userId);
        $user->setUsername($username);
        $user->setCurrentCity($defaultCity);

        $inventory = new UserInventory();
        $inventory->setUser($user);
        $inventory->setItemType('background');
        $inventory->setItemId(self::DEFAULT_BACKGROUND_ID);

        $visitedCity = new VisitedCity();
        $visitedCity->setUser($user);
        $visitedCity->setCity($defaultCity);

        $this->entityManager->persist($user);
        $this->entityManager->persist($inventory);
        $this->entityManager->persist($visitedCity);
        $this->entityManager->flush();

        return $user;
    }
}

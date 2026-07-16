<?php

namespace App\Service\User;

use App\Entity\City;
use App\Entity\User;
use App\Entity\VisitedCity;
use App\Repository\UserRepository;
use App\Service\Crypto\TokenEncryptorService;
use App\Service\Discord\DTO\DiscordTokenDTO;
use App\Service\Discord\DTO\DiscordUserDTO;
use Doctrine\ORM\EntityManagerInterface;
use RuntimeException;
use Throwable;

class UserService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserRepository $userRepository,
        private readonly TokenEncryptorService $tokenEncryptor
    ) {
    }

    public function findOrCreateFromDiscord(DiscordUserDTO $discordUser, DiscordTokenDTO $tokens): User
    {
        $user = $this->userRepository->find($discordUser->id);

        if (!$user) {
            $user = $this->createNewUser($discordUser);
        }

        $this->updateUserFromDiscord($user, $discordUser);
        $this->updateUserTokens($user, $tokens);
        $user->recordLogin();

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    private function createNewUser(DiscordUserDTO $discordUser): User
    {
        $user = new User();
        $user->setUserId($discordUser->id);

        $defaultCity = $this->getDefaultCity();
        if (!$defaultCity) {
            throw new RuntimeException('Aucune ville par défaut trouvée. Veuillez exécuter les fixtures.');
        }
        $user->setCurrentCity($defaultCity);

        $visitedCity = new VisitedCity();
        $visitedCity->setUser($user);
        $visitedCity->setCity($defaultCity);

        $user->addVisitedCity($visitedCity);
        $this->entityManager->persist($visitedCity);

        return $user;
    }

    public function updateUserFromDiscord(User $user, DiscordUserDTO $discordUser): void
    {
        $user->setUsername($discordUser->username);
        $user->setDiscordAvatar($discordUser->avatar);
        if (null !== $discordUser->email) {
            $user->setDiscordEmail($this->tokenEncryptor->encrypt($discordUser->email));
        }
    }

    public function serializeUser(User $user): array
    {
        $data = $user->toArray();
        if (null !== $data['discord_email']) {
            try {
                $data['discord_email'] = $this->tokenEncryptor->decrypt($data['discord_email']);
            } catch (Throwable) {
                $data['discord_email'] = null;
            }
        }

        return $data;
    }

    public function updateUserTokens(User $user, DiscordTokenDTO $tokens): void
    {
        $user->setOauthAccessToken($this->tokenEncryptor->encrypt($tokens->accessToken));
        $user->setOauthRefreshToken($this->tokenEncryptor->encrypt($tokens->refreshToken));
        $user->setOauthTokenExpiresAt($tokens->getExpiresAt());
    }

    public function save(User $user): void
    {
        $this->entityManager->persist($user);
        $this->entityManager->flush();
    }

    private function getDefaultCity(): ?City
    {
        $repo = $this->entityManager->getRepository(City::class);

        return $repo->find('willowbrook') ?? $repo->findOneBy([]);
    }
}

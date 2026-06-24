<?php

namespace App\Security;

use App\Repository\UserRepository;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

class UserProvider implements UserProviderInterface
{
    public function __construct(
        private UserRepository $userRepository
    ) {}

    public function refreshUser(UserInterface $user): UserInterface
    {
        if (!$user instanceof \App\Entity\User) {
            throw new UnsupportedUserException(sprintf('Invalid user class "%s".', get_class($user)));
        }

        $refreshedUser = $this->userRepository->find($user->getUserIdentifier());

        if (!$refreshedUser) {
            throw new UserNotFoundException(sprintf('User "%s" not found.', $user->getUserIdentifier()));
        }

        return $refreshedUser;
    }

    public function supportsClass(string $class): bool
    {
        return \App\Entity\User::class === $class || is_subclass_of($class, \App\Entity\User::class);
    }

    public function loadUserByIdentifier(string $identifier): UserInterface
    {
        $user = $this->userRepository->find($identifier);

        if (!$user) {
            throw new UserNotFoundException(sprintf('User "%s" not found.', $identifier));
        }

        return $user;
    }
}

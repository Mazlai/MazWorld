<?php

namespace App\Tests\Security;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\UserProvider;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use stdClass;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;

#[Group('unit')]
class UserProviderTest extends TestCase
{
    private UserRepository $userRepository;
    private UserProvider $provider;

    protected function setUp(): void
    {
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->provider       = new UserProvider($this->userRepository);
    }

    // ===== loadUserByIdentifier() =====

    public function testLoadUserByIdentifierReturnsUser(): void
    {
        $user = $this->createMock(User::class);
        $this->userRepository->method('find')->with('123')->willReturn($user);

        $this->assertSame($user, $this->provider->loadUserByIdentifier('123'));
    }

    public function testLoadUserByIdentifierThrowsWhenUserNotFound(): void
    {
        $this->userRepository->method('find')->willReturn(null);

        $this->expectException(UserNotFoundException::class);
        $this->provider->loadUserByIdentifier('unknown_id');
    }

    // ===== refreshUser() =====

    public function testRefreshUserReturnsRefreshedUser(): void
    {
        $user        = $this->createMock(User::class);
        $refreshed   = $this->createMock(User::class);

        $user->method('getUserIdentifier')->willReturn('123');
        $this->userRepository->method('find')->with('123')->willReturn($refreshed);

        $this->assertSame($refreshed, $this->provider->refreshUser($user));
    }

    public function testRefreshUserThrowsWhenRefreshedUserNotFound(): void
    {
        $user = $this->createMock(User::class);
        $user->method('getUserIdentifier')->willReturn('123');
        $this->userRepository->method('find')->willReturn(null);

        $this->expectException(UserNotFoundException::class);
        $this->provider->refreshUser($user);
    }

    public function testRefreshUserThrowsForUnsupportedClass(): void
    {
        $unsupported = $this->createMock(\Symfony\Component\Security\Core\User\UserInterface::class);

        $this->expectException(UnsupportedUserException::class);
        $this->provider->refreshUser($unsupported);
    }

    // ===== supportsClass() =====

    public function testSupportsClassReturnsTrueForUserEntity(): void
    {
        $this->assertTrue($this->provider->supportsClass(User::class));
    }

    public function testSupportsClassReturnsFalseForOtherClass(): void
    {
        $this->assertFalse($this->provider->supportsClass(stdClass::class));
    }
}

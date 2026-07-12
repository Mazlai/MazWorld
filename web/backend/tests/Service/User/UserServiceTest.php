<?php

namespace App\Tests\Service\User;

use App\Entity\City;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\Crypto\TokenEncryptorService;
use App\Service\Discord\DTO\DiscordTokenDTO;
use App\Service\Discord\DTO\DiscordUserDTO;
use App\Service\User\UserService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

#[Group('unit')]
class UserServiceTest extends TestCase
{
    /** @var EntityManagerInterface&MockObject */
    private $em;
    /** @var UserRepository&MockObject */
    private $userRepository;
    /** @var TokenEncryptorService&MockObject */
    private $encryptor;
    private UserService $service;

    protected function setUp(): void
    {
        $this->em             = $this->createMock(EntityManagerInterface::class);
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->encryptor      = $this->createMock(TokenEncryptorService::class);
        $this->service        = new UserService($this->em, $this->userRepository, $this->encryptor);
    }

    private function makeDiscordUser(string $id = '123', ?string $email = null): DiscordUserDTO
    {
        return new DiscordUserDTO($id, 'Mazlai', null, $email, 'avatar_hash', true, 'Mazlai');
    }

    private function makeTokens(): DiscordTokenDTO
    {
        return new DiscordTokenDTO('access_abc', 'refresh_xyz', 3600, 'Bearer', 'identify email guilds');
    }

    // ===== updateUserFromDiscord() =====

    public function testUpdateUserFromDiscordSetsUsernameAndAvatar(): void
    {
        $user        = $this->createMock(User::class);
        $discordUser = $this->makeDiscordUser(email: null);

        $user->expects($this->once())->method('setUsername')->with('Mazlai');
        $user->expects($this->once())->method('setDiscordAvatar')->with('avatar_hash');
        $this->encryptor->expects($this->never())->method('encrypt');

        $this->service->updateUserFromDiscord($user, $discordUser);
    }

    public function testUpdateUserFromDiscordEncryptsEmailWhenProvided(): void
    {
        $user        = $this->createMock(User::class);
        $discordUser = $this->makeDiscordUser(email: 'user@discord.com');

        $this->encryptor->expects($this->once())
            ->method('encrypt')
            ->with('user@discord.com')
            ->willReturn('encrypted_email');

        $user->expects($this->once())->method('setDiscordEmail')->with('encrypted_email');

        $this->service->updateUserFromDiscord($user, $discordUser);
    }

    public function testUpdateUserFromDiscordSkipsEmailWhenNull(): void
    {
        $user        = $this->createMock(User::class);
        $discordUser = $this->makeDiscordUser(email: null);

        $this->encryptor->expects($this->never())->method('encrypt');
        $user->expects($this->never())->method('setDiscordEmail');

        $this->service->updateUserFromDiscord($user, $discordUser);
    }

    // ===== updateUserTokens() =====

    public function testUpdateUserTokensEncryptsBothTokens(): void
    {
        $user   = $this->createMock(User::class);
        $tokens = $this->makeTokens();

        $this->encryptor->expects($this->exactly(2))
            ->method('encrypt')
            ->willReturnOnConsecutiveCalls('enc_access', 'enc_refresh');

        $user->expects($this->once())->method('setOauthAccessToken')->with('enc_access');
        $user->expects($this->once())->method('setOauthRefreshToken')->with('enc_refresh');
        $user->expects($this->once())->method('setOauthTokenExpiresAt');

        $this->service->updateUserTokens($user, $tokens);
    }

    // ===== serializeUser() =====

    public function testSerializeUserDecryptsEmail(): void
    {
        $user = $this->createMock(User::class);
        $user->method('toArray')->willReturn(['discord_email' => 'encrypted_blob', 'user_id' => '1']);

        $this->encryptor->expects($this->once())
            ->method('decrypt')
            ->with('encrypted_blob')
            ->willReturn('plain@email.com');

        $result = $this->service->serializeUser($user);

        $this->assertSame('plain@email.com', $result['discord_email']);
    }

    public function testSerializeUserReturnsNullEmailWhenAbsent(): void
    {
        $user = $this->createMock(User::class);
        $user->method('toArray')->willReturn(['discord_email' => null, 'user_id' => '1']);

        $this->encryptor->expects($this->never())->method('decrypt');

        $result = $this->service->serializeUser($user);

        $this->assertNull($result['discord_email']);
    }

    public function testSerializeUserReturnsNullEmailOnDecryptionFailure(): void
    {
        $user = $this->createMock(User::class);
        $user->method('toArray')->willReturn(['discord_email' => 'corrupted_blob', 'user_id' => '1']);

        $this->encryptor->method('decrypt')
            ->willThrowException(new \RuntimeException('Decryption failed'));

        $result = $this->service->serializeUser($user);

        $this->assertNull($result['discord_email']);
    }

    // ===== save() =====

    public function testSavePersistsAndFlushesUser(): void
    {
        $user = $this->createMock(User::class);

        $this->em->expects($this->once())->method('persist')->with($user);
        $this->em->expects($this->once())->method('flush');

        $this->service->save($user);
    }

    // ===== findOrCreateFromDiscord() =====

    public function testFindOrCreateReturnsAndUpdatesExistingUser(): void
    {
        $user   = $this->createMock(User::class);
        $tokens = $this->makeTokens();

        $this->userRepository->method('find')->with('123')->willReturn($user);
        $this->encryptor->method('encrypt')->willReturn('encrypted');

        $user->method('setUsername')->willReturnSelf();
        $user->method('setDiscordAvatar')->willReturnSelf();
        $user->method('setOauthAccessToken')->willReturnSelf();
        $user->method('setOauthRefreshToken')->willReturnSelf();
        $user->method('setOauthTokenExpiresAt')->willReturnSelf();
        $user->expects($this->once())->method('recordLogin');

        $this->em->expects($this->once())->method('persist')->with($user);
        $this->em->expects($this->once())->method('flush');

        $result = $this->service->findOrCreateFromDiscord($this->makeDiscordUser(), $tokens);

        $this->assertSame($user, $result);
    }

    public function testFindOrCreateCreatesNewUserWhenNotFound(): void
    {
        $tokens      = $this->makeTokens();
        $discordUser = $this->makeDiscordUser('999');
        $defaultCity = $this->createMock(City::class);

        $this->userRepository->method('find')->willReturn(null);

        $cityRepo = $this->createMock(EntityRepository::class);
        $cityRepo->method('find')->with('willowbrook')->willReturn($defaultCity);
        $this->em->method('getRepository')->with(City::class)->willReturn($cityRepo);

        $this->encryptor->method('encrypt')->willReturn('encrypted');

        $persistedObjects = [];
        $this->em->method('persist')->willReturnCallback(
            static function (object $obj) use (&$persistedObjects): void {
                $persistedObjects[] = $obj;
            }
        );
        $this->em->expects($this->once())->method('flush');

        $result = $this->service->findOrCreateFromDiscord($discordUser, $tokens);

        $this->assertInstanceOf(User::class, $result);
        $this->assertSame('Mazlai', $result->getUsername());
        // 2 persist : VisitedCity (dans createNewUser) + User (dans findOrCreate)
        $this->assertCount(2, $persistedObjects);
    }

    public function testFindOrCreateThrowsWhenNoDefaultCityExists(): void
    {
        $this->userRepository->method('find')->willReturn(null);

        $cityRepo = $this->createMock(EntityRepository::class);
        $cityRepo->method('find')->willReturn(null);
        $cityRepo->method('findOneBy')->willReturn(null);
        $this->em->method('getRepository')->willReturn($cityRepo);

        $this->expectException(\RuntimeException::class);

        $this->service->findOrCreateFromDiscord($this->makeDiscordUser(), $this->makeTokens());
    }
}
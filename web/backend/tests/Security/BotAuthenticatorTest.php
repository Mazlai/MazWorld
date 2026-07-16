<?php

namespace App\Tests\Security;

use App\Entity\City;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\BotAuthenticator;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use RuntimeException;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

#[Group('unit')]
class BotAuthenticatorTest extends TestCase
{
    private const BOT_SECRET = 'super_secret_bot_key';

    private BotAuthenticator $authenticator;
    private UserRepository $userRepository;
    /** @var EntityManagerInterface&MockObject */
    private $entityManager;

    protected function setUp(): void
    {
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->entityManager  = $this->createMock(EntityManagerInterface::class);
        $this->authenticator  = new BotAuthenticator(
            $this->userRepository,
            $this->entityManager,
            self::BOT_SECRET,
            $this->createMock(LoggerInterface::class),
        );
    }

    // ===== supports() =====

    public function testSupportsReturnsTrueWhenBotSecretHeaderPresent(): void
    {
        $request = new Request();
        $request->headers->set('X-Bot-Secret', 'any_value');

        $this->assertTrue($this->authenticator->supports($request));
    }

    public function testSupportsReturnsFalseWhenHeaderAbsent(): void
    {
        $this->assertFalse($this->authenticator->supports(new Request()));
    }

    // ===== authenticate() =====

    public function testAuthenticateThrowsOnInvalidBotSecret(): void
    {
        $request = new Request();
        $request->headers->set('X-Bot-Secret', 'wrong_secret');
        $request->headers->set('X-Discord-User-Id', '123');

        $this->expectException(CustomUserMessageAuthenticationException::class);
        $this->authenticator->authenticate($request);
    }

    public function testAuthenticateThrowsWhenDiscordUserIdMissing(): void
    {
        $request = new Request();
        $request->headers->set('X-Bot-Secret', self::BOT_SECRET);
        // Pas de X-Discord-User-Id

        $this->expectException(CustomUserMessageAuthenticationException::class);
        $this->authenticator->authenticate($request);
    }

    public function testAuthenticateReturnsPassportWithCorrectUserId(): void
    {
        $request = new Request();
        $request->headers->set('X-Bot-Secret', self::BOT_SECRET);
        $request->headers->set('X-Discord-User-Id', '987654321');

        $passport = $this->authenticator->authenticate($request);

        $this->assertInstanceOf(SelfValidatingPassport::class, $passport);
        // On lit l'identifiant via le badge pour ne pas déclencher le loader (appel DB)
        $badge = $passport->getBadge(UserBadge::class);
        $this->assertSame('987654321', $badge->getUserIdentifier());
    }

    // ===== onAuthenticationSuccess/Failure() =====

    public function testOnAuthenticationSuccessReturnsNull(): void
    {
        $result = $this->authenticator->onAuthenticationSuccess(
            new Request(),
            $this->createMock(\Symfony\Component\Security\Core\Authentication\Token\TokenInterface::class),
            'main'
        );

        $this->assertNull($result);
    }

    // ===== createUserForBot() — via le loader du UserBadge =====

    public function testAuthenticateCreatesNewUserWhenNotFound(): void
    {
        $request = new Request();
        $request->headers->set('X-Bot-Secret', self::BOT_SECRET);
        $request->headers->set('X-Discord-User-Id', '111222333');
        $request->headers->set('X-Discord-Username', 'BotUser');

        $this->userRepository->method('find')->with('111222333')->willReturn(null);

        $defaultCity = $this->createMock(City::class);
        $this->entityManager->method('find')
            ->with(City::class, 'willowbrook')
            ->willReturn($defaultCity);

        $persisted = [];
        $this->entityManager->method('persist')
            ->willReturnCallback(static function (object $obj) use (&$persisted): void {
                $persisted[] = $obj;
            });
        $this->entityManager->expects($this->once())->method('flush');

        $passport = $this->authenticator->authenticate($request);
        $user     = $passport->getBadge(UserBadge::class)->getUser();

        $this->assertInstanceOf(User::class, $user);
        $this->assertSame('111222333', $user->getUserId());
        $this->assertSame('BotUser', $user->getUsername());
        $this->assertCount(3, $persisted); // User + UserInventory + VisitedCity
    }

    public function testCreateUserForBotThrowsWhenDefaultCityMissing(): void
    {
        $request = new Request();
        $request->headers->set('X-Bot-Secret', self::BOT_SECRET);
        $request->headers->set('X-Discord-User-Id', '999');

        $this->userRepository->method('find')->willReturn(null);
        $this->entityManager->method('find')->willReturn(null);

        $passport = $this->authenticator->authenticate($request);

        $this->expectException(RuntimeException::class);
        $passport->getBadge(UserBadge::class)->getUser();
    }

    public function testOnAuthenticationFailureReturns401Json(): void
    {
        $response = $this->authenticator->onAuthenticationFailure(
            new Request(),
            new AuthenticationException('Invalid bot secret.')
        );

        $this->assertSame(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertFalse($data['success']);
    }
}

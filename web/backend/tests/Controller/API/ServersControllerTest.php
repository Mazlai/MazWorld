<?php

namespace App\Tests\Controller\API;

use App\Service\Crypto\TokenEncryptorService;
use PHPUnit\Framework\Attributes\Group;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

#[Group('integration')]
class ServersControllerTest extends AbstractApiWebTestCase
{
    // ===== GET /api/servers =====

    public function testWithoutAuthReturns401(): void
    {
        $this->get('/api/servers');

        $this->assertSame(401, $this->statusCode());
    }

    public function testWithoutOauthTokenReturnsError(): void
    {
        $user = $this->createTestUser();
        $this->auth($user);

        $this->get('/api/servers');

        $this->assertSame(400, $this->statusCode());
        $this->assertArrayHasKey('error', $this->json());
    }

    // Non-régression : le token OAuth est stocké chiffré (TokenEncryptorService).
    // Un test qui l'utiliserait tel quel sans le déchiffrer ne détecterait pas la
    // régression déjà rencontrée ici (token encore chiffré envoyé à Discord,
    // rejeté silencieusement, liste vide sans erreur visible).
    public function testReturnsOnlyAdminOrOwnerGuildsWithEncryptedTokenStoredInDb(): void
    {
        $user = $this->createTestUser(coins: 100);
        $tokenEncryptor = static::getContainer()->get(TokenEncryptorService::class);
        $user->setOauthAccessToken($tokenEncryptor->encrypt('discord_access_token_valide'));
        $user->setOauthTokenExpiresAt(time() + 3600);
        $this->em->flush();
        $this->auth($user);

        $response = $this->createMock(ResponseInterface::class);
        $response->method('getStatusCode')->willReturn(200);
        $response->method('toArray')->willReturn([
            ['id' => '111', 'name' => 'Guilde administrée', 'icon' => null, 'owner' => true, 'permissions' => '8'],
            ['id' => '222', 'name' => 'Guilde simple membre', 'icon' => null, 'owner' => false, 'permissions' => '0'],
        ]);

        // Assertion clé de la non-régression : si le contrôleur envoyait encore le
        // token chiffré, cette contrainte échouerait sur l'appel de récupération des
        // guildes — Discord aurait reçu le texte chiffré au lieu du jeton en clair.
        // Le second type d'appel (isBotInGuild, jeton bot) est une requête distincte
        // et légitime, acceptée séparément.
        $httpClient = $this->createMock(HttpClientInterface::class);
        $httpClient->expects($this->atLeastOnce())
            ->method('request')
            ->with(
                $this->anything(),
                $this->anything(),
                $this->callback(function (array $options) {
                    $auth = $options['headers']['Authorization'] ?? null;

                    return 'Bearer discord_access_token_valide' === $auth || str_starts_with((string) $auth, 'Bot ');
                }),
            )
            ->willReturn($response);
        static::getContainer()->set(HttpClientInterface::class, $httpClient);

        $this->get('/api/servers');

        $this->assertSame(200, $this->statusCode());
        $data = $this->json();
        $this->assertCount(1, $data);
        $this->assertSame('Guilde administrée', $data[0]['name']);
        $this->assertArrayHasKey('bot_present', $data[0]);
    }

    public function testExpiredTokenTriggersRefreshBeforeCall(): void
    {
        $user = $this->createTestUser();
        $tokenEncryptor = static::getContainer()->get(TokenEncryptorService::class);
        $user->setOauthAccessToken($tokenEncryptor->encrypt('token_expire'));
        $user->setOauthRefreshToken($tokenEncryptor->encrypt('refresh_valide'));
        $user->setOauthTokenExpiresAt(time() - 60);
        $this->em->flush();
        $this->auth($user);

        $refreshResponse = $this->createMock(ResponseInterface::class);
        $refreshResponse->method('getStatusCode')->willReturn(200);
        $refreshResponse->method('toArray')->willReturn([
            'access_token' => 'nouveau_token', 'refresh_token' => 'nouveau_refresh',
            'token_type' => 'Bearer', 'expires_in' => 3600, 'scope' => 'identify guilds',
        ]);
        $guildsResponse = $this->createMock(ResponseInterface::class);
        $guildsResponse->method('getStatusCode')->willReturn(200);
        $guildsResponse->method('toArray')->willReturn([]);

        $httpClient = $this->createMock(HttpClientInterface::class);
        $httpClient->method('request')->willReturnOnConsecutiveCalls($refreshResponse, $guildsResponse);
        static::getContainer()->set(HttpClientInterface::class, $httpClient);

        $this->get('/api/servers');

        $this->assertSame(200, $this->statusCode());
        $this->assertSame([], $this->json());
    }
}

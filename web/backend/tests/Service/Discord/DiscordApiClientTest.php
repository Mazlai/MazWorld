<?php

namespace App\Tests\Service\Discord;

use App\Service\Discord\DiscordApiClient;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

#[Group('unit')]
class DiscordApiClientTest extends TestCase
{
    /** @var HttpClientInterface&MockObject */
    private $httpClient;
    private DiscordApiClient $client;

    protected function setUp(): void
    {
        $this->httpClient = $this->createMock(HttpClientInterface::class);
        $this->client     = new DiscordApiClient(
            $this->httpClient,
            clientId:     'client_123',
            clientSecret: 'secret_abc',
            redirectUri:  'https://app.test/callback',
            botToken:     'bot_token_xyz',
        );
    }

    private function mockResponse(int $statusCode, array $data = [], string $content = ''): ResponseInterface
    {
        $response = $this->createMock(ResponseInterface::class);
        $response->method('getStatusCode')->willReturn($statusCode);
        $response->method('toArray')->willReturn($data);
        $response->method('getContent')->willReturn($content);
        return $response;
    }

    // ===== getAuthorizationUrl() — logique pure, aucun appel HTTP =====

    public function testGetAuthorizationUrlContainsRequiredParams(): void
    {
        $url = $this->client->getAuthorizationUrl('state_abc');

        $this->assertStringContainsString('client_id=client_123', $url);
        $this->assertStringContainsString('state=state_abc', $url);
        $this->assertStringContainsString('response_type=code', $url);
        $this->assertStringContainsString('prompt=consent', $url);
    }

    public function testGetAuthorizationUrlContainsDefaultScopes(): void
    {
        $url = $this->client->getAuthorizationUrl('s');

        $this->assertStringContainsString('identify', $url);
        $this->assertStringContainsString('email', $url);
        $this->assertStringContainsString('guilds', $url);
    }

    public function testGetAuthorizationUrlWithCustomScopes(): void
    {
        $url = $this->client->getAuthorizationUrl('s', ['identify']);

        $this->assertStringContainsString('identify', $url);
        $this->assertStringNotContainsString('email', $url);
        $this->assertStringNotContainsString('guilds', $url);
    }

    // ===== getCurrentUserGuilds() =====

    public function testGetCurrentUserGuildsWithCountsAppendsQueryParam(): void
    {
        $this->httpClient
            ->expects($this->once())
            ->method('request')
            ->with('GET', $this->stringContains('with_counts=true'), $this->anything())
            ->willReturn($this->mockResponse(200, []));

        $this->client->getCurrentUserGuilds('token_abc', true);
    }

    public function testGetCurrentUserGuildsWithoutCountsOmitsQueryParam(): void
    {
        $this->httpClient
            ->expects($this->once())
            ->method('request')
            ->with('GET', $this->logicalNot($this->stringContains('with_counts')), $this->anything())
            ->willReturn($this->mockResponse(200, []));

        $this->client->getCurrentUserGuilds('token_abc', false);
    }

    public function testGetCurrentUserGuildsReturnsEmptyArrayOnNon200(): void
    {
        $this->httpClient->method('request')->willReturn($this->mockResponse(403));

        $result = $this->client->getCurrentUserGuilds('token_abc');

        $this->assertSame([], $result);
    }

    // ===== isBotInGuild() =====

    public function testIsBotInGuildReturnsTrueOn200(): void
    {
        $this->httpClient->method('request')->willReturn($this->mockResponse(200));

        $this->assertTrue($this->client->isBotInGuild('guild_123'));
    }

    public function testIsBotInGuildReturnsFalseOn404(): void
    {
        $this->httpClient->method('request')->willReturn($this->mockResponse(404));

        $this->assertFalse($this->client->isBotInGuild('guild_123'));
    }

    public function testIsBotInGuildReturnsFalseOnException(): void
    {
        $this->httpClient->method('request')->willThrowException(new \Exception('Network error'));

        $this->assertFalse($this->client->isBotInGuild('guild_123'));
    }

    // ===== getBotInfo() =====

    public function testGetBotInfoReturnsStructuredDataOn200(): void
    {
        $this->httpClient->method('request')->willReturn(
            $this->mockResponse(200, ['username' => 'MazBot', 'id' => 'bot_id_123'])
        );

        $info = $this->client->getBotInfo();

        $this->assertTrue($info['online']);
        $this->assertSame('MazBot', $info['username']);
        $this->assertSame('bot_id_123', $info['bot_id']);
    }

    public function testGetBotInfoReturnsNullOnNon200(): void
    {
        $this->httpClient->method('request')->willReturn($this->mockResponse(401));

        $this->assertNull($this->client->getBotInfo());
    }

    public function testGetBotInfoReturnsNullOnException(): void
    {
        $this->httpClient->method('request')->willThrowException(new \Exception('Timeout'));

        $this->assertNull($this->client->getBotInfo());
    }

    // ===== revokeToken() =====

    public function testRevokeTokenReturnsTrueOn200(): void
    {
        $this->httpClient->method('request')->willReturn($this->mockResponse(200));

        $this->assertTrue($this->client->revokeToken('some_token'));
    }

    public function testRevokeTokenReturnsFalseOnException(): void
    {
        $this->httpClient->method('request')->willThrowException(new \Exception('Timeout'));

        $this->assertFalse($this->client->revokeToken('some_token'));
    }
}
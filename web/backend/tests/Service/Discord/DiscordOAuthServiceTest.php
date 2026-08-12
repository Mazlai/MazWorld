<?php

namespace App\Tests\Service\Discord;

use App\Service\Discord\DiscordApiClient;
use App\Service\Discord\DiscordOAuthService;
use App\Service\Discord\DTO\DiscordTokenDTO;
use App\Service\Discord\DTO\DiscordUserDTO;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

#[Group('unit')]
class DiscordOAuthServiceTest extends TestCase
{
    /** @var DiscordApiClient&MockObject */
    private $apiClient;
    private DiscordOAuthService $service;

    protected function setUp(): void
    {
        $this->apiClient = $this->createMock(DiscordApiClient::class);
    }

    private function construireService(?string $botToken): DiscordOAuthService
    {
        return new DiscordOAuthService($this->apiClient, $botToken);
    }

    private function construireTokenDTO(): DiscordTokenDTO
    {
        return new DiscordTokenDTO('access', 'refresh', 3600, 'Bearer', '');
    }

    private function construireUserDTO(): DiscordUserDTO
    {
        return new DiscordUserDTO('1', 'mazlai', null, null, null, true, null);
    }

    // ===== Délégations vers DiscordApiClient =====

    public function testGetAuthorizationUrlDelegatesToApiClient(): void
    {
        $this->apiClient->expects($this->once())
            ->method('getAuthorizationUrl')
            ->with('state_abc')
            ->willReturn('https://discord.com/oauth2/authorize?state=state_abc');

        $result = $this->construireService(null)->getAuthorizationUrl('state_abc');

        $this->assertSame('https://discord.com/oauth2/authorize?state=state_abc', $result);
    }

    public function testExchangeCodeDelegatesToApiClient(): void
    {
        $dto = $this->construireTokenDTO();
        $this->apiClient->expects($this->once())
            ->method('exchangeCodeForTokens')
            ->with('auth_code')
            ->willReturn($dto);

        $this->assertSame($dto, $this->construireService(null)->exchangeCode('auth_code'));
    }

    public function testRefreshTokensDelegatesToApiClient(): void
    {
        $dto = $this->construireTokenDTO();
        $this->apiClient->expects($this->once())
            ->method('refreshTokens')
            ->with('refresh_token_xyz')
            ->willReturn($dto);

        $this->assertSame($dto, $this->construireService(null)->refreshTokens('refresh_token_xyz'));
    }

    public function testGetDiscordUserDelegatesToApiClient(): void
    {
        $dto = $this->construireUserDTO();
        $this->apiClient->expects($this->once())
            ->method('getCurrentUser')
            ->with('access_token_abc')
            ->willReturn($dto);

        $this->assertSame($dto, $this->construireService(null)->getDiscordUser('access_token_abc'));
    }

    public function testGetDiscordUserGuildsDelegatesToApiClient(): void
    {
        $this->apiClient->expects($this->once())
            ->method('getCurrentUserGuilds')
            ->with('access_token_abc', true)
            ->willReturn([]);

        $this->construireService(null)->getDiscordUserGuilds('access_token_abc', true);
    }

    public function testRevokeTokenDelegatesToApiClient(): void
    {
        $this->apiClient->expects($this->once())
            ->method('revokeToken')
            ->with('token_to_revoke')
            ->willReturn(true);

        $this->assertTrue($this->construireService(null)->revokeToken('token_to_revoke'));
    }

    // ===== isBotInGuild() — logique propre =====

    public function testIsBotInGuildReturnsFalseWhenBotTokenIsNull(): void
    {
        $this->apiClient->expects($this->never())->method('isBotInGuild');

        $this->assertFalse($this->construireService(null)->isBotInGuild('guild_123'));
    }

    public function testIsBotInGuildReturnsFalseWhenBotTokenIsEmpty(): void
    {
        $this->apiClient->expects($this->never())->method('isBotInGuild');

        $this->assertFalse($this->construireService('')->isBotInGuild('guild_123'));
    }

    public function testIsBotInGuildDelegatesToApiClientWithGuildId(): void
    {
        $this->apiClient->expects($this->once())
            ->method('isBotInGuild')
            ->with('guild_123')
            ->willReturn(true);

        $this->assertTrue($this->construireService('bot_token_xyz')->isBotInGuild('guild_123'));
    }
}

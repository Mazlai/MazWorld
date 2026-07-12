<?php

namespace App\Service\Discord;

use App\Service\Discord\DTO\DiscordTokenDTO;
use App\Service\Discord\DTO\DiscordUserDTO;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class DiscordOAuthService
{
    public function __construct(
        private readonly DiscordApiClient $apiClient,
        #[Autowire('%env(DISCORD_BOT_TOKEN)%')]
        private readonly ?string $botToken = null
    ) {
    }

    public function getAuthorizationUrl(string $state): string
    {
        return $this->apiClient->getAuthorizationUrl($state);
    }

    public function exchangeCode(string $code): DiscordTokenDTO
    {
        return $this->apiClient->exchangeCodeForTokens($code);
    }

    public function refreshTokens(string $refreshToken): DiscordTokenDTO
    {
        return $this->apiClient->refreshTokens($refreshToken);
    }

    public function getDiscordUser(string $accessToken): DiscordUserDTO
    {
        return $this->apiClient->getCurrentUser($accessToken);
    }

    public function getDiscordUserGuilds(string $accessToken, bool $withCounts = true): array
    {
        return $this->apiClient->getCurrentUserGuilds($accessToken, $withCounts);
    }

    public function isBotInGuild(string $guildId): bool
    {
        if (!$this->botToken) {
            return false;
        }

        return $this->apiClient->isBotInGuild($guildId);
    }

    public function revokeToken(string $token): bool
    {
        return $this->apiClient->revokeToken($token);
    }
}

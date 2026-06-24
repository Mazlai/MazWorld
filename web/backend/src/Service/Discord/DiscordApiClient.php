<?php

namespace App\Service\Discord;

use App\Service\Discord\DTO\DiscordGuildDTO;
use App\Service\Discord\DTO\DiscordTokenDTO;
use App\Service\Discord\DTO\DiscordUserDTO;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class DiscordApiClient
{
    private const API_URL = 'https://discord.com/api/v10';
    private const OAUTH_URL = 'https://discord.com/api/oauth2';

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $clientId,
        private readonly string $clientSecret,
        private readonly string $redirectUri
    ) {}

    public function getAuthorizationUrl(string $state, array $scopes = ['identify', 'email', 'guilds']): string
    {
        $params = [
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUri,
            'response_type' => 'code',
            'scope' => implode(' ', $scopes),
            'state' => $state,
            'prompt' => 'consent',
        ];

        return self::OAUTH_URL . '/authorize?' . http_build_query($params);
    }

    public function exchangeCodeForTokens(string $code): DiscordTokenDTO
    {
        $response = $this->httpClient->request('POST', self::OAUTH_URL . '/token', [
            'headers' => ['Content-Type' => 'application/x-www-form-urlencoded'],
            'body' => [
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => $this->redirectUri,
            ],
        ]);

        $this->assertSuccess($response, 'Failed to exchange code for tokens');

        return DiscordTokenDTO::fromArray($response->toArray());
    }

    public function refreshTokens(string $refreshToken): DiscordTokenDTO
    {
        $response = $this->httpClient->request('POST', self::OAUTH_URL . '/token', [
            'headers' => ['Content-Type' => 'application/x-www-form-urlencoded'],
            'body' => [
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'grant_type' => 'refresh_token',
                'refresh_token' => $refreshToken,
            ],
        ]);

        $this->assertSuccess($response, 'Failed to refresh tokens');

        return DiscordTokenDTO::fromArray($response->toArray());
    }

    public function getCurrentUser(string $accessToken): DiscordUserDTO
    {
        $response = $this->httpClient->request('GET', self::API_URL . '/users/@me', [
            'headers' => ['Authorization' => 'Bearer ' . $accessToken],
        ]);

        $this->assertSuccess($response, 'Failed to fetch Discord user');

        return DiscordUserDTO::fromArray($response->toArray());
    }

    public function getCurrentUserGuilds(string $accessToken, bool $withCounts = true): array
    {
        $url = self::API_URL . '/users/@me/guilds';
        if ($withCounts) {
            $url .= '?with_counts=true';
        }

        $response = $this->httpClient->request('GET', $url, [
            'headers' => ['Authorization' => 'Bearer ' . $accessToken],
        ]);

        if ($response->getStatusCode() !== 200) {
            return [];
        }

        return DiscordGuildDTO::fromArrayList($response->toArray());
    }

    public function isBotInGuild(string $botToken, string $guildId): bool
    {
        try {
            $response = $this->httpClient->request('GET', self::API_URL . '/guilds/' . $guildId, [
                'headers' => ['Authorization' => 'Bot ' . $botToken],
            ]);

            return $response->getStatusCode() === 200;
        } catch (\Exception) {
            return false;
        }
    }

    public function revokeToken(string $token): bool
    {
        try {
            $response = $this->httpClient->request('POST', self::OAUTH_URL . '/token/revoke', [
                'headers' => ['Content-Type' => 'application/x-www-form-urlencoded'],
                'body' => [
                    'client_id' => $this->clientId,
                    'client_secret' => $this->clientSecret,
                    'token' => $token,
                ],
            ]);

            return $response->getStatusCode() === 200;
        } catch (\Exception) {
            return false;
        }
    }

    private function assertSuccess($response, string $errorMessage): void
    {
        if ($response->getStatusCode() !== 200) {
            throw new \RuntimeException($errorMessage . ': ' . $response->getContent(false));
        }
    }
}

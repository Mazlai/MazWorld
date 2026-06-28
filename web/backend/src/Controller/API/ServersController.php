<?php

namespace App\Controller\API;

use App\Service\Discord\DiscordApiClient;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api', name: 'api_servers_')]
class ServersController extends AbstractApiController
{
    public function __construct(
        private readonly DiscordApiClient $discord,
        private readonly EntityManagerInterface $entityManager,
        private readonly string $discordClientId
    ) {}

    #[Route('/servers', name: 'list', methods: ['GET'])]
    public function listServers(): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        $accessToken = $user->getOauthAccessToken();
        if (!$accessToken) {
            return $this->errorResponse('No OAuth token available. Please log in again.');
        }

        if ($user->isAccessTokenExpired()) {
            $refreshToken = $user->getOauthRefreshToken();
            if (!$refreshToken) {
                return $this->errorResponse('OAuth token expired. Please log in again.', Response::HTTP_UNAUTHORIZED);
            }

            try {
                $newTokens = $this->discord->refreshTokens($refreshToken);
                $user->setOauthAccessToken($newTokens->accessToken);
                $user->setOauthRefreshToken($newTokens->refreshToken);
                $user->setOauthTokenExpiresAt(time() + $newTokens->expiresIn);
                $this->entityManager->flush();
                $accessToken = $newTokens->accessToken;
            } catch (\Throwable) {
                return $this->errorResponse('OAuth token expired. Please log in again.', Response::HTTP_UNAUTHORIZED);
            }
        }

        try {
            $guilds = $this->discord->getCurrentUserGuilds($accessToken);

            $adminGuilds = array_filter($guilds, fn($guild) =>
                $guild->owner
                || ($guild->permissions & 0x8)   // ADMINISTRATOR
                || ($guild->permissions & 0x20)  // MANAGE_GUILD
            );

            $result = array_map(function ($guild) {
                $botPresent = $this->discord->isBotInGuild($guild->id);
                $inviteUrl  = $botPresent ? null : $this->buildInviteUrl($guild->id);

                return [
                    'id'           => $guild->id,
                    'name'         => $guild->name,
                    'icon'         => $guild->getIconUrl(64),
                    'owner'        => $guild->owner,
                    'member_count' => $guild->approximate_member_count,
                    'bot_present'  => $botPresent,
                    'invite_url'   => $inviteUrl,
                ];
            }, $adminGuilds);

            usort($result, fn($a, $b) => $b['bot_present'] <=> $a['bot_present']);

            return new JsonResponse($result);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to fetch servers: ' . $e->getMessage(), Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/bot/status', name: 'bot_status', methods: ['GET'])]
    public function botStatus(): JsonResponse
    {
        $info = $this->discord->getBotInfo();

        if ($info === null) {
            return new JsonResponse(['online' => false, 'username' => null, 'bot_id' => null]);
        }

        return new JsonResponse($info);
    }

    private function buildInviteUrl(string $guildId): string
    {
        $params = [
            'client_id'   => $this->discordClientId,
            'scope'       => 'bot applications.commands',
            'permissions' => '414464674816',
            'guild_id'    => $guildId,
        ];

        return 'https://discord.com/oauth2/authorize?' . http_build_query($params);
    }
}

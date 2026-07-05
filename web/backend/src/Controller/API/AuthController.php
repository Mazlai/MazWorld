<?php

namespace App\Controller\API;

use App\Service\Discord\DiscordOAuthService;
use App\Service\User\UserService;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/auth', name: 'api_auth_')]
class AuthController extends AbstractApiController
{
    public function __construct(
        private readonly DiscordOAuthService $discordOAuth,
        private readonly UserService $userService,
        private readonly JWTTokenManagerInterface $jwtManager,
        #[Autowire(service: 'limiter.auth_callback')]
        private readonly RateLimiterFactory $callbackLimiter,
        #[Autowire(service: 'limiter.auth_refresh')]
        private readonly RateLimiterFactory $refreshLimiter,
    ) {}

    #[Route('/discord/login', name: 'discord_login', methods: ['GET'])]
    public function discordLogin(): JsonResponse
    {
        $state = bin2hex(random_bytes(16));

        return new JsonResponse([
            'authorization_url' => $this->discordOAuth->getAuthorizationUrl($state),
            'state' => $state,
        ]);
    }

    #[Route('/discord/callback', name: 'discord_callback', methods: ['POST'])]
    public function discordCallback(Request $request): JsonResponse
    {
        $limit = $this->callbackLimiter->create($request->getClientIp())->consume();
        if (!$limit->isAccepted()) {
            return $this->tooManyRequestsResponse($limit->getRetryAfter());
        }

        $data = json_decode($request->getContent(), true);
        $code = $data['code'] ?? null;

        if (!$code) {
            return new JsonResponse(['error' => 'Missing authorization code'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $tokens = $this->discordOAuth->exchangeCode($code);
            $discordUser = $this->discordOAuth->getDiscordUser($tokens->accessToken);
            $user = $this->userService->findOrCreateFromDiscord($discordUser, $tokens);
            $jwt = $this->jwtManager->create($user);

            $guilds = $this->discordOAuth->getDiscordUserGuilds($tokens->accessToken);

            return new JsonResponse([
                'token' => $jwt,
                'user' => $user->toArray(),
                'guilds' => array_map(fn($guild) => [
                    'id' => $guild->id,
                    'name' => $guild->name,
                    'icon' => $guild->getIconUrl(),
                ], array_slice($guilds, 0, 10)),
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Authentication failed',
                'message' => $e->getMessage(),
            ], Response::HTTP_UNAUTHORIZED);
        }
    }

    #[Route('/refresh', name: 'refresh', methods: ['POST'])]
    public function refresh(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $limit = $this->refreshLimiter->create($user->getUserId())->consume();
        if (!$limit->isAccepted()) {
            return $this->tooManyRequestsResponse($limit->getRetryAfter());
        }

        try {
            if ($user->isAccessTokenExpired() && $user->getOauthRefreshToken()) {
                $newTokens = $this->discordOAuth->refreshTokens($user->getOauthRefreshToken());
                $this->userService->updateUserTokens($user, $newTokens);

                $discordUser = $this->discordOAuth->getDiscordUser($newTokens->accessToken);
                $this->userService->updateUserFromDiscord($user, $discordUser);
                $this->userService->save($user);
            }

            return new JsonResponse([
                'token' => $this->jwtManager->create($user),
                'user' => $user->toArray(),
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Token refresh failed',
                'message' => $e->getMessage(),
            ], Response::HTTP_UNAUTHORIZED);
        }
    }

    #[Route('/logout', name: 'logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        $user = $this->getCurrentUser();

        if ($user && $user->getOauthAccessToken()) {
            $this->discordOAuth->revokeToken($user->getOauthAccessToken());
        }

        return new JsonResponse(['message' => 'Logged out successfully']);
    }

    #[Route('/me', name: 'me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        return new JsonResponse(['user' => $user->toArray()]);
    }

    #[Route('/verify', name: 'verify', methods: ['GET'])]
    public function verify(): JsonResponse
    {
        $user = $this->getCurrentUser();

        return new JsonResponse([
            'valid' => $user !== null,
            'user' => $user?->toArray(),
        ]);
    }
}

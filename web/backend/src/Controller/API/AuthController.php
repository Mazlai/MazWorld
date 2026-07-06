<?php

namespace App\Controller\API;

use App\Service\Crypto\TokenEncryptorService;
use App\Service\Discord\DiscordOAuthService;
use App\Service\User\UserService;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Annotation\Route;
use Psr\Cache\CacheItemPoolInterface;

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
        private readonly CacheItemPoolInterface $cache,
        private readonly TokenEncryptorService $tokenEncryptor,
    ) {}

    #[Route('/discord/login', name: 'discord_login', methods: ['GET'])]
    public function discordLogin(): JsonResponse
    {
        $state = bin2hex(random_bytes(16));

        $item = $this->cache->getItem('oauth_state_' . $state);
        $item->set(true)->expiresAfter(300);
        $this->cache->save($item);

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
        $state = $data['state'] ?? null;
        $cacheKey = 'oauth_state_' . $state;

        if (!$state || !$this->cache->getItem($cacheKey)->isHit()) {
            return $this->errorResponse('Invalid OAuth state', Response::HTTP_BAD_REQUEST);
        }

        $this->cache->deleteItem($cacheKey);

        if (!$code) {
            return $this->errorResponse('Missing authorization code', Response::HTTP_BAD_REQUEST);
        }

        try {
            $tokens = $this->discordOAuth->exchangeCode($code);
            $discordUser = $this->discordOAuth->getDiscordUser($tokens->accessToken);
            $user = $this->userService->findOrCreateFromDiscord($discordUser, $tokens);
            $jwt = $this->jwtManager->create($user);

            $guilds = $this->discordOAuth->getDiscordUserGuilds($tokens->accessToken);

            return new JsonResponse([
                'token' => $jwt,
                'user' => $this->userService->serializeUser($user),
                'guilds' => array_map(fn($guild) => [
                    'id' => $guild->id,
                    'name' => $guild->name,
                    'icon' => $guild->getIconUrl(),
                ], array_slice($guilds, 0, 10)),
            ]);
        } catch (\Exception) {
            return $this->unauthorizedResponse('Authentication failed');
        }
    }

    #[Route('/refresh', name: 'refresh', methods: ['POST'])]
    public function refresh(): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        $limit = $this->refreshLimiter->create($user->getUserId())->consume();
        if (!$limit->isAccepted()) {
            return $this->tooManyRequestsResponse($limit->getRetryAfter());
        }

        try {
            if ($user->isAccessTokenExpired() && $user->getOauthRefreshToken()) {
                $newTokens = $this->discordOAuth->refreshTokens($this->tokenEncryptor->decrypt($user->getOauthRefreshToken()));
                $this->userService->updateUserTokens($user, $newTokens);

                $discordUser = $this->discordOAuth->getDiscordUser($newTokens->accessToken);
                $this->userService->updateUserFromDiscord($user, $discordUser);
                $this->userService->save($user);
            }

            return new JsonResponse([
                'token' => $this->jwtManager->create($user),
                'user' => $this->userService->serializeUser($user),
            ]);
        } catch (\Exception) {
            return $this->unauthorizedResponse('Token refresh failed');
        }
    }

    #[Route('/logout', name: 'logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        $user = $this->getCurrentUser();

        if ($user && $user->getOauthAccessToken()) {
            $this->discordOAuth->revokeToken($this->tokenEncryptor->decrypt($user->getOauthAccessToken()));
        }

        return new JsonResponse(['message' => 'Logged out successfully']);
    }

    #[Route('/me', name: 'me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        return new JsonResponse(['user' => $this->userService->serializeUser($user)]);
    }

    #[Route('/verify', name: 'verify', methods: ['GET'])]
    public function verify(): JsonResponse
    {
        $user = $this->getCurrentUser();

        return new JsonResponse([
            'valid' => $user !== null,
            'user' => $user !== null ? $this->userService->serializeUser($user) : null,
        ]);
    }
}

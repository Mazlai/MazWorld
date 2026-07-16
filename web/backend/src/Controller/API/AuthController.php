<?php

namespace App\Controller\API;

use App\Repository\UserRepository;
use App\Service\Crypto\TokenEncryptorService;
use App\Service\Discord\DiscordOAuthService;
use App\Service\User\UserService;
use Exception;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/auth', name: 'api_auth_')]
class AuthController extends AbstractApiController
{
    private const REFRESH_COOKIE = 'mw_refresh';
    private const REFRESH_TTL = 604800; // 7 days

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
        private readonly UserRepository $userRepository,
    ) {
    }

    #[Route('/discord/login', name: 'discord_login', methods: ['GET'])]
    public function discordLogin(): JsonResponse
    {
        $state = bin2hex(random_bytes(16));

        $item = $this->cache->getItem('oauth_state_'.$state);
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
        $cacheKey = 'oauth_state_'.$state;

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

            $response = new JsonResponse([
                'token' => $jwt,
                'user' => $this->userService->serializeUser($user),
                'guilds' => array_map(fn ($guild) => [
                    'id' => $guild->id,
                    'name' => $guild->name,
                    'icon' => $guild->getIconUrl(),
                ], array_slice($guilds, 0, 10)),
            ]);

            $response->headers->setCookie($this->createRefreshCookie($user->getUserId()));

            return $response;
        } catch (Exception) {
            return $this->unauthorizedResponse('Authentication failed');
        }
    }

    #[Route('/refresh', name: 'refresh', methods: ['POST'])]
    public function refresh(Request $request): JsonResponse
    {
        $rawToken = $request->cookies->get(self::REFRESH_COOKIE);

        if (!$rawToken) {
            return $this->unauthorizedResponse('No refresh token');
        }

        $cacheKey = 'refresh_token_'.hash('sha256', $rawToken);
        $item = $this->cache->getItem($cacheKey);

        if (!$item->isHit()) {
            return $this->unauthorizedResponse('Invalid or expired refresh token');
        }

        $userId = $item->get();
        $user = $this->userRepository->find($userId);

        if (!$user) {
            $this->cache->deleteItem($cacheKey);

            return $this->unauthorizedResponse('User not found');
        }

        $limit = $this->refreshLimiter->create($userId)->consume();
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

            // Rotate refresh token
            $this->cache->deleteItem($cacheKey);
            $response = new JsonResponse([
                'token' => $this->jwtManager->create($user),
                'user' => $this->userService->serializeUser($user),
            ]);
            $response->headers->setCookie($this->createRefreshCookie($userId));

            return $response;
        } catch (Exception) {
            return $this->unauthorizedResponse('Token refresh failed');
        }
    }

    #[Route('/logout', name: 'logout', methods: ['POST'])]
    public function logout(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser();

        if ($user) {
            if ($user->getOauthAccessToken()) {
                $this->discordOAuth->revokeToken($this->tokenEncryptor->decrypt($user->getOauthAccessToken()));
            }

            $item = $this->cache->getItem('jwt_blacklist_'.$user->getUserId());
            $item->set(time())->expiresAfter(900);
            $this->cache->save($item);
        }

        $rawToken = $request->cookies->get(self::REFRESH_COOKIE);
        if ($rawToken) {
            $this->cache->deleteItem('refresh_token_'.hash('sha256', $rawToken));
        }

        $response = new JsonResponse(['message' => 'Logged out successfully']);
        $response->headers->clearCookie(self::REFRESH_COOKIE, '/api/auth');

        return $response;
    }

    private function createRefreshCookie(string $userId): Cookie
    {
        $rawToken = bin2hex(random_bytes(32));

        $item = $this->cache->getItem('refresh_token_'.hash('sha256', $rawToken));
        $item->set($userId)->expiresAfter(self::REFRESH_TTL);
        $this->cache->save($item);

        return Cookie::create(self::REFRESH_COOKIE)
            ->withValue($rawToken)
            ->withExpires(time() + self::REFRESH_TTL)
            ->withPath('/api/auth')
            ->withSecure(true)
            ->withHttpOnly(true)
            ->withSameSite('strict');
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
            'valid' => null !== $user,
            'user' => null !== $user ? $this->userService->serializeUser($user) : null,
        ]);
    }
}

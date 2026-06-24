<?php

namespace App\Service\Discord\DTO;

readonly class DiscordTokenDTO
{
    public function __construct(
        public string $accessToken,
        public string $refreshToken,
        public int $expiresIn,
        public string $tokenType,
        public string $scope
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            accessToken: $data['access_token'],
            refreshToken: $data['refresh_token'],
            expiresIn: $data['expires_in'],
            tokenType: $data['token_type'] ?? 'Bearer',
            scope: $data['scope'] ?? ''
        );
    }

    public function getExpiresAt(): int
    {
        return time() + $this->expiresIn;
    }
}

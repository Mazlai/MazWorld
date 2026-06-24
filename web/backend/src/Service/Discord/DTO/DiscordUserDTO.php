<?php

namespace App\Service\Discord\DTO;

readonly class DiscordUserDTO
{
    public function __construct(
        public string $id,
        public string $username,
        public ?string $discriminator,
        public ?string $email,
        public ?string $avatar,
        public bool $verified,
        public ?string $globalName
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            username: $data['username'],
            discriminator: $data['discriminator'] ?? null,
            email: $data['email'] ?? null,
            avatar: $data['avatar'] ?? null,
            verified: $data['verified'] ?? false,
            globalName: $data['global_name'] ?? null
        );
    }

    public function getDisplayName(): string
    {
        return $this->globalName ?? $this->username;
    }
}

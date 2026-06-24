<?php

namespace App\Service\Discord\DTO;

readonly class DiscordGuildDTO
{
    public function __construct(
        public string $id,
        public string $name,
        public ?string $icon,
        public bool $owner,
        public int $permissions,
        public ?int $approximate_member_count = null,
        public ?int $approximate_presence_count = null
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            name: $data['name'],
            icon: $data['icon'] ?? null,
            owner: $data['owner'] ?? false,
            permissions: (int) ($data['permissions'] ?? 0),
            approximate_member_count: $data['approximate_member_count'] ?? null,
            approximate_presence_count: $data['approximate_presence_count'] ?? null
        );
    }

    public static function fromArrayList(array $guilds): array
    {
        return array_map(fn(array $guild) => self::fromArray($guild), $guilds);
    }

    public function getIconUrl(?int $size = 64): ?string
    {
        if (!$this->icon) {
            return null;
        }

        $extension = str_starts_with($this->icon, 'a_') ? 'gif' : 'png';
        return "https://cdn.discordapp.com/icons/{$this->id}/{$this->icon}.{$extension}?size={$size}";
    }
}

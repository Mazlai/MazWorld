<?php

namespace App\Tests\Service\Discord\DTO;

use App\Service\Discord\DTO\DiscordTokenDTO;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;

#[Group('unit')]
class DiscordTokenDTOTest extends TestCase
{
    // ===== fromArray() =====

    public function testFromArrayMapsAllFields(): void
    {
        $dto = DiscordTokenDTO::fromArray([
            'access_token'  => 'access_abc',
            'refresh_token' => 'refresh_xyz',
            'expires_in'    => 604800,
            'token_type'    => 'Bearer',
            'scope'         => 'identify email guilds',
        ]);

        $this->assertSame('access_abc', $dto->accessToken);
        $this->assertSame('refresh_xyz', $dto->refreshToken);
        $this->assertSame(604800, $dto->expiresIn);
        $this->assertSame('Bearer', $dto->tokenType);
        $this->assertSame('identify email guilds', $dto->scope);
    }

    public function testFromArrayUsesDefaultsForOptionalFields(): void
    {
        $dto = DiscordTokenDTO::fromArray([
            'access_token'  => 'access_abc',
            'refresh_token' => 'refresh_xyz',
            'expires_in'    => 3600,
        ]);

        $this->assertSame('Bearer', $dto->tokenType);
        $this->assertSame('', $dto->scope);
    }

    // ===== getExpiresAt() =====

    public function testGetExpiresAtIsInFuture(): void
    {
        $before = time();
        $dto    = new DiscordTokenDTO('a', 'r', 3600, 'Bearer', '');
        $after  = time();

        $this->assertGreaterThanOrEqual($before + 3600, $dto->getExpiresAt());
        $this->assertLessThanOrEqual($after + 3600, $dto->getExpiresAt());
    }
}

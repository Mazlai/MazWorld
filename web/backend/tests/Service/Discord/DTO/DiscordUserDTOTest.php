<?php

namespace App\Tests\Service\Discord\DTO;

use App\Service\Discord\DTO\DiscordUserDTO;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;

#[Group('unit')]
class DiscordUserDTOTest extends TestCase
{
    // ===== fromArray() =====

    public function testFromArrayMapsAllFields(): void
    {
        $dto = DiscordUserDTO::fromArray([
            'id'            => '123456789',
            'username'      => 'mazlai',
            'discriminator' => '0001',
            'email'         => 'mazlai@discord.com',
            'avatar'        => 'a_abc123',
            'verified'      => true,
            'global_name'   => 'Mazlai',
        ]);

        $this->assertSame('123456789', $dto->id);
        $this->assertSame('mazlai', $dto->username);
        $this->assertSame('0001', $dto->discriminator);
        $this->assertSame('mazlai@discord.com', $dto->email);
        $this->assertSame('a_abc123', $dto->avatar);
        $this->assertTrue($dto->verified);
        $this->assertSame('Mazlai', $dto->globalName);
    }

    public function testFromArraySetsOptionalFieldsToNullWhenAbsent(): void
    {
        $dto = DiscordUserDTO::fromArray([
            'id'       => '123',
            'username' => 'mazlai',
        ]);

        $this->assertNull($dto->email);
        $this->assertNull($dto->avatar);
        $this->assertNull($dto->discriminator);
        $this->assertFalse($dto->verified);
        $this->assertNull($dto->globalName);
    }

    // ===== getDisplayName() =====

    public function testGetDisplayNamePrefersGlobalName(): void
    {
        $dto = new DiscordUserDTO('1', 'old_username', null, null, null, true, 'Nouveau Pseudo');

        $this->assertSame('Nouveau Pseudo', $dto->getDisplayName());
    }

    public function testGetDisplayNameFallsBackToUsernameWhenGlobalNameIsNull(): void
    {
        $dto = new DiscordUserDTO('1', 'mazlai', null, null, null, true, null);

        $this->assertSame('mazlai', $dto->getDisplayName());
    }
}

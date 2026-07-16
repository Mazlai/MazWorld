<?php

namespace App\Tests\Service\Discord\DTO;

use App\Service\Discord\DTO\DiscordGuildDTO;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;

#[Group('unit')]
class DiscordGuildDTOTest extends TestCase
{
    // ===== fromArray() =====

    public function testFromArrayMapsAllFields(): void
    {
        $dto = DiscordGuildDTO::fromArray([
            'id'                       => '987654321',
            'name'                     => 'MazWorld',
            'icon'                     => 'icon_hash',
            'owner'                    => true,
            'permissions'              => 8,
            'approximate_member_count' => 150,
            'approximate_presence_count' => 42,
        ]);

        $this->assertSame('987654321', $dto->id);
        $this->assertSame('MazWorld', $dto->name);
        $this->assertSame('icon_hash', $dto->icon);
        $this->assertTrue($dto->owner);
        $this->assertSame(8, $dto->permissions);
        $this->assertSame(150, $dto->approximate_member_count);
        $this->assertSame(42, $dto->approximate_presence_count);
    }

    public function testFromArraySetsOptionalFieldsToNullWhenAbsent(): void
    {
        $dto = DiscordGuildDTO::fromArray([
            'id'   => '1',
            'name' => 'Test',
        ]);

        $this->assertNull($dto->icon);
        $this->assertFalse($dto->owner);
        $this->assertSame(0, $dto->permissions);
        $this->assertNull($dto->approximate_member_count);
        $this->assertNull($dto->approximate_presence_count);
    }

    // ===== fromArrayList() =====

    public function testFromArrayListConvertsEachElement(): void
    {
        $guilds = DiscordGuildDTO::fromArrayList([
            ['id' => '1', 'name' => 'Guild A'],
            ['id' => '2', 'name' => 'Guild B'],
        ]);

        $this->assertCount(2, $guilds);
        $this->assertSame('Guild A', $guilds[0]->name);
        $this->assertSame('Guild B', $guilds[1]->name);
    }

    // ===== getIconUrl() =====

    public function testGetIconUrlReturnsPngForStaticIcon(): void
    {
        $dto = new DiscordGuildDTO('123', 'MazWorld', 'icon_hash', false, 0);

        $url = $dto->getIconUrl(64);

        $this->assertStringContainsString('icon_hash.png', $url);
        $this->assertStringContainsString('size=64', $url);
    }

    public function testGetIconUrlReturnsGifForAnimatedIcon(): void
    {
        $dto = new DiscordGuildDTO('123', 'MazWorld', 'a_animated_hash', false, 0);

        $this->assertStringContainsString('a_animated_hash.gif', $dto->getIconUrl());
    }

    public function testGetIconUrlReturnsNullWhenNoIcon(): void
    {
        $dto = new DiscordGuildDTO('123', 'MazWorld', null, false, 0);

        $this->assertNull($dto->getIconUrl());
    }
}

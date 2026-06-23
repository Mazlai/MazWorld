<?php

namespace App\Entity;

use App\Repository\ShopItemRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ShopItemRepository::class)]
#[ORM\Table(name: 'shop_items')]
class ShopItem
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 50)]
    private string $item_id;

    #[ORM\Column(type: 'string', length: 20)]
    private string $item_type; // 'background' ou 'badge'

    #[ORM\Column(type: 'string', length: 100)]
    private string $name;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'integer')]
    private int $price;

    #[ORM\Column(type: 'string', length: 20, nullable: true)]
    private ?string $emoji = null;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $available = true;

    // ===== GETTERS & SETTERS =====

    public function getItemId(): string
    {
        return $this->item_id;
    }

    public function setItemId(string $item_id): self
    {
        $this->item_id = $item_id;
        return $this;
    }

    public function getItemType(): string
    {
        return $this->item_type;
    }

    public function setItemType(string $item_type): self
    {
        $this->item_type = $item_type;
        return $this;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public function getPrice(): int
    {
        return $this->price;
    }

    public function setPrice(int $price): self
    {
        $this->price = $price;
        return $this;
    }

    public function getEmoji(): ?string
    {
        return $this->emoji;
    }

    public function setEmoji(?string $emoji): self
    {
        $this->emoji = $emoji;
        return $this;
    }

    public function isAvailable(): bool
    {
        return $this->available;
    }

    public function setAvailable(bool $available): self
    {
        $this->available = $available;
        return $this;
    }

    public function toArray(): array
    {
        return [
            'item_id' => $this->item_id,
            'item_type' => $this->item_type,
            'name' => $this->name,
            'description' => $this->description,
            'price' => $this->price,
            'emoji' => $this->emoji,
            'available' => $this->available,
        ];
    }
}

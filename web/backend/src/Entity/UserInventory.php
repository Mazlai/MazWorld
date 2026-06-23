<?php

namespace App\Entity;

use App\Repository\UserInventoryRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserInventoryRepository::class)]
#[ORM\Table(name: 'user_inventory')]
#[ORM\UniqueConstraint(name: 'unique_user_item', columns: ['user_id', 'item_type', 'item_id'])]
class UserInventory
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'inventory')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'user_id', nullable: false)]
    private User $user;

    #[ORM\Column(type: 'string', length: 20)]
    private string $item_type; // 'background' ou 'badge'

    #[ORM\Column(type: 'string', length: 50)]
    private string $item_id;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $purchased_at;

    public function __construct()
    {
        $this->purchased_at = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function setUser(User $user): self
    {
        $this->user = $user;
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

    public function getItemId(): string
    {
        return $this->item_id;
    }

    public function setItemId(string $item_id): self
    {
        $this->item_id = $item_id;
        return $this;
    }

    public function getPurchasedAt(): \DateTimeInterface
    {
        return $this->purchased_at;
    }

    public function setPurchasedAt(\DateTimeInterface $purchased_at): self
    {
        $this->purchased_at = $purchased_at;
        return $this;
    }
}

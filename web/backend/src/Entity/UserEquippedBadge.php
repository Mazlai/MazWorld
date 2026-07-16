<?php

namespace App\Entity;

use App\Repository\UserEquippedBadgeRepository;
use Doctrine\ORM\Mapping as ORM;
use InvalidArgumentException;

#[ORM\Entity(repositoryClass: UserEquippedBadgeRepository::class)]
#[ORM\Table(name: 'user_equipped_badges')]
class UserEquippedBadge
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'equipped_badges')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'user_id', nullable: false)]
    private User $user;

    #[ORM\Id]
    #[ORM\Column(type: 'smallint')]
    private int $slot_number; // 0-5

    #[ORM\Column(type: 'string', length: 50)]
    private string $badge_id;

    public function getUser(): User
    {
        return $this->user;
    }

    public function setUser(User $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function getSlotNumber(): int
    {
        return $this->slot_number;
    }

    public function setSlotNumber(int $slot_number): self
    {
        if ($slot_number < 0 || $slot_number > 5) {
            throw new InvalidArgumentException('Slot number must be between 0 and 5');
        }
        $this->slot_number = $slot_number;

        return $this;
    }

    public function getBadgeId(): string
    {
        return $this->badge_id;
    }

    public function setBadgeId(string $badge_id): self
    {
        $this->badge_id = $badge_id;

        return $this;
    }
}

<?php

namespace App\Entity;

use App\Repository\UserRepository;
use DateTime;
use DateTimeInterface;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'user_profiles')]
#[ORM\HasLifecycleCallbacks]
class User implements UserInterface
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 20)]
    private string $user_id;

    // ===== INFORMATIONS DISCORD =====

    #[ORM\Column(type: 'string', length: 32)]
    private string $username;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $discord_avatar = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $discord_email = null;

    // ===== JEU =====

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $coins = 0;

    #[ORM\Column(type: 'string', length: 50, options: ['default' => 'default'])]
    private string $equipped_background = 'bg_default';

    #[ORM\Column(type: 'bigint', options: ['default' => 0])]
    private int $last_daily = 0;

    #[ORM\Column(type: 'bigint', options: ['default' => 0])]
    private int $last_work = 0;

    #[ORM\ManyToOne(targetEntity: City::class)]
    #[ORM\JoinColumn(name: 'current_city', referencedColumnName: 'city_id', nullable: false)]
    private City $current_city;

    #[ORM\ManyToOne(targetEntity: City::class)]
    #[ORM\JoinColumn(name: 'traveling_to', referencedColumnName: 'city_id', nullable: true)]
    private ?City $traveling_to = null;

    #[ORM\Column(type: 'bigint', nullable: true)]
    private ?int $arrival_time = null;

    // ===== OAUTH =====

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $oauth_access_token = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $oauth_refresh_token = null;

    #[ORM\Column(type: 'bigint', nullable: true)]
    private ?int $oauth_token_expires_at = null;

    // ===== PERMISSIONS =====

    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $roles = ['ROLE_USER'];

    // ===== TIMESTAMPS =====

    #[ORM\Column(type: 'datetime')]
    private DateTimeInterface $created_at;

    #[ORM\Column(type: 'datetime')]
    private DateTimeInterface $updated_at;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?DateTimeInterface $last_login_at = null;

    // ===== RELATIONS =====

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: UserInventory::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $inventory;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: UserEquippedBadge::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $equipped_badges;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: VisitedCity::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $visited_cities;

    public function __construct()
    {
        $this->inventory = new ArrayCollection();
        $this->equipped_badges = new ArrayCollection();
        $this->visited_cities = new ArrayCollection();
        $this->created_at = new DateTime();
        $this->updated_at = new DateTime();
    }

    #[ORM\PreUpdate]
    public function updateTimestamp(): void
    {
        $this->updated_at = new DateTime();
    }

    // ===== GETTERS & SETTERS =====

    public function getUserId(): string
    {
        return $this->user_id;
    }

    public function setUserId(string $user_id): self
    {
        $this->user_id = $user_id;

        return $this;
    }

    public function getUsername(): string
    {
        return $this->username;
    }

    public function setUsername(string $username): self
    {
        $this->username = $username;

        return $this;
    }

    public function getDiscordAvatar(): ?string
    {
        return $this->discord_avatar;
    }

    public function setDiscordAvatar(?string $discord_avatar): self
    {
        $this->discord_avatar = $discord_avatar;

        return $this;
    }

    public function getDiscordEmail(): ?string
    {
        return $this->discord_email;
    }

    public function setDiscordEmail(?string $discord_email): self
    {
        $this->discord_email = $discord_email;

        return $this;
    }

    public function getCoins(): int
    {
        return $this->coins;
    }

    public function setCoins(int $coins): self
    {
        $this->coins = $coins;

        return $this;
    }

    public function getEquippedBackground(): string
    {
        return $this->equipped_background;
    }

    public function setEquippedBackground(string $equipped_background): self
    {
        $this->equipped_background = $equipped_background;

        return $this;
    }

    public function getLastDaily(): int
    {
        return $this->last_daily;
    }

    public function setLastDaily(int $last_daily): self
    {
        $this->last_daily = $last_daily;

        return $this;
    }

    public function getLastWork(): int
    {
        return $this->last_work;
    }

    public function setLastWork(int $last_work): self
    {
        $this->last_work = $last_work;

        return $this;
    }

    public function getCurrentCity(): City
    {
        return $this->current_city;
    }

    public function setCurrentCity(City $current_city): self
    {
        $this->current_city = $current_city;

        return $this;
    }

    public function getTravelingTo(): ?City
    {
        return $this->traveling_to;
    }

    public function setTravelingTo(?City $traveling_to): self
    {
        $this->traveling_to = $traveling_to;

        return $this;
    }

    public function getArrivalTime(): ?int
    {
        return $this->arrival_time;
    }

    public function setArrivalTime(?int $arrival_time): self
    {
        $this->arrival_time = $arrival_time;

        return $this;
    }

    public function getOauthAccessToken(): ?string
    {
        return $this->oauth_access_token;
    }

    public function setOauthAccessToken(?string $oauth_access_token): self
    {
        $this->oauth_access_token = $oauth_access_token;

        return $this;
    }

    public function getOauthRefreshToken(): ?string
    {
        return $this->oauth_refresh_token;
    }

    public function setOauthRefreshToken(?string $oauth_refresh_token): self
    {
        $this->oauth_refresh_token = $oauth_refresh_token;

        return $this;
    }

    public function getOauthTokenExpiresAt(): ?int
    {
        return $this->oauth_token_expires_at;
    }

    public function setOauthTokenExpiresAt(?int $oauth_token_expires_at): self
    {
        $this->oauth_token_expires_at = $oauth_token_expires_at;

        return $this;
    }

    public function getCreatedAt(): DateTimeInterface
    {
        return $this->created_at;
    }

    public function getUpdatedAt(): DateTimeInterface
    {
        return $this->updated_at;
    }

    public function getLastLoginAt(): ?DateTimeInterface
    {
        return $this->last_login_at;
    }

    public function setLastLoginAt(?DateTimeInterface $last_login_at): self
    {
        $this->last_login_at = $last_login_at;

        return $this;
    }

    // ===== COLLECTIONS =====

    public function getInventory(): Collection
    {
        return $this->inventory;
    }

    public function addInventory(UserInventory $inventory): self
    {
        if (!$this->inventory->contains($inventory)) {
            $this->inventory->add($inventory);
            $inventory->setUser($this);
        }

        return $this;
    }

    public function removeInventory(UserInventory $inventory): self
    {
        $this->inventory->removeElement($inventory);

        return $this;
    }

    public function getEquippedBadges(): Collection
    {
        return $this->equipped_badges;
    }

    public function addEquippedBadge(UserEquippedBadge $badge): self
    {
        if (!$this->equipped_badges->contains($badge)) {
            $this->equipped_badges->add($badge);
            $badge->setUser($this);
        }

        return $this;
    }

    public function removeEquippedBadge(UserEquippedBadge $badge): self
    {
        $this->equipped_badges->removeElement($badge);

        return $this;
    }

    public function getVisitedCities(): Collection
    {
        return $this->visited_cities;
    }

    public function addVisitedCity(VisitedCity $visitedCity): self
    {
        if (!$this->visited_cities->contains($visitedCity)) {
            $this->visited_cities->add($visitedCity);
            $visitedCity->setUser($this);
        }

        return $this;
    }

    public function removeVisitedCity(VisitedCity $visitedCity): self
    {
        $this->visited_cities->removeElement($visitedCity);

        return $this;
    }

    // ===== UserInterface Implementation =====

    public function getRoles(): array
    {
        $roles = $this->roles ?? [];
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    public function setRoles(?array $roles): self
    {
        $this->roles = $roles;

        return $this;
    }

    public function eraseCredentials(): void
    {
    }

    public function getUserIdentifier(): string
    {
        return $this->user_id;
    }

    // ===== HELPER METHODS =====

    public function getAvatarUrl(?int $size = 128): string
    {
        if ($this->discord_avatar) {
            $extension = str_starts_with($this->discord_avatar, 'a_') ? 'gif' : 'png';

            return "https://cdn.discordapp.com/avatars/{$this->user_id}/{$this->discord_avatar}.{$extension}?size={$size}";
        }

        $defaultAvatar = (int) $this->user_id % 5;

        return "https://cdn.discordapp.com/embed/avatars/{$defaultAvatar}.png";
    }

    public function recordLogin(): self
    {
        $this->last_login_at = new DateTime();

        return $this;
    }

    public function isAccessTokenExpired(): bool
    {
        if (!$this->oauth_token_expires_at) {
            return true;
        }

        return time() >= $this->oauth_token_expires_at;
    }

    public function toArray(): array
    {
        return [
            'user_id' => $this->user_id,
            'username' => $this->username,
            'discord_avatar' => $this->discord_avatar,
            'discord_email' => $this->discord_email,
            'coins' => $this->coins,
            'current_city' => $this->current_city->getCityId(),
            'equipped_background' => $this->equipped_background,
            'avatar_url' => $this->getAvatarUrl(),
            'roles' => $this->getRoles(),
        ];
    }
}

<?php

namespace App\Entity;

use App\Repository\CityRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CityRepository::class)]
#[ORM\Table(name: 'cities')]
class City
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 50)]
    private string $city_id;

    #[ORM\Column(type: 'string', length: 100)]
    private string $name;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'string', length: 20, nullable: true)]
    private ?string $emoji = null;

    #[ORM\Column(type: 'string', length: 50, nullable: true)]
    private ?string $theme = null;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $position_x = 0;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $position_y = 0;

    // ===== RELATIONS =====

    #[ORM\OneToMany(mappedBy: 'city_from', targetEntity: Route::class)]
    private Collection $routes_from;

    #[ORM\OneToMany(mappedBy: 'city_to', targetEntity: Route::class)]
    private Collection $routes_to;

    #[ORM\OneToMany(mappedBy: 'city', targetEntity: CityJob::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $jobs;

    #[ORM\OneToMany(mappedBy: 'city', targetEntity: VisitedCity::class)]
    private Collection $visitors;

    public function __construct()
    {
        $this->routes_from = new ArrayCollection();
        $this->routes_to = new ArrayCollection();
        $this->jobs = new ArrayCollection();
        $this->visitors = new ArrayCollection();
    }

    // ===== GETTERS & SETTERS =====

    public function getCityId(): string
    {
        return $this->city_id;
    }

    public function setCityId(string $city_id): self
    {
        $this->city_id = $city_id;
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

    public function getEmoji(): ?string
    {
        return $this->emoji;
    }

    public function setEmoji(?string $emoji): self
    {
        $this->emoji = $emoji;
        return $this;
    }

    public function getTheme(): ?string
    {
        return $this->theme;
    }

    public function setTheme(?string $theme): self
    {
        $this->theme = $theme;
        return $this;
    }

    public function getPositionX(): int
    {
        return $this->position_x;
    }

    public function setPositionX(int $position_x): self
    {
        $this->position_x = $position_x;
        return $this;
    }

    public function getPositionY(): int
    {
        return $this->position_y;
    }

    public function setPositionY(int $position_y): self
    {
        $this->position_y = $position_y;
        return $this;
    }

    // ===== COLLECTIONS =====

    public function getRoutesFrom(): Collection
    {
        return $this->routes_from;
    }

    public function getRoutesTo(): Collection
    {
        return $this->routes_to;
    }

    public function getJobs(): Collection
    {
        return $this->jobs;
    }

    public function addJob(CityJob $job): self
    {
        if (!$this->jobs->contains($job)) {
            $this->jobs->add($job);
            $job->setCity($this);
        }
        return $this;
    }

    public function removeJob(CityJob $job): self
    {
        $this->jobs->removeElement($job);
        return $this;
    }

    public function getVisitors(): Collection
    {
        return $this->visitors;
    }

    // ===== HELPER METHODS =====

    public function toArray(): array
    {
        return [
            'city_id' => $this->city_id,
            'name' => $this->name,
            'description' => $this->description,
            'emoji' => $this->emoji,
            'theme' => $this->theme,
            'position_x' => $this->position_x,
            'position_y' => $this->position_y,
        ];
    }
}

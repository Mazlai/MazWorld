<?php

namespace App\Entity;

use App\Repository\RouteRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RouteRepository::class)]
#[ORM\Table(name: 'routes')]
#[ORM\UniqueConstraint(name: 'unique_route', columns: ['city_from_id', 'city_to_id'])]
class Route
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $route_id = null;

    #[ORM\ManyToOne(targetEntity: City::class, inversedBy: 'routes_from')]
    #[ORM\JoinColumn(name: 'city_from_id', referencedColumnName: 'city_id', nullable: false)]
    private City $city_from;

    #[ORM\ManyToOne(targetEntity: City::class, inversedBy: 'routes_to')]
    #[ORM\JoinColumn(name: 'city_to_id', referencedColumnName: 'city_id', nullable: false)]
    private City $city_to;

    #[ORM\Column(type: 'integer')]
    private int $cost;

    #[ORM\Column(type: 'integer')]
    private int $duration;

    // ===== GETTERS & SETTERS =====

    public function getRouteId(): ?int
    {
        return $this->route_id;
    }

    public function getCityFrom(): City
    {
        return $this->city_from;
    }

    public function setCityFrom(City $city_from): self
    {
        $this->city_from = $city_from;

        return $this;
    }

    public function getCityTo(): City
    {
        return $this->city_to;
    }

    public function setCityTo(City $city_to): self
    {
        $this->city_to = $city_to;

        return $this;
    }

    public function getCost(): int
    {
        return $this->cost;
    }

    public function setCost(int $cost): self
    {
        $this->cost = $cost;

        return $this;
    }

    public function getDuration(): int
    {
        return $this->duration;
    }

    public function setDuration(int $duration): self
    {
        $this->duration = $duration;

        return $this;
    }

    // ===== HELPER METHODS =====

    public function toArray(): array
    {
        return [
            'route_id' => $this->route_id,
            'city_from' => $this->city_from->getCityId(),
            'city_to' => $this->city_to->getCityId(),
            'cost' => $this->cost,
            'duration' => $this->duration,
        ];
    }
}

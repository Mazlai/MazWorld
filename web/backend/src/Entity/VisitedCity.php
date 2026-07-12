<?php

namespace App\Entity;

use App\Repository\VisitedCityRepository;
use DateTime;
use DateTimeInterface;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: VisitedCityRepository::class)]
#[ORM\Table(name: 'visited_cities')]
class VisitedCity
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'visited_cities')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'user_id', nullable: false)]
    private User $user;

    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: City::class, inversedBy: 'visitors')]
    #[ORM\JoinColumn(name: 'city_id', referencedColumnName: 'city_id', nullable: false)]
    private City $city;

    #[ORM\Column(type: 'datetime')]
    private DateTimeInterface $first_visit;

    public function __construct()
    {
        $this->first_visit = new DateTime();
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

    public function getCity(): City
    {
        return $this->city;
    }

    public function setCity(City $city): self
    {
        $this->city = $city;

        return $this;
    }

    public function getFirstVisit(): DateTimeInterface
    {
        return $this->first_visit;
    }

    public function setFirstVisit(DateTimeInterface $first_visit): self
    {
        $this->first_visit = $first_visit;

        return $this;
    }
}

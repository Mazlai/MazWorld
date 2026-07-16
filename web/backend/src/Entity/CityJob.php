<?php

namespace App\Entity;

use App\Repository\CityJobRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CityJobRepository::class)]
#[ORM\Table(name: 'city_jobs')]
#[ORM\UniqueConstraint(name: 'unique_city_job', columns: ['city_id', 'job_name'])]
class CityJob
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $job_id = null;

    #[ORM\ManyToOne(targetEntity: City::class, inversedBy: 'jobs')]
    #[ORM\JoinColumn(name: 'city_id', referencedColumnName: 'city_id', nullable: false)]
    private City $city;

    #[ORM\Column(type: 'string', length: 100)]
    private string $job_name;

    #[ORM\Column(type: 'string', length: 20)]
    private string $job_emoji;

    #[ORM\Column(type: 'string', length: 255)]
    private string $task_1;

    #[ORM\Column(type: 'string', length: 255)]
    private string $task_2;

    #[ORM\Column(type: 'string', length: 255)]
    private string $task_3;

    // ===== GETTERS & SETTERS =====

    public function getJobId(): ?int
    {
        return $this->job_id;
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

    public function getJobName(): string
    {
        return $this->job_name;
    }

    public function setJobName(string $job_name): self
    {
        $this->job_name = $job_name;

        return $this;
    }

    public function getJobEmoji(): string
    {
        return $this->job_emoji;
    }

    public function setJobEmoji(string $job_emoji): self
    {
        $this->job_emoji = $job_emoji;

        return $this;
    }

    public function getTask1(): string
    {
        return $this->task_1;
    }

    public function setTask1(string $task_1): self
    {
        $this->task_1 = $task_1;

        return $this;
    }

    public function getTask2(): string
    {
        return $this->task_2;
    }

    public function setTask2(string $task_2): self
    {
        $this->task_2 = $task_2;

        return $this;
    }

    public function getTask3(): string
    {
        return $this->task_3;
    }

    public function setTask3(string $task_3): self
    {
        $this->task_3 = $task_3;

        return $this;
    }

    // ===== HELPER METHODS =====

    public function toArray(): array
    {
        return [
            'job_id' => $this->job_id,
            'city_id' => $this->city->getCityId(),
            'name' => $this->job_name,
            'emoji' => $this->job_emoji,
            'task_1' => $this->task_1,
            'task_2' => $this->task_2,
            'task_3' => $this->task_3,
        ];
    }
}

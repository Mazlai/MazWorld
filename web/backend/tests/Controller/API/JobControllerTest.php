<?php

namespace App\Tests\Controller\API;

use PHPUnit\Framework\Attributes\Group;
#[Group('integration')]
class JobControllerTest extends AbstractApiWebTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $user = $this->createTestUser();
        $this->auth($user);
    }

    // ===== GET /api/jobs =====

    public function testJobsListReturns18JobsFromFixtures(): void
    {
        $this->get('/api/jobs');

        $this->assertSame(200, $this->statusCode());
        $jobs = $this->json();
        $this->assertCount(18, $jobs); // 6 villes × 3 jobs chacune
    }

    public function testJobsListItemsHaveCityInfo(): void
    {
        $this->get('/api/jobs');

        $job = $this->json()[0];
        $this->assertArrayHasKey('job_id', $job);
        $this->assertArrayHasKey('name', $job);
        $this->assertArrayHasKey('emoji', $job);
        $this->assertArrayHasKey('city_id', $job);
        $this->assertArrayHasKey('city_name', $job);
        $this->assertArrayHasKey('city_theme', $job);
    }

    // ===== GET /api/jobs/{jobId} =====

    public function testJobsShowReturnsJobWithCityDescription(): void
    {
        $jobId = $this->em->getConnection()->fetchOne('SELECT job_id FROM city_jobs LIMIT 1');
        $this->assertNotFalse($jobId, 'Au moins un job doit exister en base de test.');

        $this->get('/api/jobs/' . $jobId);

        $this->assertSame(200, $this->statusCode());
        $job = $this->json();
        $this->assertArrayHasKey('job_id', $job);
        $this->assertArrayHasKey('name', $job);
        $this->assertArrayHasKey('city_description', $job);
    }

    public function testJobsShowNonExistentReturns404(): void
    {
        $this->get('/api/jobs/999999');
        $this->assertSame(404, $this->statusCode());
    }

    // ===== GET /api/jobs/theme/{theme} =====

    public function testJobsByThemeFiltersJobsByTheme(): void
    {
        // Thème 'nature' = Willowbrook avec 3 jobs
        $this->get('/api/jobs/theme/nature');

        $this->assertSame(200, $this->statusCode());
        $jobs = $this->json();
        $this->assertCount(3, $jobs);
        foreach ($jobs as $job) {
            $this->assertSame('willowbrook', $job['city_id']);
        }
    }

    public function testJobsByNonExistentThemeReturnsEmptyArray(): void
    {
        $this->get('/api/jobs/theme/nonexistent_theme_xyz');

        $this->assertSame(200, $this->statusCode());
        $this->assertSame([], $this->json());
    }
}

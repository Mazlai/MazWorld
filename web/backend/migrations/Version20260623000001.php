<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260623000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Initial schema: cities, routes, shop_items, user_profiles, user_inventory, user_equipped_badges, visited_cities';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE cities (city_id VARCHAR(50) NOT NULL, name VARCHAR(100) NOT NULL, description LONGTEXT DEFAULT NULL, emoji VARCHAR(20) DEFAULT NULL, theme VARCHAR(50) DEFAULT NULL, position_x INT DEFAULT 0 NOT NULL, position_y INT DEFAULT 0 NOT NULL, PRIMARY KEY (city_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE city_jobs (job_id INT AUTO_INCREMENT NOT NULL, job_name VARCHAR(100) NOT NULL, job_emoji VARCHAR(20) NOT NULL, task_1 VARCHAR(255) NOT NULL, task_2 VARCHAR(255) NOT NULL, task_3 VARCHAR(255) NOT NULL, city_id VARCHAR(50) NOT NULL, INDEX IDX_4BDD50AD8BAC62AF (city_id), UNIQUE INDEX unique_city_job (city_id, job_name), PRIMARY KEY (job_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE routes (route_id INT AUTO_INCREMENT NOT NULL, cost INT NOT NULL, duration INT NOT NULL, city_from_id VARCHAR(50) NOT NULL, city_to_id VARCHAR(50) NOT NULL, INDEX IDX_32D5C2B3C5866759 (city_from_id), INDEX IDX_32D5C2B373BFED32 (city_to_id), UNIQUE INDEX unique_route (city_from_id, city_to_id), PRIMARY KEY (route_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE shop_items (item_id VARCHAR(50) NOT NULL, item_type VARCHAR(20) NOT NULL, name VARCHAR(100) NOT NULL, description LONGTEXT DEFAULT NULL, price INT NOT NULL, emoji VARCHAR(20) DEFAULT NULL, available TINYINT DEFAULT 1 NOT NULL, PRIMARY KEY (item_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE user_equipped_badges (slot_number SMALLINT NOT NULL, badge_id VARCHAR(50) NOT NULL, user_id VARCHAR(20) NOT NULL, INDEX IDX_8761899BA76ED395 (user_id), PRIMARY KEY (user_id, slot_number)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE user_inventory (id INT AUTO_INCREMENT NOT NULL, item_type VARCHAR(20) NOT NULL, item_id VARCHAR(50) NOT NULL, purchased_at DATETIME NOT NULL, user_id VARCHAR(20) NOT NULL, INDEX IDX_B1CDC7D2A76ED395 (user_id), UNIQUE INDEX unique_user_item (user_id, item_type, item_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE user_profiles (user_id VARCHAR(20) NOT NULL, username VARCHAR(32) NOT NULL, discord_avatar VARCHAR(100) DEFAULT NULL, discord_email VARCHAR(255) DEFAULT NULL, coins INT DEFAULT 0 NOT NULL, equipped_background VARCHAR(50) DEFAULT \'bg_default\' NOT NULL, last_daily BIGINT DEFAULT 0 NOT NULL, last_work BIGINT DEFAULT 0 NOT NULL, arrival_time BIGINT DEFAULT NULL, oauth_access_token LONGTEXT DEFAULT NULL, oauth_refresh_token LONGTEXT DEFAULT NULL, oauth_token_expires_at BIGINT DEFAULT NULL, roles JSON DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, last_login_at DATETIME DEFAULT NULL, current_city VARCHAR(50) NOT NULL, traveling_to VARCHAR(50) DEFAULT NULL, INDEX IDX_6BBD6130E2E86B52 (current_city), INDEX IDX_6BBD6130CDE03B3B (traveling_to), PRIMARY KEY (user_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE visited_cities (first_visit DATETIME NOT NULL, user_id VARCHAR(20) NOT NULL, city_id VARCHAR(50) NOT NULL, INDEX IDX_32C86CE5A76ED395 (user_id), INDEX IDX_32C86CE58BAC62AF (city_id), PRIMARY KEY (user_id, city_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('ALTER TABLE city_jobs ADD CONSTRAINT FK_4BDD50AD8BAC62AF FOREIGN KEY (city_id) REFERENCES cities (city_id)');
        $this->addSql('ALTER TABLE routes ADD CONSTRAINT FK_32D5C2B3C5866759 FOREIGN KEY (city_from_id) REFERENCES cities (city_id)');
        $this->addSql('ALTER TABLE routes ADD CONSTRAINT FK_32D5C2B373BFED32 FOREIGN KEY (city_to_id) REFERENCES cities (city_id)');
        $this->addSql('ALTER TABLE user_equipped_badges ADD CONSTRAINT FK_8761899BA76ED395 FOREIGN KEY (user_id) REFERENCES user_profiles (user_id)');
        $this->addSql('ALTER TABLE user_inventory ADD CONSTRAINT FK_B1CDC7D2A76ED395 FOREIGN KEY (user_id) REFERENCES user_profiles (user_id)');
        $this->addSql('ALTER TABLE user_profiles ADD CONSTRAINT FK_6BBD6130E2E86B52 FOREIGN KEY (current_city) REFERENCES cities (city_id)');
        $this->addSql('ALTER TABLE user_profiles ADD CONSTRAINT FK_6BBD6130CDE03B3B FOREIGN KEY (traveling_to) REFERENCES cities (city_id)');
        $this->addSql('ALTER TABLE visited_cities ADD CONSTRAINT FK_32C86CE5A76ED395 FOREIGN KEY (user_id) REFERENCES user_profiles (user_id)');
        $this->addSql('ALTER TABLE visited_cities ADD CONSTRAINT FK_32C86CE58BAC62AF FOREIGN KEY (city_id) REFERENCES cities (city_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE city_jobs DROP FOREIGN KEY FK_4BDD50AD8BAC62AF');
        $this->addSql('ALTER TABLE routes DROP FOREIGN KEY FK_32D5C2B3C5866759');
        $this->addSql('ALTER TABLE routes DROP FOREIGN KEY FK_32D5C2B373BFED32');
        $this->addSql('ALTER TABLE user_equipped_badges DROP FOREIGN KEY FK_8761899BA76ED395');
        $this->addSql('ALTER TABLE user_inventory DROP FOREIGN KEY FK_B1CDC7D2A76ED395');
        $this->addSql('ALTER TABLE user_profiles DROP FOREIGN KEY FK_6BBD6130E2E86B52');
        $this->addSql('ALTER TABLE user_profiles DROP FOREIGN KEY FK_6BBD6130CDE03B3B');
        $this->addSql('ALTER TABLE visited_cities DROP FOREIGN KEY FK_32C86CE5A76ED395');
        $this->addSql('ALTER TABLE visited_cities DROP FOREIGN KEY FK_32C86CE58BAC62AF');
        $this->addSql('DROP TABLE cities');
        $this->addSql('DROP TABLE city_jobs');
        $this->addSql('DROP TABLE routes');
        $this->addSql('DROP TABLE shop_items');
        $this->addSql('DROP TABLE user_equipped_badges');
        $this->addSql('DROP TABLE user_inventory');
        $this->addSql('DROP TABLE user_profiles');
        $this->addSql('DROP TABLE visited_cities');
    }
}

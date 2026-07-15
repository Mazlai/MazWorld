#!/bin/sh
set -e

cd /var/www

if [ ! -f vendor/autoload.php ]; then
    composer install --prefer-dist --no-interaction
fi

if [ ! -f config/jwt/private.pem ]; then
    php bin/console lexik:jwt:generate-keypair --skip-if-exists --no-interaction
fi

echo "Waiting for database..."
until php bin/console dbal:run-sql "SELECT 1" > /dev/null 2>&1; do
    sleep 1
done

php bin/console doctrine:migrations:migrate --no-interaction

if [ "$APP_ENV" = "dev" ] && [ ! -f var/.fixtures_loaded ]; then
    php bin/console doctrine:fixtures:load --no-interaction
    touch var/.fixtures_loaded
fi

if [ "$APP_ENV" = "prod" ]; then
    php bin/console cache:clear --no-warmup
    php bin/console cache:warmup
    php bin/console assets:install public --no-interaction
fi

exec "$@"

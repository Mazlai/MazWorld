#!/bin/sh
set -e

cd /var/www

touch .env

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

if [ "$APP_ENV" = "dev" ]; then
    CITY_COUNT=$(php bin/console dbal:run-sql "SELECT COUNT(*) as c FROM cities" 2>/dev/null | grep -oE '[0-9]+' | tail -1)
    if [ "${CITY_COUNT:-0}" = "0" ]; then
        php bin/console doctrine:fixtures:load --no-interaction
    fi
fi

if [ "$APP_ENV" = "prod" ]; then
    php bin/console cache:clear --no-warmup
    php bin/console cache:warmup
    php bin/console assets:install public --no-interaction
fi

exec "$@"

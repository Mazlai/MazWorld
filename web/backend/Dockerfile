# syntax=docker/dockerfile:1

FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock symfony.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

FROM php:8.2-fpm-alpine AS php_base
RUN apk add --no-cache icu-libs \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS icu-dev \
    && docker-php-ext-install pdo_mysql intl opcache \
    && apk del .build-deps
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
WORKDIR /var/www
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]

FROM php_base AS prod
ENV APP_ENV=prod
COPY docker/opcache.ini /usr/local/etc/php/conf.d/zz-opcache.ini
COPY --from=vendor /app/vendor ./vendor
COPY . .
RUN composer dump-autoload --classmap-authoritative --no-dev \
    && mkdir -p var/cache var/log config/jwt \
    && chown -R www-data:www-data var config/jwt

FROM php_base AS dev
ENV APP_ENV=dev
COPY composer.json composer.lock symfony.lock ./
RUN composer install --no-scripts --no-autoloader --prefer-dist --no-interaction

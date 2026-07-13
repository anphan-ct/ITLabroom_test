# Development image for IT_lab_room Laravel backend
FROM php:8.3-fpm

ARG user=itlab
ARG uid=1000

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/tmp/composer \
    COMPOSER_CACHE_DIR=/tmp/composer-cache

# System packages and PHP extensions required by Laravel 12
RUN apt-get update && apt-get install -y \
    bash \
    curl \
    git \
    unzip \
    zip \
    libcurl4-openssl-dev \
    libicu-dev \
    libonig-dev \
    libpng-dev \
    libxml2-dev \
    libzip-dev \
    default-mysql-client \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        exif \
        intl \
        mbstring \
        opcache \
        pcntl \
        pdo \
        pdo_mysql \
        sockets \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Create non-root user matching host UID for bind-mounted source code
RUN useradd -G www-data,root -u ${uid} -d /home/${user} -m ${user} \
    && mkdir -p /tmp/composer /tmp/composer-cache \
    && chown -R ${user}:${user} /home/${user} /tmp/composer /tmp/composer-cache

WORKDIR /var/www/html

# PHP-FPM runs as the project user in development
RUN sed -i "s/^user = www-data/user = ${user}/" /usr/local/etc/php-fpm.d/www.conf \
    && sed -i "s/^group = www-data/group = ${user}/" /usr/local/etc/php-fpm.d/www.conf

USER ${user}

EXPOSE 9000

CMD ["php-fpm"]

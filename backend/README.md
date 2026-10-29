# OphtaCare · API

API REST Laravel 12 d'OphtaCare. Installation, comptes de démonstration et architecture : voir le [README du projet](../README.md).

```bash
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
php artisan db:seed --class=DemoSeeder   # optionnel
php artisan serve
```

Routes : `php artisan route:list --path=api`.

# Stack profile: PHP (Laravel / Symfony / WordPress / plain)

Run tools through the project first (`vendor/bin/...`, `composer` scripts). If a tool is missing, say so and fall back to Grep; don't install anything without asking.

Excluded: `vendor/`, `storage/`, `bootstrap/cache/`, `var/`, `public/build/`, `wp-content/uploads/`, `wp-includes/`, `wp-admin/`, third-party plugins/themes.

| Domain | Tools (prefer what exists) | Notes |
|---|---|---|
| types | `vendor/bin/phpstan analyse --error-format=json`, `psalm --output-format=json` | Missing `declare(strict_types=1)`, untyped params/returns/properties, `mixed`, `@var` casts, `@phpstan-ignore`/`@psalm-suppress` without reason, arrays instead of DTOs at boundaries |
| dead | phpstan (unused), `composer-unused`, Grep | Unused private methods, unrouted controllers, unregistered hooks, `var_dump`/`dd`/`dump`/`ray`/`error_log` left in code |
| deps | `composer audit --format=json`, `composer outdated --direct --format=json`, `composer validate` | `abandoned` packages, dev packages in `require`, missing `composer.lock` in apps |
| tests | `vendor/bin/phpunit` / `pest` (`--coverage-text` if Xdebug/PCOV present) | `markTestSkipped`, assert-free tests, `sleep()` |
| secrets | `gitleaks`, Grep | `.env` committed, real values in `.env.example`, keys in `config/*.php` or `wp-config.php` |
| arch | Grep `use` statements, `deptrac` if configured | Fat controllers, queries in views/Blade/templates, business logic in models/hooks, `$_GET`/`$_POST` deep in domain code |
| naming | `pint --test`, `php-cs-fixer fix --dry-run` | PSR-1/PSR-12: `StudlyCaps` classes, `camelCase` methods, one class per file matching PSR-4 path. WordPress: snake_case + prefix per WPCS |
| size | `scripts/measure.mjs` | Blade/Twig templates count as UI templates |

Framework conventions: Laravel (Controllers → Actions/Services, FormRequest validation, Eloquent only in models/repos), Symfony (services via DI, no container lookups), WordPress (prefix everything, escape output, nonces + capability checks).

Verify after fixes: `phpstan` → `pint --test`/`php-cs-fixer --dry-run` → `phpunit`/`pest`.

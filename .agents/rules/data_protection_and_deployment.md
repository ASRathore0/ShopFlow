# ShopFlow Production Safety & Zero Data Loss Policy

## 🔒 1. Absolute Rule: Never Wipe Production Data
- **NEVER** run `php artisan migrate:fresh` on production or Hostinger.
- **NEVER** run `php artisan db:wipe` on production.
- **NEVER** run `php artisan migrate:reset` or `migrate:rollback` across all tables on production.
- Only run non-destructive migrations: `php artisan migrate --force`.

## 📦 2. Safe Schema Migrations
- **Never edit old/historical migration files** that have already been executed on the live server.
- When introducing schema changes, **always generate a new migration file**:
  `php artisan make:migration add_<field>_to_<table>_table --table=<table>`
- All new columns on existing tables must be either:
  - `->nullable()`
  - or provide a safe default: `->default(...)`
  This guarantees existing records belonging to shop owners, super admins, products, orders, and requests do not break.

## 🖼️ 3. Uploaded Files and Media Protection
- All files uploaded by shop owners and customers reside in:
  - `public/uploads/` (products, logos, avatars)
  - `storage/app/public/`
- The deployment pipeline (`.github/workflows/deploy.yml`) MUST ALWAYS exclude:
  - `/.env*`
  - `/uploads/***`
  - `/public/uploads/***`
  - `/storage/app/***`
- Never run `rsync --delete` against upload directories.

## 🧪 4. Local Development vs Live Production Isolation
- Local development runs against local databases (`XAMPP` MySQL / localhost).
- Changes are pushed to `main` branch only after verifying they compile cleanly with `npm run build` and `php artisan test` (or local manual checks).
- GitHub Actions handles zero-downtime, non-destructive synchronization to Hostinger.

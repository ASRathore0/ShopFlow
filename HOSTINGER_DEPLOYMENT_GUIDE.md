# 🚀 ShopFlow: Auto-Deployment from GitHub to Hostinger (Zero-Rebuild Setup)

This guide sets up **Automated Continuous Deployment** so every time you run `git push origin main`, your website updates automatically on Hostinger **in under 60 seconds without ever rebuilding on Hostinger**.

---

## 💡 Why This Is the Best Way (No Hostinger Rebuilds)

| Traditional Way (Slow & Breaks) | Our GitHub Actions Setup (Best Practice) |
|---|---|
| Runs `npm run build` on Hostinger shared server. | Runs `npm run build` on **GitHub's powerful cloud runners**. |
| Hits Hostinger RAM/CPU limits & crashes. | Zero server load on Hostinger; instant upload. |
| Takes 5–10 minutes per deployment. | Deploys pre-built production files in **~45 seconds**. |
| Needs Node.js installed & maintained on Hostinger. | Hostinger only needs standard PHP & MySQL. |

---

## 🔐 Your Exact Hostinger Details (From Your Screenshot)

From your Hostinger **SSH Access** screen:
- **IP**: `82.25.107.63`
- **Port**: `65002`
- **Username**: `u604295259`
- **Password**: *(The password you set when clicking "Change")*

---

## 🔑 GitHub Secrets to Set in Your Repository

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**:

| Secret Name | Exact Value to Enter |
|---|---|
| `HOSTINGER_SSH_PASSWORD` | Your Hostinger SSH Password (click "Change" in screenshot if you need to set/reset it) |
| `HOSTINGER_SSH_HOST` | `82.25.107.63` |
| `HOSTINGER_SSH_USER` | `u604295259` |
| `HOSTINGER_SSH_PORT` | `65002` |
| `HOSTINGER_REMOTE_PATH` | `public_html/` *(or `domains/yourdomain.com/public_html/` if using multiple domains)* |
| `VITE_API_URL` | `/api` |


---

## 🗄️ Step 3: Configure Database & `.env` on Hostinger Once

Before the first deployment:

1. In Hostinger **hPanel** → **Databases** → **MySQL Databases**:
   - Create a database: e.g. `u123456789_shopflow`
   - Create a user & password.
2. In Hostinger **hPanel** → **File Manager**:
   - Navigate to your domain folder: `domains/yourdomain.com/public_html/`
   - Create a file named `.env` and copy the contents from [backend/.env.production.example](file:///c:/Mamp/htdocs/Shoppers/backend/.env.production.example).
   - Set your `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, and `APP_URL=https://yourdomain.com`.
   - Set `APP_KEY` (you can generate one with `php artisan key:generate --show`).

---

## 🚀 Step 4: How to Deploy

That's it! From now on, whenever you push code:

```bash
git add .
git commit -m "Updated mobile view and auto-deployment"
git push origin main
```

### What Happens Automatically:
1. GitHub Actions wakes up.
2. Node.js 20 compiles the React frontend into minified production HTML/CSS/JS in `frontend/dist`.
3. PHP 8.2 runs `composer install --no-dev --optimize-autoloader`.
4. The compiled frontend assets are merged into Laravel's `public/` directory.
5. Rsync uploads only changed files to Hostinger in seconds.
6. GitHub runs `php artisan migrate --force` and caches routes/views on Hostinger.

You can watch the live progress under the **Actions** tab in your GitHub repository!

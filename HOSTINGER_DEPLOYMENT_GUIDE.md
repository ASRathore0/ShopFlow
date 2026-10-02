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

## 🛠️ Step 1: Get SSH Credentials from Hostinger

1. Log into your **Hostinger hPanel**.
2. Select your hosting plan and go to **Advanced** → **SSH Access**.
3. If SSH is disabled, click **Enable**.
4. Note down:
   - **SSH IP / Host**: (e.g., `185.199.108.153` or `connect.hostinger.com`)
   - **SSH Username**: (e.g., `u123456789`)
   - **SSH Port**: (Usually `65002` on Hostinger)
   - **SSH Password**: Your Hostinger account/SSH password.

### (Optional but Recommended) Generate an SSH Key:
If you prefer SSH keys over passwords:
In your terminal, generate a key:
```bash
ssh-keygen -t ed25519 -C "github-actions-hostinger" -f hostinger_deploy_key
```
1. Add the **Public Key** (`hostinger_deploy_key.pub`) to Hostinger: **hPanel** → **SSH Access** → **SSH Keys** → **Add SSH Key**.
2. Keep the **Private Key** (`hostinger_deploy_key`) for GitHub Secrets in Step 2.

---

## 🔐 Step 2: Add Secrets to Your GitHub Repository

1. Open your GitHub repository in your browser.
2. Go to **Settings** → **Secrets and variables** → **Actions**.
3. Click **New repository secret** and add the following 4 secrets:

| Secret Name | Value Example | Explanation |
|---|---|---|
| `HOSTINGER_SSH_HOST` | `185.199.108.153` | Your Hostinger server IP or hostname |
| `HOSTINGER_SSH_USER` | `u123456789` | Your Hostinger SSH username |
| `HOSTINGER_SSH_PORT` | `65002` | Hostinger SSH port (default `65002`) |
| `HOSTINGER_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY...` | The entire content of your private key file |
| `HOSTINGER_REMOTE_PATH` | `domains/yourdomain.com/public_html/` | Path to your website root in Hostinger |
| `VITE_API_URL` | `/api` | Production API prefix (default: `/api`) |

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

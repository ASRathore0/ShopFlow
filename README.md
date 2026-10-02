# ShopFlow - Smart Physical-Shop Management & Customer Assistance Platform

**ShopFlow** is a modern SaaS platform designed specifically for physical retail shops. It eliminates crowded customer friction, reduces unnecessary staff movement, provides instant in-store micro-location navigation (Floor, Section, Aisle, Rack, Shelf, Bin, Position), and captures real-time customer demand analytics.

---

## ⚡ Core Problem Solved

In busy physical shops (electronics, apparel, footwear, supermarkets):
- Customers cannot easily find the product model or variant they want.
- Shop employees are often busy or interrupted repeatedly with location inquiries (*"Where is size M?", "Where is the black 256GB model?"*).
- Staff waste time walking around looking for items.
- Inventory systems know quantities but are disconnected from physical shelf coordinates.

**ShopFlow connects shoppers, store associates, and physical shelf coordinates:**
1. Customer enters shop and scans entrance QR code on their phone (**Zero app download required**).
2. Customer searches or browses catalog, checks live showroom stock, and selects their preferred variant.
3. Customer taps **"SHOW ME THIS PRODUCT"**.
4. The system immediately creates a priority request and dispatches it to available floor staff with the **exact physical location breadcrumb** (`Floor 1 → Section: Laptops → Aisle A3 → Rack R07 → Shelf S04 → Position 12`).
5. Staff accepts, navigates directly to the shelf, marks **Product Found**, and brings the product to the customer.

---

## 🏗 Architecture & Tech Stack

```
/Shoppers
  ├── /frontend                 # React 19 + Vite + Tailwind CSS + Lucide Icons + Recharts
  │     ├── src/components      # Reusable UI (ProductGrid, LocationBreadcrumb, Blueprint Map, etc.)
  │     ├── src/pages           # LandingPage, CustomerPortal, StaffDashboard, AdminDashboard, SuperAdmin
  │     ├── src/context         # AuthContext (Sanctum), CustomerContext (Anonymous Sessions)
  │     └── src/services        # Axios API clients for Public, Staff, Admin, SuperAdmin
  └── /backend                  # Laravel 11 REST API + Laravel Sanctum + MySQL
        ├── app/Models          # Eloquent Models & Full Relationships
        ├── app/Http/Controllers/Api # REST API Controllers
        ├── database/migrations # 14 Database Schema Migrations
        └── database/seeders    # DatabaseSeeder with realistic retail demo data
```

### Technology Highlights
- **Frontend**: React 19, Vite 5, Tailwind CSS, Lucide React, Recharts, `qrcode.react`.
- **Backend**: Laravel 11, Laravel Sanctum, PHP 8.2, MySQL 8.
- **Multi-Tenant Architecture**: Multi-shop support with tenant-isolated products, staff, locations, requests, and settings.
- **Privacy First**: Anonymous customer session codes (`CUS-A92K`). No mandatory customer account registration before browsing or asking for assistance.

---

## 🚀 Demo Accounts & Credentials

| Role | Email | Password | Access URL | Description |
|---|---|---|---|---|
| **Floor Staff** | `staff@example.com` | `password` | `/staff` | Rahul Sharma (Floor Staff - Laptops & Mobiles) |
| **Store Manager** | `amit@example.com` | `password` | `/staff` | Amit Kumar (Store Manager - All Floors) |
| **Shop Owner** | `shopowner@example.com` | `password` | `/admin` | Vikram Mehta (ABC Electronics Store Owner) |
| **Platform Super Admin** | `admin@shopflow.com` | `password` | `/super-admin` | Platform Super-Admin (Tenant & Plan Oversight) |
| **Shopper / Customer** | *No login needed* | *No login needed* | `/shop/abc-electronics` | Mobile customer showroom portal |

*(Note: The login page at `/login` includes 1-click test buttons for all demo roles).*

---

## 🛠 Installation & Setup

### 1. Requirements
- PHP 8.2 or higher (with `pdo_mysql`, `mbstring`, `openssl`, `curl`)
- Composer 2.x
- Node.js 18+ and npm
- MySQL / MariaDB Server running on port 3306

---

### 2. Backend Setup (Laravel)

```bash
cd backend

# 1. Install dependencies
composer install

# 2. Configure Environment (.env)
# Verify database connection parameters:
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=shopflow
DB_USERNAME=root
DB_PASSWORD=
DB_COLLATION=utf8mb4_unicode_ci

# 3. Generate App Key
php artisan key:generate

# 4. Run Migrations & Seeders
php artisan migrate:fresh --seed

# 5. Start Laravel Server
php artisan serve --port=8000
```

Backend will be running at `http://127.0.0.1:8000`.

---

### 3. Frontend Setup (React + Vite)

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Verify environment configuration (.env)
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=ShopFlow

# 3. Start Vite Dev Server
npx vite --host 0.0.0.0 --port 5173
```

Frontend will be running at `http://127.0.0.1:5173`.

---

## 📡 REST API Reference

### Public Customer Store API
- `GET /api/shops` - List active enrolled physical shops.
- `GET /api/shops/{slug}` - Store profile, opening hours, status, and featured catalog.
- `GET /api/shops/{slug}/categories` - Categories for this store.
- `GET /api/shops/{slug}/products` - Search, filter, and browse store products with real-time stock status.
- `GET /api/shops/{slug}/products/{id}` - Product details, specifications, and variant options.
- `GET /api/shops/{slug}/search?q={query}` - Debounced live auto-complete search.
- `POST /api/shops/{slug}/requests` - Create assistance request (`"SHOW ME THIS PRODUCT"`), returns unique `REQ-XXXX` and queue position.
- `GET /api/requests/track/{requestNumber}` - Real-time tracking of request progress and assigned employee.
- `POST /api/shops/{slug}/reservations` - Reserve item for in-store pickup.

### Staff Floor API (`auth:sanctum`)
- `POST /api/auth/login` - Staff & admin authentication.
- `GET /api/staff/dashboard` - Top 4 metrics: Waiting Requests, Active Requests, Completed Today, Avg Service Time.
- `GET /api/staff/requests` - Filterable live queue (Waiting, Active, My Assigned, Completed).
- `POST /api/staff/requests/{id}/accept` - Accept customer request.
- `POST /api/staff/requests/{id}/found` - Mark product found on physical shelf.
- `POST /api/staff/requests/{id}/complete` - Finish customer assistance.
- `GET /api/staff/products/{id}/location` - Complete location breadcrumb and 2D map coordinates.
- `GET /api/staff/scan?code={barcode}` - Barcode / SKU hardware scanner lookup.
- `POST /api/staff/status` - Toggle online status (`online`, `busy`, `on_break`, `offline`).

### Shop Owner Admin API (`auth:sanctum`)
- `GET /api/admin/dashboard` - Metrics, hourly demand chart, top requested items, and smart demand insights.
- `GET /api/admin/products` & `POST /api/admin/products` - Product catalog CRUD and shelf assignment.
- `GET /api/admin/inventory` & `POST /api/admin/inventory/adjust` - Shelf stock adjustment & audit movements.
- `GET /api/admin/locations` & `POST /api/admin/locations` - Physical layout hierarchy management.
- `GET /api/admin/requests` & `POST /api/admin/requests/{id}/assign` - Live queue dispatch management.
- `GET /api/admin/employees` - Staff roster and shift tracking.
- `GET /api/admin/reports` - Demand loss analysis, peak hours, and staff performance.
- `GET /api/admin/shop` - Shop profile, branding, and QR signage settings.

### Super Admin API (`auth:sanctum`)
- `GET /api/super-admin/dashboard` - Platform tenant count, subscription MRR, aggregate request footfall.
- `GET /api/super-admin/shops` & `POST /api/super-admin/shops` - Onboard new physical retail tenants.
- `GET /api/super-admin/plans` - Manage subscription tiers (Starter, Growth, Business, Enterprise).

---

## 🏢 Database Architecture

The schema contains 14 dedicated migration tables:
- `shops`, `shop_users`, `plans`, `subscriptions`, `settings`, `payments`
- `users`, `roles`, `permissions`, `role_permissions`
- `location_floors`, `location_sections`, `location_aisles`, `location_racks`, `location_shelves`, `location_bins`, `locations`
- `categories`, `products`, `product_variants`, `product_images`
- `inventory`, `inventory_movements`
- `employees`, `employee_shifts`
- `customer_sessions`, `customer_requests`, `request_items`, `request_assignments`, `request_status_history`
- `orders`, `order_items`, `reservations`, `notifications`, `audit_logs`

---

## 📱 Mobile-First Responsive Design
- **Mobile Target (390px)**: Bottom bar single-hand navigation, instant search, quick variant cards, sticky "Show Me This Product" CTA.
- **Tablet Target (768px)**: Split-pane staff request queue and 2D floor map visualizer.
- **Desktop Target (1440px)**: SaaS layout with multi-metric analytics and layout editor.

---

## 📄 License
Proprietary SaaS Retail Solution. Built for high-throughput physical shops.
#   S h o p F l o w  
 
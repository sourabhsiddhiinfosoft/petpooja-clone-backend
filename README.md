# Petpooja Clone Backend

Node.js + Express + MongoDB backend for a Restaurant management system (Petpooja-like).

## Quick Start

```bash
cp .env
# edit .env values

npm install
npm run dev
```

Base URL: `http://localhost:5000`

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me` (Bearer token)

### Restaurants (admin)
- POST `/api/restaurants`
- GET `/api/restaurants`
- GET `/api/restaurants/:id`
- PUT `/api/restaurants/:id`
- DELETE `/api/restaurants/:id`

### Menu
- POST `/api/menu` (owner/admin) body: { restaurantId?, name, price, category, ingredients:[{inventoryItem, qty}] }
- GET `/api/menu/:restaurantId?` (owner/admin/staff)
- PUT `/api/menu/:id` (owner/admin)
- DELETE `/api/menu/:id` (owner/admin)

### Inventory
- POST `/api/inventory` (owner/admin)
- GET `/api/inventory` (owner/admin/staff)
- PUT `/api/inventory/:id` (owner/admin)
- DELETE `/api/inventory/:id` (owner/admin)

### Orders
- POST `/api/orders` (owner/admin/staff) body: { type, tableNo, customer, items:[{menuItem, qty}], discount?, taxRate? }
- GET `/api/orders`
- GET `/api/orders/:id`
- PUT `/api/orders/:id/status` body: { status }
- POST `/api/orders/:id/payments` body: { method, amount, status }

### Reports
- GET `/api/reports/sales?from=2025-01-01&to=2025-01-31`
- GET `/api/reports/top-items`

## Notes
- RBAC enforced via middleware.
- Inventory auto-deducts on order placement based on menu item recipe mapping.

# 🏭 Smart Warehouse Inventory Management System

A full-stack warehouse inventory management system with real-time stock tracking, alerts, analytics, and role-based access control.

---

## 🖥️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Tailwind CSS + Recharts |
| Backend | Node.js + Express.js |
| Database | PostgreSQL (Supabase) |
| Auth | JWT (JSON Web Tokens) |
| Hosting | Vercel (frontend) + Render (backend) + Supabase (DB) |

---

## 🚀 Features

- ✅ Role-based authentication (Admin / Manager / Staff)
- ✅ Product management with SKU, categories, locations
- ✅ Stock In / Stock Out with audit trail
- ✅ Real-time inventory levels
- ✅ Automatic low stock & out-of-stock alerts
- ✅ Warehouse location structure (Zone > Aisle > Shelf > Bin)
- ✅ Supplier management with performance scoring
- ✅ Analytics dashboard with charts
- ✅ Reports with CSV export
- ✅ Audit logs for all actions

---

## 📁 Project Structure

```
warehouse-system/
├── frontend/          # React app (deploy to Vercel)
│   ├── src/
│   │   ├── components/   # Sidebar, Topbar, UI components
│   │   ├── context/      # AuthContext
│   │   ├── pages/        # Dashboard, Products, Inventory, etc.
│   │   └── utils/        # API calls, helpers
│   └── package.json
├── backend/           # Express API (deploy to Render)
│   ├── config/        # Database config
│   ├── middleware/    # Auth middleware
│   ├── routes/        # API routes
│   └── server.js
└── database/
    ├── schema.sql     # Database schema + triggers
    └── seed.sql       # Sample data
```

---

## 🗃️ Database Setup (Supabase)

1. Go to [supabase.com](https://supabase.com) and create a new project(N%kA9%-KiME3sw&)
2. In the SQL Editor, run `database/schema.sql`
3. Then run `database/seed.sql` to insert sample data
4. Copy your connection string from: Settings → Database → Connection string (URI)

---

## ⚙️ Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase DATABASE_URL and JWT_SECRET
npm run dev
```

### Environment Variables (backend/.env)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
```

---

## 🎨 Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env
npm run dev
```

### Environment Variables (frontend/.env)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🔐 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@warehouse.com | Admin@1234 |
| Manager | manager@warehouse.com | Manager@1234 |
| Staff | staff@warehouse.com | Staff@1234 |

---

## 🌐 Deployment

### Deploy Database → Supabase
1. Create project at supabase.com
2. Run schema.sql and seed.sql in SQL editor

### Deploy Backend → Render
1. Push backend folder to GitHub
2. Create new Web Service on render.com
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add all environment variables

### Deploy Frontend → Vercel
1. Push frontend folder to GitHub
2. Import to vercel.com
3. Set `VITE_API_URL` to your Render backend URL
4. Deploy

---

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/logout | Logout |
| POST | /api/auth/change-password | Change password |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List all products |
| GET | /api/products/:id | Get single product |
| POST | /api/products | Create product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/inventory | Current stock levels |
| POST | /api/inventory/stock-in | Record stock in |
| POST | /api/inventory/stock-out | Record stock out |
| GET | /api/inventory/movements | Movement history |
| GET | /api/inventory/alerts | Active alerts |
| PUT | /api/inventory/alerts/:id/resolve | Resolve alert |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/suppliers | List suppliers |
| POST | /api/suppliers | Add supplier |
| GET | /api/categories | List categories |
| GET | /api/dashboard/stats | Dashboard statistics |
| GET | /api/reports/inventory | Inventory report |
| GET | /api/reports/movements | Movement report |
| GET | /api/reports/supplier-performance | Supplier report |

---

## 🗺️ ER Diagram (Summary)

```
users ─────────── roles
  │
  ├── products ── categories
  │     │       └ suppliers
  │     │       └ warehouse_bins ─ shelves ─ aisles ─ zones
  │     │
  │     └── inventory (1:1)
  │
  ├── stock_movements ── products
  │                   └─ suppliers
  └── audit_logs
```

---

## 👥 User Roles

| Feature | Admin | Manager | Staff |
|---------|-------|---------|-------|
| View dashboard | ✅ | ✅ | ✅ |
| View products | ✅ | ✅ | ✅ |
| Add/edit products | ✅ | ✅ | ❌ |
| Delete products | ✅ | ❌ | ❌ |
| Record stock in/out | ✅ | ✅ | ✅ |
| Manage suppliers | ✅ | ✅ | ❌ |
| View reports | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |

---

## 📄 License

MIT License — free to use for commercial and personal projects.
# Smart-Warehouse-Inventory-Management-System
# Smart-Warehouse-Inventory-Management-System

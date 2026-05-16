# ✨ QuickBill POS System

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=flat-square&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)
![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=flat-square&logo=google)

A production-grade, full-stack Point of Sale (POS) and inventory management system designed for modern retail environments. QuickBill combines strict transaction safety with a premium SaaS aesthetic and powerful AI-driven operational insights.

🔗 **Live Demo:** [quickbill-weybee-pos.vercel.app](https://quickbill-weybee-pos.vercel.app/)

> **Note:** To test the application, you can log in with the credentials:
> **Username:** `admin` | **Password:** `admin123`

---

## 🚀 Features

- **Executive Analytics Dashboard:** A highly scannable, visually stunning dashboard built with `Recharts`. Features dynamic Sales vs Orders trends, Top Selling Products charts, Category Distribution, and real-time Inventory Health monitoring.
- **AI-Powered Workflows:**
  - **Daily Business Summaries:** Google Gemini synthesizes raw financial data into professional, actionable daily insights.
  - **Restock Intelligence:** AI automatically scans inventory levels and provides priority restock warnings.
  - **Generative Product Descriptions:** Instantly generate concise, professional, retail-grade product descriptions using AI directly within the POS catalog workflow.
  - **Smart Natural Language Search:** Filter inventory using conversational queries (e.g., *"Show me cheap electronics in stock"*).
- **Transaction-Safe Billing:** Utilizes Prisma interactive transactions with pessimistic database-level locks (Atomic Decrements via `WHERE` clauses) to guarantee mathematically impossible overselling.
- **Enterprise-Grade Inventory:** Relational Category management, robust product CRUD, and soft-deletion (toggling `isActive`) to preserve historical invoice and accounting integrity.
- **Lightning Fast POS Interface:** Client-side cart state management ensures zero-lag counter operations with rapid, atomic API synchronization upon checkout.
- **Invoicing & Export:** Generate professional, printable invoices and export deep financial/inventory reports to Excel via SheetJS.

---

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions)
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Authentication:** Custom JWT (`jose` edge-compatible) via httpOnly Cookies
- **Styling:** Tailwind CSS, shadcn/ui, glassmorphism design system
- **Validation:** Zod, React Hook Form
- **AI Integration:** `@google/genai` (Gemini 2.5 Flash)

---

## 📦 Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL Database URL (e.g., Neon or Supabase)
- Google Gemini API Key

### 1. Clone & Install
```bash
git clone https://github.com/Yash-Kakadiya/quickbill-weybee-pos.git
cd quickbill-weybee-pos
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key"
GEMINI_API_KEY="your-google-gemini-api-key"
```

### 3. Database Setup
Push the Prisma schema to your database to sync the structure:
```bash
npx prisma db push
npx prisma generate
```

### 4. Seed Demo Data (Optional but Recommended)
Populate your database with 90 days of realistic historical retail data, categorized products, and the default admin user. 
```bash
# Safely wipe and re-seed the database
npm run db:reset-demo
```
*This command provides a rich dataset for testing charts, analytics, and AI insights.*

### 5. Run the Application
```bash
npm run dev
```
Access the application at `http://localhost:3000`.

---

## 🏗 Architecture Decisions

1. **Atomic Inventory Control:**
   Instead of calculating stock logic in Node.js (which introduces severe race conditions during high-volume sales), QuickBill pushes lock responsibility directly to PostgreSQL:
   ```typescript
   await tx.product.update({
     where: { id: productId, stock: { gte: requestedQuantity } },
     data: { stock: { decrement: requestedQuantity } }
   })
   ```

2. **Server Actions for Mutations:**
   All database mutations (`createOrder`, `generateProductDescription`) are abstracted into Next.js Server Actions. This securely isolates the database client and API keys from the frontend while providing seamless end-to-end TypeScript inference.

3. **Soft-Delete Paradigm:**
   Retail systems cannot hard-delete products that are linked to historical orders without corrupting accounting software. The `Product` table uses an `isActive` flag, hiding items from the active POS terminal while keeping past invoices intact.

---

## 🚢 Deployment (Vercel)

QuickBill is heavily optimized for edge deployment.
1. Push this repository to GitHub.
2. Import the project into Vercel.
3. Configure the Environment Variables (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`).
4. Set the Build Command to `npx prisma generate && next build`.
5. Deploy!

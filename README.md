# QuickBill POS System

A production-grade, full-stack Point of Sale (POS) system designed for retail shops. Built with Next.js 15, PostgreSQL, and Prisma, prioritizing strict transaction safety and inventory consistency.

## 🚀 Features

- **Transaction-Safe Billing:** Uses Prisma interactive transactions with pessimistic database-level locks (Atomic Decrements via WHERE clauses) to guarantee that overselling is mathematically impossible.
- **Product Management:** Complete CRUD operations with soft-deletion (toggling `isActive`) to preserve historical invoice integrity.
- **Lightning Fast POS Interface:** Client-side cart state management ensures zero-lag counter operations, with rapid API synchronization upon checkout.
- **Business Dashboard:** Built with Recharts, displaying real-time metrics, revenue, and low-stock alerts.
- **AI-Powered Insights:** Integrated with Google Gemini 2.5 Flash to automatically generate daily business summaries from sales data.
- **Invoicing & Export:** Generate professional, printable invoices and export financial/inventory reports to Excel via SheetJS.

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions)
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Authentication:** Custom JWT (`jose` edge-compatible) via httpOnly Cookies
- **Styling:** Tailwind CSS, shadcn/ui
- **Validation:** Zod, React Hook Form
- **AI:** `@google/genai` (Gemini API)

## 📦 Setup & Installation

### Prerequisites
- Node.js 18+
- A PostgreSQL Database URL (e.g., Neon or Supabase)
- A Gemini API Key

### 1. Clone & Install
\`\`\`bash
npm install
\`\`\`

### 2. Environment Variables
Create a `.env` file in the root directory:
\`\`\`env
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key"
GEMINI_API_KEY="your-google-gemini-api-key"
\`\`\`

### 3. Database Setup
Push the Prisma schema to your database and generate the client:
\`\`\`bash
npx prisma db push
npx prisma generate
\`\`\`

### 4. Seed Admin User
Run the setup script to create the initial admin user:
\`\`\`bash
node setup.js
\`\`\`
*Default Credentials: `admin` / `admin123`*

### 5. Run the Application
\`\`\`bash
npm run dev
\`\`\`
Access the app at `http://localhost:3000`.

## 🏗 Architecture Decisions

1. **Atomic Inventory Control:**
   Instead of calculating stock logic in Node.js (which risks race conditions), we use Prisma's atomic operations:
   \`\`\`typescript
   await tx.product.update({
     where: { id: productId, stock: { gte: requestedQuantity } },
     data: { stock: { decrement: requestedQuantity } }
   })
   \`\`\`
   This passes the lock responsibility directly to PostgreSQL.

2. **Server Actions for Mutations:**
   All database mutations (`createOrder`, `updateProduct`) are abstracted into Next.js Server Actions. This securely isolates the database client from the frontend while providing seamless TypeScript inference.

3. **Soft-Delete Paradigm:**
   Retail systems cannot hard-delete products that are linked to historical orders. The `Product` table uses an `isActive` flag, hiding items from the POS without corrupting past invoices.

## 🚢 Deployment (Vercel)

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. In the Vercel dashboard, configure the Environment Variables (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`).
4. Set the Build Command to `npx prisma generate && next build`.
5. Deploy!

<div align="center">

# 💍 WedPlan — Curated Wedding Planning Platform (Client)

**A luxury, role-based wedding service marketplace connecting couples with verified wedding vendors.**

[![Next.js](https://img.shields.io/badge/Next.js-App_Router-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![ShadCN UI](https://img.shields.io/badge/ShadCN_UI-Components-B76E79?style=for-the-badge)](https://ui.shadcn.com/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-JWT_%26_OAuth-10B981?style=for-the-badge)](https://www.better-auth.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Checkout-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

[🌐 **Live Website**](https://your-wedplan-client.vercel.app) • [🖥️ **Server Repository**](https://github.com/Nazmus-Sadat-21/wedplan-server) • [🐛 **Report an Issue**](https://github.com/Nazmus-Sadat-21/wedplan-client/issues)

</div>

---

## ✨ Overview

**WedPlan** is a full-stack, role-based wedding planning platform designed with an editorial rose-gold and warm alabaster aesthetic. Couples can discover approved wedding vendors across six curated categories, filter and sort listings, and submit event booking requests. Vendors manage their storefronts, respond to inquiries, and upgrade to **Premium** via **Stripe Checkout** for unlimited service listings, while Administrators moderate submissions, manage user access, and audit transactions.

---

## 🔗 Quick Links

| Resource | Link |
| :--- | :--- |
| **Live Production Site** | `https://your-wedplan-client.vercel.app` *(Replace with your deployed URL)* |
| **Client GitHub Repository** | `https://github.com/Nazmus-Sadat-21/wedplan-client` |
| **Server GitHub Repository** | `https://github.com/Nazmus-Sadat-21/wedplan-server` |

---

## 🚀 Key Features

### 🌸 Public & Discovery Experience
- **Editorial Landing Page:** Animated hero showcase powered by Framer Motion / Motion, dynamic **Featured Wedding Services**, **Service Categories**, **Why Choose WedPlan**, and **How WedPlan Works** sections.
- **Browse Services Catalogue:** Publicly accessible listing view displaying only `approved` and `active` services.
- **Advanced Search, Filter & Sorting:** Real-time search by service name, category filtering (`Photography & Videography`, `Wedding Venues`, `Decoration & Florist`, `Catering Services`, `Makeup & Styling`, `Wedding Fashion`), location filtering, and ascending/descending price sorting.
- **Protected Service Details (`/services/[id]`):** Multi-image gallery, vendor profile overview, and interactive booking modal (redirects unauthenticated visitors to Sign In).

### 💑 Customer Workspace (`/dashboard/customer`)
- **Dashboard Overview:** At-a-glance metrics for Total, Pending, Accepted, and Rejected booking requests.
- **My Bookings:** Track booking status in real time, inspect event details, and cancel `Pending` requests.
- **Smart Booking Guardrails:** Prevents duplicate active requests for the same service and event date, and blocks vendors/admins from submitting customer bookings.

### 🏛️ Vendor Studio (`/dashboard/vendor`)
- **Studio Overview:** Live KPIs for Total Services, Active Services, Pending Requests, Accepted Bookings, and active Subscription Plan.
- **Service Management:** Publish new packages with direct **ImgBB** file uploads, toggle availability (`Active` / `Paused`), edit details, and monitor admin approval status (`Pending`, `Approved`, `Rejected`).
- **Booking Request Queue:** Review customer event inquiries and `Accept` or `Reject` pending requests.
- **Subscription & Stripe Checkout:** Free tier (up to 3 active services) and **Premium Plan** upgrade via Stripe Checkout with verified webhook activation.

### 🛡️ Admin Console (`/dashboard/admin`)
- **Platform Analytics:** Summary cards covering Registered Users, Vendors, Customers, Total Services, Pending Reviews, and Transactions.
- **User Moderation:** Search by name or email, filter by role, and `Block` / `Unblock` user accounts.
- **Service Moderation:** Review vendor submissions, approve or reject listings, update status, or remove inappropriate packages.
- **Transaction Ledger:** Read-only audit log of Stripe subscription payments and statuses.

### 🔐 Authentication & Profile Management
- **Better Auth Integration:** Email/password registration (with password strength rules and ImgBB avatar upload), credential sign-in, and Google OAuth.
- **Role-Based Route Protection:** Strict client and server enforcement ensuring users cannot access another role's dashboard via URL manipulation.
- **Profile Studio:** Update display name, profile photo (file upload), and brand details while keeping `role` and `subscriptionPlan` locked.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js (App Router), React, TypeScript |
| **Styling & UI** | Tailwind CSS, ShadCN UI, Lucide Icons |
| **Animations** | Framer Motion / Motion |
| **Authentication** | Better Auth (Email/Password, Google OAuth, JWT session flow) |
| **Payments** | Stripe Checkout (Test Mode) |
| **Media Hosting** | ImgBB Image Upload API |
| **Notifications** | Sonner Toast Notifications |

---

## 📂 Project Structure

```text
wedplan-client/
├── app/
│   ├── (auth)/                 # Sign In & Sign Up pages
│   ├── (public)/               # Home, Browse Services, Service Details (/services/[id])
│   ├── dashboard/
│   │   ├── admin/              # Overview, Manage Users, Manage Services, Transactions, Profile
│   │   ├── vendor/             # Overview, My Services, Add Service, Bookings, Subscription, Profile
│   │   └── customer/           # Overview, My Bookings, Profile
│   ├── payment/
│   │   ├── success/            # Stripe Checkout success confirmation
│   │   └── cancel/             # Stripe Checkout cancellation view
│   ├── layout.tsx              # Root layout, fonts, theme & toast providers
│   └── icon.png                # WedPlan circular brand favicon
├── components/
│   ├── Shared/                 # Navbar, Footer, UpdateProfile, Loaders
│   ├── Admin/                  # Admin moderation tables & metrics
│   ├── Vendor/                 # Service forms, vendor tables & subscription cards
│   └── ui/                     # ShadCN UI primitives
├── lib/
│   ├── auth-client.ts          # Better Auth client hooks & session helpers
│   ├── api.ts                  # API fetch wrappers & helpers
│   ├── constants.ts            # Endpoints, categories & fallback imagery
│   ├── format.ts               # Currency & date formatters
│   └── imgbb.ts                # ImgBB file upload utility
└── .env.local                  # Local environment variables (git-ignored)
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root of the client repository and configure the following keys:

```env
# Application & Backend URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SERVER_API=http://localhost:5000

# Better Auth Configuration
BETTER_AUTH_SECRET=your_super_secret_random_string_here
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# ImgBB Image Hosting
NEXT_PUBLIC_IMGBB_API_KEY=your_imgbb_api_key

# Stripe Publishable Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

> **Security Note:** Never commit `.env` or `.env.local` files to version control.

---

## 💻 Local Installation & Setup

### 1. Prerequisites
- **Node.js** `v18.18+` or `v20+`
- **npm**, **pnpm**, or **yarn**
- Running instance of the **WedPlan Server** (`http://localhost:5000`)

### 2. Clone & Install
```bash
git clone [https://github.com/Nazmus-Sadat-21/wedplan-client.git](https://github.com/Nazmus-Sadat-21/wedplan-client.git)
cd wedplan-client
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SERVER_API, BETTER_AUTH_SECRET, Google OAuth, ImgBB, and Stripe keys
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server on port `3000` |
| `npm run build` | Creates an optimized production build |
| `npm run start` | Runs the compiled production server |
| `npm run lint` | Runs ESLint across the codebase |
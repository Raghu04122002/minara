<h1 align="center">Minara Admin</h1>

<p align="center">
  A comprehensive management platform for event registrations, participant data, and financial transactions. Built with a focus on intelligent data ingestion, complex person matching, smart householding, and dual-database synchronization.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe" />
</p>

## ✨ Key Features

- **🛡️ Intelligent Person Resolution:** Multi-stage matching logic to identify returning participants even with partial data (combinations of email, phone, DOB, and names).
- **⚖️ Submission Resolution Flow:** Interactive admin dashboard to resolve ambiguous matches. Allows administrators to manually compare candidate profiles, merge records, or confirm new profiles seamlessly.
- **📅 Unified Activity Timeline:** A consolidated, chronological view of all person-related events, including historical event registrations, Stripe orders, financial transactions, and pending submissions.
- **🏠 Smart Householding:** Automatic grouping of family members based on event registration context, while smartly maintaining isolated individual records for single-person participants.
- **🔄 Dual Database Support:** Gracefully handles multiple database targets (Local & Production), automatically leveraging a local database during development while syncing with Supabase in production.
- **💳 Financial Integration:** Deep integration with Stripe webhooks for tracking completed orders, failed payments, and refunds directly within the participant's activity history.

## 🚀 Getting Started

### Prerequisites

You will need the following tools installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (Local installation or a remote instance like Supabase)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) (optional, for local webhook testing)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Raghu04122002/Repo.git
   cd EventID
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or yarn / pnpm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root of the project by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your connection strings and essential keys:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://user:password@localhost:5432/eventid"
   DIRECT_URL="postgresql://user:password@localhost:5432/eventid"

   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL="your-project-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   
   # Stripe Configuration
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

4. **Initialize the Database:**
   Push the Prisma schema to your configured database to create the necessary tables:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Development

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000). 
- Access the public registration flows at `/e/[slug]`
- Access the admin dashboard at `/admin`

## 📁 Project Structure

```text
├── prisma/                  # Database schema and migration settings
├── public/                  # Static assets
├── scripts/                 # Utility and cleanup scripts
├── src/
│   ├── app/                 # Next.js App Router endpoints and pages
│   │   ├── (public)/        # Public-facing event registration and landing pages
│   │   ├── admin/           # Secured admin dashboard and management tools
│   │   └── api/             # API routes and webhooks (Stripe, sync, etc.)
│   ├── components/          # Reusable React components (Forms, UI elements)
│   └── lib/                 # Core business logic, utilities, and integrations
│       ├── import/          # CSV upload and participant matching logic
│       ├── householding/    # Household grouping algorithms
│       └── supabase/        # Supabase client configurations
```

## 🛠️ Built With

* [Next.js](https://nextjs.org/) - React framework for the web
* [Prisma](https://www.prisma.io/) - Next-generation Node.js and TypeScript ORM
* [Supabase](https://supabase.com/) - The open source Firebase alternative
* [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
* [Stripe](https://stripe.com/) - Payment processing API

## 📜 License

This project is proprietary and intended for private use.

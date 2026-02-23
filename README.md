# Minara Admin - EventID

Minara Admin is a comprehensive management platform for event registrations, participant data, and financial transactions. It features an intelligent ingestion pipeline that handles complex person matching, householding, and dual-database synchronization.

## Features

- **🛡️ Intelligent Person Resolution**: Multi-stage matching logic to identify returning participants even with partial data.
- **⚖️ Submission Resolution Flow**: Interactive admin dashboard to resolve ambiguous matches, allowing for manual merging or confirmation of new profiles.
- **📅 Unified Activity Timeline**: A consolidated view of all person-related events including registrations, Stripe orders, and financial transactions.
- **🏠 Smart Householding**: Automatic grouping of family members based on registration context, while maintaining individual records for single-person participants.
- **🔄 Dual Database Support**: Seamlessly synchronizes data between local development environments and Supabase for production reliability.
- **💳 Financial Integration**: Deep integration with Stripe for tracking orders and refunds directly within the participant's activity history.

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (Local or Supabase)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Raghu04122002/Repo.git
   cd EventID
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file based on `.env.example`:
   ```env
   DATABASE_URL="your_postgresql_url"
   DIRECT_URL="your_direct_url"
   NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
   ```

4. Run migrations:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Technical Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Auth & Storage**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## License

This project is privately owned.

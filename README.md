# Personalized QR Code Generator

A modern, responsive QR code generator website built with Next.js 14, TypeScript, and internationalization support (English/Chinese/German/French/Russian/Portuguese/Arabic/Spanish/Japanese). Features include custom QR code generation with images, colors, shapes, batch generation, subscription plans (Creem), email/password authentication, and MySQL-backed data storage.

## Features

- 🎨 **Custom QR Codes**: Generate personalized QR codes with custom colors, shapes, and center images
- 📦 **Batch Generation**: Upload CSV/Excel files to generate multiple QR codes at once
- 🌍 **Internationalization**: Full support for 9 languages (en, zh, de, fr, ru, pt, ar, es, ja)
- 📱 **Responsive Design**: Beautiful, modern UI that works on all devices
- 🔒 **SEO Optimized**: Includes sitemap.xml, robots.txt, and proper metadata
- 💳 **Subscription Plans**: Integration with Creem for subscription management
- ✉️ **Email/Password Auth**: Self-hosted auth backed by MySQL (bcrypt + HTTP-only session cookies)
- 🗄️ **MySQL Storage**: Replaces the original Supabase backend with a self-managed MySQL schema
- 🎁 **Sign-up Bonus**: New users automatically receive **500 credits** as a welcome gift

## Subscription Plans

- Monthly — `$9.9` per month
- Quarterly — `$19.9` every three months
- Yearly — `$69.9` per year

## Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- A Creem API key (for subscription functionality)
- A MySQL 8.0+ server (for users / sessions / subscriptions / heartbeat logs)

## Getting Started

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 2. Configure MySQL

Create a database and user, then run the bundled schema:

```bash
mysql -h <host> -u <user> -p person_qrcode < scripts/mysql_schema.sql
```

Or, after configuring `.env.local`, run:

```bash
npm run db:init
```

### 3. Environment Configuration

Create an `.env.local` file (or use another dotenv-compatible filename):

```bash
cp env.example .env.local
```

Update the following environment variables:

| Variable | Description |
| --- | --- |
| `CREEM_API_KEY` | Your Creem secret key |
| `APP_BASE_URL` | Base URL for success/cancel redirects (defaults to `http://localhost:3000`) |
| `CREEM_WEBHOOK_SECRET` | Secret used to verify Creem webhook signatures |
| `MYSQL_HOST` | MySQL host |
| `MYSQL_PORT` | MySQL port (default `3306`) |
| `MYSQL_USER` | MySQL user |
| `MYSQL_PASSWORD` | MySQL password |
| `MYSQL_DATABASE` | MySQL database name |
| `MYSQL_POOL_LIMIT` | (Optional) Connection pool size, defaults to `10` |
| `SUBSCRIPTION_TEST_SECRET` | Shared secret for the subscription test endpoint |

### 4. Development

Run the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to view the application.

## Build & Deployment

### Build Commands

```bash
npm run dev    # development
npm run build  # production build
npm run start  # production server
```

### Deployment Paths

#### Vercel (Recommended for Next.js)
- Configure environment variables (see the table above)
- Make sure your MySQL instance is reachable from Vercel (e.g. via a public host or a tunneling service)
- Deploy with `vercel`

#### Docker / Traditional Server
- Build: `npm run build`
- Start: `npm run start`
- Default port: `3000`

### Production Environment Variables

Make sure to set these in your production environment:

```bash
CREEM_API_KEY=your_production_creem_key
APP_BASE_URL=https://qrcode.chdaoai.com
MYSQL_HOST=...
MYSQL_USER=...
MYSQL_PASSWORD=...
MYSQL_DATABASE=person_qrcode
CREEM_WEBHOOK_SECRET=...
SUBSCRIPTION_TEST_SECRET=...
NODE_ENV=production
```

## Project Structure

```
person-qrcode/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   │   ├── page.tsx       # Homepage
│   │   ├── batch/         # Batch generation page
│   │   ├── signin/        # Sign-in page (email/password)
│   │   ├── signup/        # Sign-up page (email/password)
│   │   ├── membership/    # Membership dashboard
│   │   └── ...
│   ├── signin/            # Top-level alias for /signin
│   ├── signup/            # Top-level alias for /signup
│   └── api/               # API routes
│       ├── auth/          # register, login, logout, session
│       ├── subscriptions/ # check, list, create, test
│       ├── creem/         # Creem checkout + webhook
│       └── heartbeat-log/ # Heartbeat endpoint
├── components/            # React components (Header, AuthForm, ...)
├── contexts/              # React contexts (AuthContext)
├── messages/              # Translation files
├── scripts/               # Node utilities (heartbeat-logger, init-mysql, mysql_schema.sql)
├── utils/
│   └── mysql/             # MySQL connection pool, users, sessions, subscriptions helpers
└── public/                # Static assets
```

## How It Works

- **QR Code Generation**: Uses `qrcode` library to generate QR code matrices, then custom SVG rendering for shapes and styling
- **Internationalization**: Uses `next-intl` for multi-language support
- **Subscription**: Integrates with Creem API for payment processing; subscription records are stored in MySQL
- **Authentication**: Email + password (bcrypt) with HTTP-only session cookies backed by MySQL
- **Heartbeat**: A cron-style job (`scripts/heartbeat-logger.js`) writes a row to `heartbeat_logs` every hour
- **Batch Processing**: Client-side CSV/Excel parsing and QR code generation

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (outputs to `.next/`)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run heartbeat` - Run the heartbeat logger (long-running)
- `npm run db:init` - Initialize the MySQL schema from `scripts/mysql_schema.sql`

## Notes

- The build output directory `.next/` should not be committed to version control
- For production, ensure all environment variables are properly configured
- The application supports both server-side rendering and static generation
- SEO files (sitemap.xml, robots.txt) are in the `public/` directory and automatically served

## Migrating from Supabase

If you previously ran this project against Supabase:

1. Drop the `subscriptions` and `heartbeat_logs` tables in Supabase (or leave them; we no longer read or write them).
2. Create the MySQL schema described above.
3. Replace Supabase environment variables with the `MYSQL_*` variables in `.env.local`.
4. Existing Supabase auth users will need to re-register — passwords were managed by Supabase and cannot be imported.

## License

Private project - All rights reserved

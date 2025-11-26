# Stipends - Financial Wellness Platform

A financial wellness platform for Nigerian employees, providing tax-efficient benefits and access to a verified marketplace of deals.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Fonts:** Outfit (headings), Inter (body)
- **PWA:** Progressive Web App enabled

## Design System

### Colors
- **Primary:** Electric Royal Blue (#2563EB)
- **Secondary:** Vibrant Coral (#FA7921)
- **Accent:** Electric Lime (#96E072)
- **Neutral:** Clean White (#FFFFFF), Soft Light Grey (#F8F9FA)

### Typography
- **Headings:** Outfit (Google Font)
- **Body:** Inter (Google Font)

## Getting Started

### Prerequisites
- Node.js 20+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Adam-Maverick/perks-app.git
cd perks-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations (if needed)
npm run db:push

# Seed the database with sample data
npm run db:seed

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
perks-app/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Homepage
│   │   └── globals.css      # Global styles
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI atoms
│   │   └── modules/         # Feature-specific components
│   ├── db/                  # Database configuration
│   ├── lib/                 # Shared utilities
│   ├── server/              # Server-side logic
│   │   └── actions/         # Server Actions
│   ├── styles/              # Additional styles
│   └── types/               # TypeScript definitions
├── public/                  # Static assets
│   └── manifest.json        # PWA manifest
├── .bmad/                   # BMAD Method planning docs
└── docs/                    # Project documentation
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Add environment variables here
# Example:
# DATABASE_URL=your_database_url
# NEXT_PUBLIC_API_URL=your_api_url
```

## PWA Features

This app is configured as a Progressive Web App (PWA):
- ✅ Installable on mobile and desktop
- ✅ Offline support with service worker (Serwist)
- ✅ Deal caching for offline browsing
- ✅ Fast loading with optimized caching
- ✅ Offline banner when network unavailable

## Testing

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm test -- --run

# Run tests with coverage report
npm run test:coverage

# Run tests with interactive UI
npm run test:ui

# Run specific test file
npm test -- src/lib/validators/email-domain.test.ts
```

### Test Coverage

Current coverage: **76% overall** (32 tests passing)

- Lines: 78.69%
- Branches: 71.18%
- Functions: 34.21%
- Statements: 76.27%

Coverage thresholds are enforced in CI/CD:
- Lines: 75%
- Branches: 70%
- Functions: 30%
- Statements: 75%

See [`docs/testing-guide.md`](./docs/testing-guide.md) for comprehensive testing documentation.

## CI/CD

### GitHub Actions

Automated workflows run on every push and pull request:

- **Tests:** Run all tests and generate coverage reports
- **Lint:** Run ESLint and TypeScript type checking

Tests must pass before merging to `main` or `develop`.

### Workflows

- [`.github/workflows/test.yml`](./.github/workflows/test.yml) - Test suite
- [`.github/workflows/lint.yml`](./.github/workflows/lint.yml) - Code quality

## Deployment

### Vercel (Production)

The app is deployed to Vercel with automatic deployments on push to `main`.

**Production URL:** [https://perks-app.vercel.app](https://perks-app-five.vercel.app/) *(updated with actual URL)*

### Deployment Steps

1. **Connect GitHub Repository to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the `perks-app` repository

2. **Configure Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add all variables from `.env.local`:
     - `DATABASE_URL` - Neon PostgreSQL connection string
     - `CLERK_SECRET_KEY` - Clerk authentication secret
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
     - `CLERK_WEBHOOK_SECRET` - Clerk webhook signing secret
     - `RESEND_API_KEY` - Resend email API key
     - Any other required environment variables

3. **Configure Build Settings**
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Node.js Version: **20.x**

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Vercel will provide a deployment URL

5. **Run Database Migrations** (First deployment only)
   - After first deployment, run migrations:
   ```bash
   # Using Vercel CLI
   vercel env pull .env.production
   npm run db:push
   npm run db:seed
   ```

6. **Verify Deployment**
   - Open deployment URL
   - Test authentication flow
   - Test PWA offline capabilities
   - Check Lighthouse scores (Performance, PWA, Accessibility)

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### Rollback Deployment

If a deployment has issues:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." menu → "Promote to Production"

### Environment-Specific Deployments

- **Production:** `main` branch → Auto-deploy to production
- **Preview:** Pull requests → Auto-deploy to preview URLs
- **Development:** `develop` branch → Auto-deploy to staging (optional)

## Development

- Uses Next.js 15 App Router for modern React patterns
- TypeScript for type safety
- Tailwind CSS for utility-first styling
- ESLint for code quality
- Vitest for unit and integration testing
- Mobile-first responsive design
- PWA with offline support

## Documentation

- [`docs/testing-guide.md`](./docs/testing-guide.md) - Comprehensive testing guide
- [`docs/epics.md`](./docs/epics.md) - Epic and story breakdown
- [`docs/prep-sprint-day-1-complete.md`](./docs/prep-sprint-day-1-complete.md) - Day 1 prep sprint report
- [`.agent/workflows/`](./.agent/workflows/) - Development workflows

## License

Private - All rights reserved

## Contact

For questions or support, contact the development team.

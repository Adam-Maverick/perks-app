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
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
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
- Installable on mobile and desktop
- Offline support (coming soon with service worker)
- Fast loading with optimized caching

## Development

- Uses Next.js 15 App Router for modern React patterns
- TypeScript for type safety
- Tailwind CSS for utility-first styling
- ESLint for code quality
- Mobile-first responsive design

## License

Private - All rights reserved

## Contact

For questions or support, contact the development team.

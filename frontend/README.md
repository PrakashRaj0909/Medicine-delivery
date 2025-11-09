# MediExpress Frontend

Frontend application for the MediExpress medicine delivery platform built with React, TypeScript, and Vite.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Routing**: React Router v6
- **State Management**: TanStack Query
- **Backend**: Supabase

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Backend server running (see backend README)

### Installation

```bash
# Install dependencies
npm install
# or
bun install
```

### Environment Setup

1. Copy `.env.example` to `.env`
2. Update the Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
   VITE_API_URL=http://localhost:3000
   ```

### Running Locally

```bash
# Start development server
npm run dev
```

The app will be available at http://localhost:8080

### Building for Production

```bash
# Build the app
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── ui/            # Reusable UI components (shadcn/ui)
│   ├── hooks/             # Custom React hooks
│   ├── integrations/
│   │   └── supabase/      # Supabase client & types
│   ├── lib/               # Utility functions
│   ├── pages/             # Page components
│   │   ├── Index.tsx      # Landing page
│   │   ├── Auth.tsx       # Authentication
│   │   ├── Dashboard.tsx  # Main dashboard
│   │   ├── Cart.tsx       # Shopping cart
│   │   ├── Checkout.tsx   # Checkout flow
│   │   └── Orders.tsx     # Order history
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── public/                # Static assets
└── package.json
```

## Features

- 🔐 Authentication (Customer & Delivery Partner)
- 💊 Medicine catalog browsing
- 🛒 Shopping cart management
- 📋 Prescription upload & validation
- 📦 Order tracking
- 🚚 Delivery partner dashboard
- 📱 Responsive design

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) components built on top of Radix UI primitives. All components are fully customizable and located in `src/components/ui/`.

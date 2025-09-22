# KTC Logistics - Next.js Frontend

A modern logistics platform built with Next.js 15, TypeScript, TailwindCSS, and Ant Design. This application provides order management, tracking, and authentication features for a comprehensive logistics solution.

## 📋 Table of Contents

1. [Getting Started](#-getting-started)
2. [Project Structure](#-project-structure)
3. [Coding Conventions](#-coding-conventions)
4. [API Documentation](#-api-documentation)
5. [Examples](#-examples)
6. [Deployment](#-deployment)
7. [Tech Stack](#-tech-stack)
8. [Contributing](#-contributing)

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.17.0 or later
- **pnpm**: 8.0.0 or later (recommended package manager)
- **Git**: Latest version

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Quinh2003/PROJECT_KTC_2025.git
   cd PROJECT_KTC_2025/nextjs-project
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=http://localhost:3000
   FIREBASE_API_KEY=your-firebase-api-key
   ```

4. **Run development server**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command      | Description                             |
| ------------ | --------------------------------------- |
| `pnpm dev`   | Start development server with Turbopack |
| `pnpm build` | Build production version                |
| `pnpm start` | Start production server                 |
| `pnpm lint`  | Run ESLint for code quality             |

## 🏗️ Project Structure

```
src/
├── app/                    # App Router (Next.js 13+)
│   ├── (auth)/            # Auth route group
│   │   ├── layout.tsx     # Auth layout
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── (public)/          # Public pages group
│   ├── account/           # Protected account pages
│   │   ├── layout.tsx     # Account layout
│   │   ├── orders/        # Order management
│   │   ├── profile/       # User profile
│   │   └── estimate/      # Price estimation
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth configuration
│   │   └── stores/        # Store-related APIs
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── providers.tsx      # App providers
│
├── components/            # Reusable UI components
│   ├── forms/            # Form components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── TwoFactorForm.tsx
│   ├── modals/           # Modal components
│   └── index.ts          # Component exports
│
├── hooks/                # Custom React hooks
│   └── useOrders.ts      # Order management hooks
│
├── lib/                  # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── firebase.ts       # Firebase configuration
│   ├── pricing.ts        # Pricing calculations
│   └── react-query.ts    # React Query setup
│
├── server/               # Server-side utilities
│   ├── auth.api.ts       # Authentication APIs
│   ├── order.api.ts      # Order APIs
│   └── user.api.ts       # User APIs
│
├── services/             # Business logic services
│   ├── orderService.ts   # Order service
│   └── storeService.ts   # Store service
│
├── types/                # TypeScript type definitions
│   ├── User.ts
│   ├── orders.ts
│   ├── Store.ts
│   └── next-auth.d.ts
│
├── utils/                # General utilities
│   └── auth.ts
│
└── middleware.ts         # Next.js middleware
```

### Key Directories Explained

- **`app/`**: Uses Next.js App Router with file-based routing
- **`components/`**: Reusable UI components following atomic design
- **`hooks/`**: Custom React hooks for state management
- **`lib/`**: Configuration files and utility functions
- **`services/`**: Business logic and API communication
- **`types/`**: TypeScript interfaces and type definitions

## 📝 Coding Conventions

### File Naming

- **Components**: PascalCase (`LoginForm.tsx`, `OrderTable.tsx`)
- **Pages**: lowercase (`page.tsx`, `layout.tsx`)
- **Hooks**: camelCase starting with "use" (`useOrders.ts`)
- **Types**: PascalCase (`User.ts`, `Order.ts`)
- **Utilities**: camelCase (`auth.ts`, `pricing.ts`)

### Folder Structure

- **Route Groups**: Use parentheses `(auth)`, `(public)` for logical grouping
- **Dynamic Routes**: Use square brackets `[id]`, `[...slug]`
- **Component Organization**: Group by feature or functionality

### Component Standards

#### Client vs Server Components

```tsx
// Server Component (default)
export default function ServerPage() {
  return <div>Server-rendered content</div>;
}

// Client Component
("use client");
export default function ClientPage() {
  const [state, setState] = useState();
  return <div>Interactive content</div>;
}
```

#### TailwindCSS Usage

- Use utility classes for styling
- Create component variants using class composition
- Use CSS modules for complex styles only when necessary

```tsx
// Good: Utility-first approach
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
  Submit
</button>
```

### TypeScript Standards

- Use strict mode configuration
- Define interfaces for all props and data structures
- Prefer type inference over explicit typing when possible

## 📡 API Documentation

### Authentication Endpoints

#### NextAuth Configuration

- **Route**: `/api/auth/[...nextauth]`
- **Provider**: Credentials & Google OAuth
- **Backend Integration**: Spring Boot API

```typescript
// Login with credentials
POST /api/auth/signin/credentials
{
  "username": "string",
  "password": "string"
}
```

### Store Management

#### Get User Stores

- **Route**: `/api/stores/user/[userId]`
- **Method**: `GET`
- **Description**: Retrieve stores associated with a user

**Request:**

```typescript
GET / api / stores / user / 123;
```

**Response:**

```typescript
{
  "stores": [
    {
      "id": "string",
      "name": "string",
      "address": "string",
      "phone": "string"
    }
  ]
}
```

### Backend Integration

All API routes proxy to Spring Boot backend:

- **Base URL**: `http://localhost:8080/api`
- **Authentication**: Bearer token
- **Content-Type**: `application/json`

## 💡 Examples

### Basic Page Component

```tsx
// src/app/example/page.tsx
export default function ExamplePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Example Page</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">This is an example server component.</p>
      </div>
    </div>
  );
}
```

### Layout Component

```tsx
// src/app/example/layout.tsx
export default function ExampleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <h2 className="text-xl font-semibold">Navigation</h2>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
```

### Custom Hook Example

```tsx
// src/hooks/useExample.ts
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export function useExample(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["example", id],
    queryFn: () => fetchExample(id),
    enabled: !!id,
  });

  return {
    data,
    isLoading,
    error,
  };
}
```

### TailwindCSS Component

```tsx
// src/components/Card.tsx
interface CardProps {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "elevated";
}

export default function Card({
  title,
  children,
  variant = "default",
}: CardProps) {
  const baseClasses = "bg-white rounded-lg p-6";
  const variantClasses = {
    default: "border border-gray-200",
    elevated: "shadow-lg",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Connect Repository**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login and deploy
   vercel login
   vercel --prod
   ```

2. **Environment Variables**
   Configure in Vercel dashboard:

   - `NEXT_PUBLIC_API_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `FIREBASE_API_KEY`

3. **Build Configuration**
   The project is optimized for Vercel with:
   - Automatic builds on push
   - Edge runtime support
   - Static optimization

### Manual Deployment

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 🛠️ Tech Stack

### Core Technologies

- **Framework**: Next.js 15.4.2
- **Language**: TypeScript 5.x
- **Styling**: TailwindCSS 4.x
- **UI Library**: Ant Design 5.27.1

### State Management & Data Fetching

- **Server State**: TanStack Query (React Query) 5.85.9
- **Authentication**: NextAuth.js 4.24.11
- **HTTP Client**: Axios 1.11.0

### Additional Libraries

- **Icons**: React Icons 5.5.0, Ant Design Icons 6.0.0
- **Date Handling**: Day.js 1.11.15
- **QR Codes**: qrcode.react 4.2.0
- **Cookies**: js-cookie 3.0.5
- **Firebase**: Firebase 12.1.0

### Development Tools

- **Build Tool**: Turbopack (Next.js)
- **Linting**: ESLint 9.x
- **Package Manager**: pnpm

## 🤝 Contributing

### Development Workflow

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow Coding Standards**

   - Run `pnpm lint` before committing
   - Follow the established naming conventions
   - Write meaningful commit messages

3. **Testing**

   ```bash
   # Run tests
   pnpm test

   # Run type checking
   pnpm type-check
   ```

4. **Submit Pull Request**
   - Provide clear description
   - Include screenshots for UI changes
   - Ensure all checks pass

### Code Quality

- Follow ESLint rules
- Use TypeScript strictly
- Write self-documenting code
- Add comments for complex business logic

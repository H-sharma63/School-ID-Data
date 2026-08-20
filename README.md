# School ID Extractor

A production-ready web application for extracting student data from handwritten enrollment forms using AI (Google Gemini Vision), reviewing the extracted data in an editable table, and exporting to Excel/CSV.

![School ID Extractor](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)
![NextAuth](https://img.shields.io/badge/NextAuth-5-purple?logo=nextauth)
![Turso](https://img.shields.io/badge/Turso-Database-green)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

---

## ✨ Features

### 🎯 Core Features
- **AI-Powered Extraction** - Google Gemini Vision reads handwritten enrollment forms with confidence scoring
- **Interactive Review** - Editable data table with inline editing, bulk operations, and real-time validation
- **Multi-Format Export** - Excel (.xlsx) for school records, CSV for Photoshop batch processing
- **School Management** - Hierarchical school/class/section organization with year-over-year promotion
- **Global Search** - Instant search across all students with inline editing modal
- **Quick Export Mode** - Browser-only extraction without database persistence

### 🔐 Authentication & Security
- **Google OAuth** via NextAuth v5 (beta)
- **Session Management** - JWT tokens with 30-day expiry
- **Middleware Protection** - All routes protected except landing page and quick export
- **Role-Based Access** - Unified permission model (all authenticated users have full access)

### 🎨 Modern UI/UX
- **Design System** - CSS variables with OKLCH colors, dark/light mode support
- **Typography** - Satoshi (display), Inter Tight (body), JetBrains Mono (data)
- **Responsive Design** - Mobile-first, works on all screen sizes
- **Accessibility** - ARIA labels, focus management, reduced motion support
- **Dark/Light Mode** - System preference + manual toggle

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm/pnpm/yarn
- Google Cloud Console project (for OAuth)
- Turso database (or local SQLite for development)
- Google Cloud AI Platform (Gemini API)

### Environment Variables

Create `.env.local` from `.env.example`:

```bash
# Database (Turso)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# NextAuth
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Admin emails (comma-separated, optional)
ADMIN_EMAIL_1=admin1@example.com
ADMIN_EMAIL_2=admin2@example.com

# Cloudinary (optional - for student photos)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client (if using Prisma) / Run DB migrations
npm run db:push

# Development server
npm run dev

# Production build
npm run build

# Production start
npm start
```

---

## 🏗️ Architecture

### Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 (CSS variables) |
| Auth | NextAuth.js v5 (Google OAuth) |
| Database | Turso (libSQL) / SQLite |
| ORM | Raw SQL with @libsql/client |
| AI/ML | Google Gemini Vision (@google/genai) |
| State | Zustand (client) + URL sync |
| Deployment | Vercel (recommended) |

### Project Structure
```
src/
├── app/
│   ├── (auth)/              # Auth routes (signin, error)
│   ├── api/                 # API routes
│   │   ├── auth/            # NextAuth endpoints
│   │   ├── extract/         # Gemini Vision extraction
│   │   ├── students/        # Student CRUD + search + import/promote
│   │   ├── schools/         # School CRUD
│   │   ├── sections/        # Hierarchy browser
│   │   └── export/          # Excel/CSV generation
│   ├── dashboard/           # Main app dashboard
│   ├── quick/               # Quick export (no auth)
│   ├── schools/             # School hierarchy browser
│   ├── landing/             # Landing page components
│   ├── layout.tsx           # Root layout + providers
│   ├── page.tsx             # Landing page
│   ├── not-found.tsx        # 404 page
│   └── globals.css          # Design system (CSS variables)
├── components/
│   ├── landing/             # Landing page sections
│   ├── Navbar.tsx           # Unified navbar (auth + landing)
│   ├── DataTable.tsx        # Editable, sortable, searchable
│   ├── UploadZone.tsx       # Drag/drop with validation
│   ├── ProcessingQueue.tsx  # Real-time extraction queue
│   ├── DataTable.tsx        # Editable student table
│   ├── SchoolManager.tsx    # School/class/section picker
│   ├── LoginModal.tsx       # Modal login (no page redirect)
│   ├── GlobalSearch.tsx     # Debounced search + edit modal
│   ├── UploadZone.tsx       # Drag/drop with preview
│   ├── ProcessingQueue.tsx  # Real-time status
│   ├── Toolbar.tsx          # Sticky export bar
│   ├── StatusBar.tsx        # Student count pills
│   ├── Toast.tsx            # Portal-based notifications
│   └── ... (modals, modals, modals)
├── lib/
│   ├── auth.ts              # NextAuth config
│   ├── auth-guard.ts        # Middleware helpers
│   ├── db.ts                # Database connection
│   ├── gemini.ts            # Gemini Vision wrapper
│   ├── image.ts             # Sharp image optimization
│   ├── rate-limits.ts       # Gemini API rate limiting
│   ├── toast.ts             # Toast notification system
│   └── url-state.ts         # URL ↔ store sync
├── store/
│   └── useStudentStore.ts   # Zustand store + URL sync
├── types/
│   ├── index.ts             # Shared types
│   └── server.ts            # Server-only types
└── types/next-auth.d.ts     # NextAuth type extensions
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User visits /                                              │
│       │                                                     │
│       ▼                                                     │
│  Middleware checks session                                 │
│       │                                                     │
│       ├─ No session ──▶ Show Landing Page                  │
│       │                           │                         │
│       │                           ├─ Click "Get Started"   │
│       │                           │       │                 │
│       │                           │       ▼                 │
│       │                           │    LoginModal opens     │
│       │                           │       │                 │
│       │                           │       ├─ Google OAuth  │
│       │                           │       │       │         │
│       │                           │       │       ▼         │
│       │                           │       │    Callback     │
│       │                           │       │       │         │
│       │                           │       │       ▼         │
│       │                           │       │  /dashboard    │
│       │                           │       │       │         │
│       │                           │       │       ▼         │
│       │                           │       │  Dashboard     │
│       │                           │                         │
│       └─ Session exists ──▶ /dashboard                     │
│                                                             │
│  Logout ──▶ / (landing page)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Key User Flows

### 1. **Landing Page → Dashboard**
```
Landing Page → "Get Started" → LoginModal → Google OAuth → /dashboard
```

### 2. **Main Extraction Workflow**
```
Dashboard → SchoolManager (context) → UploadZone → ProcessingQueue
                                              ↓
                                    DataTable (review/edit)
                                              ↓
                                    Toolbar → Export (Excel/CSV)
```

### 3. **Quick Export** (no auth required)
```
/quick → Upload → Extract → Edit → Export Excel/CSV
```

### 4. **School Management**
```
/schools → Hierarchy browser → Click section → /dashboard?context
```

### 5. **Bulk Operations**
- **Import Students** - CSV/Excel upload with column mapping
- **Promote Students** - Year-end rollover (Class V→VI, XII→GRADUATE)
- **Global Search** - Search all students, inline edit modal

---

## 🛠️ Development Commands

```bash
# Development
npm run dev          # Start dev server (Turbopack)

# Build & Type Check
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript check only

# Database
npm run db:push      # Push schema changes
npm run db:studio    # Turso CLI studio

# Testing (when implemented)
npm test             # Vitest
npm run test:e2e     # Playwright
```

---

## 🌐 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

```bash
vercel --prod
```

### Environment Variables (Vercel Dashboard)
Add all variables from `.env.local` to Vercel project settings.

### Database
- **Production**: Turso (libSQL) - managed, distributed SQLite
- **Development**: Local SQLite file (`school-data.db`)

---

## 📝 API Reference

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List with filters |
| POST | `/api/students` | Create student |
| PATCH | `/api/students` | Update student |
| DELETE | `/api/students` | Bulk delete |
| GET | `/api/students/search` | Global search |

### Schools
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schools` | List schools |
| POST | `/api/schools` | Create school |
| PATCH | `/api/schools` | Update school |
| DELETE | `/api/schools` | Delete school |

### Sections
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sections` | Hierarchy tree |

### Extraction
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/extract` | Gemini Vision OCR |

### Bulk Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/students/import` | Bulk import from CSV/Excel |
| POST | `/api/students/promote` | Year-end promotion |
| POST | `/api/export` | Excel/CSV download |

---

## 🎨 Design System

### Colors (CSS Variables)
```css
:root {
  --background: #F4F0E6;      /* Ivory */
  --foreground: #102E4C;      /* Navy */
  --primary: #16845B;         /* Emerald */
  --primary-hover: #126B4A;
  --muted: #E8E2D6;           /* Linen */
  --border: #D4CCBE;          /* Sand */
  --card: #FAF7F2;            /* Warm white */
}

.dark {
  --background: #141A24;      /* Charcoal */
  --foreground: #F0EBE0;      /* Ivory */
  --primary: #1FA06D;         /* Bright emerald */
  --muted: #1A2230;
  --border: #243044;
  --card: #181E2A;
}
```

### Typography
- **Display**: Satoshi (700/800)
- **Body**: Inter Tight (400/500/600)
- **Mono**: JetBrains Mono

### Spacing & Radius
- Base: 8px scale
- Cards: `rounded-xl` (12px)
- Buttons/Inputs: `rounded-lg` (8px)
- Pills: `rounded-full`

---

## 🧪 Testing (Planned)

```bash
# Unit tests
npm test                 # Vitest

# E2E tests
npm run test:e2e         # Playwright

# Coverage
npm run test:coverage
```

### Test Coverage Goals
- API routes: 80%+
- Components: 70%+
- Utils: 90%+

---

## 📦 Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Database migrations applied
- [ ] Google OAuth credentials configured
- [ ] Gemini API key valid
- [ ] Turso database accessible
- [ ] Custom domain configured (optional)
- [ ] Analytics/error tracking enabled (Sentry configured)
- [ ] Preview deployment tested

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
3. Open Pull Request

### Code Style
- ESLint + Prettier (run `npm run lint`)
- TypeScript strict mode
- Conventional commits
- Component-driven development

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Google Gemini Vision** - AI extraction
- **NextAuth.js** - Authentication
- **Turso** - Database
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Lucide React** - Icons
- **shadcn/ui** - Component patterns

---

**Built with ❤️ for school administrators everywhere.**

---

*Last updated: August 2025 • Version 1.0.0*
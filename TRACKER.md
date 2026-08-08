# School ID Card Extractor — Project Tracker

> Last updated: 2026-07-21

---

## 🎯 GOAL

Build a web app that:
1. Takes photos of handwritten student enrollment forms
2. AI (Gemini) reads the handwriting and extracts data
3. Organizes students by School → Class → Section → Year
4. Lets you review, edit, search, filter
5. Exports CSV (for Photoshop) and XLSX (for review)
6. Deploys to Vercel (free) + Turso database (5GB free)

---

## 📊 PROGRESS OVERVIEW

| Phase | Status | Est. Time |
|-------|--------|-----------|
| Architecture Design | ✅ Complete | Done |
| Project Setup + Dependencies | ⚠️ Partial | 1 more step |
| Types + Store | ✅ Complete | Done |
| Backend: DB + Gemini + Validation | ✅ Complete | Done |
| Backend: API Routes | ✅ Complete | Done |
| Frontend: Components | ⚠️ Need dark mode polish | 30 min |
| Frontend: Merge to single page | ❌ Not started | 1 hour |
| Frontend: School manager UI | ❌ Not started | 1 hour |
| Frontend: Wire UI to API | ❌ Not started | 1 hour |
| Build + Test | ❌ Not started | 30 min |
| Turso Setup | ❌ Not started | 30 min |
| Vercel Deploy | ❌ Not started | 30 min |

---

## ✅ COMPLETED FILES

```
src/
├── types/
│   ├── index.ts          ✅ Client types (Student, QueueItem, etc.)
│   └── server.ts         ✅ Server types (SchoolRow, API contracts)
├── store/
│   └── useStudentStore.ts ✅ Zustand store + localStorage persist
├── lib/
│   ├── image.ts          ✅ Client-side image validation + resize
│   ├── validation-server.ts ✅ Server magic bytes check
│   ├── db.ts             ✅ Turso schema + init
│   └── gemini.ts         ✅ Gemini extraction prompt + API call
├── app/
│   ├── layout.tsx        ✅ Root layout + dark mode script
│   ├── globals.css       ✅ Dark mode CSS variables
│   ├── page.tsx          ✅ Upload page (simulated processing)
│   ├── review/
│   │   └── page.tsx      ✅ Review table page
│   └── api/
│       ├── extract/route.ts  ✅ POST image → Gemini → JSON
│       ├── export/route.ts   ✅ POST → CSV/XLSX download
│       ├── schools/route.ts  ✅ GET/POST schools
│       └── students/route.ts ✅ GET/POST/PATCH/DELETE students
└── components/
    ├── Navbar.tsx        ✅ Header + theme toggle
    ├── UploadZone.tsx    ✅ Drag & drop + validation
    ├── FilePreview.tsx   ✅ Per-file status card
    ├── ProcessingQueue.tsx ✅ Queue with stats
    ├── EditableCell.tsx  ✅ Click-to-edit with confidence colors
    ├── DataTable.tsx     ✅ Scrollable, sortable, selectable table
    ├── Toolbar.tsx       ✅ Actions: add row, upload, export, clear
    └── StatusBar.tsx     ✅ Stats: total, ready, needs review
```

---

## ❌ TO DO — Next Session

### 🔴 Critical (must finish before deploy)

| # | Task | Files |
|---|------|-------|
| 1 | **Install `@google/genai`** | `npm install @google/genai` |
| 2 | **Merge into ONE page** | Combine `page.tsx` + `review/page.tsx` into a single page with both upload zone AND table visible |
| 3 | **School/Class/Section selector UI** | New component: `<SchoolManager />` — dropdown to select school, add schools, pick class/section/year |
| 4 | **Wire frontend to real API** | Replace simulated `simulateProcessing()` in `page.tsx` with actual `fetch('/api/extract')` calls |
| 5 | **Real Excel/CSV download** | Replace placeholder `handleExport()` in `Toolbar.tsx` with actual `fetch('/api/export')` and download |
| 6 | **Build check** | `npm run build` — fix all TypeScript/lint errors |

### 🟡 Important (nice to have before deploy)

| # | Task |
|---|------|
| 7 | Dark mode verification — test both modes, fix any contrast issues |
| 8 | Search/filter bar above table |
| 9 | "Default class-section" to auto-fill new rows |
| 10 | Thumbnail popup — click 📷 icon to see original form photo |
| 11 | Undo last edit button |

### 🟢 Setup & Deploy

| # | Task |
|---|------|
| 12 | Create Turso account → get DB URL + auth token → add to `.env.local` |
| 13 | Create Gemini API key → add to `.env.local` |
| 14 | Push to GitHub |
| 15 | Deploy to Vercel → set env vars |
| 16 | Test full flow: upload → AI → review → export → Photoshop |

---

## 📁 WHAT'S NOT BUILT YET (new components needed)

```
src/components/
├── SchoolSelector.tsx    ❌ Dropdown: pick school + create new
├── SectionSelector.tsx   ❌ Dropdown: pick class + section + year
└── ImportZone.tsx        ❌ Drag/drop Excel files to import old data
```

---

## 🗄️ DATABASE SCHEMA (already coded, just needs Turso)

```sql
schools:   id, name, address, contact, created_at, updated_at
sections:  id, school_id, class_name, section_name, academic_year, created_at
           UNIQUE(school_id, class_name, section_name, academic_year)
students:  id, section_id, school_id, admission_no, student_name,
           father_name, mother_name, dob, class_name, section_name,
           mobile_number, address, academic_year, is_active,
           created_at, updated_at
           UNIQUE(school_id, admission_no)
```

---

## 🔑 SETUP CHECKLIST (before deploy)

```
[ ] Free Turso account → Database URL + Auth Token
[ ] Free Gemini API key → from https://aistudio.google.com/apikey
[ ] Create .env.local file with:
      TURSO_DATABASE_URL="libsql://..."
      TURSO_AUTH_TOKEN="..."
      GEMINI_API_KEY="..."
[ ] Free Vercel account → connected to GitHub
```

---

## 🚀 ORDER TO FOLLOW TOMORROW

```
1. Install @google/genai
2. Fix dark mode (any contrast issues in current components)
3. Merge into ONE page (upload + table on same screen)
4. Create .env.local + get API keys ready
5. Wire frontend → real API routes (extract, export, schools, students)
6. Add school selector component
7. npm run build → fix errors
8. Test locally (upload a real form photo!)
9. Push to GitHub
10. Deploy to Vercel
```

---

## 📝 NOTES

- The Gemini prompt is tuned for the specific form format shown (Admn No, Student Name, Father/Mother Name, DOB, Class, Mobile, Address)
- Images are NEVER stored on disk/server — processed in memory only
- CSV output is UTF-8 with BOM for Excel compatibility
- Mobile numbers in XLSX are stored as text (not numbers) to prevent formatting issues
- DOB is stored as text "DD-MM-YYYY" to prevent Excel date auto-conversion
- The `simulateProcessing()` function in `page.tsx` is a placeholder — replace with real API calls
- The `handleExport()` in `Toolbar.tsx` is a placeholder — replace with real fetch + download
- Server uses SQLite locally (`file:./school-data.db`), Turso in production (`libsql://...`)
- Free tier limits are generous: Turso 5GB, Gemini ~15 RPM, Vercel 100GB bandwidth
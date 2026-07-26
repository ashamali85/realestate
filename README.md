# RealEstate Inspect — real estate inspection system

Bilingual (English / Arabic, full RTL) inspection-request system for a real
estate inspection business. A super admin and inspector accounts sign in and
record inspection requests: address, map location, client details, property
attributes (from maintainable lookups), photos, and notes.

## Stack
- Next.js 15.5.21 (App Router, Server Components, Server Actions)
- React 19, TypeScript strict
- Prisma 6 + PostgreSQL (Neon)
- Auth: bcryptjs + jose JWT, httpOnly sameSite-strict cookie, id-only token
  with role looked up fresh each request
- zod validation
- Hand-written CSS (deep corporate blue theme), no Tailwind/PostCSS
- Deploy: Vercel

## Setup
```bash
npm install
cp .env.example .env      # fill in the values below
npm run setup             # generate + db push + seed
npm run dev
```

### Environment variables
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct (non-pooled) string, for db push/migrations |
| `JWT_SECRET` | Session signing secret, min 32 chars. `openssl rand -base64 48` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JS API key (see below) |
| `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | First super admin, created by the seed |

Generate secrets on your own machine — never in chat. Change the seed admin
password immediately after first login.

## Google Maps
The location picker uses the Maps JavaScript API. In Google Cloud Console:
enable **Maps JavaScript API**, create an API key, and restrict it by HTTP
referrer to your domain(s). Put it in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

If the key is absent, the form degrades gracefully to manual latitude/longitude
inputs — everything else still works.

## What's built (core)
- Login / logout, session auth, edge middleware guard
- Language switch EN⇄AR with correct `dir` and Arabic Kufi font
- Requests list
- New inspection request:
  - **Address** — pick an Area; the Governorate fills in automatically
    (from the seeded Kuwait geography). Then Block, Street, House number.
  - **Location** — click/drag a Google Map pin
  - **Client** — name, phone, email
  - **Property** — purpose, status, exterior, elevator, AC (all from
    maintainable lookups), plus age in years and number of floors
  - **Pictures** — multiple uploads, validated by file signature (JPEG/PNG/WebP,
    4 MB each), stored as bytes in Postgres, served behind auth
  - **Notes**
- Request detail view with photos and a Google Maps link
- Delete (super admin only)
- Every mutation written to an AuditLog

## Seeded data
- Kuwait's 6 governorates and a representative set of areas per governorate
  (English + Arabic). Add the rest from the Lookups admin.
- Default options for all five property lookups (English + Arabic).
- One super admin from the SEED_ADMIN_* variables.

## Not yet built (next chunk)
- Lookups admin (add/edit/deactivate areas, governorates, and the five option
  lists) — the tables and seed exist; the management UI is pending.
- Users admin (create inspectors, deactivate, reset passwords).
- Edit an existing request.
- Inspection rating/scoring (deferred by request).

Until the Lookups and Users admin screens are built, manage those tables with
`npm run db:studio` (Prisma Studio) or by editing and re-running the seed.

## Roles
- `SUPER_ADMIN` — everything, including delete, and (once built) lookups + users
- `INSPECTOR` — create and view requests

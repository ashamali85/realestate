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

## Admin (super admin only)
- **Lookups** (`/lookups`) — manage governorates, areas (each tied to a
  governorate), and all five option lists (purpose, status, exterior,
  elevator, AC). Add / edit / reorder / activate. Deleting an option that is
  referenced by a request deactivates it instead, to preserve history.
- **Users** (`/users`) — create inspector or super-admin accounts, activate /
  deactivate, and reset passwords. A super admin cannot deactivate their own
  account.

Both are restricted to `SUPER_ADMIN`: guarded in the nav, at the edge by
middleware, and authoritatively in every server action.

## Requests
- List with per-column filters (text search over reference/client/phone, plus
  governorate and area dropdowns) and a live count.
- View, and **Edit** every request (edit button on both the list and the detail
  view). Editing appends new photos and lets you remove existing ones.
- **Delete** (super admin) prompts for confirmation first.
- All dates display in English (en-GB) even in the Arabic view.

## Not yet built
- Inspection rating/scoring (deferred by request).

## Roles
- `SUPER_ADMIN` — everything, including delete, and (once built) lookups + users
- `INSPECTOR` — create and view requests

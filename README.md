# NGO Ledger System — Branch & Central Student Passbook

A multi-branch student credit/debit ledger for an NGO. Each branch head logs
in with their own credentials and can only see their own branch's data.
Central office can see and export everything.

```
ngo-ledger/
  backend/    Node.js + Express + PostgreSQL (Prisma) API
  frontend/   React (Vite) + Tailwind app
```

## How access control actually works

This isn't just hidden in the UI — it's enforced on the server on every request:

- Logging in (as a branch or as central) returns a signed JWT that encodes the
  role (`CENTRAL` or `BRANCH`) and, for branches, the `branchId`.
- Every branch-only API route reads `branchId` **only from that token**, never
  from anything the client sends in the request body/URL. A branch's token
  physically cannot address another branch's data.
- Every central-only route (`/api/branches`, `/api/ledger`, `/api/export/central`,
  `/api/export/branch/:id`) checks `role === 'CENTRAL'` before running.
- Recording a credit/debit re-checks the branch's password against the hash
  stored in the database on that specific request — not just once at login.
  This is what actually enforces "enter password before every entry", since
  the check happens server-side and can't be skipped by calling the API directly.

## 1. Backend setup

### Requirements
- Node.js 18+
- A PostgreSQL database (local install, Docker, or a hosted one — Railway,
  Render, Neon, Supabase all work)

### Steps
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — your Postgres connection string
- `JWT_SECRET` — set this to a long random string (e.g. `openssl rand -hex 32`)
- `CENTRAL_LOGIN_ID` / `CENTRAL_SEED_PASSWORD` — the central office's initial login

Then create the database tables and the first central login:
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

Start the API:
```bash
npm run dev
```
It listens on `http://localhost:4000` by default. Check `http://localhost:4000/api/health`.

> Note: `npx prisma generate` downloads a small query-engine binary from
> Prisma's CDN the first time you run it, so it needs normal internet access
> — it couldn't run inside this sandboxed environment, but will work fine on
> your machine or CI.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

Set `VITE_API_BASE_URL` in `.env` to wherever the backend is running
(`http://localhost:4000/api` for local dev).

```bash
npm run dev
```
Opens on `http://localhost:5173`.

For production: `npm run build` produces a static `dist/` folder you can
deploy to any static host (Vercel, Netlify, Nginx, etc.) or have the backend
serve directly.

## 3. First-time use

1. Go to the frontend, choose **Central Office Login**, sign in with the
   `CENTRAL_LOGIN_ID` / `CENTRAL_SEED_PASSWORD` you set in the backend `.env`.
2. Go to **Branches** and create a branch (name, login ID, password) for each
   of your NGO's branches — you can add as many as you need, any time.
3. Give each branch head their login ID and password.
4. Branch heads log in via **Branch Login**, enrol students, and record
   credit/debit entries against a student's account number (re-entering the
   branch password each time, as required).
5. Central can view everything under **All Data**, filter by branch/date, and
   download Excel — either the combined workbook (one sheet per branch + a
   summary sheet) or a single branch's sheet.

## 4. Deployment notes

- **Backend**: deploy to Railway, Render, Fly.io, or a VPS. Set the same env
  vars as `.env.example`, point `DATABASE_URL` at a managed Postgres instance,
  and run `npx prisma migrate deploy` + `npm run seed` once during setup.
- **Frontend**: deploy the built `dist/` folder to Vercel/Netlify, or serve it
  from the same server as the backend. Update `VITE_API_BASE_URL` to the
  backend's public URL before building.
- **Backups**: since this holds real financial records for real students, set
  up automated daily backups on whatever Postgres host you choose — most
  managed providers (Railway, Render, Neon, Supabase) offer this built in.
- **HTTPS**: make sure both frontend and backend are served over HTTPS in
  production — most of the above hosts do this automatically.

## 5. Extending it later

Some things worth adding once the core system is in daily use:
- Password reset flow for branch heads (currently central would need to
  delete and recreate a branch, or you can add a "change password" endpoint)
- Audit log of who changed what and when
- Pagination on the central "All Data" view once transaction volume grows
- A monthly/annual summary report per branch

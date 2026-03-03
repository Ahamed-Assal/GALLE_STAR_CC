# GALLE STAR CC - Full-Stack Cricket Platform

Modern full-stack cricket club web application built with Next.js App Router, TypeScript, Prisma, PostgreSQL (Supabase-ready), Tailwind CSS, and NextAuth credentials authentication.

## Highlights

- Email/password auth (register, login, logout)
- Role-based access control (`admin`, `team_owner`, `scorer`, `public`)
- Team registration with dynamic player management
- Practice matches (ephemeral, auto-delete after completion)
- Tournament matches (persistent, team-based, 2 scorers)
- Live scoring actions: `+1`, `+2`, `+3`, `+4`, `+6`, `wicket`, `wide`, `no_ball`, `undo`
- Score events persisted in `score_events` table
- Realtime scoring UI updates via Supabase Realtime subscription
- Admin dashboard: users, role changes, match deletion, statistics
- Mobile-first responsive UI, dark mode, skeleton loading states, toasts, subtle animations

## Brand Theme

Dominant non-background color extracted from uploaded logo: **`#7020b0`**.

This is set as Tailwind primary color in `tailwind.config.ts`.

You can re-extract from any logo with:

```bash
node scripts/extract-logo-color.mjs public/logo.jpg
```

## Environment Variables

Copy `.env.example` to `.env` and set values:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Local Development

```bash
npm install
npm run prisma:generate
npm run dev
```

## Prisma Setup

```bash
npx prisma migrate dev --name init
```

This creates the required models:

- `User`
- `Team`
- `Player`
- `Match`
- `ScoreEvent`

## Deployment (Vercel)

- `postinstall` automatically runs `prisma generate`
- Configure all env vars in Vercel dashboard
- Use Supabase PostgreSQL connection string for `DATABASE_URL`

## App Structure

- `app/dashboard`
- `app/teams`
- `app/matches`
- `app/practice`
- `app/admin`
- `app/api`

## Security

- Middleware-protected app routes
- Server-side role checks for all sensitive API routes
- Scorer authorization validated server-side before score inserts
- Frontend role checks are treated as UX only

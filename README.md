# BreakPoint to Tokyo — Petition Site

Single-page petition experience asking the Solana community to move BreakPoint 2026 from London to Tokyo. It uses Privy for authentication (Twitter or wallets), keeps a running signature counter, and shows a live activity feed.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Add your Privy app id and Supabase creds in `.env`:
   ```bash
   cp .env.example .env
   # edit the values
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```

## Notes

- The background image lives at `public/tokyo.jpg`.
- The intro splash cycles between `public/tokyo.jpg` and `public/tweet-splash.jpg`. Replace `public/tweet-splash.jpg` with the attached tweet screenshot to show it in the animation.
- Signatures can persist to Supabase if `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set; otherwise it falls back to local storage. Suggested table:
  ```sql
  create table public.signatures (
    id text primary key,
    user_id text,
    name text,
    proof text,
    timestamp bigint
  );
  ```
- Replace `localStorage` with your own backend or on-chain storage if you prefer.

## Deploying to Vercel

- Set the same env vars (`VITE_PRIVY_APP_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in your Vercel project.
- Build command: `npm run build` (Vercel will serve the `dist` output automatically with Vite’s static adapter).
- Ensure your Supabase anon key is scoped appropriately for inserts/select on the `signatures` table.

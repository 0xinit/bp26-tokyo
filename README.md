# BreakPoint to Tokyo — Petition Site

Single-page petition experience asking the Solana community to move BreakPoint 2026 from London to Tokyo. It uses Privy for authentication (Twitter or wallets), keeps a running signature counter, and shows a live activity feed.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Add your Privy app id in `.env`:
   ```bash
   cp .env.example .env
   # edit the value
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```

## Notes

- The background image lives at `public/tokyo.jpg`.
- The intro splash cycles between `public/tokyo.jpg` and `public/tweet-splash.jpg`. Replace `public/tweet-splash.jpg` with the attached tweet screenshot to show it in the animation.
- Signature data is stored locally in `localStorage` for demo purposes. Connect a Twitter account or wallet via Privy to add your own entry to the feed. For production, back this with durable storage or on-chain state.

# Jendal Marketplace Auth

Modern marketplace authentication for a multi-vendor ecommerce app built with Next.js, Tailwind CSS, Supabase auth, Framer Motion, and Lucide icons.

## Setup

1. Copy `.env.local.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Run `npm install`.
4. Start with `npm run dev`.

## Features

- Split-screen premium authentication layout
- Login and signup with buyer/seller role selection
- Supabase signup and profile creation in `profiles`
- Redirects for buyer, seller, and pending approval flows
- Stylish placeholder dashboards and approval page

## Notes

- `middleware.ts` guards protected routes using Supabase auth cookies.
- `lib/supabase-client.ts` creates the Supabase client for the browser.

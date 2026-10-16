# MakersKatte website

A Next.js storefront for engraved products, custom orders, and an admin panel. Product, order, and site settings are stored in Firebase Firestore.

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env` and fill in the Firebase service account fields and a strong `AUTH_SECRET`.
3. Run `npm run dev` and open `http://127.0.0.1:3000`.

To create or reset an admin login, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your local `.env`, then run `node scripts/firestore-seed-admin.mjs`. The admin panel is at `/admin`.

Local environment files, service-account keys, build output, dependencies, the local database, and customer custom-order uploads are excluded from Git. Product images under `public/uploads` are part of the storefront catalog.

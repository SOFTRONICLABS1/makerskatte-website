# MakersKatte website

A Next.js storefront for engraved products, custom orders, and an admin panel. Product, order, and site settings are stored in Firebase Firestore.

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env` and fill in the Firebase service account fields and a strong `AUTH_SECRET`.
3. Run `npm run dev` and open `http://127.0.0.1:3000`.

To create or reset an admin login, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your local `.env`, then run `node scripts/firestore-seed-admin.mjs`. The admin panel is at `/admin`.

Product images and customer custom-order uploads are compressed and stored in Firestore image documents. Product data, orders, and image URLs are also stored in Firestore. This works on Firebase's Spark plan for a small catalog, subject to its storage, read, write, and bandwidth quotas. To migrate images saved by an older local version, run `node scripts/migrate-local-images.mjs` to preview the migration, then `node scripts/migrate-local-images.mjs --apply`. The script keeps the local source files so they can be removed after the uploaded images and updated product pages are verified.

On Vercel, set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, and `AUTH_SECRET` in the project environment variables. The image upload limit is 4 MB per file to stay within Vercel's request limit.

Local environment files, service-account keys, build output, dependencies, the local database, and customer custom-order uploads are excluded from Git.

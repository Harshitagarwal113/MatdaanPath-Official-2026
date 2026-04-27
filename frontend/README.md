# MatdaanPath Frontend

Next.js frontend for the MatdaanPath election education platform.

## Scripts

```bash
npm run dev     # local development
npm run build   # production build
npm run start   # run production server
npm run lint    # lint checks
npm test        # vitest suite
```

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional Firebase Analytics
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

3. Start the app:

```bash
npm run dev
```

## Runtime integrations

- `GET /api/google-services/status` powers the live Google Services panel.
- Analytics events are sent through `src/lib/google-services.ts`.
- API resource loading is cached with a 5-minute client TTL (`src/hooks/use-api-resource.ts`).

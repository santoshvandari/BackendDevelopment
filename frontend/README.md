# Survey Builder & Analytics - Frontend (Next.js)

A clean, production-grade survey application built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Features

- **Survey Dashboard**: Browse surveys with paginated lists, response counts, and direct links.
- **Survey Builder / Editor**:
  - Question types: Text, Single Select, Multi Select, Rating (1–5).
  - Add, remove, and reorder questions.
  - Mark questions as required.
  - Conditional question logic (e.g. show question if previous question matches trigger value).
- **Public Survey Form**:
  - Dynamic question rendering based on schema.
  - Client-side validation for required fields on visible questions.
- **Analytics Dashboard**:
  - Total submission counts.
  - Per-question breakdown (distribution bars for ratings, response counts for choices, list view for text).
- **Admin Authentication**: JWT-based login, cookie credentials support.

## Environment Variables

Configure backend API target in `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

All `/api/*` requests in Next.js are routed through the Next.js rewrite proxy configured in `next.config.js`.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   npm run start
   ```

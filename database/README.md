# Database Files

- `schema.sql` — Full table structure (auto-generated from Drizzle ORM)
- `seed.sql`   — All current data (students, results, uploaded PDFs)

## How to import on Render (after deploying)

In the Render dashboard → your web service → **Shell** tab, run:

```bash
# 1. Push schema via Drizzle (creates tables)
pnpm --filter @workspace/db run push

# 2. Import existing data
psql "$DATABASE_URL" -f database/seed.sql
```

Or from your local machine if you have psql installed:

```bash
psql "YOUR_RENDER_DATABASE_URL" -f database/seed.sql
```

The Render database URL is found in:
Render Dashboard → your database → **Connection** → **External Database URL**

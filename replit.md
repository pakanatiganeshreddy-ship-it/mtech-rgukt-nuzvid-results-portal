# RGUKT M.Tech Results Portal

A student results portal for RGUKT (Rajiv Gandhi University of Knowledge Technologies) M.Tech students. Students log in to view their semester-wise grades and SGPA; admins upload result PDFs and manage student records.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- PDF parsing: pdf-parse (externalized in esbuild)
- File upload: multer

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `lib/db/src/schema/` — DB schema (students.ts, results.ts, pdfUploads.ts)
- `artifacts/api-server/src/routes/` — API route handlers (auth, students, results, admin)
- `artifacts/api-server/src/middlewares/requireAuth.ts` — auth middleware
- `artifacts/student-portal/src/` — React frontend
- `artifacts/api-server/uploads/` — uploaded PDF files (runtime)

## Architecture decisions

- Session-based auth with express-session. Student role vs admin role. Admin credentials are hardcoded (admin/admin123). Student passwords stored as plain text (per spec: default is 123456).
- pdf-parse is externalized in esbuild build (not bundled) because it has ESM/CJS issues.
- SGPA is computed server-side per semester, CGPA is a weighted average across semesters.
- Students are auto-created during PDF upload using the student ID, branch, and batch from the PDF.
- Results path `/api/results/student/:studentId` is separate from `/api/students/:studentId/results` — the former is mounted under the results router.

## Product

- Student Login: Student ID + password (default: 123456)
- Student Dashboard: semester results, subject grades, SGPA per semester, CGPA
- Admin Login: admin / admin123
- Admin Dashboard: stats, upload PDFs, view students, view all results
- PDF Upload: auto-extracts results and auto-creates student records

## Grading Scheme

EX=10, A=9, B=8, C=7, D=6, E=5, Fail=0

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- pdf-parse must be in `external` array in `artifacts/api-server/build.mjs`
- `createRequire` is used to import pdf-parse in admin.ts (ESM workaround)
- Always run codegen after OpenAPI spec changes
- Student results route is `/api/results/student/:studentId`, not `/api/students/:studentId/results`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

# Legacy Evaluation Deprecation Plan (SESS)

## Canonical model (Unified Evaluation Pipeline)
- **Primary source of truth:** `HumanEvaluation` + `EvaluationRound` + `EvaluationRubric`
- **Judge workspace (read/write):** `/api/v1/evaluator/*`
  - `GET /api/v1/evaluator/assignments`
  - `GET /api/v1/evaluator/workspace/:evaluationId`
  - `GET /api/v1/evaluator/summary/:evaluationId`
  - `POST /api/v1/evaluator/submit/:evaluationId` (`actionType: DRAFT|SUBMIT`)
- **Admin assignment (creates `HumanEvaluation` DRAFT):** `POST /api/v1/admin/evaluations/assign`
  - body: `{ evaluationRoundId, projectId, evaluatorId, rubricVersionId? }`
  - auto-creates `Notification` for judge with link `/judge/evaluations/:evaluationId`

## Legacy endpoints (deprecated, adapter-only)
Project-centric rubric scoring using `EvaluationSubmission` (criterion-row model):
- `POST /api/v1/projects/:projectId/judges` *(admin assigns panel; adapter may sync to `HumanEvaluation`)*
- `POST /api/v1/projects/:projectId/evaluation/scores` *(judge submits one criterion score; adapter may sync to `HumanEvaluation`)*
- `GET /api/v1/projects/:projectId/evaluation` *(summary based on legacy model)*

**Deprecation signals now enabled**
- `@deprecated` annotations in routes/controllers/services
- Middleware `legacyEvaluationMiddleware` logs `console.warn` and sets headers:
  - `X-Legacy-Evaluation-Endpoint: true`
  - `X-Unified-Evaluation-Pipeline: HumanEvaluation`

## Migration (safe first)
Service: `backend/src/services/evaluationMigrationService.js`
- `migrateLegacyEvaluationSubmissions({ actor, req, dryRun: true, limit })`

Admin API (JWT + ADMIN):
- `POST /api/v1/admin/evaluations/migrations/evaluation-submissions/dry-run`
  - body: `{ "dryRun": true, "limit": 0 }` (default `dryRun=true`)
- **Dry-run guarantees:** no writes to `HumanEvaluation`, no `EvaluationSubmission` flag updates, no fallback `EvaluationRound` creation, no migration audit logs.
- Returns detailed JSON report: scanned/grouped rows, mapping preview, would-create/would-update counts, warnings, errors.

Execution run (after review): same endpoint with `{ "dryRun": false }`.

## Client migration guide
1. **Assignment UI/Admin clients**: stop using `POST /projects/:projectId/judges` for new judge workspace assignments; use `POST /admin/evaluations/assign` with explicit `evaluationRoundId`.
2. **Judge scoring UI**: use `/api/v1/evaluator/*` only (already canonical). Do not submit criterion rows to legacy endpoint.
3. **Reporting clients**: migrate from `GET /projects/:projectId/evaluation` to unified summaries (`/api/v1/evaluator/summary/:evaluationId` per judge evaluation; add admin/round aggregates as needed from `HumanEvaluation`).
4. **Data cleanup (later)**: after dry-run review + production migration verification, freeze legacy writes, then remove `EvaluationSubmission`-specific paths and adapter sync code.

## Rollout safety
- Keep legacy endpoints temporarily (adapter mode) until all external/internal clients migrate.
- Monitor deprecation warning logs and `X-Legacy-Evaluation-Endpoint` responses.
- Do not delete `EvaluationSubmission` collection/model until migration completeness and reconciliation checks pass.
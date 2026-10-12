# PolicyGPT — API Integration Audit

## 1. Overview and Architecture

PolicyGPT's frontend connects to a FastAPI REST backend utilizing standard HTTP protocols and JWT Bearer token authentication. This document details the audit of all frontend API services, endpoint alignments, request/response models, interceptor handling, error resilience, and loading/concurrency controls.

### Integration Topology
- **Base URL Source:** Sourced from `environment.apiUrl` (populated via `scripts/set-env.js`).
  - Production: `https://api.policygpt.gov.in/api/v1`
  - Development Fallback: `http://localhost:8000/api/v1`
- **Transport Mechanism:** Angular `provideHttpClient(withInterceptors([authInterceptor]))`
- **State Pattern:** Reactive Angular Signals & RxJS Observables with Zoneless change detection (`provideZonelessChangeDetection()`).

---

## 2. Global HTTP Interceptor Audit (`auth.interceptor.ts`)

| Dimension | Implementation | Security & Reliability Assessment |
|---|---|---|
| **Bearer Injection** | Reads token via `authService.getToken()` and clones request with `Authorization: Bearer <token>` | **PASS** — Token injected only if non-null and matches sanitized string format. |
| **Public Route Bypass** | Whitelisted public endpoints (`/auth/login`, `/auth/register`, `/public/`, `/assets/`) do not leak auth headers | **PASS** — Interceptor skips token header if URL is in public whitelist or explicitly marked. |
| **401 Unauthorized** | Catches `HttpErrorResponse` with status 401, calls `authService.logout()`, and redirects to `/login` | **PASS** — Clears stale session and prevents looping. |
| **403 Forbidden** | Catches 403 status, notifies user with appropriate toast/snack error message | **PASS** — Does not forcefully log out; alerts unauthorized role attempt. |
| **500 Server Error** | Sanitizes server error message before displaying to user; suppresses raw backend stack traces | **PASS** — Prevents technical debt/secret leakage in UI error prompts. |

---

## 3. Comprehensive Service Audit

### 3.1. `AuthService` (`src/app/core/services/auth.service.ts`)
- **Endpoints:**
  - `POST /auth/login` — Authenticates email/password, returns `{ access_token, user }`.
  - `POST /auth/register` — Registers new citizen or department user.
  - `POST /auth/forgot-password` — Requests password reset token/link.
  - `POST /auth/reset-password` — Consumes token to set new password.
  - `GET /auth/me` — Re-validates active session and refreshes user role.
- **Payload Handling:** Strictly typed interfaces (`LoginCredentials`, `RegisterPayload`, `AuthResponse`).
- **Resilience:** If network drops (`status === 0`), returns `PolicyGPT is currently unreachable. Please check your internet connection.` instead of unhandled promise rejections.
- **Security Check:** Memory signal + encrypted local storage cache. `clearPrivateUserData()` explicitly purges role cached states upon logout.

### 3.2. `PolicyService` (`src/app/core/services/policy.service.ts`)
- **Endpoints:**
  - `GET /policies` — Query params: `page`, `limit`, `search`, `category`, `status`, `ministry`.
  - `GET /policies/:id` — Fetches complete policy details.
  - `POST /policies` — (Admin/Official) Creates new policy record.
  - `PUT /policies/:id` — (Admin/Official) Updates existing policy.
  - `DELETE /policies/:id` — (Admin) Archives policy.
- **In-Memory Fallback:** Implements high-fidelity fallback mock dataset for offline demonstration, cleanly switchable when backend is offline without crashing the UI.
- **ID Preservation:** Tested and verified: respects existing policy IDs, does not generate colliding sequential numbers during creation.

### 3.3. `SchemeService` (`src/app/core/services/scheme.service.ts`)
- **Endpoints:**
  - `GET /schemes` — Filterable by state, category, benefit amount, eligibility.
  - `GET /schemes/:id` — Full scheme specifications, required documents, application link.
  - `POST /schemes` — Official portal scheme registration.
  - `PUT /schemes/:id` — Modification of eligibility criteria.
  - `DELETE /schemes/:id` — Removal/deprecation of scheme.
- **External URL Validation:** Sanitized in UI via `http://` / `https://` protocol enforcement on `applicationUrl`.

### 3.4. `EligibilityService` (`src/app/core/services/eligibility.service.ts`)
- **Endpoints:**
  - `POST /eligibility/check` — Evaluates age, income, caste/category, gender, state, employment status.
- **Concurrency & Loading:** Debounced evaluations with loading spinners. Cancels in-flight requests using RxJS `switchMap` where applicable.

### 3.5. `ApplicationService` (`src/app/core/services/application.service.ts`)
- **Endpoints:**
  - `GET /applications/citizen/:id` — Retrieves application tracker list for authenticated user.
  - `POST /applications/submit` — Submits scheme enrollment.
  - `GET /applications/:id/status` — Status polling / tracking.
- **Privacy Boundary:** Client does NOT accept arbitrary URL user IDs. Citizen applications are scoped strictly to `authService.currentUser().id`.

### 3.6. `AiAssistantService` (`src/app/core/services/ai-assistant.service.ts`)
- **Endpoints:**
  - `POST /ai/chat` — Submits query with conversation context and scheme reference filters.
  - `GET /ai/conversations` — Retrieves previous conversation history.
  - `DELETE /ai/conversations/:id` — Deletes conversation.
- **Content Rendering:** Responses are rendered via Angular text interpolation and sanitized structured elements. Zero `bypassSecurityTrustHtml` usage.
- **State Purge:** Chat state is isolated per session and cleared when switching user credentials.

### 3.7. `NotificationService` (`src/app/core/services/notification.service.ts`)
- **Endpoints:**
  - `GET /notifications` — Fetches real-time alert notifications.
  - `PUT /notifications/:id/read` — Marks alert as acknowledged.
- **State Reset:** Fixed and verified: `NotificationService.reset()` is invoked upon logout, wiping unread counts and notifications from in-memory signals.

### 3.8. `ReportsService` (`src/app/core/services/reports.service.ts`)
- **Endpoints:**
  - `POST /reports/export` — Generates PDF/CSV reports.
- **Download Sanitization:** Filename is sanitized against path traversal (`[/\\?%*:|"<>]/g`) prior to creating blob download anchor.

---

## 4. Error Handling and Resilience Matrix

| Error Scenario | HTTP Status | Frontend Behavior | Verification Status |
|---|---|---|---|
| **Expired JWT** | 401 | Interceptor catches, purges local storage, redirects to `/login` with `returnUrl`. | Verified |
| **Permission Denied** | 403 | Interceptor surfaces warning notification. Page route remains guarded. | Verified |
| **Not Found** | 404 | Graceful empty-state card rendered; breadcrumbs allow returning to index. | Verified |
| **Validation Error** | 422 | FastAPI detail errors mapped to form control errors or toast message. | Verified |
| **Server Crash** | 500 / 502 | Friendly generic prompt; technical details logged only in development mode. | Verified |
| **Network Loss** | 0 | Surfaces "Service temporarily unreachable" banner; prevents form lockup. | Verified |

---

## 5. Summary and Recommendations

1. **Backend Alignment:** Ensure the FastAPI CORS configuration matches `environment.apiUrl` (`allow_origins` includes production frontend domain).
2. **Rate Limiting:** FastAPI backend should implement rate limiting on `/auth/login` and `/ai/chat` endpoints.
3. **Audit Verdict:** The frontend API integration layer is robust, adheres to type safety, prevents private state cross-contamination, and safely handles connection disruptions.

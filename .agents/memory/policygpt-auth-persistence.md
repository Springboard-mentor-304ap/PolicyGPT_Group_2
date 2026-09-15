---
name: PolicyGPT auth and persistence
description: Durable constraints for the PolicyGPT authentication and PostgreSQL setup.
---

PolicyGPT's browser client should rely on Clerk's same-origin session cookies; bearer-token wiring is for mobile clients, not this web artifact. The PostgreSQL seed must run during API startup rather than waiting for an authenticated request.

**Why:** An unauthenticated landing page cannot trigger protected API routes, so request-triggered seeding leaves a newly created database empty. Clerk's managed web flow also expects its canonical proxy/provider wiring and cookie transport.

**How to apply:** Keep the API proxy before body parsers, mount `clerkMiddleware` before protected routes, enforce authorization server-side, and make startup initialization idempotent.
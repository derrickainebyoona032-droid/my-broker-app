# Online Broker Uganda

A rental directory with public browsing, owner self-service submissions, photo uploads and operator review.

## Included
- Location, monthly UGX budget and bedroom filters, price sorting, saved homes and shareable property dialogs.
- Six clearly labeled fictional examples, retained until actual owner-approved properties are provided.
- Sign in with ChatGPT to submit and manage properties.
- Actual photo upload (JPEG/PNG/WebP, up to 5 MB) to R2; durable property records in D1.
- Operator approval or changes-requested feedback before publication.
- Owner edits return a property to review; withdrawal removes it from the public directory immediately.
- Availability, last-confirmed date, deposit, advance rent, utilities and public owner contact.
- Direct enquiry preparation through WhatsApp, telephone or email. Visitors review and send in their own app.
- Support WhatsApp: 0701897800 (+256701897800). This is support, separate from each listing's owner contact.

## Run and check
Use Node 24+ and npm ci. Run npm run check for TypeScript and regression tests, and npm run build for the production Worker. See OPERATIONS.md for local database migrations, preview authentication, review access, limits and publishing.

The current operator allowlist uses derrickainebyoona032@gmail.com, checked against Sites' authenticated identity on the server. No passwords or secrets are stored in this repository.

## Deployment
Preserve the existing public Sites project declared in .openai/hosting.json. This version requires a Worker, DB and BUCKET bindings; a static-only deployment does not support submissions. Sites handles hosted authentication and provisions storage during publication.

Source-access credentials returned expired during this work, so a live deployment has not been verified. Use the supported Sites workflow after source access is repaired; never bypass credential validation.

## First real property
No real property was added. Supply owner-approved facts and photographs later, or submit them through the self-service form once the full-stack deployment is live. Keep example labels on fictional records. External Unsplash photos are illustrative and must not stand in for actual property photos.

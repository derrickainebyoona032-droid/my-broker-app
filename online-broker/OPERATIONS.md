# Online Broker Uganda operations

## Owner workflow
1. Open **List a property** and sign in with ChatGPT.
2. Supply actual property details, monthly UGX rent, deposit, advance and utilities.
3. Upload one actual JPEG, PNG or WebP photograph, up to 5 MB.
4. Confirm authority and publication permission, then submit for review.
5. Return to **Your properties** to see review feedback, edit, update availability, or withdraw.

Each edit hides the previous public version and returns the property to review. Withdrawing removes it immediately. Property records survive sessions and devices through D1; photos are held in R2. Saved homes remain browser-local.

## Operator workflow
Open /review and sign in using the site operator account derrickainebyoona032@gmail.com. The server enforces this allowlist on every review operation. Owners cannot approve themselves or edit other owners' records.

Check property authenticity, authority to list, permission to publish photos and contact details, current availability, rent and tenancy terms before approval. Approval publishes the details, photograph and owner contact. Request changes with feedback to send the submission back to the owner dashboard.

Support contact: +256701897800 (0701897800 in Uganda). No WhatsApp messages are sent automatically.

## Local setup
Use Node 24 or newer (Node's built-in SQLite is used by the regression suite), npm ci, then npm run db:generate only after changing db/schema.ts. Commit generated SQL and Drizzle metadata. Never edit applied migrations.

Run npm run check and npm run build. Apply each pending SQL file once to the local database with:

    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/<migration>.sql

Run npm run dev for the local preview. The bundled portable starter simulates ChatGPT sign-in on loopback as seedy@sites.test. That identity can submit and edit its own properties but cannot use the production operator review page. Review authorization is covered by the API integration suite using isolated in-memory SQLite and test identities.

## Deployment
The retained Sites project is appgprj_6ad3d13b66708191850184d7fec39b98, with its existing public audience. .openai/hosting.json declares DB and BUCKET. This is now a full-stack Worker app: publishing just the previous dist folder to a static host will not support submissions.

Use the Sites source workflow to open the existing source repository, reconcile changes, push, build and package, then save and deploy the exact pushed commit. Sites provisions D1/R2 and applies migrations. Never commit source credentials or bypass credential-expiry validation.

Publication is not established by a successful local build or GitHub pull request. Verify a successful deployment result and then check production sign-in, an owner submission, photo access and operator review. No real property or contact delivery has been tested yet.

## Initial limits
Owners can manage 20 properties and upload 60 photos per account. Pending listings and photos are private to the submitting owner and operator. The public feed contains up to 500 approved listings; the review queue shows the oldest 100 pending submissions. These limits suit the initial directory and need pagination / retention controls as usage grows. There are no payments, bookings, automated owner verification or background notifications.

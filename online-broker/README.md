# Online Broker Uganda — first version

A responsive, buildless rental directory. Open `dist/index.html` or serve `dist/` with a static web server. For a local preview with Node, from this folder run `node preview.cjs`, then visit http://127.0.0.1:4173.

## Included
- Six clearly marked fictional example listings across Uganda.
- Location search, monthly UGX budget and bedroom filters, price sorting and empty results.
- Property detail dialogs with shareable URL fragments, amenities, floor area and tenancy information.
- Saved homes stored in the visitor's browser; no account required.
- Owner contact flow for real records: prepare a message, then open WhatsApp, telephone or email. Visitors review and send in their own app. No messages or visitor contact details are stored by the site.
- Responsive layouts, labeled forms, keyboard focus indicators, native modal dialogs and renting guidance.

## Add actual properties
Edit `dist/listings.js`. Replace fictional records with owner-approved details and photos. Each record needs a unique URL-safe `id`, title, area, city, type, numeric beds/baths/rent/size, amenities array, advance terms, description, photo, owner, phone/email and example flag.

`photo` is currently an Unsplash photo identifier; replace the `photo()` helper in `dist/app.js` if hosting your own images. Do not represent these illustrative photographs as actual property photographs.

Set `example:false` only for real listings. Supply a phone in international E.164 format (starting +256 for Uganda) and/or a valid owner email. Real records with no valid contact remain unavailable for enquiry. Confirm the owner's permission to publish their contact details. There is no self-service owner submission or backend in this release; the operator updates and deploys the data file.

## Verification
JavaScript syntax checks passed. Logic checks passed for location, budget, empty results, saved homes, detail route, blocked example contact, valid WhatsApp/call links and rejected invalid phone values. Browser checks confirmed search and property details. Actual delivery to an owner has not been tested because no real contacts were supplied. Browser preview loaded successfully after its initial navigation timeout. Full mobile visual QA has not been completed.

## Publishing status
The existing public Sites project is retained in `.openai/hosting.json`. No deployment or source sync completed: Sites returned already-expired source credentials twice. The helper rejected the credential before any repository access. Credential expiry returned about 2026-10-19 18:42 UTC while the local clock was about 2026-10-20 03:32 UTC. A fresh valid credential is required to open the existing source repository, reconcile this implementation with any existing source, package and deploy through the Sites workflow. Do not bypass credential validation.

For another static host, publish the contents of `dist/`. No build step or secrets are required. Keep the example labels until all example listings are replaced. Remove the static preview/demo labels in index.html when the directory contains actual listings only.

External resources: Unsplash images and Google Fonts load over the network; system font fallbacks are provided. Replace with approved local assets if desired before launch.

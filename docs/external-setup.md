# External setup checklist

Items that require human credentials / business decisions before production:

| Item | Status in repo | Action required |
|------|----------------|-----------------|
| MongoDB Atlas cluster | Not provisioned | Create DB + set `MONGODB_URI` |
| Redis | Optional local fallback | Provision for production multi-instance |
| Cloudinary | Server-ready, secrets missing | Create cloud + set env |
| Vercel projects | Config documented | Connect Git + domains |
| Railway (or similar) API host | Dockerfile provided | Deploy + env |
| Domain DNS | Documented | Point heybrewkhi.com / admin / api |
| Real menu & prices | Seed uses mockup-illustrative prices | Replace with authoritative HeyBrew menu |
| Branches & delivery zones | Demo seed | Configure real areas/fees |
| WhatsApp number | Placeholder in seed | Set in Store Settings |
| Contact / hours / policies | Placeholders | Configure in admin |
| Tax | Disabled until configured | Enable only with correct rates |
| Online payments | Interface stub only | Integrate provider + webhooks before showing UI |
| Transactional email/SMS | Not included as required | Optional later |
| Error monitoring (Sentry etc.) | Hook points only | Add DSN when ready |
| Load test on staging | Procedure documented | Run and record measured results |
| Legal pages (privacy/terms) | Stub routes | Replace with counsel-approved copy |

Do not invent completed integrations or production guarantees.

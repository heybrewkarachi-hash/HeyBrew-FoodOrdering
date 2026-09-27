# Dependency versions (installed)

Recorded from the monorepo lockfile at initial implementation. Prefer `package-lock.json` as source of truth.

| Package | Workspace | Version range |
|---------|-----------|---------------|
| next | client, admin | ^15.2.x |
| react / react-dom | client, admin | ^19.0.0 |
| typescript | all | ^5.8.x |
| tailwindcss | client, admin | ^3.4.x |
| @tanstack/react-query | client, admin | ^5.x |
| react-hook-form | client, admin | ^7.54.x |
| zod | shared, all | ^3.24.x |
| express | server | ^4.21.x |
| mongoose | server | ^8.12.x |
| socket.io | server | ^4.8.x |
| ioredis | server | ^5.5.x |
| bcrypt | server | ^5.1.x |
| helmet | server | ^8.x |
| cloudinary | server | (installed) |
| vitest | server | ^3.0.x |

Node engine: `>=20`

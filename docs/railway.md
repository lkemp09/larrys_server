# Railway

This repository is connected to Railway.

- Railway service URL: https://larrysserver-production.up.railway.app/
- Railway project environment: `production`
- App service: `larrys_server`
- Database service: `Postgres`
- GitHub repo connected to Railway: `lkemp09/larrys_server`
- Connected branch: `main`
- Railway auto-deploys when changes are pushed to GitHub.

The Node app starts with `npm start`, which runs `node server.js`. The server reads the port from `process.env.PORT` and falls back to `3000` for local use.

The Railway app service has a `DATABASE_URL` variable configured for PostgreSQL access. The PostgreSQL password / connection secret is stored locally in the repository's `passwords/` directory, currently `passwords/passwords.txt`.

Both `larrys_server` and `Postgres` must have Railway's serverless / sleep-application setting enabled while the project is on the Free plan. A redeploy of an older PostgreSQL deployment can reuse its previous non-serverless manifest and fail; after changing the setting, deploy the database from its current image/source so the new setting is included.

The `passwords/` directory is intended for local-only secrets and should stay out of Git.

The business license search app queries Railway PostgreSQL directly through `DATABASE_URL` and uses schema `bus_lic`.

Use `docs/postgres.md` for PostgreSQL conventions.

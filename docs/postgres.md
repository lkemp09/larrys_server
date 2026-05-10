# PostgreSQL Instructions

This project uses PostgreSQL for subprojects that need a database.

Each new subproject that needs database storage must use its own PostgreSQL schema. Do not mix unrelated subproject tables in the same schema.

Use schema names that clearly match the subproject name, using lowercase words and underscores.

The business license search app uses the `bus_lic` schema. Its seed data is loaded from `data/business-licenses/BusinessLicenseDownload.csv` with:

```bash
npm run import:business-licenses
```

Example:

```sql
CREATE SCHEMA business_license_search;
```

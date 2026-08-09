# PostgreSQL Instructions

This project uses PostgreSQL for subprojects that need a database.

Each new subproject that needs database storage must use its own PostgreSQL schema. Do not mix unrelated subproject tables in the same schema.

Use schema names that clearly match the subproject name, using lowercase words and underscores.

The business license search app uses the `bus_lic` schema. Its seed data is loaded from `data/business-licenses/BusinessLicenseDownload.csv` with:

```bash
npm run import:business-licenses
```

The Alaska Ferry Days app uses the `alaska_ferry` schema. Its published AMHS schedule data is refreshed from the State of Alaska calendar with:

```bash
npm run import:alaska-ferry
```

The ferry importer currently loads departures from August 1, 2026 through April 30, 2027. Use `npm run import:alaska-ferry -- --dry-run` to download and validate the source schedule without changing PostgreSQL.

Example:

```sql
CREATE SCHEMA business_license_search;
```

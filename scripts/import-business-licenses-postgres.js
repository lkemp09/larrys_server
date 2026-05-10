const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");
const { Pool } = require("pg");

const rootDir = path.join(__dirname, "..");
const defaultCsvPath = path.join(rootDir, "data", "business-licenses", "BusinessLicenseDownload.csv");
const schemaName = "bus_lic";
const tableName = "business_licenses";
const batchSize = 1000;

const columns = [
  "owners",
  "license_number",
  "business_name",
  "status",
  "issue_date",
  "renew_date",
  "expire_date",
  "has_telemedicine",
  "physical_city",
  "physical_country",
  "physical_line1",
  "physical_line2",
  "physical_state",
  "physical_zip",
  "physical_zip_plus",
  "mailing_city",
  "mailing_country",
  "mailing_line1",
  "mailing_line2",
  "mailing_state",
  "mailing_zip",
  "mailing_zip_plus",
];

const expectedHeaders = [
  "Owners",
  "LicenseNumber",
  "BusinessName",
  "Status",
  "IssueDate",
  "RenewDate",
  "ExpireDate",
  "HasTelemedicine",
  "PhysicalCity",
  "PhysicalCountry",
  "PhysicalLine1",
  "PhysicalLine2",
  "PhysicalState",
  "PhysicalZip",
  "PhysicalZipPlus",
  "MailingCity",
  "MailingCountry",
  "MailingLine1",
  "MailingLine2",
  "MailingState",
  "MailingZip",
  "MailingZipPlus",
];

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"") {
      if (quoted && next === "\"") {
        field += "\"";
        index++;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      fields.push(field);
      field = "";
      continue;
    }

    field += char;
  }

  fields.push(field);
  return fields;
}

function emptyToNull(value) {
  return value === "" ? null : value;
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (!match) {
    return null;
  }

  const [, month, day, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeRow(fields) {
  return [
    emptyToNull(fields[0]),
    fields[1] ? Number(fields[1]) : null,
    emptyToNull(fields[2]),
    emptyToNull(fields[3]),
    parseDate(fields[4]),
    parseDate(fields[5]),
    parseDate(fields[6]),
    emptyToNull(fields[7]),
    emptyToNull(fields[8]),
    emptyToNull(fields[9]),
    emptyToNull(fields[10]),
    emptyToNull(fields[11]),
    emptyToNull(fields[12]),
    emptyToNull(fields[13]),
    emptyToNull(fields[14]),
    emptyToNull(fields[15]),
    emptyToNull(fields[16]),
    emptyToNull(fields[17]),
    emptyToNull(fields[18]),
    emptyToNull(fields[19]),
    emptyToNull(fields[20]),
    emptyToNull(fields[21]),
  ];
}

async function createSchema(client) {
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${schemaName}.${tableName} (
      id bigserial PRIMARY KEY,
      owners text,
      license_number integer,
      business_name text,
      status text,
      issue_date date,
      renew_date date,
      expire_date date,
      has_telemedicine text,
      physical_city text,
      physical_country text,
      physical_line1 text,
      physical_line2 text,
      physical_state text,
      physical_zip text,
      physical_zip_plus text,
      mailing_city text,
      mailing_country text,
      mailing_line1 text,
      mailing_line2 text,
      mailing_state text,
      mailing_zip text,
      mailing_zip_plus text
    )
  `);

  const indexes = [
    `CREATE INDEX IF NOT EXISTS business_licenses_license_number_idx ON ${schemaName}.${tableName} (license_number)`,
    `CREATE INDEX IF NOT EXISTS business_licenses_business_name_idx ON ${schemaName}.${tableName} (business_name)`,
    `CREATE INDEX IF NOT EXISTS business_licenses_status_idx ON ${schemaName}.${tableName} (status)`,
    `CREATE INDEX IF NOT EXISTS business_licenses_physical_city_idx ON ${schemaName}.${tableName} (physical_city)`,
    `CREATE INDEX IF NOT EXISTS business_licenses_physical_state_idx ON ${schemaName}.${tableName} (physical_state)`,
  ];

  for (const sql of indexes) {
    await client.query(sql);
  }
}

async function insertBatch(client, rows) {
  if (!rows.length) {
    return;
  }

  const values = [];
  const groups = rows.map((row, rowIndex) => {
    const placeholders = row.map((value, columnIndex) => {
      values.push(value);
      return `$${rowIndex * columns.length + columnIndex + 1}`;
    });
    return `(${placeholders.join(", ")})`;
  });

  await client.query(
    `INSERT INTO ${schemaName}.${tableName} (${columns.join(", ")}) VALUES ${groups.join(", ")}`,
    values,
  );
}

async function main() {
  const csvPath = path.resolve(getArg("csv", defaultCsvPath));
  const shouldTruncate = !process.argv.includes("--no-truncate");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
  });

  const client = await pool.connect();
  let importedRows = 0;

  try {
    await client.query("BEGIN");
    await createSchema(client);

    if (shouldTruncate) {
      await client.query(`TRUNCATE TABLE ${schemaName}.${tableName} RESTART IDENTITY`);
    }

    const stream = fs.createReadStream(csvPath);
    const reader = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let headersChecked = false;
    let batch = [];

    for await (const line of reader) {
      const fields = parseCsvLine(line);

      if (!headersChecked) {
        if (fields.join("|") !== expectedHeaders.join("|")) {
          throw new Error(`Unexpected CSV headers. Found: ${fields.join(", ")}`);
        }
        headersChecked = true;
        continue;
      }

      if (fields.length !== expectedHeaders.length) {
        throw new Error(`Unexpected field count on data row ${importedRows + 2}: ${fields.length}`);
      }

      batch.push(normalizeRow(fields));

      if (batch.length >= batchSize) {
        await insertBatch(client, batch);
        importedRows += batch.length;
        console.log(`Imported ${importedRows} rows...`);
        batch = [];
      }
    }

    await insertBatch(client, batch);
    importedRows += batch.length;
    await client.query("COMMIT");
    console.log(JSON.stringify({ schema: schemaName, table: tableName, importedRows }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

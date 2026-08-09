const { Pool } = require("pg");

const schemaName = "alaska_ferry";
const sourceBase = "https://dot.alaska.gov/oars/reservations";
const months = [
  "September 2026",
  "October 2026",
  "November 2026",
  "December 2026",
  "January 2027",
  "February 2027",
  "March 2027",
  "April 2027",
];

const ports = {
  AKU: "Akutan", ANB: "Annette Bay", ANG: "Angoon", BEL: "Bellingham, WA", CBY: "Cold Bay",
  CDV: "Cordova", CHB: "Chenega Bay", CHG: "Chignik", FPS: "False Pass",
  GUS: "Gustavus", HNH: "Hoonah", HNS: "Haines", HOM: "Homer",
  JNU: "Juneau / Auke Bay", KAE: "Kake", KCV: "King Cove", KOD: "Kodiak",
  KTN: "Ketchikan", MET: "Metlakatla", OLD: "Old Harbor", ORI: "Port Lions",
  OUZ: "Ouzinkie", PEL: "Pelican", PSG: "Petersburg", RUP: "Prince Rupert, BC",
  SDP: "Sand Point", SDV: "Seldovia", SGY: "Skagway", SIT: "Sitka",
  TAT: "Tatitlek", TKE: "Tenakee", UNA: "Dutch Harbor", VDZ: "Valdez",
  WRG: "Wrangell", WTR: "Whittier", YAK: "Yakutat",
};

const vesselCodes = {
  "M/V Aurora": "AUR",
  "M/V Columbia": "COL",
  "M/V Hubbard": "HUB",
  "M/V Kennicott": "KEN",
  "M/V LeConte": "LEC",
  "M/V Lituya": "LIT",
  "M/V Tazlina": "TAZ",
  "M/V Tustumena": "TUS",
};

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractSpan(html, idPrefix) {
  const pattern = new RegExp(`<span[^>]+id=["']${idPrefix}[^"']*["'][^>]*>([\\s\\S]*?)<\\/span>`, "i");
  const match = pattern.exec(html);
  return match ? decodeHtml(match[1].replace(/<[^>]+>/g, "").trim()) : "";
}

function calendarUrl(month) {
  const query = new URLSearchParams({
    selectMonth: month,
    selectPort: "All Ports",
    selectVessel: "All Vessels",
    action: "Get Schedule",
  });
  return `${sourceBase}/CalendarFM.amhsf?${query}`;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "LarrysServer-FerryScheduleImporter/1.0" },
  });
  if (!response.ok) {
    throw new Error(`AMHS request failed (${response.status}): ${url}`);
  }
  return response.text();
}

function parseScheduleIds(html) {
  return [...new Set([...html.matchAll(/data-sch=["'](\d+)["']/g)].map((match) => match[1]))];
}

function parseLocalTimestamp(dateText, timeText) {
  const match = /^(?:\w{3},\s+)?(\w{3})\s+(\d{1,2}),\s+(\d{4})$/.exec(dateText);
  const timeMatch = /^(\d{1,2}):(\d{2})\s+([AP]M)$/i.exec(timeText);
  if (!match || !timeMatch) {
    throw new Error(`Unexpected AMHS date or time: ${dateText} ${timeText}`);
  }

  const monthNumber = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  }[match[1]];
  let hour = Number(timeMatch[1]) % 12;
  if (timeMatch[3].toUpperCase() === "PM") hour += 12;
  return `${match[3]}-${monthNumber}-${match[2].padStart(2, "0")} ${String(hour).padStart(2, "0")}:${timeMatch[2]}:00`;
}

function parseDetails(html, scheduleId) {
  const vesselName = extractSpan(html, "vessel");
  const vesselCode = vesselCodes[vesselName];
  if (!vesselCode) {
    throw new Error(`Unknown vessel for schedule ${scheduleId}: ${vesselName}`);
  }

  const events = [...html.matchAll(/<tr\s+class=["'](Dp|Ar)["'][^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((match) => ({
      type: extractSpan(match[2], "seEventType"),
      port: extractSpan(match[2], "seCtyName"),
      timestamp: parseLocalTimestamp(
        extractSpan(match[2], "seDate"),
        extractSpan(match[2], "seTime"),
      ),
      status: extractSpan(match[2], "seStatus"),
    }));

  const sailings = [];
  for (let departureIndex = 0; departureIndex < events.length; departureIndex++) {
    const departure = events[departureIndex];
    if (departure.type !== "Dp" || departure.status !== "ACTIVE") continue;

    for (let arrivalIndex = departureIndex + 1; arrivalIndex < events.length; arrivalIndex++) {
      const arrival = events[arrivalIndex];
      if (arrival.type !== "Ar" || arrival.status !== "ACTIVE" || arrival.port === departure.port) continue;
      sailings.push({
        scheduleId,
        vesselCode,
        vesselName,
        fromPort: departure.port,
        toPort: arrival.port,
        departureAt: departure.timestamp,
        arrivalAt: arrival.timestamp,
      });
    }
  }
  return sailings;
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

async function downloadSchedule() {
  const idsByMonth = await mapWithConcurrency(months, 4, async (month) => {
    const html = await fetchText(calendarUrl(month));
    const ids = parseScheduleIds(html);
    console.log(`${month}: ${ids.length} published vessel schedules`);
    return ids;
  });
  const scheduleIds = [...new Set(idsByMonth.flat())];
  const details = await mapWithConcurrency(scheduleIds, 6, async (scheduleId) => {
    const url = `${sourceBase}/CalendarDetailsPG.amhsf?sailingId=${encodeURIComponent(scheduleId)}`;
    return parseDetails(await fetchText(url), scheduleId);
  });

  const unique = new Map();
  for (const sailing of details.flat()) {
    const date = sailing.departureAt.slice(0, 10);
    if (date < "2026-09-01" || date > "2027-04-30") continue;
    const key = [sailing.scheduleId, sailing.fromPort, sailing.toPort, sailing.departureAt, sailing.arrivalAt].join("|");
    unique.set(key, sailing);
  }
  return [...unique.values()].sort((a, b) => a.departureAt.localeCompare(b.departureAt));
}

async function createSchema(client) {
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${schemaName}.ports (
      code text PRIMARY KEY CHECK (code ~ '^[A-Z]{3}$'),
      name text NOT NULL
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${schemaName}.vessels (
      code text PRIMARY KEY CHECK (code ~ '^[A-Z]{3}$'),
      name text NOT NULL
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${schemaName}.sailings (
      id bigserial PRIMARY KEY,
      schedule_id text NOT NULL,
      vessel_code text NOT NULL REFERENCES ${schemaName}.vessels(code),
      from_port text NOT NULL REFERENCES ${schemaName}.ports(code),
      to_port text NOT NULL REFERENCES ${schemaName}.ports(code),
      departure_at timestamp without time zone NOT NULL,
      arrival_at timestamp without time zone NOT NULL,
      source_url text NOT NULL,
      UNIQUE (schedule_id, from_port, to_port, departure_at, arrival_at)
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${schemaName}.import_runs (
      id bigserial PRIMARY KEY,
      imported_at timestamptz NOT NULL DEFAULT now(),
      first_departure date NOT NULL,
      last_departure date NOT NULL,
      sailing_count integer NOT NULL
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS sailings_route_departure_idx ON ${schemaName}.sailings (from_port, to_port, departure_at)`);
  await client.query(`CREATE INDEX IF NOT EXISTS sailings_departure_idx ON ${schemaName}.sailings (departure_at)`);
}

async function insertSailings(client, sailings) {
  const batchSize = 250;
  for (let start = 0; start < sailings.length; start += batchSize) {
    const batch = sailings.slice(start, start + batchSize);
    const values = [];
    const groups = batch.map((sailing, rowIndex) => {
      const base = rowIndex * 7;
      values.push(
        sailing.scheduleId, sailing.vesselCode, sailing.fromPort, sailing.toPort,
        sailing.departureAt, sailing.arrivalAt,
        `${sourceBase}/CalendarDetailsPG.amhsf?sailingId=${sailing.scheduleId}`,
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
    });
    await client.query(`
      INSERT INTO ${schemaName}.sailings
        (schedule_id, vessel_code, from_port, to_port, departure_at, arrival_at, source_url)
      VALUES ${groups.join(", ")}
    `, values);
  }
}

async function importSchedule(sailings) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
  });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await createSchema(client);
    await client.query(`TRUNCATE TABLE ${schemaName}.sailings RESTART IDENTITY`);

    for (const [code, name] of Object.entries(ports)) {
      await client.query(`
        INSERT INTO ${schemaName}.ports (code, name) VALUES ($1, $2)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      `, [code, name]);
    }
    for (const [name, code] of Object.entries(vesselCodes)) {
      await client.query(`
        INSERT INTO ${schemaName}.vessels (code, name) VALUES ($1, $2)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      `, [code, name]);
    }
    await insertSailings(client, sailings);
    await client.query(`
      INSERT INTO ${schemaName}.import_runs (first_departure, last_departure, sailing_count)
      VALUES ($1, $2, $3)
    `, [sailings[0].departureAt.slice(0, 10), sailings.at(-1).departureAt.slice(0, 10), sailings.length]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  const sailings = await downloadSchedule();
  const unknownPorts = [...new Set(sailings.flatMap((sailing) => [sailing.fromPort, sailing.toPort]))]
    .filter((code) => !ports[code]);
  if (unknownPorts.length) throw new Error(`Unknown port codes: ${unknownPorts.join(", ")}`);
  if (!sailings.length) throw new Error("No active sailings were found.");

  const summary = {
    sailingCount: sailings.length,
    firstDeparture: sailings[0].departureAt,
    lastDeparture: sailings.at(-1).departureAt,
    routes: new Set(sailings.map((sailing) => `${sailing.fromPort}-${sailing.toPort}`)).size,
  };
  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }
  await importSchedule(sailings);
  console.log(JSON.stringify({ ...summary, schema: schemaName }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

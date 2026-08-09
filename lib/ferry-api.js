const { Pool } = require("pg");

let pool;

function sendJson(response, statusCode, value) {
  const body = Buffer.from(JSON.stringify(value));
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
    });
  }

  return pool;
}

function parsePort(value, label) {
  const code = String(value || "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) {
    throw new Error(`${label} must be a three-letter port code.`);
  }
  return code;
}

function parseMonth(value) {
  const month = String(value || "").trim();
  if (month && !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("Month must use YYYY-MM format.");
  }
  return month;
}

async function getPorts(response) {
  const database = getPool();
  const [portsResult, monthsResult, importResult] = await Promise.all([
    database.query(`
      SELECT p.code, p.name
      FROM alaska_ferry.ports p
      WHERE EXISTS (
        SELECT 1 FROM alaska_ferry.sailings s WHERE s.from_port = p.code
      )
      ORDER BY p.name
    `),
    database.query(`
      SELECT
        to_char(date_trunc('month', departure_at), 'YYYY-MM') AS value,
        to_char(date_trunc('month', departure_at), 'FMMonth YYYY') AS label
      FROM alaska_ferry.sailings
      GROUP BY date_trunc('month', departure_at)
      ORDER BY date_trunc('month', departure_at)
    `),
    database.query(`
      SELECT imported_at AS "importedAt", sailing_count AS "sailingCount"
      FROM alaska_ferry.import_runs
      ORDER BY imported_at DESC
      LIMIT 1
    `),
  ]);

  sendJson(response, 200, {
    ports: portsResult.rows,
    months: monthsResult.rows,
    lastImport: importResult.rows[0] || null,
  });
}

async function getDestinations(response, searchParams) {
  const from = parsePort(searchParams.get("from"), "Departure port");
  const month = parseMonth(searchParams.get("month"));
  const values = [from];
  let monthSql = "";

  if (month) {
    values.push(month);
    monthSql = `AND to_char(s.departure_at, 'YYYY-MM') = $${values.length}`;
  }

  const result = await getPool().query(`
    SELECT DISTINCT p.code, p.name
    FROM alaska_ferry.sailings s
    JOIN alaska_ferry.ports p ON p.code = s.to_port
    WHERE s.from_port = $1
      ${monthSql}
    ORDER BY p.name
  `, values);

  sendJson(response, 200, { destinations: result.rows });
}

async function getSailings(response, searchParams) {
  const from = parsePort(searchParams.get("from"), "Departure port");
  const to = parsePort(searchParams.get("to"), "Destination port");
  const month = parseMonth(searchParams.get("month"));
  const values = [from, to];
  let monthSql = "";

  if (month) {
    values.push(month);
    monthSql = `AND to_char(s.departure_at, 'YYYY-MM') = $${values.length}`;
  }

  const result = await getPool().query(`
    SELECT
      s.schedule_id AS "scheduleId",
      s.vessel_code AS "vesselCode",
      v.name AS vessel,
      s.from_port AS "fromCode",
      origin.name AS "fromName",
      s.to_port AS "toCode",
      destination.name AS "toName",
      to_char(s.departure_at, 'YYYY-MM-DD') AS "departureDate",
      to_char(s.departure_at, 'HH24:MI') AS "departureTime",
      to_char(s.arrival_at, 'YYYY-MM-DD') AS "arrivalDate",
      to_char(s.arrival_at, 'HH24:MI') AS "arrivalTime",
      round(extract(epoch FROM (s.arrival_at - s.departure_at)) / 60)::int AS "durationMinutes"
    FROM alaska_ferry.sailings s
    JOIN alaska_ferry.vessels v ON v.code = s.vessel_code
    JOIN alaska_ferry.ports origin ON origin.code = s.from_port
    JOIN alaska_ferry.ports destination ON destination.code = s.to_port
    WHERE s.from_port = $1
      AND s.to_port = $2
      ${monthSql}
    ORDER BY s.departure_at, s.arrival_at
  `, values);

  sendJson(response, 200, { sailings: result.rows });
}

async function handleFerryApi(request, requestUrl, response, routeParts) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    if (routeParts[0] === "ports" && routeParts.length === 1) {
      await getPorts(response);
      return;
    }

    if (routeParts[0] === "destinations" && routeParts.length === 1) {
      await getDestinations(response, requestUrl.searchParams);
      return;
    }

    if (routeParts[0] === "sailings" && routeParts.length === 1) {
      await getSailings(response, requestUrl.searchParams);
      return;
    }

    sendJson(response, 404, { error: "Ferry API endpoint not found." });
  } catch (error) {
    const statusCode = /must (be|use)/.test(error.message) ? 400 : 500;
    sendJson(response, statusCode, { error: error.message });
  }
}

module.exports = { handleFerryApi };

const form = document.querySelector("#filters");
const clearFilters = document.querySelector("#clearFilters");
const results = document.querySelector("#results");
const count = document.querySelector("#count");

function field(value) {
  return value == null ? "" : String(value);
}

function escapeHtml(value) {
  return field(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function address(row, prefix) {
  const line1 = field(row[`${prefix}Line1`]);
  const line2 = field(row[`${prefix}Line2`]);
  const city = field(row[`${prefix}City`]);
  const state = field(row[`${prefix}State`]);
  const zip = field(row[`${prefix}Zip`]);
  return [line1, line2, [city, state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

function renderRows(data) {
  count.textContent = `${data.returned} of ${data.total.toLocaleString()} shown`;
  if (!data.rows.length) {
    results.innerHTML = "<p class='empty'>No matching licenses found.</p>";
    return;
  }

  results.innerHTML = data.rows.map((row) => `
    <article class="license">
      <div class="license-main">
        <h2>${escapeHtml(row.businessName)}</h2>
        <span class="badge">${escapeHtml(row.status)}</span>
      </div>
      <dl>
        <div><dt>License</dt><dd>${escapeHtml(row.licenseNumber)}</dd></div>
        <div><dt>Owner</dt><dd>${escapeHtml(row.owners)}</dd></div>
        <div><dt>Expires</dt><dd>${escapeHtml(row.expireDate)}</dd></div>
        <div><dt>Telemedicine</dt><dd>${escapeHtml(row.hasTelemedicine)}</dd></div>
        <div><dt>Physical</dt><dd>${escapeHtml(address(row, "physical"))}</dd></div>
        <div><dt>Mailing</dt><dd>${escapeHtml(address(row, "mailing"))}</dd></div>
      </dl>
    </article>
  `).join("");
}

async function search() {
  count.textContent = "Searching...";
  results.innerHTML = "";
  const params = new URLSearchParams(new FormData(form));
  const response = await fetch(`/api/licenses?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    count.textContent = "Error";
    results.innerHTML = `<p class="warning">${escapeHtml(data.error || "Query failed.")}</p>`;
    return;
  }

  renderRows(data);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  search();
});

clearFilters.addEventListener("click", () => {
  form.reset();
  search();
});

search();

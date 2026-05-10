const form = document.querySelector("#filters");
const clearFilters = document.querySelector("#clearFilters");
const results = document.querySelector("#results");
const count = document.querySelector("#count");
const openAddDrawer = document.querySelector("#openAddDrawer");
const drawerBackdrop = document.querySelector("#drawerBackdrop");
const addDrawer = document.querySelector("#addDrawer");
const editDrawer = document.querySelector("#editDrawer");
const addLicenseForm = document.querySelector("#addLicenseForm");
const editLicenseForm = document.querySelector("#editLicenseForm");
const addFormMessage = document.querySelector("#addFormMessage");
const editFormMessage = document.querySelector("#editFormMessage");
const apiBase = window.BUSINESS_LICENSE_API_BASE || "";
const currentRows = new Map();
let activeDrawer = null;

const editableFields = [
  "businessName",
  "licenseNumber",
  "status",
  "owners",
  "issueDate",
  "renewDate",
  "expireDate",
  "hasTelemedicine",
  "physicalLine1",
  "physicalLine2",
  "physicalCity",
  "physicalState",
  "physicalZip",
  "physicalZipPlus",
  "physicalCountry",
  "mailingLine1",
  "mailingLine2",
  "mailingCity",
  "mailingState",
  "mailingZip",
  "mailingZipPlus",
  "mailingCountry",
];

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

function pdfRow(label, value) {
  return `
    <div class="pdf-row">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>
  `;
}

function openLicensePdf(row) {
  const pdfWindow = window.open("", "_blank");
  if (!pdfWindow) {
    alert("Please allow popups to create the PDF.");
    return;
  }

  const physicalAddress = address(row, "physical");
  const mailingAddress = address(row, "mailing");
  const generatedDate = new Date().toLocaleDateString();

  pdfWindow.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Business License Record ${escapeHtml(row.licenseNumber)}</title>
  <style>
    @page { margin: 0.65in; }
    * { box-sizing: border-box; }
    body {
      color: #18211f;
      font-family: "Segoe UI", Arial, sans-serif;
      margin: 0;
    }
    .document {
      border: 2px solid #173f35;
      min-height: 9.7in;
      padding: 34px;
    }
    header {
      align-items: center;
      border-bottom: 1px solid #b9c4bf;
      display: flex;
      gap: 22px;
      padding-bottom: 20px;
    }
    .record-mark {
      align-items: center;
      border: 2px solid #173f35;
      border-radius: 50%;
      color: #173f35;
      display: flex;
      flex: 0 0 auto;
      font-size: 11px;
      font-weight: 800;
      height: 92px;
      justify-content: center;
      line-height: 1.25;
      padding: 10px;
      text-align: center;
      text-transform: uppercase;
      width: 92px;
    }
    h1 {
      font-size: 30px;
      line-height: 1.1;
      margin: 0 0 8px;
    }
    .subtitle {
      color: #54615c;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.04em;
      margin: 0;
      text-transform: uppercase;
    }
    .notice {
      background: #fff7e8;
      border: 1px solid #e9c681;
      margin: 24px 0;
      padding: 12px 14px;
    }
    dl {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin: 0;
    }
    .pdf-row {
      border-bottom: 1px solid #d8dfdc;
      min-height: 58px;
      padding-bottom: 10px;
    }
    .pdf-row.wide {
      grid-column: 1 / -1;
    }
    dt {
      color: #6a756f;
      font-size: 11px;
      font-weight: 800;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    dd {
      font-size: 17px;
      margin: 0;
      overflow-wrap: anywhere;
    }
    footer {
      border-top: 1px solid #b9c4bf;
      color: #54615c;
      font-size: 12px;
      margin-top: 34px;
      padding-top: 12px;
    }
    @media print {
      button { display: none; }
    }
  </style>
</head>
<body>
  <section class="document">
    <header>
      <div class="record-mark">Alaska<br>Business<br>Record</div>
      <div>
        <p class="subtitle">Business License Record Copy</p>
        <h1>${escapeHtml(row.businessName)}</h1>
        <p>Generated ${escapeHtml(generatedDate)}</p>
      </div>
    </header>
    <p class="notice">Unofficial record copy generated from Larry's Server. This document is not issued by the State of Alaska and is not a substitute for an official state business license.</p>
    <dl>
      ${pdfRow("License Number", row.licenseNumber)}
      ${pdfRow("Status", row.status)}
      ${pdfRow("Owner", row.owners)}
      ${pdfRow("Telemedicine", row.hasTelemedicine)}
      ${pdfRow("Issue Date", row.issueDate)}
      ${pdfRow("Renew Date", row.renewDate)}
      ${pdfRow("Expire Date", row.expireDate)}
      ${pdfRow("Physical Address", physicalAddress)}
      ${pdfRow("Mailing Address", mailingAddress)}
    </dl>
    <footer>Source schema: bus_lic.business_licenses. Record id: ${escapeHtml(row.id)}.</footer>
  </section>
  <script>
    window.addEventListener("load", () => {
      window.print();
    });
  </script>
</body>
</html>`);
  pdfWindow.document.close();
}

function openDrawer(drawer) {
  closeDrawer();
  activeDrawer = drawer;
  drawerBackdrop.hidden = false;
  drawer.setAttribute("aria-hidden", "false");
  drawer.classList.add("open");
}

function closeDrawer() {
  if (activeDrawer) {
    activeDrawer.setAttribute("aria-hidden", "true");
    activeDrawer.classList.remove("open");
  }

  activeDrawer = null;
  drawerBackdrop.hidden = true;
  addFormMessage.textContent = "";
  editFormMessage.textContent = "";
}

function formPayload(targetForm) {
  const data = new FormData(targetForm);
  const payload = {};

  for (const name of editableFields) {
    payload[name] = data.get(name) || "";
  }

  payload.physicalState = payload.physicalState.toUpperCase();
  payload.mailingState = payload.mailingState.toUpperCase();
  return payload;
}

function fillLicenseForm(targetForm, row) {
  for (const name of editableFields) {
    const control = targetForm.elements[name];
    if (control) {
      control.value = field(row[name]);
    }
  }
}

function renderRows(data) {
  currentRows.clear();
  count.textContent = `${data.returned} of ${data.total.toLocaleString()} shown`;
  if (!data.rows.length) {
    results.innerHTML = "<p class='empty'>No matching licenses found.</p>";
    return;
  }

  results.innerHTML = data.rows.map((row) => {
    currentRows.set(String(row.id), row);

    return `
      <article class="license">
        <div class="license-main">
          <h2>${escapeHtml(row.businessName)}</h2>
          <div class="license-tools">
            <span class="badge">${escapeHtml(row.status)}</span>
            <button type="button" class="secondary pdf-license" data-license-id="${escapeHtml(row.id)}">PDF</button>
            <button type="button" class="secondary edit-license" data-license-id="${escapeHtml(row.id)}">Edit</button>
          </div>
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
    `;
  }).join("");
}

async function search() {
  count.textContent = "Searching...";
  results.innerHTML = "";
  const params = new URLSearchParams(new FormData(form));
  const response = await fetch(`${apiBase}/api/licenses?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    count.textContent = "Error";
    results.innerHTML = `<p class="warning">${escapeHtml(data.error || "Query failed.")}</p>`;
    return;
  }

  renderRows(data);
}

async function saveLicense(targetForm, url, method, messageElement) {
  messageElement.textContent = "Saving...";
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formPayload(targetForm)),
  });
  const data = await response.json();

  if (!response.ok) {
    messageElement.textContent = data.error || "Save failed.";
    return;
  }

  closeDrawer();
  await search();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  search();
});

clearFilters.addEventListener("click", () => {
  form.reset();
  search();
});

openAddDrawer.addEventListener("click", () => {
  addLicenseForm.reset();
  addLicenseForm.elements.status.value = "Active";
  addLicenseForm.elements.hasTelemedicine.value = "No";
  addLicenseForm.elements.physicalCountry.value = "UNITED STATES";
  addLicenseForm.elements.mailingCountry.value = "UNITED STATES";
  openDrawer(addDrawer);
  addLicenseForm.elements.businessName.focus();
});

results.addEventListener("click", (event) => {
  const pdfButton = event.target.closest(".pdf-license");
  if (pdfButton) {
    const row = currentRows.get(pdfButton.dataset.licenseId);
    if (row) {
      openLicensePdf(row);
    }
    return;
  }

  const button = event.target.closest(".edit-license");
  if (!button) {
    return;
  }

  const row = currentRows.get(button.dataset.licenseId);
  if (!row) {
    return;
  }

  editLicenseForm.reset();
  editLicenseForm.elements.id.value = row.id;
  fillLicenseForm(editLicenseForm, row);
  openDrawer(editDrawer);
  editLicenseForm.elements.businessName.focus();
});

addLicenseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveLicense(addLicenseForm, `${apiBase}/api/licenses`, "POST", addFormMessage);
});

editLicenseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = editLicenseForm.elements.id.value;
  saveLicense(editLicenseForm, `${apiBase}/api/licenses/${encodeURIComponent(id)}`, "PUT", editFormMessage);
});

drawerBackdrop.addEventListener("click", closeDrawer);

document.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-drawer]")) {
    closeDrawer();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDrawer();
  }
});

search();

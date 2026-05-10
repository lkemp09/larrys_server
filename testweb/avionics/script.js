const budgetSelect = document.querySelector("#budgetSelect");
const missionSelect = document.querySelector("#missionSelect");
const autopilotToggle = document.querySelector("#autopilotToggle");
const certifiedToggle = document.querySelector("#certifiedToggle");
const optionGrid = document.querySelector("#optionGrid");
const cardCount = document.querySelector("#cardCount");
const solutionTitle = document.querySelector("#solutionTitle");
const solutionSummary = document.querySelector("#solutionSummary");
const solutionList = document.querySelector("#solutionList");
const valueScore = document.querySelector("#valueScore");
const integrationScore = document.querySelector("#integrationScore");
const growthScore = document.querySelector("#growthScore");
const previewPfd = document.querySelector("#previewPfd");
const previewNav = document.querySelector("#previewNav");
const previewBackup = document.querySelector("#previewBackup");
const previewAutopilot = document.querySelector("#previewAutopilot");
const previewPanel = document.querySelector("#previewPanel");
const pfdDisplay = document.querySelector("#pfdDisplay");
const mfdDisplay = document.querySelector("#mfdDisplay");
const radioStack = document.querySelector("#radioStack");
const backupInstrument = document.querySelector("#backupInstrument");
const autopilotHead = document.querySelector("#autopilotHead");
const systemForm = document.querySelector("#systemForm");
const priceTableBody = document.querySelector("#priceTableBody");
const equipmentTotal = document.querySelector("#equipmentTotal");
const installTotal = document.querySelector("#installTotal");
const systemTotal = document.querySelector("#systemTotal");
const configTotalPill = document.querySelector("#configTotalPill");
const navigatorPriceBody = document.querySelector("#navigatorPriceBody");

const currency = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "USD",
});

const options = [
  {
    name: "G3X Touch Certified",
    vendor: "Garmin",
    role: "PFD / MFD core",
    price: "$8k-$20k equipment",
    category: "primary",
    certified: true,
    ifr: true,
    autopilot: true,
    value: 8,
    integration: 10,
    growth: 9,
    budgetFit: { lean: 5, medium: 9, capable: 10 },
    summary: "Best all-Garmin foundation for a modern single-engine panel, especially if GFC 500 autopilot is in scope.",
    tags: ["touchscreen", "synthetic vision", "engine data", "Garmin ecosystem"],
    source: "https://www.garmin.com/en-US/newsroom/press-release/aviation/2020-garmin-receives-easa-approval-of-the-g3x-touch-flight-display-in-single-engine-piston-aircraft/",
  },
  {
    name: "SkyView HDX",
    vendor: "Dynon",
    role: "PFD / MFD core",
    price: "$7k-$18k equipment",
    category: "primary",
    certified: true,
    ifr: true,
    autopilot: true,
    value: 10,
    integration: 8,
    growth: 8,
    budgetFit: { lean: 7, medium: 10, capable: 8 },
    summary: "High value integrated glass option with broad certified-aircraft approval and strong display ergonomics.",
    tags: ["high value", "engine data", "ADS-B options", "approved models vary"],
    source: "https://www.dynoncertified.com/",
  },
  {
    name: "Evolution E5",
    vendor: "Aspen",
    role: "PFD / HSI retrofit",
    price: "$5k-$12k equipment",
    category: "primary",
    certified: true,
    ifr: true,
    autopilot: false,
    value: 8,
    integration: 7,
    growth: 8,
    budgetFit: { lean: 8, medium: 8, capable: 6 },
    summary: "Efficient glass upgrade for legacy panels when keeping existing radios and minimizing panel surgery matters.",
    tags: ["legacy friendly", "scalable", "round-gauge replacement"],
    source: "https://aspenavionics.com/products/general-aviation/evolution-e5-primary-flight-display/",
  },
  {
    name: "GI 275",
    vendor: "Garmin",
    role: "Round-gauge glass instrument",
    price: "$4k-$9k each",
    category: "backup",
    certified: true,
    ifr: true,
    autopilot: true,
    value: 7,
    integration: 9,
    growth: 8,
    budgetFit: { lean: 6, medium: 8, capable: 9 },
    summary: "Compact certified instrument that can serve many roles, including standby, CDI, HSI, engine, or primary functions.",
    tags: ["3-inch hole", "flexible roles", "Garmin ecosystem"],
    source: "https://www.garmin.com/en-US/newsroom/press-release/aviation/2020-garmin-reimagines-aircraft-flight-instrumentation/",
  },
  {
    name: "G5",
    vendor: "Garmin",
    role: "Budget attitude / HSI",
    price: "$3k-$7k each",
    category: "backup",
    certified: true,
    ifr: true,
    autopilot: true,
    value: 9,
    integration: 9,
    growth: 6,
    budgetFit: { lean: 9, medium: 8, capable: 6 },
    summary: "A common budget Garmin path for replacing vacuum instruments and supporting GFC 500 installs.",
    tags: ["budget Garmin", "backup", "vacuum removal"],
    source: "https://static.garmin.com/pumac/190-01112-12_d.pdf",
  },
  {
    name: "AV-30-C",
    vendor: "uAvionix",
    role: "Digital attitude / DG",
    price: "$2k-$5k each",
    category: "backup",
    certified: true,
    ifr: true,
    autopilot: false,
    value: 9,
    integration: 6,
    growth: 5,
    budgetFit: { lean: 10, medium: 7, capable: 4 },
    summary: "Low-disruption digital replacement for legacy 3-inch instruments when panel preservation is the priority.",
    tags: ["lowest disruption", "round-gauge look", "vacuum replacement"],
    source: "https://uavionix.com/product/av-30-certified/",
  },
  {
    name: "AeroVue Touch",
    vendor: "BendixKing",
    role: "PFD glass display",
    price: "$6k-$15k equipment",
    category: "primary",
    certified: true,
    ifr: true,
    autopilot: false,
    value: 7,
    integration: 7,
    growth: 7,
    budgetFit: { lean: 6, medium: 7, capable: 7 },
    summary: "Touch PFD path that can pair with existing Garmin, Avidyne, BendixKing, or legacy navigation equipment.",
    tags: ["touch PFD", "works with retained navigators", "STC dependent"],
    source: "https://www.bendixking.com/en/products/ifd/integrated-flight-decks/aerovue-touch",
  },
  {
    name: "IFD 440 / 540",
    vendor: "Avidyne",
    role: "IFR GPS / NAV / COM",
    price: "$12k-$20k equipment",
    category: "navigator",
    certified: true,
    ifr: true,
    autopilot: false,
    value: 7,
    integration: 7,
    growth: 8,
    budgetFit: { lean: 4, medium: 8, capable: 9 },
    summary: "IFR navigator option for pilots who want touchscreen GPS capability without an all-Garmin stack.",
    tags: ["IFR navigator", "touchscreen", "mixable"],
    source: "https://www.avidyne.com/ifd/",
  },
  {
    name: "GTN Xi / GPS 175 family",
    vendor: "Garmin",
    role: "IFR GPS / NAV / COM",
    price: "$6k-$18k equipment",
    category: "navigator",
    certified: true,
    ifr: true,
    autopilot: true,
    value: 8,
    integration: 10,
    growth: 9,
    budgetFit: { lean: 5, medium: 9, capable: 10 },
    summary: "The easiest integration path if the rest of the panel leans Garmin or autopilot coupling is central.",
    tags: ["IFR navigator", "strong integration", "common shop support"],
    source: "https://www.garmin.com/en-US/c/aviation/general-aviation/gps-nav-comm/",
  },
  {
    name: "GFC 500",
    vendor: "Garmin",
    role: "Digital autopilot",
    price: "$8k-$20k equipment",
    category: "autopilot",
    certified: true,
    ifr: true,
    autopilot: true,
    value: 8,
    integration: 10,
    growth: 8,
    budgetFit: { lean: 3, medium: 9, capable: 10 },
    summary: "Often the biggest workload-reduction upgrade, but it pulls the panel toward Garmin compatibility choices.",
    tags: ["workload reduction", "IFR", "model approval required"],
    source: "https://www.garmin.com/en-US/p/604257",
  },
  {
    name: "Pro Pilot",
    vendor: "Trio",
    role: "Digital autopilot",
    price: "$7k-$16k equipment",
    category: "autopilot",
    certified: true,
    ifr: true,
    autopilot: true,
    value: 9,
    integration: 7,
    growth: 7,
    budgetFit: { lean: 7, medium: 10, capable: 8 },
    summary: "Affordable certified autopilot path for legacy aircraft, with STC/model coverage and navigator/display integration that must be checked carefully.",
    tags: ["legacy aircraft", "value autopilot", "STC dependent"],
    source: "https://trioautopilots.com/aircraft-compatibility/",
  },
];

const solutionProfiles = {
  lean: {
    title: "Lean glass refresh",
    categories: ["backup", "navigator"],
    summary: "Keep the panel simple: replace weak vacuum instruments, add or retain a legal IFR navigator if needed, and avoid a full panel rebuild.",
  },
  medium: {
    title: "Balanced IFR retrofit",
    categories: ["primary", "navigator", "backup", "autopilot"],
    summary: "Best medium-budget value: modern primary glass, an IFR navigator, a small independent backup, and autopilot only if the approval path is clean.",
  },
  capable: {
    title: "Capable cross-country panel",
    categories: ["primary", "navigator", "backup", "autopilot"],
    summary: "Spend more on integration and future growth: a coherent primary display, navigator, backup instrument, and digital autopilot stack.",
  },
};

const configCategories = [
  {
    id: "primary",
    label: "Primary display",
    defaultChoice: "dynon-hdx",
    choices: [
      { id: "dynon-hdx", label: "Dynon SkyView HDX 10-inch", equipment: [12000, 19000], install: [8000, 16000] },
      { id: "garmin-g3x", label: "Garmin G3X Touch Certified", equipment: [14000, 24000], install: [10000, 20000] },
      { id: "aspen-e5", label: "Aspen Evolution E5", equipment: [6000, 10000], install: [5000, 10000] },
      { id: "bendixking-aerovue", label: "BendixKing AeroVue Touch", equipment: [7000, 15000], install: [6000, 14000] },
      { id: "retain-primary", label: "Retain existing primary instruments", equipment: [0, 0], install: [0, 1500] },
    ],
  },
  {
    id: "backup",
    label: "Backup instrument",
    defaultChoice: "garmin-g5",
    choices: [
      { id: "garmin-g5", label: "Garmin G5 backup", equipment: [3000, 5500], install: [2500, 5500] },
      { id: "garmin-gi275", label: "Garmin GI 275", equipment: [4500, 8500], install: [3000, 7000] },
      { id: "uavionix-av30", label: "uAvionix AV-30-C", equipment: [2200, 4500], install: [2000, 5000] },
      { id: "dynon-d30", label: "Dynon D30 standby", equipment: [2500, 4500], install: [2000, 4500] },
      { id: "none-backup", label: "No backup change", equipment: [0, 0], install: [0, 0] },
    ],
  },
  {
    id: "navigator",
    label: "IFR GPS / navigator",
    defaultChoice: "none-navigator",
    choices: [
      { id: "garmin-gps175", label: "Garmin GPS 175", equipment: [5500, 7500], install: [5000, 10000] },
      { id: "garmin-gnc355", label: "Garmin GNC 355 GPS/COM", equipment: [8000, 10500], install: [6000, 12000] },
      { id: "garmin-gtn650xi", label: "Garmin GTN 650Xi", equipment: [14000, 18000], install: [8000, 16000] },
      { id: "avidyne-ifd440", label: "Avidyne IFD 440", equipment: [13000, 17000], install: [7000, 15000] },
      { id: "none-navigator", label: "Retain existing navigator", equipment: [0, 0], install: [0, 1500] },
    ],
  },
  {
    id: "com",
    label: "COM radio",
    defaultChoice: "val-com",
    choices: [
      { id: "val-com", label: "VAL Avionics COM", equipment: [1600, 2800], install: [1800, 4500] },
      { id: "garmin-gtr200", label: "Garmin GTR 200", equipment: [1800, 3000], install: [1800, 4500] },
      { id: "trig-ty96", label: "Trig TY96", equipment: [2200, 3400], install: [2000, 5000] },
      { id: "none-com", label: "Retain existing COM", equipment: [0, 0], install: [0, 1000] },
    ],
  },
  {
    id: "transponder",
    label: "Transponder / ADS-B",
    defaultChoice: "stratus-esg",
    choices: [
      { id: "stratus-esg", label: "Appareo Stratus ESG", equipment: [3000, 4500], install: [2500, 5500] },
      { id: "garmin-gnx375", label: "Garmin GNX 375 GPS/Xpdr", equipment: [8500, 10500], install: [6500, 12500] },
      { id: "trig-tt31", label: "Trig TT31", equipment: [2500, 4000], install: [2500, 5500] },
      { id: "none-transponder", label: "Retain existing transponder", equipment: [0, 0], install: [0, 1500] },
    ],
  },
  {
    id: "autopilot",
    label: "Autopilot",
    defaultChoice: "trio-pro",
    choices: [
      { id: "trio-pro", label: "Trio Pro Pilot", equipment: [7500, 14000], install: [8000, 18000] },
      { id: "garmin-gfc500", label: "Garmin GFC 500", equipment: [9000, 18000], install: [10000, 22000] },
      { id: "dynon-autopilot", label: "Dynon autopilot components", equipment: [5000, 10000], install: [7000, 16000] },
      { id: "none-autopilot", label: "No autopilot", equipment: [0, 0], install: [0, 0] },
    ],
  },
  {
    id: "engine",
    label: "Engine monitor / extras",
    defaultChoice: "dynon-eis",
    choices: [
      { id: "dynon-eis", label: "Dynon engine monitoring", equipment: [2500, 6500], install: [3500, 9000] },
      { id: "jpi-edm900", label: "JPI EDM 900", equipment: [5500, 8500], install: [4500, 10000] },
      { id: "ei-cgr30p", label: "Electronics International CGR-30P", equipment: [4500, 7500], install: [4500, 10000] },
      { id: "none-engine", label: "No engine monitor change", equipment: [0, 0], install: [0, 0] },
    ],
  },
];

const navigatorAveragePrices = [
  {
    name: "Garmin GPS 175",
    type: "IFR WAAS GPS",
    equipment: [5500, 7500],
    install: [5000, 10000],
  },
  {
    name: "Garmin GNC 355",
    type: "IFR WAAS GPS / COM",
    equipment: [8000, 10500],
    install: [6000, 12000],
  },
  {
    name: "Garmin GNX 375",
    type: "IFR WAAS GPS / ADS-B transponder",
    equipment: [8500, 10500],
    install: [6500, 12500],
  },
  {
    name: "Garmin GTN 650Xi",
    type: "IFR GPS / NAV / COM / MFD",
    equipment: [14000, 18000],
    install: [8000, 16000],
  },
  {
    name: "Avidyne IFD 440",
    type: "IFR FMS / GPS / NAV / COM",
    equipment: [13000, 17000],
    install: [7000, 15000],
  },
  {
    name: "BendixKing AeroNav 800",
    type: "IFR GPS / NAV / COM",
    equipment: [12000, 17000],
    install: [7000, 15000],
  },
];

function getSettings() {
  return {
    budget: budgetSelect.value,
    mission: missionSelect.value,
    wantsAutopilot: autopilotToggle.checked,
    certifiedOnly: certifiedToggle.checked,
  };
}

function scoreOption(option, settings) {
  let score = option.value * 1.4 + option.integration + option.growth * 0.8 + option.budgetFit[settings.budget] * 1.5;

  if (settings.mission !== "vfr" && option.ifr) {
    score += 7;
  }

  if (settings.mission === "vfr" && option.category === "backup") {
    score += 5;
  }

  if (settings.wantsAutopilot && option.autopilot) {
    score += 7;
  }

  if (settings.certifiedOnly && !option.certified) {
    score -= 100;
  }

  return score;
}

function getVisibleOptions(settings) {
  return options
    .filter((option) => !settings.certifiedOnly || option.certified)
    .map((option) => ({ ...option, score: scoreOption(option, settings) }))
    .sort((a, b) => b.score - a.score);
}

function getBestByCategory(visibleOptions, category) {
  return visibleOptions.find((option) => option.category === category);
}

function getRecommendedSolution(settings, visibleOptions) {
  const profile = solutionProfiles[settings.budget];
  const categories = profile.categories.filter((category) => settings.wantsAutopilot || category !== "autopilot");
  const picks = categories.map((category) => getBestByCategory(visibleOptions, category)).filter(Boolean);

  return { ...profile, picks };
}

function renderMeter(label, value) {
  return `
    <div class="meter">
      <span>${label}</span>
      <div class="meter-bar"><span style="width: ${value * 10}%"></span></div>
    </div>
  `;
}

function renderOptions(visibleOptions) {
  cardCount.textContent = `${visibleOptions.length} options`;
  optionGrid.innerHTML = visibleOptions.map((option) => {
    return `
      <article class="option-card">
        <header>
          <span class="vendor-line">${option.vendor} · ${option.role}</span>
          <h3>${option.name}</h3>
          <div class="tags">${option.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
        </header>
        <p>${option.summary}</p>
        <div class="metric-row">
          ${renderMeter("Value", option.value)}
          ${renderMeter("Integration", option.integration)}
          ${renderMeter("Growth", option.growth)}
        </div>
        <footer>
          <span class="price">${option.price}</span>
          <a class="source-link" href="${option.source}">Source</a>
        </footer>
      </article>
    `;
  }).join("");
}

function renderSolution(solution) {
  solutionTitle.textContent = solution.title;
  solutionSummary.textContent = solution.summary;
  solutionList.innerHTML = solution.picks.map((pick) => {
    return `
      <li>
        <strong>${pick.vendor} ${pick.name}</strong>
        <span>${pick.role}: ${pick.summary}</span>
      </li>
    `;
  }).join("");

  const average = (key) => {
    const total = solution.picks.reduce((sum, pick) => sum + pick[key], 0);
    return Math.round(total / Math.max(solution.picks.length, 1));
  };

  valueScore.textContent = average("value");
  integrationScore.textContent = average("integration");
  growthScore.textContent = average("growth");

  const primary = solution.picks.find((pick) => pick.category === "primary");
  const navigator = solution.picks.find((pick) => pick.category === "navigator");
  const backup = solution.picks.find((pick) => pick.category === "backup");
  const autopilot = solution.picks.find((pick) => pick.category === "autopilot");

  previewPfd.textContent = primary ? `${primary.vendor} ${primary.name}` : "Retain primary six-pack";
  previewNav.textContent = navigator ? `${navigator.vendor} ${navigator.name}` : "Retain existing navigator";
  previewBackup.textContent = backup ? `${backup.vendor} ${backup.name}` : "Standby";
  previewAutopilot.textContent = autopilot ? `${autopilot.vendor} ${autopilot.name}` : "Autopilot optional";

  updatePanelVisuals({ primary, navigator, backup, autopilot });
}

function getProductClass(option) {
  if (!option) {
    return "product-retained";
  }

  if (option.name.includes("SkyView")) {
    return "product-dynon";
  }

  if (option.name.includes("Evolution")) {
    return "product-aspen";
  }

  if (option.name.includes("AV-30")) {
    return "product-uavionix";
  }

  if (option.name.includes("AeroVue")) {
    return "product-bendixking";
  }

  if (option.name.includes("IFD")) {
    return "product-avidyne";
  }

  if (option.name.includes("GFC")) {
    return "product-gfc";
  }

  if (option.vendor === "Trio") {
    return "product-trio";
  }

  if (option.vendor === "Garmin") {
    return "product-garmin";
  }

  return `product-${option.vendor.toLowerCase()}`;
}

function setProductClass(element, option) {
  element.classList.remove(
    "product-retained",
    "product-garmin",
    "product-dynon",
    "product-aspen",
    "product-uavionix",
    "product-bendixking",
    "product-avidyne",
    "product-gfc",
    "product-trio",
  );
  element.classList.add(getProductClass(option));
}

function updatePanelVisuals({ primary, navigator, backup, autopilot }) {
  setProductClass(previewPanel, primary);
  setProductClass(pfdDisplay, primary);
  setProductClass(mfdDisplay, primary);
  setProductClass(radioStack, navigator);
  setProductClass(backupInstrument, backup);
  setProductClass(autopilotHead, autopilot);
}

function formatRange(range) {
  const [low, high] = range;

  if (low === high) {
    return currency.format(low);
  }

  return `${currency.format(low)}-${currency.format(high)}`;
}

function getAverage(range) {
  return Math.round((range[0] + range[1]) / 2);
}

function formatAverage(range) {
  return currency.format(getAverage(range));
}

function addRanges(first, second) {
  return [first[0] + second[0], first[1] + second[1]];
}

function renderNavigatorAveragePrices() {
  navigatorPriceBody.innerHTML = navigatorAveragePrices.map((navigator) => {
    const installedAverage = getAverage(navigator.equipment) + getAverage(navigator.install);

    return `
      <tr>
        <td>${navigator.name}</td>
        <td>${navigator.type}</td>
        <td>${formatAverage(navigator.equipment)}</td>
        <td>${formatAverage(navigator.install)}</td>
        <td>${currency.format(installedAverage)}</td>
      </tr>
    `;
  }).join("");
}

function getChoice(category) {
  const select = document.querySelector(`#config-${category.id}`);
  const choiceId = select ? select.value : category.defaultChoice;
  return category.choices.find((choice) => choice.id === choiceId) || category.choices[0];
}

function renderConfigurator() {
  systemForm.innerHTML = configCategories.map((category) => {
    const optionsMarkup = category.choices.map((choice) => {
      const selected = choice.id === category.defaultChoice ? " selected" : "";
      return `<option value="${choice.id}"${selected}>${choice.label}</option>`;
    }).join("");

    return `
      <label class="field">
        <span>${category.label}</span>
        <select id="config-${category.id}" data-config-select>${optionsMarkup}</select>
      </label>
    `;
  }).join("");

  systemForm.querySelectorAll("[data-config-select]").forEach((select) => {
    select.addEventListener("change", updateConfigurator);
  });
}

function updateConfigurator() {
  let equipmentRange = [0, 0];
  let installRange = [0, 0];

  const rows = configCategories.map((category) => {
    const choice = getChoice(category);
    const rowTotal = addRanges(choice.equipment, choice.install);

    equipmentRange = addRanges(equipmentRange, choice.equipment);
    installRange = addRanges(installRange, choice.install);

    return `
      <tr>
        <td>${category.label}</td>
        <td>${choice.label}</td>
        <td>${formatRange(choice.equipment)}</td>
        <td>${formatRange(choice.install)}</td>
        <td>${formatRange(rowTotal)}</td>
      </tr>
    `;
  });

  const totalRange = addRanges(equipmentRange, installRange);

  priceTableBody.innerHTML = rows.join("");
  equipmentTotal.textContent = formatRange(equipmentRange);
  installTotal.textContent = formatRange(installRange);
  systemTotal.textContent = formatRange(totalRange);
  configTotalPill.textContent = formatRange(totalRange);
}

function updatePlanner() {
  const settings = getSettings();
  const visibleOptions = getVisibleOptions(settings);
  const solution = getRecommendedSolution(settings, visibleOptions);

  renderSolution(solution);
  renderOptions(visibleOptions);
}

budgetSelect.addEventListener("change", updatePlanner);
missionSelect.addEventListener("change", updatePlanner);
autopilotToggle.addEventListener("change", updatePlanner);
certifiedToggle.addEventListener("change", updatePlanner);

renderConfigurator();
renderNavigatorAveragePrices();
updateConfigurator();
updatePlanner();

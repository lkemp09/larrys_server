const abacus = document.querySelector("#abacus");
const input = document.querySelector("#numberInput");
const valueDisplay = document.querySelector("#valueDisplay");
const clearButton = document.querySelector("#clearButton");

const places = [
  { label: "100k", value: 100000 },
  { label: "10k", value: 10000 },
  { label: "1k", value: 1000 },
  { label: "100", value: 100 },
  { label: "10", value: 10 },
  { label: "1", value: 1 },
];

let digits = [0, 0, 0, 0, 0, 0];

function clampValue(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(999999, Math.floor(value)));
}

function valueToDigits(value) {
  return String(clampValue(value)).padStart(6, "0").split("").map(Number);
}

function digitsToValue(nextDigits) {
  return nextDigits.reduce((sum, digit, index) => sum + digit * places[index].value, 0);
}

function renderAbacus() {
  abacus.innerHTML = "";

  digits.forEach((digit, placeIndex) => {
    const rod = document.createElement("div");
    rod.className = "rod";

    const upper = document.createElement("div");
    upper.className = "bead-zone upper";
    const upperBead = createBead(placeIndex, 5, digit >= 5);
    upper.append(upperBead);

    const divider = document.createElement("div");
    divider.className = "divider";

    const lower = document.createElement("div");
    lower.className = "bead-zone lower";

    for (let beadValue = 1; beadValue <= 4; beadValue += 1) {
      lower.append(createBead(placeIndex, beadValue, digit % 5 >= beadValue));
    }

    const label = document.createElement("span");
    label.className = "place-label";
    label.textContent = places[placeIndex].label;

    rod.append(upper, divider, lower, label);
    abacus.append(rod);
  });
}

function createBead(placeIndex, beadValue, isActive) {
  const bead = document.createElement("button");
  bead.className = `bead${isActive ? " active" : ""}`;
  bead.type = "button";
  bead.setAttribute("aria-label", `${places[placeIndex].label} bead ${beadValue}`);
  bead.addEventListener("click", () => setDigitFromBead(placeIndex, beadValue));
  return bead;
}

function setDigitFromBead(placeIndex, beadValue) {
  const current = digits[placeIndex];
  const hasUpper = current >= 5;
  const lowerCount = current % 5;

  if (beadValue === 5) {
    digits[placeIndex] = (hasUpper ? 0 : 5) + lowerCount;
  } else {
    digits[placeIndex] = (hasUpper ? 5 : 0) + (lowerCount >= beadValue ? beadValue - 1 : beadValue);
  }

  syncFromDigits();
}

function syncFromDigits() {
  const value = digitsToValue(digits);
  input.value = value;
  valueDisplay.value = value.toLocaleString("en-US");
  renderAbacus();
}

function setValue(value) {
  digits = valueToDigits(value);
  syncFromDigits();
}

input.addEventListener("input", () => setValue(Number(input.value)));
clearButton.addEventListener("click", () => setValue(0));

setValue(0);

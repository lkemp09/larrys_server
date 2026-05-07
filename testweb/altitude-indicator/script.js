const altimeter = document.querySelector("#altimeter");
const altitudeReadout = document.querySelector("#altitudeReadout");
const targetReadout = document.querySelector("#targetReadout");
const climbReadout = document.querySelector("#climbReadout");
const baroReadout = document.querySelector("#baroReadout");

let targetAltitude = 0;
let altitude = 0;
let lastAltitude = 0;
let lastFrame = performance.now();

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatAltitude(value) {
  return Math.round(value).toString().padStart(5, "0");
}

function updateTarget(clientX, clientY) {
  const rect = altimeter.getBoundingClientRect();
  const x = clamp((clientX - rect.left) / rect.width, 0, 1);
  const y = clamp((clientY - rect.top) / rect.height, 0, 1);
  const bank = (x - 0.5) * 28;
  const pitch = (0.5 - y) * 42;
  const baro = 28.8 + (1 - y) * 2.4;

  targetAltitude = Math.round(x * 50000);
  document.documentElement.style.setProperty("--bank", `${bank.toFixed(2)}deg`);
  document.documentElement.style.setProperty("--pitch", `${pitch.toFixed(2)}px`);
  baroReadout.textContent = baro.toFixed(2);
  targetReadout.textContent = `${targetAltitude.toLocaleString("en-US")} ft`;
}

function setNeedles(value) {
  const hundred = (value % 1000) / 1000 * 360;
  const thousand = (value % 10000) / 10000 * 360;
  const tenThousand = (value % 100000) / 100000 * 360;

  document.documentElement.style.setProperty("--needle-hundred", `${hundred.toFixed(2)}deg`);
  document.documentElement.style.setProperty("--needle-thousand", `${thousand.toFixed(2)}deg`);
  document.documentElement.style.setProperty("--needle-ten-thousand", `${tenThousand.toFixed(2)}deg`);
}

function animate(now) {
  const elapsed = Math.max(16, now - lastFrame);
  const easing = 1 - Math.pow(0.001, elapsed / 1000);

  altitude += (targetAltitude - altitude) * easing;
  const climbRate = (altitude - lastAltitude) / (elapsed / 1000) * 60;

  altitudeReadout.textContent = formatAltitude(altitude);
  climbReadout.textContent = `${Math.round(climbRate).toLocaleString("en-US")} fpm`;
  setNeedles(altitude);

  lastAltitude = altitude;
  lastFrame = now;
  requestAnimationFrame(animate);
}

altimeter.addEventListener("pointermove", (event) => updateTarget(event.clientX, event.clientY));
altimeter.addEventListener("pointerdown", (event) => {
  altimeter.setPointerCapture(event.pointerId);
  updateTarget(event.clientX, event.clientY);
});

updateTarget(window.innerWidth / 2, window.innerHeight / 2);
requestAnimationFrame(animate);

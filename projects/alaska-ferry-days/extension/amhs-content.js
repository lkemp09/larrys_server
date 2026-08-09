(function () {
  const storageKey = "alaskaFerryReservationV1";
  const maximumAge = 24 * 60 * 60 * 1000;

  function show(message, tone = "success") {
    document.getElementById("alaska-ferry-transfer-banner")?.remove();
    const banner = document.createElement("div");
    banner.id = "alaska-ferry-transfer-banner";
    banner.textContent = message;
    Object.assign(banner.style, {
      position: "fixed",
      top: "12px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "2147483647",
      width: "max-content",
      maxWidth: "min(680px, calc(100vw - 32px))",
      padding: "14px 18px",
      borderRadius: "9px",
      background: tone === "error" ? "#8d2f24" : "#063b49",
      color: "white",
      boxShadow: "0 8px 30px rgba(0,0,0,.28)",
      font: "700 15px/1.4 system-ui,sans-serif",
      textAlign: "center",
    });
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 12000);
  }

  function decodeToken(token) {
    const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  async function loadReservation() {
    const token = new URLSearchParams(location.hash.slice(1)).get("afd");
    if (token) {
      try {
        const reservation = decodeToken(token);
        await chrome.storage.local.set({ [storageKey]: { reservation, savedAt: Date.now() } });
        history.replaceState(null, "", `${location.pathname}${location.search}`);
        return reservation;
      } catch (_) {
        show("The transferred trip details could not be read. Return to Alaska Ferry Days and try again.", "error");
        return null;
      }
    }

    const stored = (await chrome.storage.local.get(storageKey))[storageKey];
    if (!stored || Date.now() - stored.savedAt > maximumAge) {
      if (stored) await chrome.storage.local.remove(storageKey);
      return null;
    }
    return stored.reservation;
  }

  function setField(name, value) {
    const field = document.querySelector(`[name="${name}"]`);
    if (!field) return false;
    const prototype = field instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) setter.call(field, String(value));
    else field.value = String(value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function dateForAmhs(date) {
    const [year, month, day] = date.split("-");
    return `${month}-${day}-${year}`;
  }

  function fillSearch(data, announce = true) {
    if (!document.querySelector('[name="cw_journeysearch_j1_from"]')) return false;
    const passengers = data.passengers || {};
    setField("cw_journeysearch_j1_passengers[1][qty]", passengers.adults || 0);
    setField("cw_journeysearch_j1_passengers[2][qty]", passengers.seniors || 0);
    setField("cw_journeysearch_j1_passengers[3][qty]", passengers.children || 0);
    setField("cw_journeysearch_j1_passengers[4][qty]", passengers.infants || 0);
    setField("cw_journeysearch_j1_from", `P~${data.fromCode}`);
    setField("cw_journeysearch_j1_to", `P~${data.toCode}`);
    setField("cw_journeysearch_j1_date", data.departureDate);
    document.querySelectorAll("input").forEach((input) => {
      if (/date/i.test(`${input.name} ${input.id} ${input.className}`) && input.type !== "hidden") {
        input.value = dateForAmhs(data.departureDate);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    const category = data.vehicle.type === "standard" ? "CAR" : data.vehicle.type === "electric" ? "EV" : "";
    setField("cw_journeysearch_j1_vehicles[0][ctg]", category);
    setField("cw_journeysearch_j1_vehicles[0][qty]", 1);
    if (category) setField("cw_journeysearch_j1_vehicles[0][vLength]", data.vehicle.lengthFeet);
    if (announce) show("Alaska Ferry Transfer filled your trip details. Review them, then click Next.");
    return true;
  }

  function selectSailing(data) {
    const radios = document.querySelectorAll('tr input[type="radio"]');
    if (!radios.length) return false;
    const targetDate = dateForAmhs(data.departureDate);
    const targetTime = String(data.departureTimeLabel || "").replace(/^0/, "");
    const rows = Array.from(document.querySelectorAll("tr"));
    const exact = rows.find((row) => {
      const rowText = row.innerText.replace(/\s+/g, " ");
      return rowText.includes(targetDate) && (!targetTime || rowText.includes(targetTime)) &&
        (!data.vessel || rowText.toLowerCase().includes(data.vessel.toLowerCase())) && row.querySelector('input[type="radio"]');
    });
    const dated = rows.find((row) => row.innerText.includes(targetDate) && row.querySelector('input[type="radio"]'));
    const radio = (exact || dated)?.querySelector('input[type="radio"]');
    if (!radio) {
      show("The matching sailing is not listed by AMHS. Review the available choices manually.", "error");
      return true;
    }
    if (!radio.checked) radio.click();
    radio.dispatchEvent(new Event("change", { bubbles: true }));
    show("Alaska Ferry Transfer selected your sailing. Review the live price, then click Next.");
    return true;
  }

  function selectCabin(data) {
    if (!document.body.innerText.includes("Choose Cabins Below") && !/no cabins available/i.test(document.body.innerText)) return false;
    const preference = String(data.cabinPreference || "none").toLowerCase();
    if (preference === "none") {
      show("No cabin was requested. Review this page, then click Next.");
      return true;
    }
    if (/no cabins available/i.test(document.body.innerText)) {
      show("AMHS has no cabins available on this sailing. Continue without one or choose another sailing.", "error");
      return true;
    }
    if (preference === "accessible") {
      show("Accessible cabins must be requested from AMHS at 800-642-0066; they cannot be reserved online.", "error");
      return true;
    }
      const words = preference === "outside" ? ["outside", "window"] : ["inside"];
    const choices = Array.from(document.querySelectorAll('input[type="radio"], input[type="checkbox"], select'));
    const match = choices.find((choice) => {
      const container = choice.closest("tr, article, li, fieldset, .row, div") || choice.parentElement;
      const text = `${container?.innerText || ""} ${choice.value || ""}`.toLowerCase();
      return words.some((word) => text.includes(word)) && !choice.disabled;
    });
    if (!match) {
      show(`AMHS did not show a matching ${preference} cabin. Review its available choices.`, "error");
      return true;
    }
    if (match.tagName === "SELECT") match.selectedIndex = Math.max(1, match.selectedIndex);
    else if (!match.checked) match.click();
    match.dispatchEvent(new Event("change", { bubbles: true }));
    show(`Alaska Ferry Transfer selected a matching ${preference} cabin. Review its price, then click Next.`);
    return true;
  }

  async function run() {
    const reservation = await loadReservation();
    if (!reservation) return;
    const apply = () => {
      if (/journeySearch/i.test(location.pathname)) return fillSearch(reservation);
      if (/chooseJourney/i.test(location.pathname)) return selectSailing(reservation);
      if (/cabins/i.test(location.pathname)) return selectCabin(reservation);
      return true;
    };
    if (apply()) {
      if (/journeySearch/i.test(location.pathname)) {
        setTimeout(() => fillSearch(reservation, false), 600);
        setTimeout(() => fillSearch(reservation, false), 1500);
      }
      return;
    }
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (apply() || attempts >= 10) clearInterval(timer);
    }, 500);
  }

  run().catch(() => show("The trip could not be transferred automatically. Review this AMHS page manually.", "error"));
}());

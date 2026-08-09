(function () {
  async function alaskaFerryAutofill() {
    const storageKey = "alaskaFerryReservationV1";
    const marker = "ALASKA_FERRY_AUTOFILL_V1:";

    function show(message, tone) {
      document.getElementById("alaska-ferry-autofill-banner")?.remove();
      const banner = document.createElement("div");
      banner.id = "alaska-ferry-autofill-banner";
      banner.textContent = message;
      Object.assign(banner.style, {
        position: "fixed", top: "12px", left: "50%", transform: "translateX(-50%)",
        zIndex: "2147483647", maxWidth: "min(680px, calc(100vw - 32px))", padding: "14px 18px",
        borderRadius: "9px", background: tone === "error" ? "#8d2f24" : "#063b49",
        color: "white", boxShadow: "0 8px 30px rgba(0,0,0,.28)", font: "700 15px/1.4 system-ui,sans-serif",
      });
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 12000);
    }

    function parse(text) {
      const line = String(text || "").split(/\r?\n/).find((item) => item.startsWith(marker));
      return line ? JSON.parse(line.slice(marker.length)) : null;
    }

    async function loadReservation() {
      let data = null;
      try { data = JSON.parse(sessionStorage.getItem(storageKey)); } catch (_) { /* ignore */ }
      try {
        const copied = parse(await navigator.clipboard.readText());
        if (copied) data = copied;
      } catch (_) { /* clipboard permission may be unavailable */ }
      if (!data) data = parse(window.prompt("Paste the reservation details copied by Alaska Ferry Days:"));
      if (data) sessionStorage.setItem(storageKey, JSON.stringify(data));
      return data;
    }

    function setField(name, value) {
      const field = document.querySelector(`[name="${name}"]`);
      if (!field) return false;
      field.value = String(value);
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    function dateForAmhs(date) {
      const [year, month, day] = date.split("-");
      return `${month}-${day}-${year}`;
    }

    function fillSearch(data) {
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
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
      const category = data.vehicle.type === "standard" ? "CAR" : data.vehicle.type === "electric" ? "EV" : "";
      setField("cw_journeysearch_j1_vehicles[0][ctg]", category);
      setField("cw_journeysearch_j1_vehicles[0][qty]", category ? 1 : 0);
      if (category) setField("cw_journeysearch_j1_vehicles[0][vLength]", data.vehicle.lengthFeet);
      show("Trip details filled. Review them, then click Next on the AMHS page.");
    }

    function selectSailing(data) {
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
        show("The exact sailing was not found in AMHS availability. Review the choices manually.", "error");
        return;
      }
      radio.click();
      radio.dispatchEvent(new Event("change", { bubbles: true }));
      show("Your matching sailing is selected. Review the price, then click Next.");
    }

    function selectCabin(data) {
      const preference = String(data.cabinPreference || "none").toLowerCase();
      if (preference === "none") return show("No cabin requested. Click Next to continue without one.");
      if (/no cabins available/i.test(document.body.innerText)) {
        return show("AMHS has no cabins available on this departure. Continue without one or choose another sailing.", "error");
      }
      if (preference === "accessible") {
        return show("Accessible cabins must be requested from AMHS at 800-642-0066; they cannot be reserved online.", "error");
      }
      const words = preference === "outside" ? ["outside", "window"] : ["inside", "inside passage"];
      const choices = Array.from(document.querySelectorAll('input[type="radio"], input[type="checkbox"], select'));
      const match = choices.find((choice) => {
        const container = choice.closest("tr, article, li, fieldset, .row, div") || choice.parentElement;
        const text = `${container?.innerText || ""} ${choice.value || ""}`.toLowerCase();
        return words.some((word) => text.includes(word)) && !choice.disabled;
      });
      if (!match) return show(`AMHS did not show a matching ${preference} cabin. Review the available choices.`, "error");
      if (match.tagName === "SELECT") match.selectedIndex = Math.max(1, match.selectedIndex);
      else match.click();
      match.dispatchEvent(new Event("change", { bubbles: true }));
      show(`A matching ${preference} cabin was selected. Review its price, then click Next.`);
    }

    if (!/bookamhs\.alaska\.gov$/i.test(location.hostname)) return show("Open the official AMHS booking page first, then use this bookmark.", "error");
    const reservation = await loadReservation();
    if (!reservation) return show("No saved choices were found. Return to Alaska Ferry Days and click Continue at AMHS.", "error");
    if (/journeySearch/i.test(location.pathname)) fillSearch(reservation);
    else if (/chooseJourney/i.test(location.pathname)) selectSailing(reservation);
    else if (/cabins/i.test(location.pathname)) selectCabin(reservation);
    else show("Your saved choices are ready. Complete this AMHS step and keep personal and payment details here.");
  }

  window.alaskaFerryAutofillBookmarklet = `javascript:(${alaskaFerryAutofill.toString()})()`;
}());

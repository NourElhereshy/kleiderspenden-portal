
const OFFICE_POSTCODE = "10115";

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const show = (sel) => $(sel).classList.remove("hidden");
const hide = (sel) => $(sel).classList.add("hidden");

function setDateMinToToday() {
  const dateInput = $("#date");
  if (!dateInput) return;
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const min = `${yyyy}-${mm}-${dd}`;
  dateInput.setAttribute("min", min);
}
document.addEventListener("DOMContentLoaded", setDateMinToToday);

const state = {
  user: {},
  shipping: { type: null, location: null },
  donation: { clothes: null, crisis: null, date: null, time: null },
};

const regForm = $("#register-form");
const regError = $("#reg-error");

regForm.addEventListener("submit", (e) => {
  e.preventDefault();
  regError.textContent = "";

  const pwd = $("#password").value.trim();
  const cpw = $("#confirm-password").value.trim();

  if (pwd.length < 6) {
    regError.textContent = "Das Passwort muss mindestens 6 Zeichen lang sein.";
    return;
  }
  if (pwd !== cpw) {
    regError.textContent = "Die Passwörter stimmen nicht überein.";
    return;
  }

  state.user.firstname = $("#firstname").value.trim();
  state.user.lastname = $("#lastname").value.trim();
  state.user.email = $("#email").value.trim();

  hide("#step-1");
  show("#step-2");
  $("#step-2").setAttribute("aria-hidden", "false");
});

const optAbholung = $("#opt-abholung");
const optUebergabe = $("#opt-uebergabe");

optAbholung.addEventListener("click", () => {
  $("#abholung-form").classList.remove("hidden");
  $("#uebergabe-search").classList.add("hidden");
  $("#details-form").classList.add("hidden"); 
  $("#street").focus();
  state.shipping.type = "Abholung";
});

optUebergabe.addEventListener("click", () => {
  $("#uebergabe-search").classList.remove("hidden");
  $("#abholung-form").classList.add("hidden");
  $("#details-form").classList.add("hidden"); 
  $("#search").focus();
  state.shipping.type = "Übergabe";
  renderPoints(points);
});

$("#back-to-options-1").addEventListener("click", () => {
  $("#abholung-form").classList.add("hidden");
});
$("#back-to-options-2").addEventListener("click", () => {
  $("#uebergabe-search").classList.add("hidden");
});

const pickupForm = $("#pickup-form");
const pickupError = $("#pickup-error");

pickupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  pickupError.textContent = "";

  const street = $("#street").value.trim();
  const building = $("#building").value.trim();
  const postcode = $("#postcode").value.trim();
  const city = $("#city").value.trim();

  if (!street || !building || !postcode || !city) {
    pickupError.textContent = "Bitte alle Felder ausfüllen.";
    return;
  }

  const userPrefix = postcode.slice(0, 2);
  const officePrefix = OFFICE_POSTCODE.slice(0, 2);
  if (userPrefix !== officePrefix) {
    pickupError.textContent = `Abholung nicht möglich: Die ersten zwei Ziffern der PLZ (${postcode}) müssen mit der Büro‑PLZ (${OFFICE_POSTCODE}) übereinstimmen.`;
    return;
  }

  state.shipping.location = `${street} ${building}, ${postcode} ${city}`;

  $("#details-form").classList.remove("hidden");
  $("#clothes").focus();
});

const points = [
  {
    name: "PaketShop Mitte",
    city: "Berlin",
    postcode: "10115",
    lat: 52.532,
    lon: 13.384,
  },
  {
    name: "Kiez DropPoint",
    city: "Berlin",
    postcode: "10243",
    lat: 52.513,
    lon: 13.454,
  },
  {
    name: "City Locker West",
    city: "Berlin",
    postcode: "10585",
    lat: 52.517,
    lon: 13.3,
  },
  {
    name: "Altstadt PaketBox",
    city: "München",
    postcode: "80331",
    lat: 48.137,
    lon: 11.575,
  },
  {
    name: "Isar DropPoint",
    city: "München",
    postcode: "80469",
    lat: 48.129,
    lon: 11.573,
  },
  {
    name: "HafenCity Locker",
    city: "Hamburg",
    postcode: "20457",
    lat: 53.541,
    lon: 9.998,
  },
  {
    name: "Alster PaketShop",
    city: "Hamburg",
    postcode: "20095",
    lat: 53.553,
    lon: 10.001,
  },
];

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function renderPoints(list) {
  const ul = $("#points");
  ul.innerHTML = "";
  if (!list.length) {
    ul.innerHTML = '<li class="muted">Keine Ergebnisse.</li>';
    return;
  }
  list.slice(0, 6).forEach((p) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div>
          <strong>${p.name}</strong><br>
          <span class="muted">${p.postcode} ${p.city}</span>
          ${
            typeof p.distanceKm === "number"
              ? `<div class="muted">~ ${p.distanceKm.toFixed(2)} km</div>`
              : ""
          }
        </div>
        <button class="btn" type="button" data-select-point>Hier abgeben</button>
      </div>`;
    li.querySelector("[data-select-point]").addEventListener("click", () => {
      state.shipping.location = `${p.name}, ${p.postcode} ${p.city}`;
      $("#details-form").classList.remove("hidden");
      $("#clothes").focus();
    });
    ul.appendChild(li);
  });
}

$("#search").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  const filtered = points.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.postcode.toLowerCase().includes(q)
  );
  renderPoints(filtered);
});

$("#geo-btn").addEventListener("click", async () => {
  if (!("geolocation" in navigator)) {
    alert("Geolokalisierung wird von Ihrem Browser nicht unterstützt.");
    renderPoints(points);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const withDist = points
        .map((p) => ({
          ...p,
          distanceKm: haversine(latitude, longitude, p.lat, p.lon),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);
      renderPoints(withDist);
    },
    (err) => {
      console.warn("Geo error:", err);
      alert("Standort konnte nicht abgerufen werden. Bitte Suche verwenden.");
      renderPoints(points);
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
});

const donationForm = $("#donation-form");
const detailsError = $("#details-error");

donationForm.addEventListener("submit", (e) => {
  e.preventDefault();
  detailsError.textContent = "";

  const clothes = $("#clothes").value;
  const crisis = $("#crisis").value;
  const date = $("#date").value;
  const time = $("#time").value;

  if (!clothes || !crisis || !date || !time) {
    detailsError.textContent = "Bitte alle Spenden‑Details ausfüllen.";
    return;
  }

  const selected = new Date(date);
  selected.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selected < today) {
    detailsError.textContent = "Datum darf nicht in der Vergangenheit liegen.";
    return;
  }

  state.donation = { clothes, crisis, date, time };

  const summary = [
    `Registrierung: ${state.user.firstname || ""} ${state.user.lastname || ""} <${state.user.email || ""}>`,
    `Versandart: ${state.shipping.type}`,
    `Ort: ${state.shipping.location}`,
    `Kleidungstyp: ${state.donation.clothes}`,
    `Krisengebiet: ${state.donation.crisis}`,
    `Datum: ${state.donation.date}`,
    `Uhrzeit: ${state.donation.time}`,
  ].join("\n");

  $("#summary").textContent = summary;
  hide("#step-2");
  show("#step-3");
  $("#step-3").setAttribute("aria-hidden", "false");
});

$("#debug-reset").addEventListener("click", () => {
  Object.assign(state, {
    donation: { clothes: null, crisis: null, date: null, time: null },
    shipping: { type: null, location: null },
    user: {},
  });
  $("#step-3").setAttribute("aria-hidden", "false");
  show("#step-3");
  hide("#step-2");
  $("#step-2").setAttribute("aria-hidden", "true");
  $("#step-1").removeAttribute("aria-hidden");
  $("#summary").textContent = "";
  donationForm.reset();
  pickupForm.reset();
  regForm.reset();
});
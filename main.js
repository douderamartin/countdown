// ── API ────────────────────────────────────────────────

const BASE_URL = 'https://date.nager.at/api/v3/NextPublicHolidays';

async function fetchNextHoliday(countryCode) {
  const res = await fetch(`${BASE_URL}/${countryCode}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const holidays = await res.json();
  if (!holidays || holidays.length === 0) throw new Error('No upcoming holidays found.');

  const { name, localName, date } = holidays[0];
  return { name, localName, date };
}

// ── UI ─────────────────────────────────────────────────

const elName    = document.getElementById('holidayName');
const elLocal   = document.getElementById('holidayLocal');
const elDate    = document.getElementById('holidayDate');
const elLoading = document.getElementById('loadingState');
const elDigits  = document.getElementById('digits');

function setLoading(isLoading) {
  elLoading.style.display = isLoading ? 'flex' : 'none';
  elDigits.style.display  = isLoading ? 'none' : 'flex';
}

function parseDateString(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function renderHolidayInfo(holiday) {
  if (!holiday) {
    elName.textContent  = 'Chyba načítání';
    elLocal.textContent = '';
    elDate.textContent  = '—';
    return;
  }

  const { name, localName, date } = holiday;

  if (localName && localName !== name) {
    elName.textContent  = name;
    elLocal.textContent = `(${localName})`;
  } else {
    elName.textContent  = name;
    elLocal.textContent = '';
  }

  const dateObj = parseDateString(date);
  elDate.textContent = dateObj.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ── Countdown ──────────────────────────────────────────

const elDays    = document.getElementById('days');
const elHours   = document.getElementById('hours');
const elMinutes = document.getElementById('minutes');
const elSeconds = document.getElementById('seconds');

function pad(n) {
  return String(n).padStart(2, '0');
}

function setDigit(el, newValue) {
  if (el.textContent === newValue) return;
  el.classList.add('flip');
  setTimeout(() => {
    el.textContent = newValue;
    el.classList.remove('flip');
  }, 150);
}

function calcTimeLeft(target) {
  const diff = target - new Date();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, diff };

  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    diff,
  };
}

function startCountdown(dateStr) {
  const target = parseDateString(dateStr);

  function tick() {
    const { days, hours, minutes, seconds, diff } = calcTimeLeft(target);
    setDigit(elDays,    pad(days));
    setDigit(elHours,   pad(hours));
    setDigit(elMinutes, pad(minutes));
    setDigit(elSeconds, pad(seconds));
    setLoading(false);
    if (diff <= 0) clearInterval(intervalId);
  }

  tick();
  const intervalId = setInterval(tick, 1000);
  return intervalId;
}

// ── Main ───────────────────────────────────────────────

let currentCountdownInterval = null;
let activeCountry = 'CZ';

async function load(countryCode) {
  if (currentCountdownInterval) {
    clearInterval(currentCountdownInterval);
    currentCountdownInterval = null;
  }

  setLoading(true);

  try {
    const holiday = await fetchNextHoliday(countryCode);
    renderHolidayInfo(holiday);
    currentCountdownInterval = startCountdown(holiday.date);
  } catch (err) {
    console.error(err);
    renderHolidayInfo(null);
    setLoading(false);
  }
}

document.querySelectorAll('.country-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const code = btn.dataset.code;
    if (code === activeCountry) return;

    document.querySelectorAll('.country-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCountry = code;

    load(code);
  });
});

load(activeCountry);

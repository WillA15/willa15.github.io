// ============================================================
// Fast Lap: reads data.json and fills in the page.
//
// All the content (races, notes, headlines) lives in data.json.
// This file only decides what to show and formats the dates and
// times for whoever is visiting.
// ============================================================

// How many headlines and upcoming races to show.
const HEADLINES_TO_SHOW = 5;
const UPCOMING_TO_SHOW = 3;

// A race stays "next" until this many hours after it starts,
// so it's still featured while it's being run.
const RACE_HOURS = 3;

// "Now", normally the real time. For testing, add ?date=... to the
// address to pretend it's another day, for example:
//   index.html?date=2026-09-28   (after Baku, so Sepang is next)
//   index.html?date=2026-10-05   (Singapore, a Sprint weekend, is next)
//   index.html?date=2026-12-07   (after the last race of the season)
const testDate = new URLSearchParams(window.location.search).get("date");
const now = testDate ? new Date(testDate) : new Date();

loadSite();

async function loadSite() {
  try {
    const response = await fetch("data.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("data.json could not be loaded (status " + response.status + ")");
    }
    const data = await response.json();

    showLastUpdated(data.lastUpdated);
    showRaces(data.races);
    showHeadlines(data.headlines);
  } catch (error) {
    console.error(error);
    document.getElementById("next-race").innerHTML =
      '<p class="error">Sorry, the race data didn\'t load. If you opened index.html ' +
      "straight from your computer, preview it through a local server instead (see the README).</p>";
  }
}

// ---------- Races ----------

function showRaces(races) {
  // Keep only races that haven't finished yet, soonest first.
  const remaining = races
    .filter((race) => now < raceFinish(race))
    .sort((a, b) => raceStart(a) - raceStart(b));

  if (remaining.length === 0) {
    showSeasonOver();
    return;
  }

  showNextRace(remaining[0]);
  showUpcoming(remaining.slice(1, 1 + UPCOMING_TO_SHOW));
}

function showNextRace(race) {
  const sessions = [...race.sessions].sort((a, b) => new Date(a.start) - new Date(b.start));

  const sessionRows = sessions.map((session) => {
    const start = new Date(session.start);
    let rowClass = "session";
    if (session.name === "Race") rowClass += " is-race";
    if (session.name.startsWith("Sprint")) rowClass += " is-sprint";

    return `
      <li class="${rowClass}">
        <span class="session-day">${formatDay(start)}</span>
        <span class="session-time">${formatTime(start)}</span>
        <span class="session-name">${escapeHtml(session.name)}</span>
      </li>`;
  }).join("");

  // The "What to watch for" part only appears if the race has notes.
  let watchSection = "";
  if (race.watchFor && race.watchFor.length > 0) {
    const notes = race.watchFor.map((note) => `<li>${escapeHtml(note)}</li>`).join("");
    watchSection = `
      <h3 class="panel-subtitle">What to watch for</h3>
      <ul class="watch-list">${notes}</ul>`;
  }

  document.getElementById("next-race").innerHTML = `
    <div class="race-labels">
      <span class="chip">Next race · Round ${escapeHtml(race.round)}</span>
      ${race.sprint ? '<span class="chip sprint">Sprint weekend</span>' : ""}
    </div>
    <h2 class="race-name">
      <span class="flag" aria-hidden="true">${escapeHtml(race.flag)}</span>${escapeHtml(race.name)}
    </h2>
    <p class="race-meta">
      ${escapeHtml(race.circuit)} · ${escapeHtml(race.location)} · <strong>${formatDateRange(race)}</strong>
    </p>

    <h3 class="panel-subtitle">Schedule</h3>
    <ol class="sessions">${sessionRows}</ol>
    <p class="timezone-note">Times are in your time zone (${yourTimeZone()}).</p>

    ${watchSection}`;
}

function showUpcoming(races) {
  const list = document.getElementById("upcoming-list");

  if (races.length === 0) {
    document.getElementById("upcoming").hidden = true;
    return;
  }

  list.innerHTML = races.map((race) => `
    <li class="upcoming-race">
      <span class="upcoming-round">R${escapeHtml(race.round)}</span>
      <span class="flag" aria-hidden="true">${escapeHtml(race.flag)}</span>
      <span class="upcoming-name">
        ${escapeHtml(race.name)}
        ${race.sprint ? '<span class="chip sprint small">Sprint</span>' : ""}
      </span>
      <span class="upcoming-dates">${formatDateRange(race)}</span>
    </li>`).join("");
}

function showSeasonOver() {
  document.getElementById("next-race").innerHTML = `
    <div class="season-over">
      <span class="chip">Chequered flag</span>
      <h2>Season over, see you in 2027</h2>
      <p>That's every race of 2026 done. The headlines below are still worth a read.</p>
    </div>`;
  document.getElementById("upcoming").hidden = true;
}

// ---------- Headlines ----------

function showHeadlines(headlines) {
  // Newest first, then keep the top few. Older ones simply drop off.
  // (Dates are written YYYY-MM-DD, so sorting them as text works.)
  const newest = [...headlines]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, HEADLINES_TO_SHOW);

  document.getElementById("headline-list").innerHTML = newest.map((item) => `
    <li class="headline">
      <p class="headline-meta">${formatPlainDate(item.date)} · ${escapeHtml(item.source)}</p>
      <h3 class="headline-title">
        <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">
          ${escapeHtml(item.title)} <span class="arrow" aria-hidden="true">↗</span>
        </a>
      </h3>
      <p class="why">${escapeHtml(item.whyItMatters)}</p>
    </li>`).join("");
}

function showLastUpdated(date) {
  if (date) {
    document.getElementById("updated").textContent = "Headlines last updated " + formatPlainDate(date);
  }
}

// ---------- Date and time helpers ----------

// When the race session starts (the session named "Race",
// or the last session listed if none is called that).
function raceStart(race) {
  const raceSession =
    race.sessions.find((session) => session.name === "Race") || race.sessions[race.sessions.length - 1];
  return new Date(raceSession.start);
}

// When we treat the race as over.
function raceFinish(race) {
  return new Date(raceStart(race).getTime() + RACE_HOURS * 60 * 60 * 1000);
}

// "Sep 24 – 26", from the first session to the race, in the visitor's time zone.
function formatDateRange(race) {
  const times = race.sessions.map((session) => new Date(session.start).getTime());
  const first = new Date(Math.min(...times));
  const last = new Date(Math.max(...times));
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).formatRange(first, last);
}

// "Thu, Sep 24"
function formatDay(date) {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

// "3:30 AM" or "03:30", depending on how the visitor's computer shows times.
function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// "2026-09-22" becomes "Sep 22, 2026". Using UTC stops it slipping to the day before.
function formatPlainDate(isoDate) {
  return new Date(isoDate + "T00:00:00Z").toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

// "America/New_York" becomes "America/New York"
function yourTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll("_", " ");
}

// Makes text from data.json safe to put inside HTML, so a "<" or "&"
// in a headline shows up as text instead of breaking the page.
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

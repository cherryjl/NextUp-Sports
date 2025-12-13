
/*Adds a loading animation to the inner html of each day div*/
function createLoadingAnimation(league) {
  const upcomingDays = getNextDates(30);
  console.log("Creating loading animation...");

  for (let i = 0; i < upcomingDays.length; i++) {
    const dayDiv = document.getElementById(`day${i + 1}`);
    if (!dayDiv) continue;

    const date = dayDiv.dataset.date;
    if (!loadedLeaguesByDate[date] || !loadedLeaguesByDate[date].has(league)) {
      // Show spinner placeholder in each day box while loading
      const spinnerId = `${league}-loading-${i + 1}`;
      if (!document.getElementById(spinnerId)) {
        dayDiv.insertAdjacentHTML(
          "beforeend",
          `
            <div id="${spinnerId}" class="day-loading">
              <div class="spinner"></div>
              <p>${league} Loading...</p>
            </div>
          `
        );
      }
    }
  }
}

const allGamesByDate = {}; // key: date string (YYYY-MM-DD), value: array of games from all leagues
const loadedLeaguesByDate = {};

/** Sets up the date and button for every day in the calendar */
async function setUpDayHeader() {
  const upcomingDays = getNextDates(30);
  
  for (let i = 0; i < upcomingDays.length; i++) {
    // Adds date header
    const { label } = upcomingDays[i];
    const dayDiv = document.getElementById(`day${i + 1}`);
    if (!dayDiv) continue;
    dayDiv.dataset.date = upcomingDays[i].date;

    // Adds button to expand day view
    dayDiv.innerHTML = `
      <div class="day-header">
        <h3>${label}</h3>
        <button class="expand-btn" title="View games">
          <i class="fa fa-search"></i>
        </button>
      </div>
    `;

    const btn = dayDiv.querySelector(".expand-btn");
    btn.addEventListener("click", () => {
      const dayDate = dayDiv.dataset.date;
      openDayModal(dayDiv.querySelector("h3").textContent, allGamesByDate[dayDate] || []);
    });
  }
}

//Generic function to fetch league games
//enter league name as in SportsDB (e.g., "NBA", "NFL", "NHL")
//days: number of days to fetch
//shiftDate: whether to shift date forward by 1 day (needed for NBA because sportsdb is weird)
async function fetchLeagueGames(league, days = 30, shiftDate = false) {
  const upcomingDays = getNextDates(days);
  console.log(`Fetching ${days} days of ${league} games...`);

  createLoadingAnimation(league);

  for (let i = 0; i < upcomingDays.length; i++) {
    const { date } = upcomingDays[i];
    const cacheKey = `${league.toLowerCase()}_${date}`;
    const dayDiv = document.getElementById(`day${i + 1}`);
    if (!dayDiv) continue;

    // Check 24-hour cache
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
    if (cached && (Date.now() - cached.timestamp) / (1000 * 60 * 60) < 24) {
      renderDayGames(dayDiv, cached.data.events || [], league, date);
      continue;
    }

    // Optionally shift date forward (NBA needs this)
    let fetchDate = date;
    if (shiftDate) {
      const shifted = new Date(date);
      shifted.setDate(shifted.getDate() + 1);
      fetchDate = formatDateUTC(shifted);
    }

    try {
      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${fetchDate}&l=${league}`
      );
      const data = await res.json();

      renderDayGames(dayDiv, data.events || [], league, date);
      localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));

      // Delay to avoid API rate limits
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`Error fetching ${league} data for ${date}:`, err);
      const spinnerId = `${league}-loading-${dayDiv.id.replace("day", "")}`;
      const div = document.getElementById(spinnerId);
      if (div) div.remove();
      
      dayDiv.insertAdjacentHTML(
        "beforeend",
        `
        <div class="error-message">
          <p> Could not load ${league} games for ${date}. Check your internet connection or try again later.</p>
        <div>
        `
      );
    }
  }
}


/* gets the next n days and formats them as strings, uses UTC to avoid timezone drift */
function getNextDates(n, startDate = new Date()) {
  const dates = [];
  const base = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate()
    )
  );

  for (let i = 0; i < n; i++) {
    const nextDay = new Date(base);
    nextDay.setUTCDate(base.getUTCDate() + i);
    dates.push({
      date: formatDateUTC(nextDay),
      label: nextDay.toUTCString().split(" ").slice(0, 4).join(" "),
    });
  }
  return dates;
}

/* formats a date as YYYY-MM-DD in UTC */
function formatDateUTC(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Start the loading animation and fetch data
// functions run on start up in this order
(async function init() {
  // Apply saved background
  const savedBg = localStorage.getItem("calendarBackground");
  if (savedBg) {
    document.getElementById("calendar").style.backgroundImage = `url('${savedBg}')`;
    document.getElementById("calendar").style.backgroundSize = "cover";
    document.getElementById("calendar").style.backgroundPosition = "center";
  }

  await setUpDayHeader();

  //After calendar setup, check saved filters and load leagues
  const savedFilters = JSON.parse(localStorage.getItem('selectedSports') || '[]');

  // Set checkboxes up before fetching data, so the checkbox doesn't have 
  //     to wait a full minute to show for later sports.
  for (const sport of savedFilters) {
    const checkbox = document.querySelector(`#favSports input[value="${sport}"]`);
    if (checkbox) checkbox.checked = true;
  }

  // Fetch data for saved filters
  // 34 Sports so far
  for (const sport of savedFilters) {
    if (sport === 'nba') await fetchLeagueGames('NBA');
    else if (sport === 'nfl') await fetchLeagueGames('NFL');
    else if (sport === 'nhl') await fetchLeagueGames('NHL');
    else if (sport === 'ufc') await fetchLeagueGames('UFC');
    else if (sport === 'f1') await fetchLeagueGames('Formula 1');
    else if (sport === 'formula e') await fetchLeagueGames('Formula E');
    else if (sport === 'motogp') await fetchLeagueGames('MotoGP');
    else if (sport === 'indycar') await fetchLeagueGames('IndyCar Series');
    else if (sport === 'imsa sportscar') await fetchLeagueGames('IMSA SportsCar Championship');
    else if (sport === 'ferrari challenge na') await fetchLeagueGames('Ferrari Challenge North America');
    else if (sport === 'wec') await fetchLeagueGames('WEC');
    else if (sport === 'gtwc endurance') await fetchLeagueGames('GT Series Endurance Cup');
    else if (sport === 'gtwc sprint') await fetchLeagueGames('GT World Challenge Europe Sprint Cup');
    else if (sport === 'wrc') await fetchLeagueGames('WRC');
    else if (sport === 'dakar rally') await fetchLeagueGames('Dakar Rally');
    else if (sport === 'super gt') await fetchLeagueGames('Super GT series');
    else if (sport === 'cfl') await fetchLeagueGames('CFL');
    else if (sport === 'ufl') await fetchLeagueGames('UFL');
    else if (sport === 'mls') await fetchLeagueGames('American Major League Soccer');
    else if (sport === 'epl') await fetchLeagueGames('English Premier League');
    else if (sport === 'la liga') await fetchLeagueGames('Spanish La Liga');
    else if (sport === 'bundesliga') await fetchLeagueGames('German Bundesliga');
    else if (sport === 'euroleague bb') await fetchLeagueGames('Euroleague Basketball');
    else if (sport === 'australian nbl') await fetchLeagueGames('Australian NBL');
    else if (sport === 'ncaa hockey') await fetchLeagueGames('NCAA Division 1 Ice Hockey');
    else if (sport === 'swedish hockey') await fetchLeagueGames('Swedish Hockey League');
    else if (sport === 'boxing') await fetchLeagueGames('Boxing');
    else if (sport === 'one champ') await fetchLeagueGames('ONE');
    else if (sport === 'mlb') await fetchLeagueGames('MLB');
    else if (sport === 'kbo league') await fetchLeagueGames('Korean KBO League');
    else if (sport === 'nippon') await fetchLeagueGames('Nippon Baseball League');
    else if (sport === 'cuban') await fetchLeagueGames('Cuban National Series');
    else if (sport === 'pga golf') await fetchLeagueGames('PGA Golf');
    else if (sport === 'liv golf') await fetchLeagueGames('LIV Golf');
  }
})();

/************************************* Handles expand day button *****************************************/

// Create modal element dynamically
const modal = document.createElement("div");
modal.id = "day-modal";
modal.innerHTML = `
  <div class="modal-content">
    <button id="close-modal">×</button>
    <div id="modal-body"></div>
  </div>
`;
document.body.appendChild(modal);

document.getElementById("close-modal").addEventListener("click", () => closeModal());
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

// Open modal and fill it with that day's games
function openDayModal(label, games) {
  const modalBody = document.getElementById("modal-body");
  let html = `<h2>${label}</h2>`;

  if (games.length > 0) {
    games.forEach((g) => {
      // Determine matchup text
      let matchup;
      if (g?.strHomeTeam && g?.strAwayTeam) {
        matchup = `${g.strHomeTeam} vs ${g.strAwayTeam}`;
      } else if (g?.strEvent) {
        matchup = g.strEvent;
      } else if (g?.strEventAlternate) {
        matchup = g.strEventAlternate;
      } else {
        matchup = "Event TBD";
      }

      // Determine home and away images with league badge fallback
      // Optionally, you could also add a generic placeholder as a final fallback
      const homeImg =
        g.strHomeTeamBadge || g.strLeagueBadge || "https://loremflickr.com/40/40/sports";
      const awayImg =
        g.strAwayTeamBadge || g.strLeagueBadge || "https://loremflickr.com/40/40/sports";

      html += `
        <div class="game expanded">
          <div class="teams">
            <img src="${homeImg}" alt="${g.strHomeTeam || "Home"}" width="40" height="40">
            <p>${matchup}</p>
            <img src="${awayImg}" alt="${g.strAwayTeam || "Away"}" width="40" height="40">
          </div>
          <div class="meta">
            ${(() => {
              const dt = parseSportsDBTime(g);
              const localTime = dt
                ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "TBD";
              const localDate = dt
                ? dt.toLocaleDateString([], { year: "numeric", month: "2-digit", day: "2-digit" })
                : (g.dateEvent || "");

              return `${localDate} @ ${localTime}`;
            })()}
            <p>${g.strVenue || ""}</p>
          </div>
        </div>
      `;
    });
  } else {
    html += `<p>No events scheduled</p>`;
  }

  modalBody.innerHTML = html;
  modal.classList.add("show");
  document.body.classList.add("modal-open");
}


// Close modal
document.getElementById("close-modal").addEventListener("click", closeModal());
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

function closeModal() {
  modal.classList.remove("show");
  document.body.classList.remove("modal-open");
}

/***************************** Event listeners for the filter boxes *********************************/
document.addEventListener('DOMContentLoaded', () => {
  const sportsCheckBoxes = document.querySelectorAll('#favSports input[type="checkbox"]');

  sportsCheckBoxes.forEach((checkbox) => {
    checkbox.addEventListener('change', async (e) => {
      const sport = e.target.value.toLowerCase();
      let selected = JSON.parse(localStorage.getItem('selectedSports') || '[]');

      if (e.target.checked) {
        if (!selected.includes(sport)) selected.push(sport);
      } else {
        selected = selected.filter(s => s !== sport);
        //removeSportGames(sport);
      }

      localStorage.setItem('selectedSports', JSON.stringify(selected));
    });
  });

  // Save open/closed state of details elements (drop down menu)
  // Select all details inside your favSports section
  const detailsList = document.querySelectorAll("#favSports details");

  // Restore open/closed state from localStorage
  detailsList.forEach((details) => {
    const id = details.querySelector("summary")?.textContent.trim();
    const savedState = localStorage.getItem(`details-${id}`);
    if (savedState === "open") {
      details.open = true;
    }
  });

  // Save state whenever one opens or closes
  detailsList.forEach((details) => {
    const id = details.querySelector("summary")?.textContent.trim();
    details.addEventListener("toggle", () => {
      localStorage.setItem(`details-${id}`, details.open ? "open" : "closed");
    });
  });
});

function parseSportsDBTime(g) {
  // Best: strTimestamp
  if (g.strTimestamp) {
    return new Date(g.strTimestamp.replace(" ", "T") + "Z");
  }

  // Fallback: dateEvent + strTime
  if (g.dateEvent && g.strTime) {
    return new Date(`${g.dateEvent}T${g.strTime}Z`);
  }

  return null;
}

// Returns a Date object in local time parsed from SportsDB fields.
// Assumes parseSportsDBTime(g) already exists (the function you added earlier).
function getEventLocalDate(g) {
  const dt = parseSportsDBTime(g); // returns a Date object or null
  return dt || null;
}

// Format a local Date object to YYYY-MM-DD (local date, NOT UTC)
function formatDateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Find the day DIV by matching dataset.date (returns the element or null)
function getDayDivByDate(dateStr) {
  return document.querySelector(`[data-date="${dateStr}"]`);
}

function renderDayGames(dayDiv, games, league, date) {
  // Ensure data structures exist
  if (!allGamesByDate[date]) allGamesByDate[date] = [];
  if (!loadedLeaguesByDate[date]) loadedLeaguesByDate[date] = new Set();
  if (loadedLeaguesByDate[date].has(league)) return;
  loadedLeaguesByDate[date].add(league);

  // We'll collect HTML to insert into each target dayDiv keyed by date
  const htmlByDate = {}; // { "YYYY-MM-DD": "<...html...>" };

  games.forEach((g) => {
    g.strLeague = league;

    // Determine local date/time
    const dt = getEventLocalDate(g);
    const localDate = dt ? formatDateLocal(dt) : (g.dateEvent || date);
    const localTime = dt
      ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : (g.strTime || "TBD");

    // Prepare matchup text
    let matchup;
    if (g?.strHomeTeam && g?.strAwayTeam) {
      matchup = `${g.strHomeTeam} vs ${g.strAwayTeam}`;
    } else {
      matchup = g.strEvent || g.strEventAlternate || "Event TBD";
    }

    // Use league badge as fallback if team badges are missing
    const homeImg = g.strHomeTeamBadge || g.strLeagueBadge || "";
    const awayImg = g.strAwayTeamBadge || g.strLeagueBadge || "";

    // Build HTML for this event
    const eventHtml = `
      <div class="game" data-league="${league}">
        <div class="teams">
          ${homeImg ? `<img src="${homeImg}" alt="${g.strHomeTeam || 'Home'}" width="30" height="30">` : ""}
          <p>${matchup}</p>
          ${awayImg ? `<img src="${awayImg}" alt="${g.strAwayTeam || 'Away'}" width="30" height="30">` : ""}
        </div>
        <div class="meta">
          <span>${league}: ${localDate} @ ${localTime}</span>
        </div>
      </div>
    `;

    // Add to allGamesByDate for modal and future reference
    if (!allGamesByDate[localDate]) allGamesByDate[localDate] = [];
    allGamesByDate[localDate].push(Object.assign({}, g, { localDate, localTime }));

    // Group HTML by the local date to render into the correct column
    if (!htmlByDate[localDate]) htmlByDate[localDate] = "";
    htmlByDate[localDate] += eventHtml;
  });

  // Remove the spinner for the original dayDiv
  const spinnerId = `${league}-loading-${dayDiv.id.replace("day", "")}`;
  const spinnerDiv = document.getElementById(spinnerId);
  if (spinnerDiv) spinnerDiv.remove();

  // Insert HTML into each target dayDiv (including the original date)
  Object.keys(htmlByDate).forEach((targetDate) => {
    const targetHtml = htmlByDate[targetDate];
    const targetDiv = getDayDivByDate(targetDate);

    if (targetDiv) {
      targetDiv.insertAdjacentHTML("beforeend", targetHtml);

      // Mark that this league has been loaded for that date
      if (!loadedLeaguesByDate[targetDate]) loadedLeaguesByDate[targetDate] = new Set();
      loadedLeaguesByDate[targetDate].add(league);
    }
  });
}




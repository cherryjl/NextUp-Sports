
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

// Mapping of sport IDs to league names for API calls
const sportToLeagueMap = {
  'nba': 'NBA',
  'nfl': 'NFL',
  'nhl': 'NHL',
  'ufc': 'UFC',
  'f1': 'Formula 1',
  'formula e': 'Formula E',
  'motogp': 'MotoGP',
  'indycar': 'IndyCar Series',
  'imsa sportscar': 'IMSA SportsCar Championship',
  'ferrari challenge na': 'Ferrari Challenge North America',
  'wec': 'WEC',
  'gtwc endurance': 'GT Series Endurance Cup',
  'gtwc sprint': 'GT World Challenge Europe Sprint Cup',
  'wrc': 'WRC',
  'dakar rally': 'Dakar Rally',
  'super gt': 'Super GT series',
  'cfl': 'CFL',
  'ufl': 'UFL',
  'mls': 'American Major League Soccer',
  'epl': 'English Premier League',
  'la liga': 'Spanish La Liga',
  'bundesliga': 'German Bundesliga',
  'euroleague bb': 'Euroleague Basketball',
  'australian nbl': 'Australian NBL',
  'ncaa hockey': 'NCAA Division 1 Ice Hockey',
  'swedish hockey': 'Swedish Hockey League',
  'boxing': 'Boxing',
  'one champ': 'ONE',
  'mlb': 'MLB',
  'kbo league': 'Korean KBO League',
  'nippon': 'Nippon Baseball League',
  'cuban': 'Cuban National Series',
  'pga golf': 'PGA Golf',
  'liv golf': 'LIV Golf'
};

// Fetch all selected sports and update the calendar
async function loadSelectedSports() {
  const savedFilters = JSON.parse(localStorage.getItem('selectedSports') || '[]');
  
  for (const sport of savedFilters) {
    const leagueName = sportToLeagueMap[sport];
    if (leagueName) {
      await fetchLeagueGames(leagueName);
    }
  }
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

  // Check saved filters and load leagues
  const savedFilters = JSON.parse(localStorage.getItem('selectedSports') || '[]');

  // Set checkboxes before fetching data
  for (const sport of savedFilters) {
    const checkbox = document.querySelector(`#favSports input[value="${sport}"]`);
    if (checkbox) checkbox.checked = true;
  }

  // Load the selected sports
  await loadSelectedSports();
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
    checkbox.addEventListener('change', (e) => {
      const sport = e.target.value.toLowerCase();
      let selected = JSON.parse(localStorage.getItem('selectedSports') || '[]');

      if (e.target.checked) {
        if (!selected.includes(sport)) selected.push(sport);
      } else {
        selected = selected.filter(s => s !== sport);
      }

      localStorage.setItem('selectedSports', JSON.stringify(selected));
    });
  });

  // Handle filter button submission
  const filterForm = document.querySelector('form');
  if (filterForm) {
    filterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      // Clear existing games and reload based on current checkboxes
      clearAllGames();
      await loadSelectedSports();
      console.log('Filters applied');
    });
  }

  // Save open/closed state of details elements (drop down menu)
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

// Clear all games from the calendar
function clearAllGames() {
  // Remove all game divs
  const gameElements = document.querySelectorAll('.game');
  gameElements.forEach(el => el.remove());

  // Remove all loading spinners
  const spinners = document.querySelectorAll('.day-loading');
  spinners.forEach(el => el.remove());

  // Reset tracking objects
  Object.keys(allGamesByDate).forEach(date => delete allGamesByDate[date]);
  Object.keys(loadedLeaguesByDate).forEach(date => delete loadedLeaguesByDate[date]);

  console.log('All games cleared');
}

// Remove all games from a specific sport from the calendar
function removeSportGames(sport) {
  const leagueName = sportToLeagueMap[sport];
  if (!leagueName) return;

  // Find and remove all game divs with this league
  const gameElements = document.querySelectorAll(`.game[data-league="${leagueName}"]`);
  gameElements.forEach(el => el.remove());

  // Clear from tracking objects
  Object.keys(loadedLeaguesByDate).forEach(date => {
    loadedLeaguesByDate[date].delete(leagueName);
  });

  // Clear from cache
  const upcomingDays = getNextDates(30);
  upcomingDays.forEach(({ date }) => {
    const cacheKey = `${leagueName.toLowerCase()}_${date}`;
    localStorage.removeItem(cacheKey);
  });

  console.log(`Removed games for ${leagueName}`);
}

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




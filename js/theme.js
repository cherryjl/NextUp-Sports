// js/theme.js
// Initialize site theme in a single place and remain backwards-compatible
(function () {
    const THEME_INDEX_KEY = 'nextup_theme_index'; // new index-based key used by appearanceToggle.js
  const LEGACY_THEME_KEY = 'nextup_sports_theme'; // older key some deployments use
  const THEMES = ['morgan-mode', 'dark-mode', 'light-mode', 'darker-mode', 'cool-green-mode'];

  try {
    // 1) Preferred: index-based theme key (stored as integer index)
    const idx = localStorage.getItem(THEME_INDEX_KEY);
    if (idx !== null) {
      const parsed = parseInt(idx, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < THEMES.length) {
        // Ensure no leftover theme classes exist first
        THEMES.forEach(c => document.documentElement.classList.remove(c));
        document.documentElement.classList.add(THEMES[parsed]);
        return;
      }
    }

    // 2) Fallback: legacy key (string values like 'dark' or 'light')
    const legacy = localStorage.getItem(LEGACY_THEME_KEY);
    if (legacy === 'dark') {
      THEMES.forEach(c => document.documentElement.classList.remove(c));
      document.documentElement.classList.add('darker-mode');
      return;
    }
    if (legacy === 'light') {
      THEMES.forEach(c => document.documentElement.classList.remove(c));
      document.documentElement.classList.add('morgan-mode');
      return;
    }

    // 3) Default: apply the first theme (morgan-mode)
    THEMES.forEach(c => document.documentElement.classList.remove(c));
    document.documentElement.classList.add(THEMES[0]);
  } catch (e) {
    // If localStorage access fails, don't throw; default to morgan-mode
    try { THEMES.forEach(c => document.documentElement.classList.remove(c)); document.documentElement.classList.add(THEMES[0]); } catch (e2) {}
  }
})();

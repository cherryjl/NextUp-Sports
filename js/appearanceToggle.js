// js/settings-toggle.js

const toggleBtn = document.getElementById('theme-toggle');
const html = document.documentElement;

const THEMES = ['morgan-mode', 'dark-mode', 'light-mode', 'darker-mode', 'cool-green-mode'];
const THEME_KEY = 'nextup_theme_index';

// --- Load saved theme index safely ---
let saved = localStorage.getItem(THEME_KEY);
let themeIndex = 0;                     // default to the first theme

if (saved !== null) {
  const parsed = parseInt(saved, 10);
  if (!isNaN(parsed) && parsed >= 0 && parsed < THEMES.length) {
    themeIndex = parsed;                // only load if valid
  }
}

// --- Apply initial theme ---
html.classList.add(THEMES[themeIndex]);

// --- Toggle through themes ---
toggleBtn.addEventListener('click', () => {
  // Remove current theme
  html.classList.remove(THEMES[themeIndex]);

  // Advance to next index
  themeIndex = (themeIndex + 1) % THEMES.length;

  // Apply new theme
  html.classList.add(THEMES[themeIndex]);

  // Save theme index
  localStorage.setItem(THEME_KEY, themeIndex);
});

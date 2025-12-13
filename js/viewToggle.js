document.addEventListener('DOMContentLoaded', () => {
  const viewModeRadios = document.querySelectorAll('input[name="viewMode"]');
  const VIEW_KEY = 'nextup_sports_viewMode';
  let savedView = localStorage.getItem(VIEW_KEY);

  if (!savedView) {
    savedView = (window.innerWidth < 480) ? 'list' : 'grid';
  }

  // Only set the radio if it exists on this page (settings page).
  const savedRadio = document.getElementById(savedView + 'View');
  if (savedRadio) {
    savedRadio.checked = true;
  }

  // Always apply the view mode attribute to the body so any page including
  // this script (or reading localStorage) can react to the saved mode.
  document.body.setAttribute('data-view-mode', savedView);

  viewModeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      localStorage.setItem(VIEW_KEY, radio.value);
      document.body.setAttribute('data-view-mode', radio.value);
    });
  });
});

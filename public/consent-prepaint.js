(() => {
  let choice = 'unset';
  try {
    const saved = window.localStorage.getItem('flowhome-consent');
    const preference = saved ? JSON.parse(saved) : null;
    if (preference?.version === 1 && (preference.choice === 'accepted' || preference.choice === 'rejected')) choice = preference.choice;
  } catch {}
  document.documentElement.dataset.flowhomeConsent = choice;
})();

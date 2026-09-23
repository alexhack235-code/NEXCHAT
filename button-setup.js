const initButtonSetup = () => {
  document.querySelectorAll('[data-action]').forEach((button) => {
    const action = button.getAttribute('data-action');
    if (!action) return;

    button.addEventListener('click', () => {
      if (window[action]) {
        window[action]();
      }
    });
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initButtonSetup);
} else {
  initButtonSetup();
}

window.__nexchatButtonSetupReady = true;
export { initButtonSetup };

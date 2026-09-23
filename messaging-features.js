const initMessagingFeatures = () => {
  const navItems = document.querySelectorAll('[data-nav]');
  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const navSection = item.getAttribute('data-nav');
      if (navSection && window.handleNavigation) {
        window.handleNavigation(navSection);
      }
    });
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMessagingFeatures);
} else {
  initMessagingFeatures();
}

window.__nexchatMessagingFeaturesReady = true;
export { initMessagingFeatures };

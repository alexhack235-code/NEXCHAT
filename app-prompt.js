
function initializeAppPrompt() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const isDismissed = localStorage.getItem('nexchat_download_dismissed');
  const isInstalledApp = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  
  const isProfileSetupPage = window.location.pathname.includes('profile-upload');
  
  if (!isMobile || isDismissed || isInstalledApp || isProfileSetupPage) {
    return;
  }

  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  const style = document.createElement('style');
  style.textContent = `
    
    .app-smart-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #00ff66 0%, #00cc52 100%);
      color: #000;
      padding: 12px 16px;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0, 255, 102, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideDown 0.3s ease;
      gap: 12px;
    }

    .app-smart-banner.hidden {
      display: none;
    }

    .app-banner-content {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .app-banner-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .app-banner-text {
      flex: 1;
    }

    .app-banner-text h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }

    .app-banner-text p {
      margin: 2px 0 0 0;
      font-size: 12px;
      opacity: 0.85;
    }

    .app-banner-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .app-banner-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .app-banner-btn-install {
      background: #000;
      color: #00ff66;
    }

    .app-banner-btn-install:active {
      transform: scale(0.95);
    }

    .app-banner-btn-close {
      background: transparent;
      color: #000;
      padding: 4px 8px;
    }

    
    .app-download-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .app-download-modal.hidden {
      display: none;
    }

    .app-modal-content {
      background: #1a1a1a;
      border-radius: 16px;
      padding: 24px;
      max-width: 320px;
      text-align: center;
      color: #fff;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.3s ease;
    }

    .app-modal-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .app-modal-content h2 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #00ff66;
    }

    .app-modal-content p {
      margin: 0 0 24px 0;
      font-size: 13px;
      color: #aaa;
      line-height: 1.5;
    }

    .app-modal-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .app-modal-btn {
      padding: 12px 16px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .app-modal-btn-primary {
      background: linear-gradient(135deg, #00ff66 0%, #00cc52 100%);
      color: #000;
    }

    .app-modal-btn-primary:active {
      transform: scale(0.98);
    }

    .app-modal-btn-secondary {
      background: transparent;
      color: #00ff66;
      border: 1px solid #00ff66;
    }

    .app-modal-btn-secondary:active {
      background: rgba(0, 255, 102, 0.1);
    }

    
    @keyframes slideDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    
    body.app-prompt-active {
      padding-top: 60px;
    }

    @media (max-width: 480px) {
      .app-smart-banner {
        padding: 10px;
      }

      .app-banner-text h3 {
        font-size: 13px;
      }

      .app-banner-text p {
        font-size: 11px;
      }

      .app-modal-content {
        margin: 16px;
        max-width: none;
      }
    }
  `;
  document.head.appendChild(style);

  const banner = document.createElement('div');
  banner.className = 'app-smart-banner';
  banner.innerHTML = `
    <div class="app-banner-content">
      <div class="app-banner-icon"><img src="/favicons/icon-192.png" alt="NEX" style="width:28px;height:28px;border-radius:6px;display:block;" /></div>
      <div class="app-banner-text">
        <h3>Get NEXCHAT App</h3>
        <p>Faster & offline support</p>
      </div>
    </div>
    <div class="app-banner-actions">
      <button class="app-banner-btn app-banner-btn-install">Install</button>
      <button class="app-banner-btn app-banner-btn-close" aria-label="Close">&times;</button>
    </div>
  `;

  const modal = document.createElement('div');
  modal.className = 'app-download-modal hidden';
  modal.innerHTML = `
    <div class="app-modal-content">
      <img src="/favicons/icon-192.png" alt="NEXCHAT" style="width:64px;height:64px;border-radius:16px;margin:0 auto 14px auto;display:block;box-shadow:0 8px 24px rgba(124,58,237,0.35);border:1px solid rgba(124,58,237,0.4);" />
      <h2>DOWNLOAD NEXCHAT</h2>
      <p>Get app for your phone. For you better experience.</p>
      <div class="app-modal-buttons">
        <button class="app-modal-btn app-modal-btn-primary app-download-link">
          Download on Google Play
        </button>
        <button class="app-modal-btn app-modal-btn-secondary app-modal-close">Later</button>
      </div>
    </div>
  `;

  document.body.insertBefore(banner, document.body.firstChild);
  document.body.appendChild(modal);

  banner.querySelector('.app-banner-btn-close').addEventListener('click', () => {
    dismissPrompt();
    banner.classList.add('hidden');
  });

  banner.querySelector('.app-banner-btn-install').addEventListener('click', () => {
    showModal();
  });

  modal.querySelector('.app-modal-close').addEventListener('click', () => {
    dismissPrompt();
    modal.classList.add('hidden');
  });

  modal.querySelector('.app-download-link').addEventListener('click', () => {
    if (isAndroid) {
      window.location.href = 'https://play.google.com/store/apps/details?id=com.nexchat.app';
    } else if (isIOS) {
      window.location.href = 'https://apps.apple.com/app/nexchat/id123456789';
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  function dismissPrompt() {
    localStorage.setItem('nexchat_download_dismissed', 'true');
    document.body.classList.remove('app-prompt-active');
  }

  function showModal() {
    modal.classList.remove('hidden');
  }

  document.body.classList.add('app-prompt-active');

  let modalShown = false;
  const showModalAfterDelay = setTimeout(() => {
    if (!modalShown) {
      showModal();
      modalShown = true;
    }
  }, 3000);

  const handleScroll = () => {
    if (!modalShown && window.scrollY > 200) {
      showModal();
      modalShown = true;
      clearTimeout(showModalAfterDelay);
      window.removeEventListener('scroll', handleScroll);
    }
  };

  window.addEventListener('scroll', handleScroll);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAppPrompt);
} else {
  initializeAppPrompt();
}


/**
 * InviteQR - Group invite link generator and QR code display
 * Uses the existing `qrcode` npm dependency to render QR codes.
 * 
 * @module invite-qr
 */

import QRCode from 'qrcode';

/**
 * Generate a group invite link
 * @param {string} groupId - The Firestore group document ID
 * @returns {string} Full invite URL
 */
export function generateInviteLink(groupId) {
  if (!groupId) throw new Error('Group ID is required');
  const origin = window.location.origin;
  const pathname = window.location.pathname.replace(/\/[^/]*$/, '/');
  return `${origin}${pathname}chat.html?joinGroup=${encodeURIComponent(groupId)}`;
}

/**
 * Generate a unique invite code for the group
 * @returns {string} Random 8-character alphanumeric code
 */
export function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Render a QR code into a canvas element
 * @param {string} data - The data to encode (invite link)
 * @param {HTMLElement} container - Element to render into
 * @param {Object} [options]
 * @param {number} [options.width=256] - QR code width in pixels
 * @param {string} [options.darkColor='#00ff66'] - Dark module color
 * @param {string} [options.lightColor='#0a0e17'] - Light module color
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderQRCode(data, container, options = {}) {
  const width = options.width || 256;
  const darkColor = options.darkColor || '#00ff66';
  const lightColor = options.lightColor || '#0a0e17';

  const canvas = document.createElement('canvas');
  canvas.classList.add('nex-invite-qr');

  try {
    await QRCode.toCanvas(canvas, data, {
      width,
      margin: 2,
      color: {
        dark: darkColor,
        light: lightColor
      },
      errorCorrectionLevel: 'M'
    });

    if (container) {
      container.innerHTML = '';
      container.appendChild(canvas);
    }

    return canvas;
  } catch (err) {
    console.error('[InviteQR] Failed to generate QR code:', err);

    // Fallback: render as text link
    const fallback = document.createElement('div');
    fallback.classList.add('nex-invite-link');
    fallback.textContent = data;
    if (container) {
      container.innerHTML = '';
      container.appendChild(fallback);
    }
    return null;
  }
}

/**
 * Create the full invite modal with QR code, link text, and action buttons
 * @param {string} groupId - Group ID
 * @param {string} groupName - Group display name
 * @param {Object} callbacks
 * @param {Function} [callbacks.onCopy] - Called when link is copied
 * @param {Function} [callbacks.onShare] - Called when share is triggered
 * @param {Function} [callbacks.onRegenerate] - Called when invite is regenerated
 * @param {Function} callbacks.onClose - Called when modal is closed
 * @returns {HTMLElement} The modal element
 */
export function createInviteModal(groupId, groupName, callbacks = {}) {
  const inviteLink = generateInviteLink(groupId);

  const modal = document.createElement('div');
  modal.classList.add('nex-invite-modal');
  modal.innerHTML = `
    <div class="nex-invite-modal-backdrop"></div>
    <div class="nex-invite-modal-content">
      <div class="nex-invite-modal-header">
        <h3>Invite to ${escapeHtml(groupName)}</h3>
        <button class="nex-invite-modal-close" aria-label="Close">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="nex-invite-qr-container"></div>
      <div class="nex-invite-link-container">
        <input type="text" class="nex-invite-link-input" value="${escapeHtml(inviteLink)}" readonly>
      </div>
      <div class="nex-invite-actions">
        <button class="nex-invite-action-btn nex-invite-copy" title="Copy Link">
          <i class="fa-solid fa-copy"></i> Copy Link
        </button>
        <button class="nex-invite-action-btn nex-invite-share" title="Share">
          <i class="fa-solid fa-share-nodes"></i> Share
        </button>
        <button class="nex-invite-action-btn nex-invite-regenerate" title="Regenerate">
          <i class="fa-solid fa-arrows-rotate"></i> New Link
        </button>
      </div>
    </div>
  `;

  // Render QR code
  const qrContainer = modal.querySelector('.nex-invite-qr-container');
  renderQRCode(inviteLink, qrContainer).catch(() => {});

  // Close handler
  const closeBtn = modal.querySelector('.nex-invite-modal-close');
  const backdrop = modal.querySelector('.nex-invite-modal-backdrop');
  const closeModal = () => {
    modal.classList.add('closing');
    setTimeout(() => {
      modal.remove();
      if (callbacks.onClose) callbacks.onClose();
    }, 300);
  };
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  // Copy handler
  modal.querySelector('.nex-invite-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      const btn = modal.querySelector('.nex-invite-copy');
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy Link';
      }, 2000);
      if (callbacks.onCopy) callbacks.onCopy(inviteLink);
    } catch (err) {
      console.error('[InviteQR] Copy failed:', err);
      // Fallback: select the input text
      const input = modal.querySelector('.nex-invite-link-input');
      input.select();
      document.execCommand('copy');
    }
  });

  // Share handler (Web Share API)
  modal.querySelector('.nex-invite-share').addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName} on NEXCHAT`,
          text: `You're invited to join ${groupName} on NEXCHAT!`,
          url: inviteLink
        });
        if (callbacks.onShare) callbacks.onShare(inviteLink);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[InviteQR] Share failed:', err);
        }
      }
    } else {
      // Fallback to copy
      modal.querySelector('.nex-invite-copy').click();
    }
  });

  // Regenerate handler
  modal.querySelector('.nex-invite-regenerate').addEventListener('click', () => {
    if (callbacks.onRegenerate) callbacks.onRegenerate();
  });

  return modal;
}

/**
 * Show the invite modal by appending to document body
 * @param {string} groupId
 * @param {string} groupName
 * @param {Object} callbacks
 */
export function showInviteModal(groupId, groupName, callbacks = {}) {
  // Remove any existing invite modal
  document.querySelector('.nex-invite-modal')?.remove();

  const modal = createInviteModal(groupId, groupName, callbacks);
  document.body.appendChild(modal);

  // Trigger open animation
  requestAnimationFrame(() => {
    modal.classList.add('open');
  });

  return modal;
}

/**
 * Escape HTML special characters
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

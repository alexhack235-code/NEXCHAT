/**
 * GroupCallButton - WebRTC group call placeholder
 * Renders a call button in the group header and provides
 * a modal showing active participants.
 * 
 * Integrates with the existing LiveKit call system in src/js/livekit-call.js
 * 
 * @module group-call-button
 */

/**
 * Create the group call button element
 * @param {Object} options
 * @param {Function} options.onAudioCall - Called when audio call is initiated
 * @param {Function} options.onVideoCall - Called when video call is initiated
 * @returns {HTMLElement}
 */
export function createGroupCallButton(options = {}) {
  const container = document.createElement('div');
  container.classList.add('nex-group-call-buttons');
  container.innerHTML = `
    <button class="nex-group-call-btn nex-group-audio-call" title="Group Audio Call" aria-label="Start audio call">
      <i class="fa-solid fa-phone"></i>
    </button>
    <button class="nex-group-call-btn nex-group-video-call" title="Group Video Call" aria-label="Start video call">
      <i class="fa-solid fa-video"></i>
    </button>
  `;

  const audioBtn = container.querySelector('.nex-group-audio-call');
  const videoBtn = container.querySelector('.nex-group-video-call');

  audioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (options.onAudioCall) options.onAudioCall();
  });

  videoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (options.onVideoCall) options.onVideoCall();
  });

  return container;
}

/**
 * Create the group call modal showing active participants
 * @param {Object} options
 * @param {string} options.groupName - Name of the group
 * @param {string} options.callType - 'audio' or 'video'
 * @param {Array<{uid: string, username: string, avatar: string}>} options.participants
 * @param {Function} options.onJoin - Called when user joins the call
 * @param {Function} options.onLeave - Called when user leaves the call
 * @param {Function} options.onClose - Called when modal is closed
 * @returns {HTMLElement}
 */
export function createGroupCallModal(options = {}) {
  const { groupName = 'Group', callType = 'audio', participants = [], onJoin, onLeave, onClose } = options;

  const modal = document.createElement('div');
  modal.classList.add('nex-group-call-modal');
  modal.innerHTML = `
    <div class="nex-group-call-modal-backdrop"></div>
    <div class="nex-group-call-modal-content">
      <div class="nex-group-call-modal-header">
        <div class="nex-group-call-modal-icon">
          <i class="fa-solid fa-${callType === 'video' ? 'video' : 'phone'}"></i>
        </div>
        <h3>${escapeHtml(groupName)}</h3>
        <p class="nex-group-call-modal-subtitle">${callType === 'video' ? 'Video' : 'Audio'} Call</p>
      </div>
      <div class="nex-group-call-participants">
        <h4>${participants.length} participant${participants.length !== 1 ? 's' : ''}</h4>
        <div class="nex-group-call-participant-list">
          ${participants.map(p => `
            <div class="nex-group-call-participant">
              <img src="${escapeHtml(p.avatar || 'favicon.png')}" alt="" class="nex-group-call-participant-avatar">
              <span class="nex-group-call-participant-name">${escapeHtml(p.username)}</span>
              <span class="nex-group-call-participant-status">In call</span>
            </div>
          `).join('')}
          ${participants.length === 0 ? '<p class="nex-group-call-empty">No one is in the call yet. Be the first to join!</p>' : ''}
        </div>
      </div>
      <div class="nex-group-call-actions">
        <button class="nex-group-call-join-btn">
          <i class="fa-solid fa-phone"></i> Join Call
        </button>
        <button class="nex-group-call-close-btn">
          <i class="fa-solid fa-xmark"></i> Close
        </button>
      </div>
    </div>
  `;

  // Event handlers
  const backdrop = modal.querySelector('.nex-group-call-modal-backdrop');
  const closeBtn = modal.querySelector('.nex-group-call-close-btn');
  const joinBtn = modal.querySelector('.nex-group-call-join-btn');

  const close = () => {
    modal.classList.add('closing');
    setTimeout(() => {
      modal.remove();
      if (onClose) onClose();
    }, 300);
  };

  backdrop.addEventListener('click', close);
  closeBtn.addEventListener('click', close);

  joinBtn.addEventListener('click', () => {
    joinBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting...';
    joinBtn.disabled = true;
    if (onJoin) onJoin(callType);
  });

  return modal;
}

/**
 * Show the group call modal
 * @param {Object} options - Same as createGroupCallModal
 */
export function showGroupCallModal(options = {}) {
  document.querySelector('.nex-group-call-modal')?.remove();

  const modal = createGroupCallModal(options);
  document.body.appendChild(modal);

  requestAnimationFrame(() => {
    modal.classList.add('open');
  });

  return modal;
}

/**
 * Escape HTML
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

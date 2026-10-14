/**
 * PollComponent - Group poll creation, voting, and rendering
 * Extracted and enhanced from chat.js poll functions.
 * 
 * Firestore collections:
 *   - groupPolls/{pollId}: { question, options[], votes: {}, totalVotes, creatorId, groupId, createdAt, closed }
 *   - groupMessages/{msgId}: { isPoll: true, pollId: '...' }
 * 
 * @module poll-component
 */

import {
  doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, arrayUnion, arrayRemove, increment
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

/**
 * @typedef {Object} PollOption
 * @property {string} text - Option text
 * @property {string[]} voters - Array of UIDs who voted for this option
 * @property {number} votes - Vote count
 */

/**
 * @typedef {Object} PollData
 * @property {string} question - Poll question
 * @property {PollOption[]} options - Array of poll options
 * @property {number} totalVotes - Total vote count
 * @property {string} creatorId - UID of poll creator
 * @property {string} groupId - Group the poll belongs to
 * @property {boolean} closed - Whether voting is closed
 * @property {Object} createdAt - Firestore timestamp
 */

/**
 * Create a new poll in Firestore
 * @param {Object} db - Firestore database instance
 * @param {string} groupId - Group ID
 * @param {string} creatorId - Creator's UID
 * @param {string} question - Poll question text
 * @param {string[]} optionTexts - Array of option texts (2-10 options)
 * @returns {Promise<{ pollId: string, messageId: string }>}
 */
export async function createPoll(db, groupId, creatorId, question, optionTexts) {
  if (!question || !question.trim()) {
    throw new Error('Poll question is required');
  }

  if (!optionTexts || optionTexts.length < 2) {
    throw new Error('At least 2 options are required');
  }

  if (optionTexts.length > 10) {
    throw new Error('Maximum 10 options allowed');
  }

  const options = optionTexts
    .map(text => text.trim())
    .filter(text => text.length > 0)
    .map(text => ({
      text,
      voters: [],
      votes: 0
    }));

  if (options.length < 2) {
    throw new Error('At least 2 non-empty options are required');
  }

  // Create poll document
  const pollRef = await addDoc(collection(db, 'groupPolls'), {
    question: question.trim(),
    options,
    totalVotes: 0,
    creatorId,
    groupId,
    createdAt: serverTimestamp(),
    closed: false
  });

  // Create the group message referencing the poll
  const msgRef = await addDoc(collection(db, 'groupMessages'), {
    groupId,
    from: creatorId,
    text: ` Poll: ${question.trim()}`,
    timestamp: serverTimestamp(),
    isPoll: true,
    pollId: pollRef.id,
    edited: false,
    read: false,
    mentionedUserIds: []
  });

  return { pollId: pollRef.id, messageId: msgRef.id };
}

/**
 * Vote on a poll option
 * @param {Object} db - Firestore database instance
 * @param {string} pollId - Poll document ID
 * @param {number} optionIndex - Index of the option to vote for
 * @param {string} uid - Voter's UID
 * @returns {Promise<void>}
 */
export async function votePoll(db, pollId, optionIndex, uid) {
  if (!pollId || !uid) throw new Error('Poll ID and UID are required');

  const pollRef = doc(db, 'groupPolls', pollId);
  const pollSnap = await getDoc(pollRef);

  if (!pollSnap.exists()) {
    throw new Error('Poll not found');
  }

  const pollData = pollSnap.data();

  if (pollData.closed) {
    throw new Error('This poll is closed');
  }

  if (optionIndex < 0 || optionIndex >= pollData.options.length) {
    throw new Error('Invalid option index');
  }

  // Check if user already voted on this option
  const currentOption = pollData.options[optionIndex];
  const alreadyVoted = currentOption.voters && currentOption.voters.includes(uid);

  // Check if user voted on another option (switch vote)
  let previousOptionIndex = -1;
  for (let i = 0; i < pollData.options.length; i++) {
    if (i !== optionIndex && pollData.options[i].voters && pollData.options[i].voters.includes(uid)) {
      previousOptionIndex = i;
      break;
    }
  }

  // Build update
  const updates = {};

  if (alreadyVoted) {
    // Remove vote
    updates[`options.${optionIndex}.voters`] = arrayRemove(uid);
    updates[`options.${optionIndex}.votes`] = increment(-1);
    updates.totalVotes = increment(-1);
  } else {
    // Add vote
    updates[`options.${optionIndex}.voters`] = arrayUnion(uid);
    updates[`options.${optionIndex}.votes`] = increment(1);

    if (previousOptionIndex >= 0) {
      // Switch vote - remove from previous
      updates[`options.${previousOptionIndex}.voters`] = arrayRemove(uid);
      updates[`options.${previousOptionIndex}.votes`] = increment(-1);
    } else {
      updates.totalVotes = increment(1);
    }
  }

  await updateDoc(pollRef, updates);
}

/**
 * Close a poll (stop accepting votes)
 * @param {Object} db - Firestore database instance
 * @param {string} pollId - Poll document ID
 * @returns {Promise<void>}
 */
export async function closePoll(db, pollId) {
  await updateDoc(doc(db, 'groupPolls', pollId), { closed: true });
}

/**
 * Render a poll component as DOM
 * @param {string} pollId - Poll document ID
 * @param {PollData} pollData - Poll data from Firestore
 * @param {string} currentUid - Current user's UID
 * @param {Object} db - Firestore database instance
 * @param {Function} [onVote] - Optional callback after vote
 * @returns {HTMLElement}
 */
export function renderPoll(pollId, pollData, currentUid, db, onVote) {
  const container = document.createElement('div');
  container.classList.add('nex-poll');
  container.dataset.pollId = pollId;

  const { question, options, totalVotes, closed, creatorId } = pollData;

  // Find which option current user voted for
  let myVotedIndex = -1;
  for (let i = 0; i < options.length; i++) {
    if (options[i].voters && options[i].voters.includes(currentUid)) {
      myVotedIndex = i;
      break;
    }
  }

  const hasVoted = myVotedIndex >= 0;

  // Header
  const header = document.createElement('div');
  header.classList.add('nex-poll-header');
  header.innerHTML = `
    <i class="fa-solid fa-chart-bar"></i>
    <span class="nex-poll-label">Poll</span>
    ${closed ? '<span class="nex-poll-closed-badge">Closed</span>' : ''}
  `;
  container.appendChild(header);

  // Question
  const questionEl = document.createElement('div');
  questionEl.classList.add('nex-poll-question');
  questionEl.textContent = question;
  container.appendChild(questionEl);

  // Options
  const optionsContainer = document.createElement('div');
  optionsContainer.classList.add('nex-poll-options');

  options.forEach((option, index) => {
    const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
    const isMyVote = index === myVotedIndex;
    const isWinning = option.votes === Math.max(...options.map(o => o.votes)) && option.votes > 0;

    const optionEl = document.createElement('div');
    optionEl.classList.add('nex-poll-option');
    if (isMyVote) optionEl.classList.add('voted');
    if (isWinning && (hasVoted || closed)) optionEl.classList.add('winning');
    optionEl.dataset.optionIndex = String(index);

    optionEl.innerHTML = `
      <div class="nex-poll-bar" style="width: ${hasVoted || closed ? percentage : 0}%"></div>
      <div class="nex-poll-option-content">
        <span class="nex-poll-option-text">${escapeHtml(option.text)}</span>
        ${isMyVote ? '<i class="fa-solid fa-check nex-poll-check"></i>' : ''}
        <span class="nex-poll-votes">${hasVoted || closed ? `${percentage}% · ${option.votes}` : ''}</span>
      </div>
    `;

    if (!closed) {
      optionEl.addEventListener('click', async () => {
        try {
          optionEl.classList.add('voting');
          await votePoll(db, pollId, index, currentUid);
          if (onVote) onVote(pollId, index);
        } catch (err) {
          console.error('[Poll] Vote failed:', err);
        } finally {
          optionEl.classList.remove('voting');
        }
      });
    }

    optionsContainer.appendChild(optionEl);
  });

  container.appendChild(optionsContainer);

  // Footer
  const footer = document.createElement('div');
  footer.classList.add('nex-poll-footer');
  footer.textContent = `${totalVotes} vote${totalVotes !== 1 ? 's' : ''}`;

  if (!closed && currentUid === creatorId) {
    const closeBtn = document.createElement('button');
    closeBtn.classList.add('nex-poll-close-btn');
    closeBtn.textContent = 'Close Poll';
    closeBtn.addEventListener('click', async () => {
      try {
        await closePoll(db, pollId);
      } catch (err) {
        console.error('[Poll] Close failed:', err);
      }
    });
    footer.appendChild(closeBtn);
  }

  container.appendChild(footer);

  return container;
}

/**
 * Create the poll creation modal
 * @param {Function} onSubmit - (question: string, options: string[]) => void
 * @param {Function} onClose - Called when modal closes
 * @returns {HTMLElement}
 */
export function createPollModal(onSubmit, onClose) {
  const modal = document.createElement('div');
  modal.classList.add('nex-poll-modal');
  modal.innerHTML = `
    <div class="nex-poll-modal-backdrop"></div>
    <div class="nex-poll-modal-content">
      <div class="nex-poll-modal-header">
        <h3><i class="fa-solid fa-chart-bar"></i> Create Poll</h3>
        <button class="nex-poll-modal-close"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="nex-poll-modal-body">
        <div class="nex-poll-field">
          <label>Question</label>
          <textarea class="nex-poll-question-input" placeholder="Ask a question..." maxlength="300" rows="2"></textarea>
        </div>
        <div class="nex-poll-field">
          <label>Options</label>
          <div class="nex-poll-options-inputs">
            <input type="text" class="nex-poll-option-input" placeholder="Option 1" maxlength="100">
            <input type="text" class="nex-poll-option-input" placeholder="Option 2" maxlength="100">
          </div>
          <button class="nex-poll-add-option-btn">
            <i class="fa-solid fa-plus"></i> Add Option
          </button>
        </div>
      </div>
      <div class="nex-poll-modal-footer">
        <button class="nex-poll-cancel-btn">Cancel</button>
        <button class="nex-poll-submit-btn">Create Poll</button>
      </div>
    </div>
  `;

  const backdrop = modal.querySelector('.nex-poll-modal-backdrop');
  const closeBtn = modal.querySelector('.nex-poll-modal-close');
  const cancelBtn = modal.querySelector('.nex-poll-cancel-btn');
  const submitBtn = modal.querySelector('.nex-poll-submit-btn');
  const addOptionBtn = modal.querySelector('.nex-poll-add-option-btn');
  const optionsContainer = modal.querySelector('.nex-poll-options-inputs');
  const questionInput = modal.querySelector('.nex-poll-question-input');

  const close = () => {
    modal.classList.add('closing');
    setTimeout(() => {
      modal.remove();
      if (onClose) onClose();
    }, 300);
  };

  backdrop.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);

  addOptionBtn.addEventListener('click', () => {
    const inputs = optionsContainer.querySelectorAll('.nex-poll-option-input');
    if (inputs.length >= 10) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.classList.add('nex-poll-option-input');
    input.placeholder = `Option ${inputs.length + 1}`;
    input.maxLength = 100;
    optionsContainer.appendChild(input);
    input.focus();

    if (inputs.length >= 9) {
      addOptionBtn.style.display = 'none';
    }
  });

  submitBtn.addEventListener('click', () => {
    const question = questionInput.value.trim();
    const optionInputs = optionsContainer.querySelectorAll('.nex-poll-option-input');
    const options = Array.from(optionInputs)
      .map(input => input.value.trim())
      .filter(text => text.length > 0);

    if (!question) {
      questionInput.classList.add('error');
      questionInput.focus();
      return;
    }

    if (options.length < 2) {
      alert('Please add at least 2 options');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';

    onSubmit(question, options);
    close();
  });

  return modal;
}

/**
 * Show the poll creation modal
 * @param {Function} onSubmit
 * @param {Function} [onClose]
 */
export function showPollModal(onSubmit, onClose) {
  document.querySelector('.nex-poll-modal')?.remove();

  const modal = createPollModal(onSubmit, onClose);
  document.body.appendChild(modal);

  requestAnimationFrame(() => {
    modal.classList.add('open');
    modal.querySelector('.nex-poll-question-input')?.focus();
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

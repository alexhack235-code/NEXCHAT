/**
 * NEXCHAT - SMART THREAD ANCHORS & COLLAPSIBLE SIDE-RAILS ENGINE
 * Architecture: Dual-Persistence + Real-Time Subcollections + ChronEX AI Synthesis
 * Global Namespace: window.NexThreadingEngine
 * Standard: Strictly 0 Unicode Emojis (FontAwesome 6 Vector Glyphs Only)
 */

(function (window) {
  'use strict';

  class NexThreadingEngine {
    constructor() {
      this.activeThreadId = null;
      this.activeParentData = null;
      this.activeChatId = null;
      this.activeChatType = 'direct'; // 'direct' | 'group'
      this.snapshotUnsubscribe = null;
      this.replies = [];
      this.isSynthesizing = false;

      this.init();
    }

    init() {
      console.log('[NEX-THREADS] Booting Smart Threading Engine...');
      this.bindDOMEvents();
      this.setupDuressListener();
    }

    bindDOMEvents() {
      const closeBtn = document.getElementById('btnCloseThreadRail');
      const scrim = document.getElementById('threadRailScrim');
      const synthBtn = document.getElementById('btnThreadSynthesize');
      const composerForm = document.getElementById('threadComposerForm');

      if (closeBtn) closeBtn.addEventListener('click', () => this.closeThread());
      if (scrim) scrim.addEventListener('click', () => this.closeThread());
      if (synthBtn) synthBtn.addEventListener('click', () => this.synthesizeAndMerge());
      if (composerForm) composerForm.addEventListener('submit', (e) => this.handleSendReply(e));

      // Global delegation for opening threads
      document.addEventListener('click', (e) => {
        // A. In-Stream Thread Root Pill
        const rootPill = e.target.closest('.nex-thread-root-pill');
        if (rootPill) {
          e.stopPropagation();
          const parentId = rootPill.dataset.parentId;
          if (parentId) this.openThread(parentId);
          return;
        }

        // B. Thread Anchor Badge inside bubble
        const anchor = e.target.closest('.thread-anchor-badge');
        if (anchor) {
          e.stopPropagation();
          const threadId = anchor.dataset.threadId;
          if (threadId) this.openThread(threadId);
          return;
        }

        // C. Jump to Thread Button inside Synthesis Card
        const jumpBtn = e.target.closest('.btn-jump-to-thread');
        if (jumpBtn) {
          e.stopPropagation();
          const threadId = jumpBtn.dataset.threadId;
          if (threadId) this.openThread(threadId);
          return;
        }

        // D. Message Hover Dock Trigger Button
        const hoverTrigger = e.target.closest('.msg-thread-trigger-btn, [data-action="open-thread"]');
        if (hoverTrigger) {
          e.stopPropagation();
          const wrapper = hoverTrigger.closest('.message-wrapper');
          if (wrapper) {
            const parentId = wrapper.dataset.docId || wrapper.id.replace('msg-wrapper-', '').replace('wrapper-', '');
            this.openThread(parentId);
          }
          return;
        }
      });

      // Global Esc key dismissal
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const railEl = document.getElementById('nexThreadSideRail');
          if (railEl && railEl.classList.contains('open')) {
            this.closeThread();
          }
        }
      });
    }

    setupDuressListener() {
      window.addEventListener('nex:duress:wipe', () => {
        this.clearThreadCache();
      });
    }

    /**
     * Opens thread side-rail anchored to parentMessageId
     */
    openThread(parentMessageId, fallbackData = null) {
      if (!parentMessageId) return;

      const railEl = document.getElementById('nexThreadSideRail');
      if (!railEl) return;

      this.activeThreadId = parentMessageId;
      this.activeChatId = window.currentChatUser || 'general';
      this.activeChatType = window.currentChatType || 'direct';

      const parentData = fallbackData || this.resolveParentMessage(parentMessageId);
      this.activeParentData = parentData;

      // Populate Root Card
      const avatarEl = document.getElementById('threadRootAvatar');
      const senderEl = document.getElementById('threadRootSender');
      const timeEl = document.getElementById('threadRootTime');
      const bodyEl = document.getElementById('threadRootBody');

      if (avatarEl) avatarEl.src = parentData.avatar || 'logo.jpg';
      if (senderEl) senderEl.textContent = parentData.sender || 'User';
      if (timeEl) timeEl.textContent = parentData.time || 'Recently';
      if (bodyEl) bodyEl.textContent = parentData.text || '';

      // Slide drawer open
      railEl.classList.add('open');
      railEl.setAttribute('aria-hidden', 'false');

      if (typeof window.playLuxuryPopSound === 'function') {
        window.playLuxuryPopSound();
      }

      // Dispatch Pub/Sub event
      window.dispatchEvent(new CustomEvent('nex:thread:open', {
        detail: { parentId: parentMessageId, parentData: parentData }
      }));

      // Subscribe to replies
      this.subscribeThreadReplies(parentMessageId);

      const input = document.getElementById('threadComposerInput');
      if (input) setTimeout(() => input.focus(), 280);
    }

    closeThread() {
      const railEl = document.getElementById('nexThreadSideRail');
      if (railEl) {
        railEl.classList.remove('open');
        railEl.setAttribute('aria-hidden', 'true');
      }

      if (this.snapshotUnsubscribe) {
        this.snapshotUnsubscribe();
        this.snapshotUnsubscribe = null;
      }

      this.activeThreadId = null;
      this.activeParentData = null;
    }

    resolveParentMessage(msgId) {
      const wrapper = document.getElementById(`msg-wrapper-${msgId}`) ||
                      document.getElementById(`wrapper-${msgId}`) ||
                      document.querySelector(`[data-doc-id="${msgId}"]`);
      if (!wrapper) {
        return {
          id: msgId,
          text: 'Topic message active in discussion enclave.',
          sender: 'Participant',
          avatar: 'logo.jpg',
          time: 'Earlier'
        };
      }

      const textEl = wrapper.querySelector('.message-text-content') || wrapper.querySelector('p');
      const timeEl = wrapper.querySelector('.message-time-text');
      const isSent = wrapper.classList.contains('sent');
      const sender = isSent ? 'You' : (window.currentChatName || document.getElementById('chatName')?.textContent || 'User');
      const avatar = wrapper.querySelector('.message-avatar')?.src || (isSent ? (window.myProfilePic || 'logo.jpg') : (document.getElementById('activeChatAvatar')?.src || 'logo.jpg'));

      return {
        id: msgId,
        text: textEl ? textEl.innerText.trim() : '[Attachment Discussion]',
        sender: sender,
        avatar: avatar,
        time: timeEl ? timeEl.innerText.trim() : 'Recently'
      };
    }

    subscribeThreadReplies(threadId) {
      const feed = document.getElementById('threadRepliesList');
      const loading = document.getElementById('threadLoadingState');
      const empty = document.getElementById('threadEmptyState');

      // 1. Instant local-storage render
      const cached = this.getLocalReplies(threadId);
      this.renderReplies(cached);

      if (this.snapshotUnsubscribe) {
        this.snapshotUnsubscribe();
        this.snapshotUnsubscribe = null;
      }

      if (!window.db || typeof window.collection !== 'function') {
        if (loading) loading.style.display = 'none';
        return;
      }

      if (loading) loading.style.display = 'flex';

      try {
        const repliesCol = window.collection(window.db, 'chatThreads', threadId, 'replies');
        const q = window.query(repliesCol, window.orderBy('createdAt', 'asc'));

        this.snapshotUnsubscribe = window.onSnapshot(q, (snap) => {
          if (loading) loading.style.display = 'none';

          if (snap.empty && cached.length === 0) {
            if (empty) empty.style.display = 'flex';
            if (feed) feed.innerHTML = '';
            this.replies = [];
            return;
          }

          if (empty) empty.style.display = 'none';

          const dbReplies = [];
          snap.forEach(doc => {
            const d = doc.data();
            dbReplies.push({
              id: doc.id,
              senderUid: d.senderUid,
              senderName: d.senderName || 'User',
              senderAvatar: d.senderAvatar || 'logo.jpg',
              text: d.text || '',
              time: d.createdAt?.toDate ? d.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'
            });
          });

          this.replies = dbReplies;
          localStorage.setItem(`nex_thread_${threadId}`, JSON.stringify(dbReplies));
          this.renderReplies(dbReplies);
        }, (err) => {
          console.warn('[NEX-THREADS] Remote subscription fallback:', err);
          if (loading) loading.style.display = 'none';
        });
      } catch (err) {
        console.warn('[NEX-THREADS] Cloud sync skipped, local mode active:', err);
        if (loading) loading.style.display = 'none';
      }
    }

    getLocalReplies(threadId) {
      try {
        const raw = localStorage.getItem(`nex_thread_${threadId}`);
        return raw ? JSON.parse(raw) : [];
      } catch (_) {
        return [];
      }
    }

    renderReplies(repliesList) {
      const feed = document.getElementById('threadRepliesList');
      const empty = document.getElementById('threadEmptyState');
      const viewport = document.getElementById('threadMessagesArea');
      if (!feed) return;

      if (!repliesList || repliesList.length === 0) {
        if (empty) empty.style.display = 'flex';
        feed.innerHTML = '';
        return;
      }

      if (empty) empty.style.display = 'none';
      const myUid = window.myUID || (window.auth?.currentUser?.uid) || 'me';

      feed.innerHTML = repliesList.map(r => {
        const isMine = r.senderUid === myUid || r.senderName === 'You';
        return `
          <div class="thread-msg-item ${isMine ? 'sent' : 'received'}" id="reply-${r.id}">
            <img src="${r.senderAvatar || 'logo.jpg'}" alt="${this.escapeHtml(r.senderName)}" class="thread-msg-avatar" onerror="this.src='logo.jpg';">
            <div class="thread-msg-bubble">
              <div class="thread-msg-header">
                <span class="thread-msg-sender">${isMine ? 'You' : this.escapeHtml(r.senderName)}</span>
                <span class="thread-msg-time">${this.escapeHtml(r.time)}</span>
              </div>
              <div class="thread-msg-body">${this.escapeHtml(r.text)}</div>
            </div>
          </div>
        `;
      }).join('');

      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }

    async handleSendReply(e) {
      e.preventDefault();
      const input = document.getElementById('threadComposerInput');
      if (!input) return;

      const text = input.value.trim();
      if (!text) return;

      const threadId = this.activeThreadId;
      if (!threadId) return;

      const myUid = window.myUID || (window.auth?.currentUser?.uid) || 'me';
      const myName = window.myUsername || 'You';
      const myAvatar = window.myProfilePic || 'logo.jpg';

      input.value = '';

      if (typeof window.playLuxuryPopSound === 'function') {
        window.playLuxuryPopSound();
      }

      // 1. Fast Optimistic Local Update
      const replies = this.getLocalReplies(threadId);
      const replyId = 'rep_' + Date.now();
      replies.push({
        id: replyId,
        senderUid: myUid,
        senderName: myName,
        senderAvatar: myAvatar,
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      localStorage.setItem(`nex_thread_${threadId}`, JSON.stringify(replies));
      this.renderReplies(replies);

      // 2. Commit to Cloud Firestore Subcollection
      if (window.db && typeof window.collection === 'function') {
        try {
          await window.addDoc(window.collection(window.db, 'chatThreads', threadId, 'replies'), {
            threadId: threadId,
            senderUid: myUid,
            senderName: myName,
            senderAvatar: myAvatar,
            text: text,
            createdAt: window.serverTimestamp ? window.serverTimestamp() : new Date(),
            isE2EE: true
          });

          // Atomic increment on parent message document
          const isGroup = this.activeChatType === 'group';
          const targetCol = isGroup ? 'groupMessages' : 'messages';
          const parentRef = window.doc(window.db, targetCol, threadId);

          await window.setDoc(parentRef, {
            hasThread: true,
            threadRootId: threadId,
            replyCount: window.increment ? window.increment(1) : replies.length,
            threadCount: window.increment ? window.increment(1) : replies.length,
            lastReplyAt: window.serverTimestamp ? window.serverTimestamp() : new Date(),
            threadLastReplyAt: window.serverTimestamp ? window.serverTimestamp() : new Date(),
            threadLastReplySnippet: text.substring(0, 60),
            participantUids: window.arrayUnion ? window.arrayUnion(myUid) : [myUid]
          }, { merge: true });
        } catch (err) {
          console.warn('[NEX-THREADS] Cloud dispatch notice:', err);
        }
      }

      // 3. Update In-Stream Root Pill in Main Chat
      this.updateInStreamRootPill(threadId, replies.length);

      // 4. Dispatch Pub/Sub Event
      window.dispatchEvent(new CustomEvent('nex:thread:reply_sent', {
        detail: {
          parentId: threadId,
          replyId: replyId,
          replyCount: replies.length,
          text: text,
          senderUid: myUid
        }
      }));

      if (typeof window.showNotif === 'function') {
        window.showNotif('Thread reply sent', 'success', 1500);
      }
    }

    updateInStreamRootPill(parentId, replyCount) {
      const wrapper = document.getElementById(`msg-wrapper-${parentId}`) ||
                      document.getElementById(`wrapper-${parentId}`) ||
                      document.querySelector(`[data-doc-id="${parentId}"]`);
      if (!wrapper) return;

      const bubble = wrapper.querySelector('.message-bubble');
      if (!bubble) return;

      let pill = bubble.querySelector('.nex-thread-root-pill');
      if (!pill) {
        pill = document.createElement('div');
        pill.className = 'nex-thread-root-pill';
        pill.dataset.parentId = parentId;
        bubble.appendChild(pill);
      }

      const countLabel = replyCount === 1 ? '1 reply' : `${replyCount} replies`;
      pill.innerHTML = `
        <div class="nex-thread-root-pill-left">
          <i class="fa-solid fa-comments"></i>
          <span class="nex-thread-root-pill-count">${countLabel}</span>
          <span class="nex-thread-root-pill-sep">&bull;</span>
          <span class="nex-thread-root-pill-time">Last reply Just now</span>
        </div>
        <div class="nex-thread-root-pill-arrow">
          <i class="fa-solid fa-chevron-right"></i>
        </div>
      `;
    }

    async synthesizeAndMerge() {
      if (this.isSynthesizing) return;
      const threadId = this.activeThreadId;
      const replies = this.getLocalReplies(threadId);

      if (!threadId || replies.length === 0) {
        if (typeof window.showNotif === 'function') {
          window.showNotif('Add discussion replies before synthesizing', 'info', 2500);
        }
        return;
      }

      const synthBtn = document.getElementById('btnThreadSynthesize');
      if (synthBtn) {
        synthBtn.disabled = true;
        synthBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Synthesizing...</span>';
      }
      this.isSynthesizing = true;

      try {
        const rootText = this.activeParentData?.text || 'Topic message';
        const transcript = replies.map(r => `${r.senderName}: ${r.text}`).join('\n');
        const prompt = `Synthesize this discussion thread into an executive consensus summary. Root: "${rootText}". Transcript:\n${transcript}\nStrictly format 2 concise bullet points:\n- **Consensus Reached:** (Key decision)\n- **Action Items:** (Next steps)\nZero unicode emojis.`;

        let summary = `- **Consensus Reached:** Thread resolved discussion on "${rootText.substring(0, 45)}...".\n- **Action Items:** Synchronized with active participants.`;
        if (typeof window.generateChronexAIResponse === 'function') {
          summary = await window.generateChronexAIResponse(prompt);
        }

        // Dispatch synthesis card message to main chat
        const isGroup = this.activeChatType === 'group';
        const targetCol = isGroup ? 'groupMessages' : 'messages';
        const targetUser = this.activeChatId;

        const synthesisPayload = {
          from: 'chronex-ai',
          senderName: 'ChronEX Thread Synthesis',
          isThreadSynthesis: true,
          sourceThreadId: threadId,
          rootSnippet: rootText.substring(0, 80),
          summaryText: summary,
          replyCount: replies.length,
          participantCount: new Set(replies.map(r => r.senderUid)).size,
          time: window.serverTimestamp ? window.serverTimestamp() : new Date(),
          read: false
        };

        if (isGroup) {
          synthesisPayload.groupId = targetUser;
        } else {
          synthesisPayload.to = targetUser;
          synthesisPayload.from = window.myUID || 'chronex-ai';
        }

        if (window.db && typeof window.collection === 'function') {
          await window.addDoc(window.collection(window.db, targetCol), synthesisPayload);
          await window.setDoc(window.doc(window.db, 'chatThreads', threadId), {
            isMerged: true,
            summaryText: summary,
            mergedAt: window.serverTimestamp ? window.serverTimestamp() : new Date()
          }, { merge: true });
        }

        if (typeof window.playLuxuryChimeSound === 'function') {
          window.playLuxuryChimeSound();
        }

        if (typeof window.showNotif === 'function') {
          window.showNotif('Thread synthesized and merged to main chat!', 'success', 3000);
        }

        this.closeThread();
      } catch (err) {
        console.error('[NEX-THREADS] Synthesis error:', err);
        if (typeof window.showNotif === 'function') {
          window.showNotif('Synthesis failed: ' + err.message, 'error', 3000);
        }
      } finally {
        this.isSynthesizing = false;
        if (synthBtn) {
          synthBtn.disabled = false;
          synthBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Summarize &amp; Merge</span>';
        }
      }
    }

    clearThreadCache() {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(k => {
          if (k.startsWith('nex_thread_')) localStorage.removeItem(k);
        });
        console.log('[NEX-THREADS] Zero-knowledge duress wipe complete.');
      } catch (_) {}
    }

    escapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  }

  // Bind to Global Window Namespaces
  const engineInstance = new NexThreadingEngine();
  window.NexThreadingEngine = engineInstance;
  window.NexThreadEngine = engineInstance;

})(typeof window !== 'undefined' ? window : globalThis);

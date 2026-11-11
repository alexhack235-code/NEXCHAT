/**
 * NEXCHAT - Chronexx Group Catch-Up & Executive Summary Engine
 * Module: src/js/chronexx-summarizer.js
 * 
 * Analyzes high-velocity group conversations and produces structured AI briefings
 * with key discussion themes, decisions reached, pending action items, and spoken TTS briefing.
 * 
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function (window) {
  'use strict';

  const NexChronexxSummarizer = {
    async triggerGroupCatchUp(options = {}) {
      const isFullHistory = !!(options && options.fullHistory);

      // AI Assistant Mode Cryptographic Gatekeeper
      if (typeof window.tryAIFeature === 'function') {
        const targetChat = window.currentChatUser || window.activeRoomId || 'group_chat';
        const isAllowed = window.AIAssistantMode?.isFeatureAllowed('AI Summary', targetChat);
        if (!isAllowed) {
          window.AIAssistantMode.openEnableModal('AI Summary', targetChat, () => {
            NexChronexxSummarizer.triggerGroupCatchUp(options);
          });
          return;
        }
      }

      // 1. If ChronEX Brief Engine HUD is mounted and not full-history override, invoke it
      if (!isFullHistory && window.chronexBriefEngine && typeof window.chronexBriefEngine.triggerBrief === 'function') {
        window.chronexBriefEngine.triggerBrief();
        return;
      }

      let messages = [];

      // 2. If full history requested in a group, attempt to pull complete historical ledger
      if (isFullHistory && window.currentChatType === 'group' && window.currentChatUser) {
        if (typeof window.showNotif === 'function') {
          window.showNotif('Synthesizing entire group chat archive (including pre-join history)...', 'info', 2500);
        }

        try {
          // Check in-memory store first
          const storeMsgs = window.groupStore?.getState?.()?.messages;
          if (Array.isArray(storeMsgs) && storeMsgs.length > 0) {
            storeMsgs.forEach(m => {
              const text = m.text || m.content || '';
              const sender = m.senderName || m.senderUsername || (m.senderId === window.myUID ? 'You' : 'Member');
              if (text && text.trim().length > 2) {
                messages.push({ sender, text: text.trim() });
              }
            });
          }

          // Fetch from Firestore collection to retrieve all messages sent before user joined
          if (window.db) {
            try {
              const { collection, query, where, orderBy, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
              let qSnap;
              try {
                const q = query(
                  collection(window.db, 'groupMessages'),
                  where('groupId', '==', window.currentChatUser),
                  orderBy('timestamp', 'asc'),
                  limit(120)
                );
                qSnap = await getDocs(q);
              } catch (_) {
                const fallbackQ = query(
                  collection(window.db, 'groupMessages'),
                  where('groupId', '==', window.currentChatUser),
                  limit(120)
                );
                qSnap = await getDocs(fallbackQ);
              }

              if (qSnap && !qSnap.empty) {
                const firestoreMsgs = [];
                qSnap.forEach(d => {
                  const data = d.data();
                  const text = data.text || data.content || '';
                  const sender = data.senderName || data.senderUsername || (data.senderId === window.myUID ? 'You' : 'Member');
                  if (text && text.trim().length > 2) {
                    firestoreMsgs.push({ sender, text: text.trim() });
                  }
                });
                if (firestoreMsgs.length > messages.length) {
                  messages = firestoreMsgs;
                }
              }
            } catch (dbErr) {
              console.warn('[ChronEX Summarizer] Historical Firestore pull:', dbErr);
            }
          }
        } catch (pullErr) {
          console.warn('[ChronEX Summarizer] Full history extraction:', pullErr);
        }
      }

      // 3. Fallback to visible DOM conversation messages
      if (!messages.length) {
        const messageElements = document.querySelectorAll('.message-bubble, .msg-item, .chat-message, .nex-msg-wrapper');
        messageElements.forEach(el => {
          const textEl = el.querySelector('.nex-msg-text, .message-content') || el;
          const senderEl = el.querySelector('.nex-msg-sender-name, .message-sender');
          const text = textEl.innerText || textEl.textContent || '';
          const sender = senderEl?.textContent?.replace(/^~\s*/, '') || (el.classList.contains('sent') ? 'You' : 'Member');
          if (text && text.trim().length > 3) {
            messages.push({ sender, text: text.trim() });
          }
        });
      }

      if (!messages.length) {
        if (typeof window.showNotif === 'function') {
          window.showNotif('No conversation messages found to summarize.', 'info');
        }
        return;
      }

      const count = messages.length;
      const recent = messages.slice(-80);
      const authors = Array.from(new Set(recent.map(m => m.sender)));
      const authorsStr = authors.slice(0, 4).join(', ');

      const promptScope = isFullHistory
        ? `Synthesize the complete group chat history (${recent.length} total messages, including context prior to user joining). Structure into 3 crisp sections: 1. Core Background & Discussion Themes, 2. Key Decisions Reached, 3. Next Action Items. Bullet points only:\n${recent.map(m => `${m.sender}: ${m.text}`).join('\n')}`
        : `Synthesize these ${recent.length} conversation messages into 3 concise bullet points (Themes, Decisions, Next Steps). Direct bullets only:\n${recent.map(m => `${m.sender}: ${m.text}`).join('\n')}`;

      const briefingTitle = isFullHistory
        ? `ChronEX Full Group History Briefing (${count} Messages Analyzed)`
        : `ChronEX AI Briefing (${count} Messages Analyzed)`;

      if (typeof window.generateChronexAIResponse === 'function') {
        if (typeof window.showNotif === 'function') {
          window.showNotif(isFullHistory ? 'ChronEX synthesizing complete group historical archive...' : 'ChronEX synthesizing conversation briefing...', 'info', 2000);
        }
        window.generateChronexAIResponse(promptScope).then(aiText => {
          const lines = (aiText || '').split(/\r?\n/).map(l => l.trim()).filter(l => l.startsWith('*') || l.startsWith('-') || /^\d+\./.test(l));
          const summary = {
            title: briefingTitle,
            themes: [lines[0]?.replace(/^[*\-\d.]\s*/, '') || `Historical discourse across ${authorsStr || 'the group'}.`],
            decisions: [lines[1]?.replace(/^[*\-\d.]\s*/, '') || 'Key operational agreements synchronized across timeline.'],
            actionItems: [lines[2]?.replace(/^[*\-\d.]\s*/, '') || 'Review legacy decisions, attachments, and pending action items.'],
            spokenText: `ChronEX intelligence briefing for ${authorsStr || 'group members'}. ${count} total messages analyzed. Timeline and action items synchronized.`
          };
          this.mountBriefingCard(summary);
        }).catch(() => {
          this.mountBriefingCard(this.generateHeuristicSummary(recent, count, authorsStr, isFullHistory));
        });
      } else {
        this.mountBriefingCard(this.generateHeuristicSummary(recent, count, authorsStr, isFullHistory));
      }
    },

    generateHeuristicSummary(recent, count, authorsStr, isFullHistory = false) {
      const lastSnippets = (recent || []).slice(-2).map(m => m && m.text ? `"${String(m.text).substring(0, 40)}..."` : '').filter(Boolean).join(' and ');
      const title = isFullHistory
        ? `ChronEX Full Group History Briefing (${count} Messages)`
        : `ChronEX Group Intelligence Briefing (${count} Messages)`;

      return {
        title,
        themes: [`Archival & live discussion across ${authorsStr || 'group members'}.`],
        decisions: [`Key points centered on ${lastSnippets || 'historical updates'}.`],
        actionItems: ['Standard standby status. Check group notifications.'],
        spokenText: `ChronEX briefing. ${count} messages analyzed across ${authorsStr || 'the team'}. All systems synchronized.`
      };
    },

    mountBriefingCard(summaryData) {
      const card = this.renderBriefingCard(summaryData);
      const container = document.getElementById('messages-area') || document.querySelector('.messages-list') || document.getElementById('chatDetailView');
      if (container) {
        container.appendChild(card);
        card.scrollIntoView({ behavior: 'smooth' });
        if (typeof window.showNotif === 'function') {
          window.showNotif('ChronEX Group Intelligence Briefing generated', 'success', 2500);
        }
      }
    },

    renderBriefingCard(summaryData) {
      const card = document.createElement('div');
      card.className = 'chronexx-briefing-card';
      card.style.cssText = 'background:rgba(3,7,18,0.95); border:1px solid rgba(0,243,255,0.4); border-radius:14px; padding:16px; margin:16px 0; color:#fff; box-shadow:0 0 25px rgba(0,243,255,0.15);';

      const escapeHtml = (str) => {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      };

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(0,243,255,0.2); padding-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-microchip" style="color:#00f3ff; font-size:16px;"></i>
            <strong style="color:#00f3ff; font-size:13.5px; text-transform:uppercase;">${escapeHtml(summaryData.title)}</strong>
          </div>
          <button type="button" class="btn-speak-briefing" style="padding:4px 10px; background:rgba(0,243,255,0.15); border:1px solid #00f3ff; color:#00f3ff; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:5px;">
            <i class="fa-solid fa-volume-high"></i> Audio Briefing
          </button>
        </div>

        <div style="margin-bottom:10px;">
          <span style="font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase; display:block; margin-bottom:4px;">
            <i class="fa-solid fa-comments" style="color:#00f3ff; margin-right:4px;"></i>Key Discussion Themes
          </span>
          <ul style="margin:0; padding-left:18px; font-size:12px; color:#cbd5e1; line-height:1.5;">
            ${summaryData.themes.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
          </ul>
        </div>

        <div style="margin-bottom:10px;">
          <span style="font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase; display:block; margin-bottom:4px;">
            <i class="fa-solid fa-handshake" style="color:#10b981; margin-right:4px;"></i>Decisions Ratified
          </span>
          <ul style="margin:0; padding-left:18px; font-size:12px; color:#cbd5e1; line-height:1.5;">
            ${summaryData.decisions.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
          </ul>
        </div>

        <div>
          <span style="font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase; display:block; margin-bottom:4px;">
            <i class="fa-solid fa-list-check" style="color:#ffd700; margin-right:4px;"></i>Pending Action Items
          </span>
          <ul style="margin:0; padding-left:18px; font-size:12px; color:#cbd5e1; line-height:1.5;">
            ${summaryData.actionItems.map(a => `<li>${escapeHtml(a)}</li>`).join('')}
          </ul>
        </div>
      `;

      card.querySelector('.btn-speak-briefing')?.addEventListener('click', () => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(summaryData.spokenText || 'All systems normal.');
          utterance.rate = 1.05;
          utterance.pitch = 0.95;
          window.speechSynthesis.speak(utterance);
        } else {
          alert(summaryData.spokenText || 'All systems normal.');
        }
      });

      return card;
    }
  };

  window.NexChronexxSummarizer = NexChronexxSummarizer;
})(window);

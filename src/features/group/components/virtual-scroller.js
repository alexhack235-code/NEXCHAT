/**
 * VirtualScroller - High-performance resilient scroller engine for chat messages
 * 
 * Flow-based DOM engine with key-based element reconciliation, native GPU scrolling,
 * and auto-scroll-to-bottom. Solves message overlapping, ghost text, floating stickers,
 * and layout desynchronization.
 */

const SCROLL_TO_BOTTOM_THRESHOLD = 150;
const LOAD_MORE_THRESHOLD = 200;

export class VirtualScroller {
  /**
   * @param {HTMLElement} container - The scroll container element
   * @param {Object} options
   * @param {number} [options.estimatedItemHeight=72]
   * @param {number} [options.overscan=5]
   * @param {Function} options.renderItem - (item, element, index) => void
   * @param {Function} [options.onLoadMore] - Called when scrolled near top
   * @param {Function} [options.onBottomReached] - Called when scrolled to bottom
   * @param {Function} [options.onVisibleRangeChange]
   */
  constructor(container, options = {}) {
    this._container = container;
    this._renderItem = options.renderItem;
    this._onLoadMore = options.onLoadMore;
    this._onBottomReached = options.onBottomReached;
    this._onVisibleRangeChange = options.onVisibleRangeChange;

    /** @type {Array<Object>} All items */
    this._items = [];

    /** @type {Map<string, HTMLElement>} DOM node pool keyed by item ID */
    this._nodePool = new Map();

    /** @type {number} Current scroll offset */
    this._scrollTop = 0;

    /** @type {boolean} Whether auto-scroll to bottom is active */
    this._isNearBottom = true;

    /** @type {boolean} Loading more (pagination) */
    this._isLoadingMore = false;

    /** @type {number|null} RAF handle */
    this._rafHandle = null;

    /** @type {boolean} Destroyed */
    this._destroyed = false;

    // Build internal DOM structure
    this._setupDOM();
    this._bindEvents();
  }

  /**
   * Build the internal DOM structure:
   * container > natural flow content wrapper
   */
  _setupDOM() {
    this._container.classList.add('nex-virtual-scroller');
    this._container.style.overflowY = 'auto';
    this._container.style.overflowX = 'hidden';
    this._container.style.position = 'relative';
    this._container.style.scrollBehavior = 'auto';
    this._container.style.webkitOverflowScrolling = 'touch';

    // Content wrapper in natural document flow
    this._content = document.createElement('div');
    this._content.classList.add('nex-virtual-scroller-content');
    this._content.style.position = 'relative';
    this._content.style.width = '100%';
    this._content.style.minHeight = '100%';
    this._content.style.display = 'flex';
    this._content.style.flexDirection = 'column';
    this._content.style.justifyContent = 'flex-end';
    this._content.style.boxSizing = 'border-box';
    this._content.style.padding = '8px 12px 24px 12px';
    this._content.style.gap = '6px';

    // Rendered items container (flex column, natural height)
    this._rendered = document.createElement('div');
    this._rendered.className = 'nex-virtual-scroller-rendered';
    this._rendered.style.display = 'flex';
    this._rendered.style.flexDirection = 'column';
    this._rendered.style.width = '100%';
    this._rendered.style.position = 'relative';
    this._rendered.style.boxSizing = 'border-box';
    this._rendered.style.gap = '4px';

    this._content.appendChild(this._rendered);

    // Mount into container
    this._container.innerHTML = '';
    this._container.appendChild(this._content);

    // Scroll-to-bottom FAB
    this._scrollToBottomBtn = document.createElement('button');
    this._scrollToBottomBtn.classList.add('nex-scroll-to-bottom');
    this._scrollToBottomBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
    this._scrollToBottomBtn.style.display = 'none';
    this._scrollToBottomBtn.addEventListener('click', () => this.scrollToBottom(true));
    this._container.parentElement?.appendChild(this._scrollToBottomBtn);
  }

  /**
   * Bind scroll and resize events
   */
  _bindEvents() {
    this._onScroll = this._handleScroll.bind(this);
    this._container.addEventListener('scroll', this._onScroll, { passive: true });

    this._resizeObserver = new ResizeObserver(() => {
      if (this._isNearBottom) {
        this.scrollToBottom(false);
      }
    });
    this._resizeObserver.observe(this._container);
  }

  /**
   * Handle scroll events with threshold checking
   */
  _handleScroll() {
    if (this._destroyed) return;

    this._scrollTop = this._container.scrollTop;
    const scrollHeight = this._container.scrollHeight;
    const clientHeight = this._container.clientHeight;

    // Check if near bottom
    this._isNearBottom = (scrollHeight - this._scrollTop - clientHeight) < SCROLL_TO_BOTTOM_THRESHOLD;

    // Show/hide scroll-to-bottom button
    if (this._scrollToBottomBtn) {
      this._scrollToBottomBtn.style.display = this._isNearBottom ? 'none' : 'flex';
    }

    // Trigger load-more when near top ONLY if there is actual scrollable overflow
    const hasScrollOverflow = scrollHeight > clientHeight + 60;
    if (hasScrollOverflow && this._scrollTop < LOAD_MORE_THRESHOLD && !this._isLoadingMore && this._onLoadMore && this._items.length > 0) {
      this._isLoadingMore = true;
      this._onLoadMore();
    }

    // Trigger bottom-reached callback
    if (this._isNearBottom && this._onBottomReached) {
      this._onBottomReached();
    }
  }

  /**
   * Schedule a render on the next animation frame
   */
  _scheduleRender() {
    if (this._rafHandle != null) return;
    this._rafHandle = requestAnimationFrame(() => {
      this._rafHandle = null;
      this._render();
    });
  }

  /**
   * Core render — renders items into clean, natural document flow.
   * Completely avoids position:absolute, eliminate message overlapping,
   * sticker collisions, and scroll tear.
   */
  _computeItemSig(item) {
    if (!item) return '';
    if (item.type === 'date-separator') {
      const t = item.date?.getTime ? item.date.getTime() : String(item.date || '');
      return `date:${t}`;
    }
    if (item.type === 'system' || item.type === 'unread-divider') {
      return `${item.type}:${item.id || ''}:${item.text || ''}`;
    }
    const reactions = item.reactions ? JSON.stringify(item.reactions) : '';
    const replyKey = item.replyTo ? (item.replyTo.id || item.replyTo.text || '1') : '';
    return `${item.id || item.clientMsgId || ''}|${item.text || ''}|${item.edited ? '1' : '0'}|${item.isDeleted ? '1' : '0'}|${item.status || ''}|${item.hideSenderHeader ? '1' : '0'}|${item.hideAvatar ? '1' : '0'}|${item.senderName || ''}|${item.senderAvatar || ''}|${reactions}|${replyKey}`;
  }

  _render() {
    if (this._destroyed) return;

    if (this._items.length === 0) {
      if (this._rendered.childElementCount > 0) {
        this._rendered.innerHTML = '';
      }
      this._nodePool.clear();
      return;
    }

    const hadMountedItems = this._nodePool.size > 0;
    const desiredNodes = [];
    const activeIds = new Set();

    for (let i = 0; i < this._items.length; i++) {
      const item = this._items[i];
      if (!item) continue;

      const itemId = String(item.id || item.clientMsgId || `idx-${i}`);
      activeIds.add(itemId);
      const itemSig = this._computeItemSig(item);

      let node = this._nodePool.get(itemId);
      if (!node) {
        node = document.createElement('div');
        node.classList.add('nex-vs-item');
        if (hadMountedItems && item.type !== 'date-separator' && item.type !== 'system') {
          node.classList.add('nex-msg-enter');
        }
        node.dataset.vsId = itemId;
        node.dataset.vsIndex = String(i);
        node.style.position = 'relative';
        node.style.display = 'flex';
        node.style.flexDirection = 'column';
        node.style.width = '100%';
        node.style.boxSizing = 'border-box';
        node._lastRenderedItem = item;
        node._lastRenderedSig = itemSig;

        this._nodePool.set(itemId, node);

        if (this._renderItem) {
          this._renderItem(item, node, i);
        }
      } else {
        node.dataset.vsIndex = String(i);
        if (node._lastRenderedSig !== itemSig && this._renderItem) {
          node._lastRenderedItem = item;
          node._lastRenderedSig = itemSig;
          this._renderItem(item, node, i);
        }
      }

      desiredNodes.push(node);
    }

    // Garbage collect unmounted nodes from pool & remove from DOM
    for (const [id, node] of this._nodePool.entries()) {
      if (!activeIds.has(id)) {
        if (node.parentNode) node.remove();
        this._nodePool.delete(id);
      }
    }

    // Keyed in-place reconciliation: NEVER clear _rendered.innerHTML so existing bubbles stay intact with zero flicker
    if (this._rendered.childElementCount === 0) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < desiredNodes.length; i++) {
        fragment.appendChild(desiredNodes[i]);
      }
      this._rendered.appendChild(fragment);
    } else {
      const desiredSet = new Set(desiredNodes);
      for (let i = this._rendered.children.length - 1; i >= 0; i--) {
        const child = this._rendered.children[i];
        if (!desiredSet.has(child)) child.remove();
      }
      for (let i = 0; i < desiredNodes.length; i++) {
        const node = desiredNodes[i];
        const currentAtIdx = this._rendered.children[i];
        if (currentAtIdx !== node) {
          this._rendered.insertBefore(node, currentAtIdx || null);
        }
      }
    }

    // Auto-scroll down if user was at bottom
    if (this._isNearBottom) {
      requestAnimationFrame(() => {
        this.scrollToBottom(false);
      });
    }
  }

  /**
   * Set the full items array (replaces all items)
   * @param {Array<Object>} items
   */
  setItems(items) {
    this._items = items || [];
    this._scheduleRender();
  }

  /**
   * Prepend older messages (pagination) with scroll anchor restoration
   * @param {Array<Object>} olderItems
   */
  prependItems(olderItems) {
    if (!olderItems || olderItems.length === 0) {
      this._isLoadingMore = false;
      return;
    }

    const prevScrollHeight = this._container.scrollHeight;
    const prevScrollTop = this._container.scrollTop;

    this._items = [...olderItems, ...this._items];
    this._render();

    requestAnimationFrame(() => {
      const newScrollHeight = this._container.scrollHeight;
      const heightDiff = newScrollHeight - prevScrollHeight;
      this._container.scrollTop = prevScrollTop + heightDiff;
      this._scrollTop = this._container.scrollTop;
      this._isLoadingMore = false;
    });
  }

  /**
   * Append new messages (realtime incoming)
   * @param {Array<Object>} newItems
   */
  appendItems(newItems) {
    if (!newItems || newItems.length === 0) return;

    const wasNearBottom = this._isNearBottom;
    this._items = [...this._items, ...newItems];

    this._render();

    if (wasNearBottom) {
      requestAnimationFrame(() => {
        this.scrollToBottom(true);
      });
    }
  }

  /**
   * Update a single item in place (reactions, edit, read status)
   * @param {string} itemId
   * @param {Object} updatedItem
   */
  updateItem(itemId, updatedItem) {
    const index = this._items.findIndex(item => String(item.id || item.clientMsgId) === String(itemId));
    if (index === -1) return;

    this._items[index] = updatedItem;

    const node = this._nodePool.get(String(itemId));
    if (node && this._renderItem) {
      node._lastRenderedItem = updatedItem;
      this._renderItem(updatedItem, node, index);
    } else {
      this._scheduleRender();
    }
  }

  /**
   * Remove an item (message deleted)
   * @param {string} itemId
   */
  removeItem(itemId) {
    const index = this._items.findIndex(item => String(item.id || item.clientMsgId) === String(itemId));
    if (index === -1) return;

    this._items.splice(index, 1);
    const node = this._nodePool.get(String(itemId));
    if (node) {
      node.remove();
      this._nodePool.delete(String(itemId));
    }
  }

  /**
   * Scroll to the bottom of the list
   * @param {boolean} [smooth=false]
   */
  scrollToBottom(smooth = false) {
    if (this._destroyed || !this._container) return;
    this._container.scrollTo({
      top: this._container.scrollHeight + 10000,
      behavior: smooth ? 'smooth' : 'auto'
    });
    this._isNearBottom = true;
    if (this._scrollToBottomBtn) {
      this._scrollToBottomBtn.style.display = 'none';
    }
  }

  /**
   * Scroll to a specific item by its ID
   * @param {string} itemId
   * @param {string} [behavior='smooth']
   */
  scrollToItem(itemId, behavior = 'smooth') {
    const node = this._nodePool.get(String(itemId));
    if (node) {
      node.scrollIntoView({ behavior, block: 'center' });
      node.classList.add('nex-vs-item-highlight');
      setTimeout(() => node.classList.remove('nex-vs-item-highlight'), 2000);
    }
  }

  /**
   * Finish loading more (resets loading lock)
   */
  finishLoadMore() {
    this._isLoadingMore = false;
  }

  /**
   * Destroy the scroller instance and remove event listeners
   */
  destroy() {
    this._destroyed = true;
    if (this._rafHandle) cancelAnimationFrame(this._rafHandle);
    if (this._resizeObserver) this._resizeObserver.disconnect();
    this._container.removeEventListener('scroll', this._onScroll);
    this._scrollToBottomBtn?.remove();
    this._nodePool.clear();
    this._items = [];
  }
}

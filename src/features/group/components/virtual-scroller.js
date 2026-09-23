/**
 * VirtualScroller - High-performance virtual scroll engine for chat messages
 * 
 * Renders only visible items + overscan buffer, recycling DOM nodes from a pool.
 * Supports reverse-infinite-scroll (load older messages at top), anchor-based
 * scroll restoration, and auto-scroll-to-bottom for new messages.
 * 
 * Designed for 10,000+ messages at 60fps in a vanilla JS environment.
 * 
 * @example
 *   const scroller = new VirtualScroller(container, {
 *     estimatedItemHeight: 72,
 *     overscan: 5,
 *     renderItem: (item, element) => { ... },
 *     onLoadMore: () => loadOlderMessages(),
 *     onBottomReached: () => markAllRead()
 *   });
 *   scroller.setItems(messages);
 *   scroller.appendItems(newMessages);
 *   scroller.prependItems(olderMessages);
 */

const DEFAULT_ITEM_HEIGHT = 72;
const OVERSCAN_COUNT = 5;
const SCROLL_TO_BOTTOM_THRESHOLD = 150;
const LOAD_MORE_THRESHOLD = 200;

export class VirtualScroller {
  /**
   * @param {HTMLElement} container - The scroll container element
   * @param {Object} options
   * @param {number} [options.estimatedItemHeight=72] - Estimated height per item
   * @param {number} [options.overscan=5] - Extra items to render above/below viewport
   * @param {Function} options.renderItem - (item, element) => void — renders item into element
   * @param {Function} [options.onLoadMore] - Called when scrolled near top (pagination)
   * @param {Function} [options.onBottomReached] - Called when scrolled to bottom
   * @param {Function} [options.onVisibleRangeChange] - (startIndex, endIndex) => void
   */
  constructor(container, options = {}) {
    this._container = container;
    this._estimatedHeight = options.estimatedItemHeight || DEFAULT_ITEM_HEIGHT;
    this._overscan = options.overscan || OVERSCAN_COUNT;
    this._renderItem = options.renderItem;
    this._onLoadMore = options.onLoadMore;
    this._onBottomReached = options.onBottomReached;
    this._onVisibleRangeChange = options.onVisibleRangeChange;

    /** @type {Array<Object>} All items */
    this._items = [];

    /** @type {Map<number, number>} Measured heights by index */
    this._measuredHeights = new Map();

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
   * container > viewport > content (with dynamic height)
   */
  _setupDOM() {
    this._container.classList.add('nex-virtual-scroller');
    this._container.style.overflow = 'auto';
    this._container.style.position = 'relative';
    this._container.style.willChange = 'transform';

    // Content wrapper — its height represents total scrollable area
    this._content = document.createElement('div');
    this._content.classList.add('nex-virtual-scroller-content');
    this._content.style.position = 'relative';
    this._content.style.width = '100%';

    // Rendered items container — positioned absolutely within content
    this._rendered = document.createElement('div');
    this._rendered.style.position = 'absolute';
    this._rendered.style.top = '0';
    this._rendered.style.left = '0';
    this._rendered.style.right = '0';

    this._content.appendChild(this._rendered);

    // Clear container and mount
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
      this._scheduleRender();
    });
    this._resizeObserver.observe(this._container);
  }

  /**
   * Handle scroll events with RAF batching
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

    // Trigger load-more when near top
    if (this._scrollTop < LOAD_MORE_THRESHOLD && !this._isLoadingMore && this._onLoadMore && this._items.length > 0) {
      this._isLoadingMore = true;
      this._onLoadMore();
    }

    // Trigger bottom-reached callback
    if (this._isNearBottom && this._onBottomReached) {
      this._onBottomReached();
    }

    this._scheduleRender();
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
   * Get the height for an item (measured or estimated)
   * @param {number} index
   * @returns {number}
   */
  _getItemHeight(index) {
    return this._measuredHeights.get(index) || this._estimatedHeight;
  }

  /**
   * Calculate the total height of all items
   * @returns {number}
   */
  _getTotalHeight() {
    let total = 0;
    for (let i = 0; i < this._items.length; i++) {
      total += this._getItemHeight(i);
    }
    return total;
  }

  /**
   * Get the Y offset for a given index
   * @param {number} index
   * @returns {number}
   */
  _getOffsetForIndex(index) {
    let offset = 0;
    for (let i = 0; i < index && i < this._items.length; i++) {
      offset += this._getItemHeight(i);
    }
    return offset;
  }

  /**
   * Find the item index at a given scroll offset
   * @param {number} offset
   * @returns {number}
   */
  _getIndexAtOffset(offset) {
    let accumulated = 0;
    for (let i = 0; i < this._items.length; i++) {
      accumulated += this._getItemHeight(i);
      if (accumulated > offset) return i;
    }
    return Math.max(0, this._items.length - 1);
  }

  /**
   * Core render — determines visible range and renders only those items
   */
  _render() {
    if (this._destroyed || this._items.length === 0) {
      this._content.style.height = '0px';
      this._rendered.innerHTML = '';
      return;
    }

    const totalHeight = this._getTotalHeight();
    this._content.style.height = `${totalHeight}px`;

    const viewportHeight = this._container.clientHeight;
    const scrollTop = this._scrollTop;

    // Find visible range
    const startIndex = Math.max(0, this._getIndexAtOffset(scrollTop) - this._overscan);
    const endOffset = scrollTop + viewportHeight;
    let endIndex = Math.min(this._items.length - 1, this._getIndexAtOffset(endOffset) + this._overscan);

    // Notify visible range change
    if (this._onVisibleRangeChange) {
      const visStart = this._getIndexAtOffset(scrollTop);
      const visEnd = this._getIndexAtOffset(endOffset);
      this._onVisibleRangeChange(visStart, visEnd);
    }

    // Collect currently rendered item IDs
    const renderedIds = new Set();
    const fragment = document.createDocumentFragment();

    for (let i = startIndex; i <= endIndex; i++) {
      const item = this._items[i];
      if (!item) continue;

      const itemId = item.id || `idx-${i}`;
      renderedIds.add(itemId);

      // Get or create node
      let node = this._nodePool.get(itemId);
      if (!node) {
        node = document.createElement('div');
        node.classList.add('nex-vs-item');
        node.dataset.vsIndex = String(i);
        node.dataset.vsId = itemId;
        this._nodePool.set(itemId, node);
        
        // Render item content
        if (this._renderItem) {
          this._renderItem(item, node, i);
        }
      }

      // Position the node
      const offsetY = this._getOffsetForIndex(i);
      node.style.position = 'absolute';
      node.style.top = `${offsetY}px`;
      node.style.left = '0';
      node.style.right = '0';
      node.style.width = '100%';

      fragment.appendChild(node);
    }

    // Replace rendered content
    this._rendered.innerHTML = '';
    this._rendered.appendChild(fragment);

    // Measure actual heights after render
    requestAnimationFrame(() => {
      if (this._destroyed) return;
      let heightChanged = false;

      for (let i = startIndex; i <= endIndex; i++) {
        const item = this._items[i];
        if (!item) continue;
        const itemId = item.id || `idx-${i}`;
        const node = this._nodePool.get(itemId);
        if (node) {
          const actualHeight = node.getBoundingClientRect().height;
          if (actualHeight > 0 && actualHeight !== this._measuredHeights.get(i)) {
            this._measuredHeights.set(i, actualHeight);
            heightChanged = true;
          }
        }
      }

      // Re-render if heights changed significantly
      if (heightChanged) {
        const newTotal = this._getTotalHeight();
        this._content.style.height = `${newTotal}px`;

        // Re-position visible items
        for (let i = startIndex; i <= endIndex; i++) {
          const item = this._items[i];
          if (!item) continue;
          const itemId = item.id || `idx-${i}`;
          const node = this._nodePool.get(itemId);
          if (node) {
            const offsetY = this._getOffsetForIndex(i);
            node.style.top = `${offsetY}px`;
          }
        }
      }
    });

    // Clean up off-screen nodes from pool (keep pool manageable)
    if (this._nodePool.size > (endIndex - startIndex + 1) * 3) {
      for (const [id, node] of this._nodePool) {
        if (!renderedIds.has(id)) {
          this._nodePool.delete(id);
        }
      }
    }
  }

  /**
   * Set the full items array (replaces all items)
   * @param {Array<Object>} items
   */
  setItems(items) {
    this._items = items || [];
    this._measuredHeights.clear();
    this._nodePool.clear();
    this._rendered.innerHTML = '';
    this._scheduleRender();

    if (this._isNearBottom) {
      requestAnimationFrame(() => this.scrollToBottom(false));
    }
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

    // Capture anchor: the item currently at the top of the viewport
    const anchorIndex = this._getIndexAtOffset(this._scrollTop);
    const anchorOffset = this._scrollTop - this._getOffsetForIndex(anchorIndex);

    // Shift measured heights
    const newMeasured = new Map();
    for (const [idx, height] of this._measuredHeights) {
      newMeasured.set(idx + olderItems.length, height);
    }
    this._measuredHeights = newMeasured;

    // Prepend items
    this._items = [...olderItems, ...this._items];

    // Clear node pool (IDs shifted)
    this._nodePool.clear();
    this._rendered.innerHTML = '';

    // Restore scroll position to the anchor item
    requestAnimationFrame(() => {
      const newAnchorOffset = this._getOffsetForIndex(anchorIndex + olderItems.length);
      this._container.scrollTop = newAnchorOffset + anchorOffset;
      this._scrollTop = this._container.scrollTop;
      this._isLoadingMore = false;
      this._scheduleRender();
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

    // Invalidate node pool for new items
    for (const item of newItems) {
      const id = item.id;
      if (id) this._nodePool.delete(id);
    }

    this._scheduleRender();

    // Auto-scroll to bottom if user was near bottom
    if (wasNearBottom) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.scrollToBottom(true);
        });
      });
    }
  }

  /**
   * Update a single item in place (e.g., reaction added, read receipt updated)
   * @param {string} itemId
   * @param {Object} updatedItem
   */
  updateItem(itemId, updatedItem) {
    const index = this._items.findIndex(item => item.id === itemId);
    if (index === -1) return;

    this._items[index] = updatedItem;

    // Re-render the specific node
    const node = this._nodePool.get(itemId);
    if (node && this._renderItem) {
      this._renderItem(updatedItem, node, index);
      // Clear measured height to re-measure
      this._measuredHeights.delete(index);
    }

    this._scheduleRender();
  }

  /**
   * Remove an item (e.g., message deleted)
   * @param {string} itemId
   */
  removeItem(itemId) {
    const index = this._items.findIndex(item => item.id === itemId);
    if (index === -1) return;

    this._items.splice(index, 1);
    this._nodePool.delete(itemId);

    // Shift measured heights
    const newMeasured = new Map();
    for (const [idx, height] of this._measuredHeights) {
      if (idx < index) newMeasured.set(idx, height);
      else if (idx > index) newMeasured.set(idx - 1, height);
    }
    this._measuredHeights = newMeasured;

    this._scheduleRender();
  }

  /**
   * Scroll to the bottom of the list
   * @param {boolean} [smooth=false]
   */
  scrollToBottom(smooth = false) {
    if (this._destroyed) return;
    const totalHeight = this._getTotalHeight();
    this._container.scrollTo({
      top: totalHeight,
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
    const index = this._items.findIndex(item => item.id === itemId);
    if (index === -1) return;

    const offset = this._getOffsetForIndex(index);
    const viewportHeight = this._container.clientHeight;

    this._container.scrollTo({
      top: Math.max(0, offset - viewportHeight / 3),
      behavior
    });

    // Highlight the item briefly
    requestAnimationFrame(() => {
      const node = this._nodePool.get(itemId);
      if (node) {
        node.classList.add('nex-vs-item-highlight');
        setTimeout(() => node.classList.remove('nex-vs-item-highlight'), 2000);
      }
    });
  }

  /**
   * Get total item count
   * @returns {number}
   */
  getItemCount() {
    return this._items.length;
  }

  /**
   * Check if scrolled near bottom
   * @returns {boolean}
   */
  isNearBottom() {
    return this._isNearBottom;
  }

  /**
   * Mark pagination loading as complete
   */
  finishLoadMore() {
    this._isLoadingMore = false;
  }

  /**
   * Clean up and destroy the scroller
   */
  destroy() {
    this._destroyed = true;

    if (this._rafHandle != null) {
      cancelAnimationFrame(this._rafHandle);
      this._rafHandle = null;
    }

    this._container.removeEventListener('scroll', this._onScroll);

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }

    if (this._scrollToBottomBtn?.parentElement) {
      this._scrollToBottomBtn.remove();
    }

    this._items = [];
    this._measuredHeights.clear();
    this._nodePool.clear();
    this._rendered.innerHTML = '';
    this._container.innerHTML = '';
  }
}

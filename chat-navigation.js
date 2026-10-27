window.handleNavigation = function (navSection) {
    if (!navSection) return;
    const normalized = navSection.toLowerCase().trim();

    const sections = {
        chat: 'chatListView',
        chats: 'chatListView',
        messages: 'chatListView',
        status: 'statusContainer',
        updates: 'statusContainer',
        groups: 'groupsContainer',
        communities: 'groupsContainer',
        announcements: 'announcementsContainer',
        news: 'announcementsContainer',
        alerts: 'announcementsContainer',
        calls: 'callHistoryContainer',
        call: 'callHistoryContainer',
        marketplace: 'advertisement.html',
        market: 'advertisement.html',
        games: 'gaminghub.html',
        gaming: 'gaminghub.html',
        game: 'game.html',
        astroshift: 'game.html',
        terminal: 'terminal.html',
        camshot: 'reels.html',
        reels: 'reels.html',
        video: 'chat.html'
    };

    if (normalized === 'more') {
        const moreSheet = document.getElementById('mobileMoreSheet');
        if (moreSheet) {
            moreSheet.classList.toggle('open');
        }
        return;
    }

    const target = sections[normalized];
    if (!target) {
        if (typeof window.showChatListView === 'function') {
            window.showChatListView();
        } else {
            const chatList = document.getElementById('chatListView');
            if (chatList) chatList.style.display = 'flex';
        }
        return;
    }

    if (typeof target === 'string' && target.endsWith('.html')) {
        window.location.href = target;
        return;
    }

    // Close mobile more sheet if open
    const moreSheet = document.getElementById('mobileMoreSheet');
    if (moreSheet) moreSheet.classList.remove('open');

    const chatMain = document.querySelector('.chat-main');
    const app = document.querySelector('.app');
    if (app) {
        app.dataset.activeSection = (normalized === 'chat' || normalized === 'messages') ? 'chats' : normalized;
    }

    // Hide all subviews
    document.querySelectorAll('.chat-list-view, .nex-status-container, .whatsapp-updates-container, .status-container, .groups-container, .announcements-container, .call-history-container').forEach((section) => {
        section.style.setProperty('display', 'none', 'important');
    });

    if (normalized === 'chats' || normalized === 'chat' || normalized === 'messages') {
        if (typeof window.showChatListView === 'function') {
            window.showChatListView();
        } else {
            if (chatMain) chatMain.style.setProperty('display', 'flex', 'important');
            const element = document.getElementById(target);
            if (element) element.style.setProperty('display', 'flex', 'important');
        }
    } else {
        if (chatMain) chatMain.style.setProperty('display', 'none', 'important');
        const element = document.getElementById(target);
        if (element) {
            element.style.setProperty('display', 'flex', 'important');
        }
    }

    // Trigger section-specific live data fetchers
    if (normalized === 'calls' || normalized === 'call') {
        if (typeof window.loadCallHistory === 'function') window.loadCallHistory();
    } else if (normalized === 'updates' || normalized === 'status') {
        if (typeof window.loadStatusFeed === 'function') window.loadStatusFeed();
    } else if (normalized === 'groups' || normalized === 'communities') {
        if (typeof window.loadGroups === 'function') window.loadGroups();
    } else if (normalized === 'announcements' || normalized === 'news' || normalized === 'alerts') {
        if (typeof window.loadAnnouncements === 'function') window.loadAnnouncements();
    }

    // Update active tab styling
    document.querySelectorAll('.nav-item').forEach((item) => {
        const navAttr = item.getAttribute('data-nav');
        if (navAttr && (navAttr === normalized || sections[navAttr] === target)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
};

window.__nexchatNavigationReady = true;
export const handleNavigation = window.handleNavigation;

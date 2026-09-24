
let clansUnsubscribe;
let clipsUnsubscribe;
let gamersUnsubscribe;
let sessionsUnsubscribe;

const foldableStates = {
  myClans: true,
  suggestedClans: true,
  clanInvites: false,
  trendingClips: true,
  myClips: false,
  clanClips: false
};

import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit,
  onSnapshot, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import { uploadAnyMedia } from "./src/js/media-upload.js";

const GAMES_DATABASE = [
  {
    id: 1,
    name: "Blood Strike",
    icon: "fa-solid fa-gamepad",
    category: "action",
    description: "Intense multiplayer tactical shooter. Fast-paced combat with various game modes. Free-to-play FPS action!",
    playersNow: 456789,
    avgScore: 18500,
    avgTime: 12,
    rating: 4.8,
    badges: "HOT",
    gameUrl: "https://play.bloodstrike.com",
    type: "shooter"
  },
  {
    id: 2,
    name: "Call of Duty Mobile",
    icon: "fa-solid fa-gamepad",
    category: "action",
    description: "COD Mobile - Legendary FPS on mobile! Multiplayer battles, Zombies, Campaign. True COD experience.",
    playersNow: 2345678,
    avgScore: 24500,
    avgTime: 15,
    rating: 4.9,
    badges: "TOP",
    gameUrl: "https://www.callofduty.com/mobile",
    type: "shooter"
  },
  {
    id: 3,
    name: "PUBG Mobile",
    icon: "fa-solid fa-gamepad",
    category: "action",
    description: "PUBG Mobile - Battle royale legend! 100 players drop, loot, and fight. Survive to win!",
    playersNow: 3456789,
    avgScore: 45000,
    avgTime: 20,
    rating: 4.8,
    badges: "TRENDING",
    gameUrl: "https://www.pubgmobile.com",
    type: "battle-royale"
  },
  {
    id: 4,
    name: "FireLite",
    icon: "fa-solid fa-gamepad",
    category: "action",
    description: "Fast-paced online shooter! Competitive matches with squad-based gameplay. Download and dominate!",
    playersNow: 234567,
    avgScore: 16200,
    avgTime: 10,
    rating: 4.7,
    badges: null,
    gameUrl: "https://firelite.com",
    type: "shooter"
  },
  {
    id: 5,
    name: "Fortnite",
    icon: "fa-solid fa-gamepad",
    category: "action",
    description: "Epic battle royale! 100 players compete with building mechanics. Free-to-play with seasons & events.",
    playersNow: 5678901,
    avgScore: 55000,
    avgTime: 18,
    rating: 4.9,
    badges: "TOP",
    gameUrl: "https://www.fortnite.com",
    type: "battle-royale"
  },
  {
    id: 6,
    name: "Valorant",
    icon: "fa-solid fa-gamepad",
    category: "action",
    description: "Tactical 5v5 competitive shooter! Agent-based abilities with round-based economy system.",
    playersNow: 1234567,
    avgScore: 28000,
    avgTime: 35,
    rating: 4.9,
    badges: "HOT",
    gameUrl: "https://playvalorant.com",
    type: "shooter"
  },
  {
    id: 7,
    name: "Counter-Strike 2",
    icon: "fa-solid fa-gamepad",
    category: "action",
    description: "CS2 - The legendary competitive FPS! Terrorist vs Counter-Terrorist. Pure tactical gameplay.",
    playersNow: 2789012,
    avgScore: 32000,
    avgTime: 40,
    rating: 4.8,
    badges: null,
    gameUrl: "https://www.counter-strike.net/cs2",
    type: "shooter"
  },
  {
    id: 8,
    name: "Apex Legends",
    icon: "fa-solid fa-gamepad",
    category: "action",
    description: "Hero-based battle royale! 3v3 teams with unique legends. Ping system for teamwork.",
    playersNow: 1890234,
    avgScore: 38000,
    avgTime: 20,
    rating: 4.8,
    badges: "TRENDING",
    gameUrl: "https://www.ea.com/games/apex",
    type: "battle-royale"
  },
  {
    id: 9,
    name: "Warzone 2.0",
    icon: "fa-solid fa-gamepad",
    category: "action",
    description: "Call of Duty Warzone - Massive 150-player battle royale. Squads, Solos, Duos modes.",
    playersNow: 3567890,
    avgScore: 52000,
    avgTime: 25,
    rating: 4.7,
    badges: "HOT",
    gameUrl: "https://www.callofduty.com/warzone",
    type: "battle-royale"
  },
  {
    id: 10,
    name: "Rainbow Six Siege",
    icon: "fa-solid fa-gamepad",
    category: "strategy",
    description: "Tactical team-based shooter! 5v5 with destructible environments. Attack & defend objectives.",
    playersNow: 987654,
    avgScore: 25000,
    avgTime: 40,
    rating: 4.7,
    badges: null,
    gameUrl: "https://www.ubisoft.com/en-us/game/rainbow-six/siege",
    type: "shooter"
  },
  {
    id: 11,
    name: "Overwatch 2",
    icon: "fa-solid fa-gamepad",
    category: "multiplayer",
    description: "Hero shooter 5v5! Team-based gameplay with diverse character abilities. Free-to-play.",
    playersNow: 2345678,
    avgScore: 35000,
    avgTime: 25,
    rating: 4.8,
    badges: "TOP",
    gameUrl: "https://overwatch.blizzard.com",
    type: "hero-shooter"
  },
  {
    id: 12,
    name: "Lost Ark",
    icon: "fa-solid fa-gamepad",
    category: "multiplayer",
    description: "MMO action RPG! Hardcore PvE raids and PvP combat. Rich story with dungeons and guilds.",
    playersNow: 456789,
    avgScore: 45000,
    avgTime: 120,
    rating: 4.6,
    badges: null,
    gameUrl: "https://www.lostarkmmo.com",
    type: "mmo"
  },
  {
    id: 13,
    name: "New World",
    icon: "fa-solid fa-gamepad",
    category: "multiplayer",
    description: "MMO with large-scale PvP! Territory wars between factions. Crafting, dungeons, raids.",
    playersNow: 234567,
    avgScore: 40000,
    avgTime: 90,
    rating: 4.5,
    badges: null,
    gameUrl: "https://www.newworld.com",
    type: "mmo"
  },
  {
    id: 14,
    name: "Destiny 2",
    icon: "fa-solid fa-gamepad",
    category: "action",
    description: "Sci-fi shooter MMO! PvE strikes & raids. Competitive PvP Crucible matches.",
    playersNow: 1234567,
    avgScore: 48000,
    avgTime: 60,
    rating: 4.8,
    badges: "TRENDING",
    gameUrl: "https://www.bungie.net/7/en/Destiny/NewLight",
    type: "shooter-mmo"
  },
  {
    id: 15,
    name: "PLAYERUNKNOWN'S BATTLEGROUNDS",
    icon: "fa-solid fa-gamepad",
    category: "action",
    description: "Original battle royale! 100 players, massive map, intense combat. The game that started it all!",
    playersNow: 2567890,
    avgScore: 50000,
    avgTime: 25,
    rating: 4.7,
    badges: "HOT",
    gameUrl: "https://www.pubg.com",
    type: "battle-royale"
  }
];

let allGames = [...GAMES_DATABASE].sort((a, b) => b.playersNow - a.playersNow);
let currentCategory = "all";
let currentSessionTab = "active";
let currentSearchQuery = "";
let selectedGame = null;
let darkMode = true;
let statusBannerTimeout = null;

document.addEventListener("DOMContentLoaded", () => {
  initializeDarkMode();
  loadGames();
  setupEventListeners();
  setupMainNavigation();

  initializeFirebaseConnection();

  console.log("ðŸŽ® Gaming Hub fully initialized!");

  window.viewGameDetail = viewGameDetail;
  window.playGame = playGame;
  window.closeGameModal = closeGameModal;
  window.closeGamePlayer = closeGamePlayer;
  window.shareGame = shareGame;
  window.viewGamerProfile = viewGamerProfile;
  window.closeGamerProfile = closeGamerProfile;
  window.addFriend = addFriend;
  window.inviteToSquad = inviteToSquad;
  window.startSession = startSession;
  window.joinSession = joinSession;
  window.viewSquad = viewSquad;
  window.displayLoadingState = displayLoadingState;

  window.toggleFoldable = toggleFoldable;
  window.viewClan = viewClan;
  window.joinClan = joinClan;
  window.leaveClan = leaveClan;
  window.inviteToClan = inviteToClan;
  window.respondToClanInvite = respondToClanInvite;
  window.openCreateClanModal = openCreateClanModal;
  window.closeCreateClanModal = closeCreateClanModal;
  window.closeClanDetailModal = closeClanDetailModal;

  window.viewClip = viewClip;
  window.openUploadClipModal = openUploadClipModal;
  window.closeUploadClipModal = closeUploadClipModal;
  window.closeClipViewerModal = closeClipViewerModal;
});

function setupEventListeners() {
  document.getElementById("back-to-chat-btn")?.addEventListener("click", () => {
    window.location.href = "chat.html";
  });

  document.getElementById("game-search-input")?.addEventListener("input", (e) => {
    currentSearchQuery = e.target.value.toLowerCase();
    filterAndDisplayGames();
  });

  document.querySelectorAll(".category-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".category-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentCategory = tab.dataset.category;
      filterAndDisplayGames();
    });
  });

  document.getElementById("close-game-modal-btn")?.addEventListener("click", closeGameModal);

  document.getElementById("game-detail-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "game-detail-modal") {
      closeGameModal();
    }
  });

  document.getElementById("close-player-btn")?.addEventListener("click", closeGamePlayer);

  document.getElementById("play-game-btn")?.addEventListener("click", () => {
    if (selectedGame) {
      playGame(selectedGame);
    }
  });

  document.getElementById("share-game-btn")?.addEventListener("click", () => {
    if (selectedGame) {
      shareGame(selectedGame);
    }
  });

  document.getElementById("createClanBtn")?.addEventListener("click", openCreateClanModal);
  document.getElementById("createClanForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    createClan();
  });

  document.getElementById("uploadClipBtn")?.addEventListener("click", openUploadClipModal);
  document.getElementById("uploadClipForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    uploadClip();
  });

  document.getElementById("createSquadBtn")?.addEventListener("click", showCreateSquadModal);
  document.getElementById("createSessionBtn")?.addEventListener("click", showCreateSessionModal);

  document.querySelectorAll(".session-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".session-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentSessionTab = tab.dataset.tab || "active";
      loadSessions();
    });
  });
}

function initializeDarkMode() {
  const savedDarkMode = localStorage.getItem("darkMode");
  darkMode = savedDarkMode !== "false";

  if (!darkMode) {
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
  }
}

function loadGames() {
  displayLoadingState(true);

  setTimeout(() => {
    displayLoadingState(false);
    filterAndDisplayGames();
  }, 300);
}

function filterAndDisplayGames() {
  let filtered = allGames;

  if (currentCategory !== "all") {
    filtered = filtered.filter((game) => game.category === currentCategory);
  }

  if (currentSearchQuery) {
    filtered = filtered.filter((game) =>
      game.name.toLowerCase().includes(currentSearchQuery) ||
      game.description.toLowerCase().includes(currentSearchQuery)
    );
  }

  displayGames(filtered);
}

function displayGames(games) {
  const grid = document.getElementById("games-grid");
  const emptyState = document.getElementById("empty-state");

  if (!grid) return;

  if (games.length === 0) {
    grid.style.display = "none";
    emptyState.style.display = "flex";
    return;
  }

  grid.style.display = "grid";
  emptyState.style.display = "none";
  grid.innerHTML = games
    .map(
      (game) => `
    <div class="game-card" onclick="viewGameDetail(${game.id})">
      <div class="game-card-image">
        <span><i class="${game.icon || "fa-solid fa-gamepad"}"></i></span>
        ${game.badges ? `<div class="game-card-badge">${game.badges}</div>` : ""}
      </div>
      <div class="game-card-info">
        <h3 class="game-card-name">${game.name}</h3>
        <p class="game-card-category">${game.category}</p>
        <div class="game-card-stats">
          <span class="stat"> ${formatNumber(game.playersNow)}</span>
          <span class="stat"> ${game.rating}</span>
        </div>
        <div class="game-card-rating">
          ${Array(Math.round(game.rating))
          .fill("")
          .join("")}
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

function viewGameDetail(gameId) {
  console.log("ðŸ” Viewing game detail for ID:", gameId);
  selectedGame = allGames.find((g) => g.id === parseInt(gameId, 10)) || allGames.find((g) => g.id == gameId);

  if (!selectedGame) {
    console.error("âŒ Game not found for ID:", gameId);
    return;
  }

  const modal = document.getElementById("game-detail-modal");
  if (!modal) {
    console.error("âŒ Modal element not found!");
    return;
  }

  const imgEl = document.getElementById("game-detail-image");
  const nameEl = document.getElementById("game-detail-name");
  const catEl = document.getElementById("game-detail-category");
  const playEl = document.getElementById("game-detail-players");
  const ratEl = document.getElementById("game-detail-rating");
  const descEl = document.getElementById("game-detail-description");
  const playingEl = document.getElementById("game-detail-playing");
  const scoreEl = document.getElementById("game-detail-score");
  const timeEl = document.getElementById("game-detail-time");

  if (imgEl) imgEl.innerHTML = selectedGame.emoji || "ðŸŽ®";
  if (nameEl) nameEl.textContent = selectedGame.name || "Unknown Game";
  if (catEl) {
    const cat = selectedGame.category || "General";
    catEl.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
  }
  if (playEl) playEl.textContent = formatNumber(selectedGame.playersNow || 0);
  if (ratEl) ratEl.textContent = `${selectedGame.rating || 0} â­`;
  if (descEl) descEl.textContent = selectedGame.description || "No description available.";
  if (playingEl) playingEl.textContent = formatNumber(selectedGame.playersNow || 0);
  if (scoreEl) scoreEl.textContent = formatNumber(selectedGame.avgScore || 0);
  if (timeEl) timeEl.textContent = `${selectedGame.avgTime || 0}min`;

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeGameModal() {
  const modal = document.getElementById("game-detail-modal");
  modal.style.display = "none";
  document.body.style.overflow = "auto";
  selectedGame = null;
}

function playGame(game) {
  if (!game.gameUrl) {
    showNotification(`Game ${game.name} not yet available`, "error");
    return;
  }

  const playerModal = document.getElementById("game-player-modal");
  const iframe = document.getElementById("game-iframe");
  const playerEmoji = document.getElementById("player-game-emoji");
  const playerName = document.getElementById("player-game-name");

  if (!playerModal || !iframe) return;

  showNotification(` Launching ${game.name}...`, "success");

  if (playerEmoji) playerEmoji.textContent = game.emoji;
  if (playerName) playerName.textContent = game.name;

  iframe.src = game.gameUrl;
  playerModal.style.display = "flex";

  document.body.style.overflow = "hidden";

  closeGameModal();

  console.log(`â–¶ï¸ Playing online game: ${game.name} | URL: ${game.gameUrl}`);
}

function closeGamePlayer() {
  const playerModal = document.getElementById("game-player-modal");
  const iframe = document.getElementById("game-iframe");

  if (playerModal) playerModal.style.display = "none";
  if (iframe) iframe.src = ""; // Stop the game content

  document.body.style.overflow = "auto";
}

function shareGame(game) {
  const shareText = `ðŸŽ® Check out ${game.name}! <i class="${game.icon || "fa-solid fa-gamepad"}"></i>\n\n${game.description}\n\nRate: ${game.rating}â­`;

  if (navigator.share) {
    navigator.share({
      title: game.name,
      text: shareText,
      url: window.location.href
    });
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = shareText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    showNotification("ðŸ“‹ Game info copied to clipboard!", "success");
  }
}

function displayLoadingState(show) {
  const loadingState = document.getElementById("loading-state");
  if (loadingState) {
    loadingState.style.display = show ? "flex" : "none";
  }
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function updateStatusBanner(message, type = "info", duration = 2500) {
  const banner = document.getElementById("hubStatusMessage");
  if (!banner) return;

  banner.textContent = message;
  banner.className = `hub-status-message visible ${type}`;

  if (statusBannerTimeout) {
    clearTimeout(statusBannerTimeout);
  }

  statusBannerTimeout = setTimeout(() => {
    banner.className = "hub-status-message";
  }, duration);
}

function showNotification(message, type = "info", duration = 2500) {
  if (type !== "error") {
    updateStatusBanner(message, type, duration);
    return;
  }

  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    max-width: 360px;
    width: calc(100% - 32px);
    background: #ff4444;
    color: #fff;
    padding: 14px 16px;
    border-radius: 14px;
    font-weight: 700;
    z-index: 1001;
    box-shadow: 0 8px 30px rgba(255, 68, 68, 0.35);
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(-50%) translateY(-12px)";
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

function showCreateSessionModal() {
  const modalHTML = `
    <div class="modal-overlay active" id="createSessionOverlay">
      <div class="modal-content large-modal">
        <div class="modal-header">
          <h3>Start a Gaming Session</h3>
          <button class="close-modal-btn" onclick="closeSessionModal()"></button>
        </div>
        <div class="modal-body">
          <form id="createSessionForm">
            <div class="form-group">
              <label for="sessionGame">Game</label>
              <input id="sessionGame" type="text" placeholder="Valorant, PUBG Mobile, Apex Legends" required />
            </div>
            <div class="form-group">
              <label for="sessionObjective">Objective</label>
              <input id="sessionObjective" type="text" placeholder="Ranked push, casual match, co-op quest" required />
            </div>
            <div class="form-group">
              <label for="sessionSkill">Skill Level</label>
              <select id="sessionSkill">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="pro">Pro</option>
              </select>
            </div>
            <div class="form-group">
              <label for="sessionParticipants">Max Players</label>
              <input id="sessionParticipants" type="number" min="1" max="16" value="4" required />
            </div>
            <div class="form-group">
              <label for="sessionTime">Duration</label>
              <input id="sessionTime" type="text" placeholder="60 mins" required />
            </div>
            <button type="submit" class="action-btn primary">Create Session</button>
          </form>
        </div>
      </div>
    </div>
  `;

  const existing = document.getElementById('createSessionOverlay');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.innerHTML = modalHTML;
  document.body.appendChild(container.firstElementChild);

  document.getElementById('createSessionForm')?.addEventListener('submit', handleSessionCreation);
}

function closeSessionModal() {
  const modal = document.getElementById('createSessionOverlay');
  if (modal) modal.remove();
}

function handleSessionCreation(e) {
  e.preventDefault();
  const game = document.getElementById('sessionGame')?.value.trim();
  const objective = document.getElementById('sessionObjective')?.value.trim();
  const skillLevel = document.getElementById('sessionSkill')?.value;
  const participants = parseInt(document.getElementById('sessionParticipants')?.value, 10) || 4;
  const duration = document.getElementById('sessionTime')?.value.trim();

  if (!game || !objective || !duration) {
    showNotification('Please fill in all session details', 'error');
    return;
  }

  const newSession = {
    id: Date.now(),
    game,
    createdBy: auth?.currentUser?.displayName || 'Guest Player',
    participants: 1,
    maxParticipants: participants,
    skillLevel,
    startTime: 'Starts soon',
    duration,
    objective,
    status: 'upcoming'
  };

  SESSIONS_DATABASE.unshift(newSession);
  loadSessions();
  closeSessionModal();
  updateStatusBanner('Session created. Invite your squad now!', 'success', 3000);
}

function viewSquad(squadId) {
  const id = parseInt(squadId, 10);
  const squad = SQUADS_DATABASE.find((s) => s.id === id);
  if (!squad) {
    showNotification('Squad not found', 'error');
    return;
  }

  const modalHTML = `
    <div class="modal-overlay active" id="squadDetailOverlay">
      <div class="modal-content large-modal">
        <div class="modal-header">
          <h3>${squad.emoji} ${squad.name}</h3>
          <button class="close-modal-btn" onclick="closeSquadDetailModal()"></button>
        </div>
        <div class="modal-body">
          <p class="squad-description">${squad.description}</p>
          <div class="squad-detail-grid">
            <div><strong>Game:</strong> ${squad.game}</div>
            <div><strong>Leader:</strong> ${squad.leader}</div>
            <div><strong>Skill:</strong> ${squad.skill}</div>
            <div><strong>Members:</strong> ${squad.members}/${squad.maxMembers}</div>
            <div><strong>Wins:</strong> ${squad.wins}</div>
            <div><strong>Founded:</strong> ${squad.founded}</div>
          </div>
          <div class="profile-actions">
            <button class="action-btn primary" onclick="joinSquad(${squad.id})">Join Squad</button>
            <button class="action-btn secondary" onclick="inviteToSquad(${squad.id})">Send Invite</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const existing = document.getElementById('squadDetailOverlay');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.innerHTML = modalHTML;
  document.body.appendChild(container.firstElementChild);
}

function closeSquadDetailModal() {
  const modal = document.getElementById('squadDetailOverlay');
  if (modal) modal.remove();
}

function joinSquad(squadId) {
  const squad = SQUADS_DATABASE.find((s) => s.id === parseInt(squadId, 10));
  if (!squad) {
    showNotification('Squad not found', 'error');
    return;
  }

  if (squad.members >= squad.maxMembers) {
    showNotification('Squad is full. Join another team.', 'error');
    return;
  }

  squad.members += 1;
  loadSquads();
  closeSquadDetailModal();
  updateStatusBanner(`Joined ${squad.name}. Ready to play!`, 'success', 3000);
}
style.textContent = `
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
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(-100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

function hapticFeedback(type = "light") {
  if (navigator.vibrate) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 50,
      success: [10, 20, 10]
    };
    navigator.vibrate(patterns[type] || 10);
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeGameModal();
  }
});

window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    filterAndDisplayGames();
  }, 100);
});

console.log("ðŸŽ® Gaming Hub initialized successfully!");


const GAMERS_DATABASE = [
  {
    id: 1,
    username: "ShadowNinja",
    avatar: "ðŸ¥·",
    level: 45,
    skill: "advanced",
    mainGame: "Valorant",
    hoursPlayed: 2340,
    wins: 1240,
    rating: 4.9,
    bio: "Competitive FPS player | Team Captain",
    status: "online",
    games: ["Valorant", "CS2", "Fortnite"],
    region: "North America"
  },
  {
    id: 2,
    username: "PhantomGamer",
    avatar: "ðŸ‘»",
    level: 38,
    skill: "intermediate",
    mainGame: "PUBG Mobile",
    hoursPlayed: 1856,
    wins: 856,
    rating: 4.7,
    bio: "Battle royale enthusiast | Always seeking squad",
    status: "online",
    games: ["PUBG Mobile", "Fortnite", "Apex Legends"],
    region: "Europe"
  },
  {
    id: 3,
    username: "IceQueen",
    avatar: "â„ï¸",
    level: 52,
    skill: "pro",
    mainGame: "Overwatch 2",
    hoursPlayed: 3120,
    wins: 2100,
    rating: 4.95,
    bio: "Pro esports player | Esports org: TitanGaming",
    status: "offline",
    games: ["Overwatch 2", "Valorant"],
    region: "Asia"
  },
  {
    id: 4,
    username: "NovaStrike",
    avatar: "âš¡",
    level: 28,
    skill: "beginner",
    mainGame: "Call of Duty Mobile",
    hoursPlayed: 420,
    wins: 85,
    rating: 4.3,
    bio: "New to competitive gaming, learning fast!",
    status: "online",
    games: ["Call of Duty Mobile", "Fortnite"],
    region: "South America"
  },
  {
    id: 5,
    username: "VortexKing",
    avatar: "ðŸ‘‘",
    level: 41,
    skill: "advanced",
    mainGame: "Destiny 2",
    hoursPlayed: 2650,
    wins: 450,
    rating: 4.6,
    bio: "Raid master | Mythic+ player",
    status: "online",
    games: ["Destiny 2", "Lost Ark"],
    region: "Europe"
  }
];

const SQUADS_DATABASE = [
  {
    id: 1,
    name: "Apex Predators",
    icon: "fa-solid fa-gamepad",
    game: "Apex Legends",
    leader: "ShadowNinja",
    members: 8,
    maxMembers: 20,
    joinRequests: 3,
    skill: "advanced",
    description: "Competitive Apex Legends team. Scrimmages daily.",
    founded: "2024-06-15",
    wins: 245
  },
  {
    id: 2,
    name: "Night Hunters",
    icon: "fa-solid fa-gamepad",
    game: "PUBG Mobile",
    leader: "PhantomGamer",
    members: 5,
    maxMembers: 20,
    joinRequests: 1,
    skill: "intermediate",
    description: "Casual to competitive PUBG squad",
    founded: "2024-08-20",
    wins: 128
  },
  {
    id: 3,
    name: "valorant grinders",
    icon: "fa-solid fa-gamepad",
    game: "Valorant",
    leader: "IceQueen",
    members: 15,
    maxMembers: 30,
    joinRequests: 12,
    skill: "pro",
    description: "Pro-level Valorant team. Ranked grinding.",
    founded: "2024-01-10",
    wins: 890
  }
];

const SESSIONS_DATABASE = [
  {
    id: 1,
    game: "Valorant",
    createdBy: "ShadowNinja",
    participants: 4,
    maxParticipants: 5,
    skillLevel: "advanced",
    startTime: "2024-01-21 19:00",
    duration: "120 mins",
    objective: "Competitive Ranked Push",
    status: "active"
  },
  {
    id: 2,
    game: "PUBG Mobile",
    createdBy: "PhantomGamer",
    participants: 2,
    maxParticipants: 4,
    skillLevel: "intermediate",
    startTime: "2024-01-21 18:30",
    duration: "60 mins",
    objective: "Team Deathmatch Practice",
    status: "active"
  },
  {
    id: 3,
    game: "Apex Legends",
    createdBy: "VortexKing",
    participants: 3,
    maxParticipants: 3,
    skillLevel: "advanced",
    startTime: "2024-01-21 20:00",
    duration: "90 mins",
    objective: "Squad Scrimmage",
    status: "upcoming"
  }
];

function setupMainNavigation() {
  const navTabs = document.querySelectorAll(".nav-tab");

  navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const section = tab.dataset.section;

      document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const gamesSection = document.getElementById("gamesSection");
      const gamersSection = document.getElementById("gamersSection");
      const clansSection = document.getElementById("clansSection");
      const squadsSection = document.getElementById("squadsSection");
      const clipsSection = document.getElementById("clipsSection");
      const sessionsSection = document.getElementById("sessionsSection");

      const gameSearchArea = document.querySelector(".gaming-search-area");
      const categoryTabs = document.querySelector(".category-tabs");
      const gamingTitle = document.querySelector(".gaming-title");

      if (gamesSection) gamesSection.style.display = "none";
      if (gamersSection) gamersSection.style.display = "none";
      if (clansSection) clansSection.style.display = "none";
      if (squadsSection) squadsSection.style.display = "none";
      if (clipsSection) clipsSection.style.display = "none";
      if (sessionsSection) sessionsSection.style.display = "none";

      if (section === "games") {
        if (gamesSection) gamesSection.style.display = "block";

        if (gameSearchArea) gameSearchArea.style.display = "block";
        if (categoryTabs) categoryTabs.style.display = "flex";
        if (gamingTitle) gamingTitle.textContent = "ðŸŽ® Gaming Hub";
      }
      else if (section === "gamers") {
        if (gamersSection) gamersSection.style.display = "block";

        if (gameSearchArea) gameSearchArea.style.display = "none";
        if (categoryTabs) categoryTabs.style.display = "none";
        if (gamingTitle) gamingTitle.textContent = "ðŸ‘¾ Gamers";

        loadGamers();
      }
      else if (section === "clans") {
        if (clansSection) clansSection.style.display = "block";

        if (gameSearchArea) gameSearchArea.style.display = "none";
        if (categoryTabs) categoryTabs.style.display = "none";
        if (gamingTitle) gamingTitle.textContent = "ðŸ° Clans";

        loadClans();
      }
      else if (section === "squads") {
        if (squadsSection) squadsSection.style.display = "block";

        if (gameSearchArea) gameSearchArea.style.display = "none";
        if (categoryTabs) categoryTabs.style.display = "none";
        if (gamingTitle) gamingTitle.textContent = " Squads";

        loadSquads();
      }
      else if (section === "clips") {
        if (clipsSection) clipsSection.style.display = "block";

        if (gameSearchArea) gameSearchArea.style.display = "none";
        if (categoryTabs) categoryTabs.style.display = "none";
        if (gamingTitle) gamingTitle.textContent = "ðŸŽ¬ Clips";

        loadClips();
      }
      else if (section === "sessions") {
        if (sessionsSection) sessionsSection.style.display = "block";

        if (gameSearchArea) gameSearchArea.style.display = "none";
        if (categoryTabs) categoryTabs.style.display = "none";
        if (gamingTitle) gamingTitle.textContent = "ðŸŽ® Sessions";

        loadSessions();
      }
    });
  });

  const gamesSection = document.getElementById("gamesSection");
  if (gamesSection) {
    gamesSection.style.display = "block";
  }
}

function loadGamers() {
  const gamersList = document.getElementById("gamersList");

  const usernameFilter = document.getElementById("usernameFilter");
  const gameFilter = document.getElementById("gameFilter");
  const skillFilter = document.getElementById("skillFilter");
  const statusFilter = document.getElementById("statusFilter");

  const filterGamers = () => {
    let filtered = GAMERS_DATABASE;

    if (usernameFilter && usernameFilter.value) {
      filtered = filtered.filter(g => g.username.toLowerCase().includes(usernameFilter.value.toLowerCase()));
    }

    if (gameFilter && gameFilter.value) {
      filtered = filtered.filter(g => g.games.includes(gameFilter.value));
    }

    if (skillFilter && skillFilter.value) {
      filtered = filtered.filter(g => g.skill === skillFilter.value);
    }

    if (statusFilter && statusFilter.value) {
      filtered = filtered.filter(g => g.status === statusFilter.value);
    }

    displayGamers(filtered);
  };

  if (usernameFilter) usernameFilter.addEventListener("change", filterGamers);
  if (gameFilter) gameFilter.addEventListener("change", filterGamers);
  if (skillFilter) skillFilter.addEventListener("change", filterGamers);
  if (statusFilter) statusFilter.addEventListener("change", filterGamers);

  filterGamers();
}

function displayGamers(gamers) {
  const gamersList = document.getElementById("gamersList");
  gamersList.innerHTML = gamers.map(gamer => `
    <div class="gamer-card" onclick="viewGamerProfile(${gamer.id})">
      <div class="gamer-header">
        <div class="gamer-avatar">${gamer.avatar}</div>
        <div class="gamer-status" style="background: ${gamer.status === 'online' ? '#00ff66' : '#999'};"></div>
      </div>
      <h3 class="gamer-name">${gamer.username}</h3>
      <p class="gamer-level">Level ${gamer.level} | ${gamer.skill}</p>
      <p class="gamer-game">ðŸŽ® ${gamer.mainGame}</p>
      <div class="gamer-stats">
        <span> ${gamer.rating}</span>
        <span> ${gamer.wins} wins</span>
      </div>
      <button class="gamer-action-btn" onclick="event.stopPropagation(); addFriend(${gamer.id})"> Add Friend</button>
    </div>
  `).join("");
}

function viewGamerProfile(gamerId) {
  const gamer = GAMERS_DATABASE.find(g => g.id === gamerId);
  if (!gamer) return;

  const profileHTML = `
    <div class="gamer-profile-modal">
      <button class="close-modal" onclick="closeGamerProfile()">âœ•</button>
      <div class="profile-header" style="background: linear-gradient(135deg, #00ff66, #00ccff);">
        <div class="profile-avatar-large">${gamer.avatar}</div>
        <div class="profile-status">${gamer.status === 'online' ? 'ðŸŸ¢ Online' : 'âš« Offline'}</div>
      </div>
      <div class="profile-body">
        <h2>${gamer.username}</h2>
        <p class="profile-bio">${gamer.bio}</p>
        
        <div class="profile-stats">
          <div class="stat">
            <span class="stat-label">Level</span>
            <span class="stat-value">${gamer.level}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Rating</span>
            <span class="stat-value">${gamer.rating} â­</span>
          </div>
          <div class="stat">
            <span class="stat-label">Wins</span>
            <span class="stat-value">${gamer.wins}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Hours</span>
            <span class="stat-value">${gamer.hoursPlayed}</span>
          </div>
        </div>

        <div class="profile-section">
          <h4>Favorite Games</h4>
          <div class="games-list">
            ${gamer.games.map(game => `<span class="game-tag">${game}</span>`).join('')}
          </div>
        </div>

        <div class="profile-section">
          <h4>Region</h4>
          <p>${gamer.region}</p>
        </div>

        <div class="profile-actions">
          <button class="action-btn primary" onclick="addFriend(${gamer.id})">ðŸ‘¥ Add Friend</button>
          <button class="action-btn secondary" onclick="inviteToSquad(${gamer.id})">ðŸŽ–ï¸ Invite to Squad</button>
          <button class="action-btn secondary" onclick="startSession(${gamer.id})">ðŸŽ® Play Together</button>
        </div>
      </div>
    </div>
  `;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = profileHTML;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeGamerProfile();
  };

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add("active"), 10);
}

function closeGamerProfile() {
  const overlay = document.querySelector(".modal-overlay");
  if (overlay) {
    overlay.classList.remove("active");
    setTimeout(() => overlay.remove(), 300);
  }
}


function toggleFoldable(sectionId) {
  const content = document.getElementById(`${sectionId}Content`);
  const toggle = content.previousElementSibling.querySelector('.fold-toggle');

  foldableStates[sectionId] = !foldableStates[sectionId];

  if (foldableStates[sectionId]) {
    content.style.display = 'block';
    toggle.textContent = 'â–¼';
  } else {
    content.style.display = 'none';
    toggle.textContent = 'â–¶';
  }
}


async function loadClans() {
  try {
    if (clansUnsubscribe) {
      clansUnsubscribe();
    }

    setupClanListeners();

    await loadMyClans();
    await loadSuggestedClans();
    await loadClanInvites();

  } catch (error) {
    console.error('Error loading clans:', error);
    showNotification('âŒ Failed to load clans', 'error');
  }
}

function setupClanListeners() {
  clansUnsubscribe = onSnapshot(
    query(collection(db, 'clans'), where('members', 'array-contains', auth.currentUser?.uid || 'guest')),
    (snapshot) => {
      loadMyClans();
    },
    (error) => {
      console.error('Clan listener error:', error);
    }
  );
}

async function loadMyClans() {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      document.getElementById('myClansList').innerHTML = '<p class="empty-text">Please login to view your clans</p>';
      return;
    }

    const clansRef = collection(db, 'clans');
    const q = query(clansRef, where('members', 'array-contains', userId));
    const snapshot = await getDocs(q);

    const clansList = document.getElementById('myClansList');

    if (snapshot.empty) {
      clansList.innerHTML = '<p class="empty-text">No clans yet. Create or join one!</p>';
      return;
    }

    const clansHTML = snapshot.docs.map(doc => {
      const clan = { id: doc.id, ...doc.data() };
      return `
        <div class="clan-card" onclick="viewClan('${clan.id}')">
          <div class="clan-header">
            <span class="clan-emoji">${clan.emoji || 'ðŸ°'}</span>
            <span class="clan-skill-badge">${clan.skill?.toUpperCase() || 'CASUAL'}</span>
          </div>
          <h3>${clan.name}</h3>
          <p class="clan-game">ðŸŽ® ${clan.game}</p>
          <p class="clan-description">${clan.description || 'No description'}</p>
          <div class="clan-stats">
            <span>ðŸ‘¥ ${clan.members?.length || 0}/${clan.maxMembers || 50}</span>
            <span>ðŸ† ${clan.wins || 0} wins</span>
          </div>
          <div class="clan-actions">
            <button class="clan-action-btn" onclick="event.stopPropagation(); leaveClan('${clan.id}')">Leave</button>
            <button class="clan-action-btn primary" onclick="event.stopPropagation(); inviteToClan('${clan.id}')">Invite</button>
          </div>
        </div>
      `;
    }).join('');

    clansList.innerHTML = clansHTML;

  } catch (error) {
    console.error('Error loading my clans:', error);
    document.getElementById('myClansList').innerHTML = '<p class="error-text">Failed to load clans</p>';
  }
}

async function loadSuggestedClans() {
  try {
    const clansRef = collection(db, 'clans');
    const q = query(clansRef, limit(10));
    const snapshot = await getDocs(q);

    const clansList = document.getElementById('suggestedClansList');

    if (snapshot.empty) {
      clansList.innerHTML = '<p class="empty-text">No clans available</p>';
      return;
    }

    const clansHTML = snapshot.docs.map(doc => {
      const clan = { id: doc.id, ...doc.data() };
      return `
        <div class="clan-card" onclick="viewClan('${clan.id}')">
          <div class="clan-header">
            <span class="clan-emoji">${clan.emoji || 'ðŸ°'}</span>
            <span class="clan-skill-badge">${clan.skill?.toUpperCase() || 'CASUAL'}</span>
          </div>
          <h3>${clan.name}</h3>
          <p class="clan-game">ðŸŽ® ${clan.game}</p>
          <p class="clan-description">${clan.description || 'No description'}</p>
          <div class="clan-stats">
            <span>ðŸ‘¥ ${clan.members?.length || 0}/${clan.maxMembers || 50}</span>
            <span>ðŸ† ${clan.wins || 0} wins</span>
          </div>
          <button class="clan-action-btn" onclick="event.stopPropagation(); joinClan('${clan.id}')">âž• Join</button>
        </div>
      `;
    }).join('');

    clansList.innerHTML = clansHTML;

  } catch (error) {
    console.error('Error loading suggested clans:', error);
    document.getElementById('suggestedClansList').innerHTML = '<p class="error-text">Failed to load clans</p>';
  }
}

async function loadClanInvites() {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      document.getElementById('clanInvitesList').innerHTML = '<p class="empty-text">Please login to view invites</p>';
      return;
    }

    const invitesRef = collection(db, 'clanInvites');
    const q = query(invitesRef, where('inviteeId', '==', userId), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);

    const invitesList = document.getElementById('clanInvitesList');

    if (snapshot.empty) {
      invitesList.innerHTML = '<p class="empty-text">No pending invites</p>';
      return;
    }

    const invitesHTML = snapshot.docs.map(doc => {
      const invite = { id: doc.id, ...doc.data() };
      return `
        <div class="invite-card">
          <div class="invite-info">
            <h4>ðŸ° ${invite.clanName}</h4>
            <p>Invited by: ${invite.inviterName}</p>
            <p>Game: ${invite.game}</p>
          </div>
          <div class="invite-actions">
            <button class="invite-btn accept" onclick="respondToClanInvite('${invite.id}', 'accepted', '${invite.clanId}')">âœ… Accept</button>
            <button class="invite-btn decline" onclick="respondToClanInvite('${invite.id}', 'declined')">âŒ Decline</button>
          </div>
        </div>
      `;
    }).join('');

    invitesList.innerHTML = invitesHTML;

  } catch (error) {
    console.error('Error loading clan invites:', error);
    document.getElementById('clanInvitesList').innerHTML = '<p class="error-text">Failed to load invites</p>';
  }
}

async function createClan() {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    showNotification('âŒ Please login to create a clan', 'error');
    return;
  }

  const name = document.getElementById('clanName').value.trim();
  const game = document.getElementById('clanGame').value;
  const description = document.getElementById('clanDescription').value.trim();
  const skill = document.getElementById('clanSkill').value;
  const maxMembers = parseInt(document.getElementById('clanMaxMembers').value);

  if (!name || !game) {
    showNotification('âŒ Please fill in all required fields', 'error');
    return;
  }

  try {
    const clanData = {
      name,
      game,
      description,
      skill,
      maxMembers,
      leader: userId,
      members: [userId],
      wins: 0,
      createdAt: new Date(),
      icon: "fa-solid fa-gamepad"
    };

    await addDoc(collection(db, 'clans'), clanData);

    showNotification('âœ… Clan created successfully!', 'success');
    closeCreateClanModal();
    loadClans();

  } catch (error) {
    console.error('Error creating clan:', error);
    showNotification('âŒ Failed to create clan', 'error');
  }
}

async function joinClan(clanId) {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    showNotification('âŒ Please login to join a clan', 'error');
    return;
  }

  try {
    const clanRef = doc(db, 'clans', clanId);
    const clanDoc = await getDoc(clanRef);

    if (!clanDoc.exists()) {
      showNotification('âŒ Clan not found', 'error');
      return;
    }

    const clan = clanDoc.data();

    if (clan.members.includes(userId)) {
      showNotification('â„¹ï¸ You are already a member of this clan', 'info');
      return;
    }

    if (clan.members.length >= clan.maxMembers) {
      showNotification('âŒ Clan is full', 'error');
      return;
    }

    await updateDoc(clanRef, {
      members: arrayUnion(userId)
    });

    showNotification('âœ… Successfully joined clan!', 'success');
    loadClans();

  } catch (error) {
    console.error('Error joining clan:', error);
    showNotification('âŒ Failed to join clan', 'error');
  }
}

async function leaveClan(clanId) {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  try {
    const clanRef = doc(db, 'clans', clanId);
    const clanDoc = await getDoc(clanRef);

    if (!clanDoc.exists()) return;

    const clan = clanDoc.data();

    if (clan.leader === userId) {
      showNotification('âŒ Clan leaders cannot leave. Transfer leadership or disband the clan first.', 'error');
      return;
    }

    await updateDoc(clanRef, {
      members: arrayRemove(userId)
    });

    showNotification('âœ… Left clan successfully', 'success');
    loadClans();

  } catch (error) {
    console.error('Error leaving clan:', error);
    showNotification('âŒ Failed to leave clan', 'error');
  }
}

async function inviteToClan(clanId) {
  showNotification('ðŸ“¨ Clan invite feature coming soon!', 'info');
}

async function respondToClanInvite(inviteId, response, clanId = null) {
  try {
    const inviteRef = doc(db, 'clanInvites', inviteId);

    await updateDoc(inviteRef, {
      status: response,
      respondedAt: new Date()
    });

    if (response === 'accepted' && clanId) {
      await joinClan(clanId);
    }

    showNotification(`âœ… Invite ${response}`, 'success');
    loadClanInvites();

  } catch (error) {
    console.error('Error responding to invite:', error);
    showNotification('âŒ Failed to respond to invite', 'error');
  }
}

async function viewClan(clanId) {
  const modal = document.getElementById('clanDetailModal');
  const content = document.getElementById('clanDetailContent');
  const title = document.getElementById('clanDetailTitle');

  if (!modal || !content || !title) {
    showNotification('Clan detail modal not available', 'error');
    return;
  }

  let clan = null;
  try {
    const clanRef = doc(db, 'clans', clanId);
    const clanSnap = await getDoc(clanRef);
    if (clanSnap.exists()) {
      clan = { id: clanSnap.id, ...clanSnap.data() };
    }
  } catch (error) {
    console.warn('Failed to load clan from Firestore, falling back to local data:', error);
  }

  if (!clan) {
    clan = SQUADS_DATABASE.find(c => c.id === parseInt(clanId, 10));
  }

  if (!clan) {
    showNotification('Clan not found', 'error');
    return;
  }

  title.textContent = ` ${clan.name}`;
  content.innerHTML = `
    <div class="clan-detail-header">
      <div class="clan-detail-icon">${clan.emoji || ''}</div>
      <div>
        <p class="clan-detail-game"> ${clan.game || clan.name}</p>
        <p class="clan-detail-leader">Leader: ${clan.leader || 'Unknown'}</p>
      </div>
    </div>
    <p class="clan-detail-description">${clan.description || 'No description available.'}</p>
    <div class="clan-detail-stats">
      <span> ${clan.members?.length || clan.members || 0}/${clan.maxMembers || 50} members</span>
      <span> ${clan.wins || 0} wins</span>
      <span> ${clan.skill?.toUpperCase() || 'CASUAL'}</span>
    </div>
    <div class="clan-detail-actions">
      <button class="action-btn primary" onclick="joinClan('${clan.id}')">Join Clan</button>
      <button class="action-btn secondary" onclick="inviteToClan('${clan.id}')">Invite</button>
    </div>
  `;

  modal.style.display = 'flex';
}


async function loadClips() {
  try {
    if (clipsUnsubscribe) {
      clipsUnsubscribe();
    }

    setupClipListeners();

    await loadTrendingClips();
    await loadMyClips();
    await loadClanClips();

  } catch (error) {
    console.error('Error loading clips:', error);
    showNotification('âŒ Failed to load clips', 'error');
  }
}

function setupClipListeners() {
  clipsUnsubscribe = onSnapshot(
    query(collection(db, 'clips'), orderBy('createdAt', 'desc'), limit(50)),
    (snapshot) => {
      loadTrendingClips();
      loadMyClips();
      loadClanClips();
    },
    (error) => {
      console.error('Clips listener error:', error);
    }
  );
}

async function loadTrendingClips() {
  try {
    const clipsRef = collection(db, 'clips');
    const q = query(clipsRef, where('visibility', '==', 'public'), orderBy('views', 'desc'), limit(12));
    const snapshot = await getDocs(q);

    const clipsGrid = document.getElementById('trendingClipsGrid');

    if (snapshot.empty) {
      clipsGrid.innerHTML = '<p class="empty-text">No trending clips yet</p>';
      return;
    }

    const clipsHTML = snapshot.docs.map(doc => {
      const clip = { id: doc.id, ...doc.data() };
      return `
        <div class="clip-card" onclick="viewClip('${clip.id}')">
          <div class="clip-thumbnail">
            <video src="${clip.videoUrl}" muted preload="metadata"></video>
            <div class="clip-duration">${clip.duration || '0:00'}</div>
          </div>
          <div class="clip-info">
            <h4>${clip.title}</h4>
            <p class="clip-meta">ðŸŽ® ${clip.game} â€¢ ðŸ‘¤ ${clip.uploaderName} â€¢ ðŸ‘ï¸ ${clip.views || 0}</p>
            <p class="clip-description">${clip.description || ''}</p>
          </div>
        </div>
      `;
    }).join('');

    clipsGrid.innerHTML = clipsHTML;

  } catch (error) {
    console.error('Error loading trending clips:', error);
    document.getElementById('trendingClipsGrid').innerHTML = '<p class="error-text">Failed to load clips</p>';
  }
}

async function loadMyClips() {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      document.getElementById('myClipsGrid').innerHTML = '<p class="empty-text">Please login to view your clips</p>';
      return;
    }

    const clipsRef = collection(db, 'clips');
    const q = query(clipsRef, where('uploaderId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const clipsGrid = document.getElementById('myClipsGrid');

    if (snapshot.empty) {
      clipsGrid.innerHTML = '<p class="empty-text">No clips uploaded yet</p>';
      return;
    }

    const clipsHTML = snapshot.docs.map(doc => {
      const clip = { id: doc.id, ...doc.data() };
      return `
        <div class="clip-card" onclick="viewClip('${clip.id}')">
          <div class="clip-thumbnail">
            <video src="${clip.videoUrl}" muted preload="metadata"></video>
            <div class="clip-duration">${clip.duration || '0:00'}</div>
          </div>
          <div class="clip-info">
            <h4>${clip.title}</h4>
            <p class="clip-meta">ðŸŽ® ${clip.game} â€¢ ðŸ‘ï¸ ${clip.views || 0} views</p>
            <p class="clip-description">${clip.description || ''}</p>
          </div>
        </div>
      `;
    }).join('');

    clipsGrid.innerHTML = clipsHTML;

  } catch (error) {
    console.error('Error loading my clips:', error);
    document.getElementById('myClipsGrid').innerHTML = '<p class="error-text">Failed to load clips</p>';
  }
}

async function loadClanClips() {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      document.getElementById('clanClipsGrid').innerHTML = '<p class="empty-text">Please login to view clan clips</p>';
      return;
    }

    const clansRef = collection(db, 'clans');
    const clansQuery = query(clansRef, where('members', 'array-contains', userId));
    const clansSnapshot = await getDocs(clansQuery);

    if (clansSnapshot.empty) {
      document.getElementById('clanClipsGrid').innerHTML = '<p class="empty-text">Join a clan to see clan clips</p>';
      return;
    }

    const clanIds = clansSnapshot.docs.map(doc => doc.id);

    const clipsRef = collection(db, 'clips');
    const q = query(clipsRef, where('clanId', 'in', clanIds), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const clipsGrid = document.getElementById('clanClipsGrid');

    if (snapshot.empty) {
      clipsGrid.innerHTML = '<p class="empty-text">No clan clips available</p>';
      return;
    }

    const clipsHTML = snapshot.docs.map(doc => {
      const clip = { id: doc.id, ...doc.data() };
      return `
        <div class="clip-card" onclick="viewClip('${clip.id}')">
          <div class="clip-thumbnail">
            <video src="${clip.videoUrl}" muted preload="metadata"></video>
            <div class="clip-duration">${clip.duration || '0:00'}</div>
          </div>
          <div class="clip-info">
            <h4>${clip.title}</h4>
            <p class="clip-meta">ðŸŽ® ${clip.game} â€¢ ðŸ‘¤ ${clip.uploaderName} â€¢ ðŸ° ${clip.clanName}</p>
            <p class="clip-description">${clip.description || ''}</p>
          </div>
        </div>
      `;
    }).join('');

    clipsGrid.innerHTML = clipsHTML;

  } catch (error) {
    console.error('Error loading clan clips:', error);
    document.getElementById('clanClipsGrid').innerHTML = '<p class="error-text">Failed to load clips</p>';
  }
}

async function uploadClip() {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    showNotification('âŒ Please login to upload clips', 'error');
    return;
  }

  const title = document.getElementById('clipTitle').value.trim();
  const game = document.getElementById('clipGame').value;
  const file = document.getElementById('clipFile').files[0];
  const description = document.getElementById('clipDescription').value.trim();
  const clanOnly = document.getElementById('clipClanOnly').checked;

  if (!title || !game || !file) {
    showNotification('âŒ Please fill in all required fields', 'error');
    return;
  }

  if (file.size > 100 * 1024 * 1024) {
    showNotification('âŒ File size must be less than 100MB', 'error');
    return;
  }

  try {
    showNotification('ðŸ“¤ Uploading clip...', 'info');

    let videoUrl = '';
    try {
      const upRes = await uploadAnyMedia(file, {
        folder: `gaming-clips/${userId}`,
        onProgress: (percent) => {
          showNotification(`Uploading clip: ${percent}%...`, 'info');
        }
      });
      videoUrl = upRes.url || upRes.downloadUrl;
    } catch (clipErr) {
      console.warn('Primary clip upload failed, trying storage fallback:', clipErr);
      try {
        const storageRef = ref(storage, `clips/${userId}/${Date.now()}_${file.name}`);
        const uploadTask = await uploadBytes(storageRef, file);
        videoUrl = await getDownloadURL(uploadTask.ref);
      } catch (fbErr) {
        console.warn('Storage failed, using fallback blob URL:', fbErr);
        videoUrl = URL.createObjectURL(file);
      }
    }

    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    const clipData = {
      title,
      game,
      description,
      videoUrl,
      uploaderId: userId,
      uploaderName: userData?.username || 'Unknown',
      visibility: clanOnly ? 'clan' : 'public',
      views: 0,
      likes: 0,
      createdAt: new Date(),
      duration: '0:00' // Would calculate actual duration
    };

    if (clanOnly) {
      const clansRef = collection(db, 'clans');
      const clansQuery = query(clansRef, where('members', 'array-contains', userId));
      const clansSnapshot = await getDocs(clansQuery);

      if (!clansSnapshot.empty) {
        const clan = clansSnapshot.docs[0].data();
        clipData.clanId = clansSnapshot.docs[0].id;
        clipData.clanName = clan.name;
      }
    }

    await addDoc(collection(db, 'clips'), clipData);

    showNotification('âœ… Clip uploaded successfully!', 'success');
    closeUploadClipModal();
    loadClips();

  } catch (error) {
    console.error('Error uploading clip:', error);
    showNotification('âŒ Failed to upload clip', 'error');
  }
}

async function viewClip(clipId) {
  const modal = document.getElementById('clipViewerModal');
  const content = document.getElementById('clipViewerContent');
  const title = document.getElementById('clipViewerTitle');

  if (!modal || !content || !title) {
    showNotification('Clip viewer not available', 'error');
    return;
  }

  try {
    const clipRef = doc(db, 'clips', clipId);
    const clipSnap = await getDoc(clipRef);
    const clip = clipSnap.exists() ? { id: clipSnap.id, ...clipSnap.data() } : null;

    if (!clip) {
      content.innerHTML = `<p class="empty-text">Clip not found.</p>`;
      title.textContent = ' Clip Viewer';
      modal.style.display = 'flex';
      return;
    }

    title.textContent = clip.title || ' Clip Viewer';
    content.innerHTML = `
      <div class="clip-viewer-card">
        <video src="${clip.videoUrl}" controls autoplay style="width: 100%; border-radius: 16px; background: #000;"></video>
        <div class="clip-viewer-info">
          <h4>${clip.title}</h4>
          <p>${clip.description || 'No description provided.'}</p>
          <p class="clip-meta"> ${clip.game || 'Unknown Game'} •  ${clip.uploaderName || 'Unknown'} •  ${clip.views || 0} views</p>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  } catch (error) {
    console.error('Error loading clip:', error);
    showNotification('Failed to load clip', 'error');
  }
}


function openCreateClanModal() {
  document.getElementById('createClanModal').style.display = 'flex';
}

function closeCreateClanModal() {
  document.getElementById('createClanModal').style.display = 'none';
  document.getElementById('createClanForm').reset();
}

function openUploadClipModal() {
  document.getElementById('uploadClipModal').style.display = 'flex';
}

function closeUploadClipModal() {
  document.getElementById('uploadClipModal').style.display = 'none';
  document.getElementById('uploadClipForm').reset();
}

function closeClanDetailModal() {
  document.getElementById('clanDetailModal').style.display = 'none';
}

function closeClipViewerModal() {
  document.getElementById('clipViewerModal').style.display = 'none';
}

function loadSquads() {
  const mySquadsList = document.getElementById('mySquadsList');
  const featuredSquadsList = document.getElementById('featuredSquadsList');

  const currentPlayer = auth?.currentUser?.displayName || 'ShadowNinja';
  const mySquads = SQUADS_DATABASE.filter(s => s.leader === currentPlayer);
  const featuredSquads = SQUADS_DATABASE.filter(s => s.leader !== currentPlayer);

  if (mySquadsList) {
    mySquadsList.innerHTML = mySquads.length
      ? mySquads.map(squad => `
          <div class="squad-card" onclick="viewSquad(${squad.id})">
            <div class="squad-card-header">
              <span class="squad-emoji">${squad.emoji}</span>
              <div>
                <h4>${squad.name}</h4>
                <p>${squad.game} • ${squad.skill}</p>
              </div>
            </div>
            <p>${squad.description}</p>
            <div class="squad-meta">
              <span> ${squad.members}/${squad.maxMembers}</span>
              <span> ${squad.wins} wins</span>
            </div>
          </div>
        `).join('')
      : '<p class="empty-text">No squads yet. Create or join one!</p>';
  }

  if (featuredSquadsList) {
    featuredSquadsList.innerHTML = featuredSquads.length
      ? featuredSquads.map(squad => `
          <div class="squad-card" onclick="viewSquad(${squad.id})">
            <div class="squad-card-header">
              <span class="squad-emoji">${squad.emoji}</span>
              <div>
                <h4>${squad.name}</h4>
                <p>${squad.game} • ${squad.skill}</p>
              </div>
            </div>
            <p>${squad.description}</p>
            <div class="squad-meta">
              <span> ${squad.members}/${squad.maxMembers}</span>
              <span> ${squad.wins} wins</span>
            </div>
            <button class="action-btn primary" onclick="event.stopPropagation(); viewSquad(${squad.id})">View Squad</button>
          </div>
        `).join('')
      : '<p class="empty-text">No featured squads available.</p>';
  }
}

function loadSessions() {
  const sessionsList = document.getElementById('activeSessionsList');
  const filteredSessions = SESSIONS_DATABASE.filter((session) => {
    if (currentSessionTab === 'active') return session.status === 'active';
    if (currentSessionTab === 'upcoming') return session.status === 'upcoming';
    if (currentSessionTab === 'history') return session.status === 'completed';
    return session.status === 'active';
  });

  if (!sessionsList) return;

  sessionsList.innerHTML = filteredSessions.length
    ? filteredSessions.map((session) => {
        const isActive = session.status === 'active';
        const sessionLabel = isActive ? 'LIVE' : session.status.toUpperCase();
        const joinButton = isActive
          ? `<button class="session-join-btn" onclick="joinSession(${session.id})">Join Session</button>`
          : `<button class="session-join-btn secondary" onclick="viewSquad(${session.id})">View Details</button>`;

        return `
          <div class="session-card">
            <div class="session-header">
              <h4> ${session.game}</h4>
              <span class="session-status">${sessionLabel}</span>
            </div>
            <p><strong>Created by:</strong> ${session.createdBy}</p>
            <p><strong>Objective:</strong> ${session.objective}</p>
            <div class="session-info">
              <span> ${session.participants}/${session.maxParticipants} Players</span>
              <span> ${session.duration}</span>
              <span> ${session.skillLevel}</span>
            </div>
            ${isActive ? joinButton : ''}
          </div>
        `;
      }).join('')
    : `<p class="empty-text">No ${currentSessionTab} sessions available.</p>`;
}

function addFriend(gamerId) {
  const gamer = GAMERS_DATABASE.find(g => g.id === gamerId);
  showNotification(`âœ… Friend request sent to ${gamer.username}!`, "success");
}

function inviteToSquad(gamerId) {
  showNotification("ðŸŽ–ï¸ Squad invite sent!", "success");
}

function startSession(gamerId) {
  const gamer = GAMERS_DATABASE.find((g) => g.id === gamerId);
  showCreateSessionModal();

  setTimeout(() => {
    const sessionGame = document.getElementById('sessionGame');
    const sessionObjective = document.getElementById('sessionObjective');
    if (sessionGame) sessionGame.value = gamer?.mainGame || '';
    if (sessionObjective) sessionObjective.value = gamer ? `Join ${gamer.username} for a squad match` : '';
  }, 50);
}

function joinSession(sessionId) {
  const session = SESSIONS_DATABASE.find(s => s.id === sessionId);
  showNotification(`âœ… Joined ${session.game} session! Launching game...`, "success");
  setTimeout(() => {
    window.open("https://www.google.com", "_blank");
  }, 1000);
}

// Legacy duplicate viewSquad() removed. The primary implementation above now handles squad detail display.


let firebaseConnectionTimeout;
let isFirebaseConnected = true;
let connectionCheckInterval;

function initializeFirebaseConnection() {
  try {
    connectionCheckInterval = setInterval(checkFirebaseConnection, 30000);

    checkFirebaseConnection();

    console.log("âœ… Firebase connection monitor started");
  } catch (error) {
    console.warn("âš ï¸ Firebase initialization warning:", error.message);
  }
}

function checkFirebaseConnection() {
  try {
    if (typeof db !== 'undefined' || typeof auth !== 'undefined') {
      console.log("âœ… Firebase connection is active");
      isFirebaseConnected = true;

      if (firebaseConnectionTimeout) {
        clearTimeout(firebaseConnectionTimeout);
      }
    }
  } catch (error) {
    console.warn("âš ï¸ Firebase connection check warning:", error.message);
    isFirebaseConnected = false;
  }
}

function reconnectFirebase() {
  try {
    if (typeof auth !== 'undefined') {
      console.log("ðŸ”„ Firebase connection recheck...");
      checkFirebaseConnection();
      return true;
    }
  } catch (error) {
    console.error("âŒ Firebase recheck warning:", error.message);
    return false;
  }
}

window.addEventListener("online", () => {
  console.log("ðŸŒ Network restored");
  reconnectFirebase();
});

window.addEventListener("offline", () => {
  console.log("âŒ Network disconnected - Gaming Hub will work offline");
  isFirebaseConnected = false;
});

window.addEventListener("beforeunload", () => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  if (firebaseConnectionTimeout) {
    clearTimeout(firebaseConnectionTimeout);
  }
});

console.log("ðŸŽ® Gaming Hub Firebase connection management loaded!");


function showCreateSquadModal() {
  const modalHTML = `
    <div class="squad-modal-overlay">
      <div class="squad-modal">
        <div class="squad-modal-header">
          <h2>ðŸ›¡ï¸ Register New Clan</h2>
          <button class="close-modal-btn" onclick="closeSquadModal()">âœ•</button>
        </div>
        <form id="createSquadForm" onsubmit="handleSquadCreation(event)">
          <div class="form-group">
            <label>Clan Name</label>
            <input type="text" id="clanName" placeholder="Enter clan name..." required>
          </div>
          <div class="form-group">
            <label>Clan Tag (e.g. [FAZE])</label>
            <input type="text" id="clanTag" placeholder="[TAG]" maxlength="6" required>
          </div>
          <div class="form-group">
            <label>Main Game</label>
            <select id="clanGame" required>
              <option value="PUBG Mobile">PUBG Mobile</option>
              <option value="Call of Duty Mobile">CODM</option>
              <option value="Free Fire">Free Fire</option>
              <option value="Valorant">Valorant</option>
            </select>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="clanDescription" placeholder="Describe your clan..." rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Clan Logo (Emoji)</label>
            <input type="text" id="clanLogo" placeholder="ðŸ¦" maxlength="2" value="ðŸ›¡ï¸">
          </div>
          <button type="submit" class="create-btn">ðŸš€ Register Clan</button>
        </form>
      </div>
    </div>
  `;

  const existingModal = document.querySelector('.squad-modal-overlay');
  if (existingModal) existingModal.remove();

  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer.firstElementChild);

  if (!document.getElementById('squad-modal-styles')) {
    const style = document.createElement('style');
    style.id = 'squad-modal-styles';
    style.textContent = `
      .squad-modal-overlay {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex; justify-content: center; align-items: center;
        z-index: 2000;
        backdrop-filter: blur(5px);
      }
      .squad-modal {
        background: #1a1a1a;
        width: 90%; max-width: 400px;
        border-radius: 16px;
        border: 1px solid #00ff66;
        padding: 20px;
        box-shadow: 0 0 20px rgba(0,255,102,0.2);
      }
      .squad-modal-header {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid #333;
        padding-bottom: 10px;
      }
      .squad-modal-header h2 { color: #00ff66; margin: 0; }
      .form-group { margin-bottom: 15px; }
      .form-group label { display: block; color: #888; margin-bottom: 5px; font-size: 12px; }
      .form-group input, .form-group select, .form-group textarea {
        width: 100%; padding: 10px;
        background: #0a0a0a; border: 1px solid #333;
        border-radius: 8px; color: #fff;
        outline: none;
      }
      .form-group input:focus { border-color: #00ff66; }
      .create-btn {
        width: 100%; padding: 12px;
        background: #00ff66; color: #000;
        border: none; border-radius: 8px;
        font-weight: bold; font-size: 16px;
        margin-top: 10px;
      }
    `;
    document.head.appendChild(style);
  }
}

window.closeSquadModal = function () {
  const modal = document.querySelector('.squad-modal-overlay');
  if (modal) modal.remove();
};

window.handleSquadCreation = function (e) {
  e.preventDefault();
  const name = document.getElementById('clanName').value;
  const tag = document.getElementById('clanTag').value;

  showNotification(`âœ… Clan "${name}" [${tag}] Registered Successfully!`, "success");
  closeSquadModal();

  const squadsList = document.getElementById("mySquadsList");
  if (squadsList) {
    const emptyText = squadsList.querySelector('.empty-text');
    if (emptyText) emptyText.remove();

    squadsList.innerHTML += `
      <div class="squad-card" style="border-left: 4px solid #00ff66;">
        <div class="squad-header">
          <span class="squad-emoji">${document.getElementById('clanLogo').value}</span>
          <span class="squad-skill-badge">LEADER</span>
        </div>
        <h3>${name} <span style="color:#888;font-size:12px;">${tag}</span></h3>
        <p class="squad-game">ðŸŽ® ${document.getElementById('clanGame').value}</p>
        <div class="squad-stats">
          <span>ðŸ‘¥ 1/20</span>
          <span>ðŸ† 0 wins</span>
        </div>
      </div>
    `;
  }
};



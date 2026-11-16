# NEXCHAT Global Drop — Official X-Architecture Specification (X.md)

This document details the architectural blueprint, design specifications, data models, and click-routing implementations for the **X (formerly Twitter) style Global Drop** and **User-to-User Profile** system.

---

## 1. Architectural Overview

The Global Drop system delivers a native, high-performance timeline and user interaction layer mirroring official X mobile UX:
- **Zero-lag mobile navigation** with sticky headers and native safe-area handling (`env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`).
- **Universal Click-to-Profile Navigation**: Tapping any user's avatar, name, or handle across drops, thread replies, or chat messages seamlessly transitions into their interactive User-to-User Profile.
- **Full Content Segmentation**: Dedicated tabbed sections with icons for **Drops**, **Videos**, **Media**, **Replies**, and **Likes**.
- **Tenure & Impression Aggregation**: Automated calculation of user registration tenure (e.g., `Joined Nov 2024 · 2 yrs on NEXCHAT`), dynamic cyber operative rank, and aggregated drop views.

---

## 2. User-to-User Profile Architecture (`#globalDropUserProfileModal`)

### Visual Hierarchy
```
┌──────────────────────────────────────────────────────────────┐
│ [←] Alex                      14 Drops                  [↑]  │  Sticky Header
├──────────────────────────────────────────────────────────────┤
│ ░░░░░░░░░░░░░ Cyber Matrix Banner (150px) ░░░░░░░░░░░░░░░░░ │  Banner Cover
│ ┌────────┐                                                  │
│ │ Avatar │                                  [ Follow ] [ ✉ ]│  Avatar (-42px) & CTAs
│ └────────┘                                                  │
│ Alex ✔  [ SENIOR TRANSMITTER (11 MOS) ]                     │  Identity & Rank
│ @alexander                                                   │  Handle
│ NEX Cyber Node Operative • Transmitting on Global Drop.      │  Bio
│                                                              │
│ 📅 Joined Nov 2024 · 2 yrs on NEXCHAT                        │
│ 📍 Los Angeles, CA  📊 24.5K Drop Views  🔑 NEX-ZHVQSK7N    │  Metadata Strip
│                                                              │
│ 142 Following   1.8K Followers   12 Videos   14 Drops        │  Stats Row
├──────────────────────────────────────────────────────────────┤
│ [Drops]   [▶ Videos (12)]   [Media]   [Replies]   [Likes]    │  5 Content Tabs
├──────────────────────────────────────────────────────────────┤
│ Feed / Video Grid / Media Grid Stream                        │  Dynamic Content
└──────────────────────────────────────────────────────────────┘
```

### Component Details

#### A. Sticky Header (`.x-profile-header`)
- **Back Button (`#globalDropProfileBackBtn`)**: Direct arrow icon (`fa-arrow-left`) with haptic feedback; smoothly dismisses modal and restores previous timeline position.
- **Title Block**: Displays user's display name and total drop count (`X Drops`).
- **Share Action (`#globalDropProfileShareBtn`)**: Copies direct deep link (`https://nexchat-drab.vercel.app/chat?profile=<UID>`) to clipboard.

#### B. Profile Header & Cover Banner (`.x-profile-banner`)
- High-tech cyber gradient (`#071714` to `#0d281e`) overlaid with neon grid matrix.
- Mobile height: 125px; Desktop height: 150px.

#### C. Avatar & Beacon (`.x-profile-avatar-wrapper`)
- 80px circular profile image (68px on mobile) with 4px solid black border.
- Floating Cyber Status Beacon in bottom-right with online glow (`box-shadow: 0 0 8px var(--x-green)`).

#### D. Operative Rank & Tenure Calculation
Derived dynamically from `userData.createdAtMs` or registration timestamp:
- **Tenure Formula**:
  - `diffYears >= 2`: `Pioneer Operative (X+ Yrs)`
  - `diffYears >= 1`: `Veteran Operative (1+ Yr)`
  - `diffMonths >= 6`: `Senior Transmitter (X Mos)`
  - `diffMonths >= 1`: `Active Transmitter (X Mos)`
  - `< 1 month`: `New Node Operative`
- **Join Date Subline**: `Joined <Month Year> · <X> on NEXCHAT`.

#### E. Content Metrics & Counters (`.x-profile-stats-row`)
1. **Following**: Active followed operative count.
2. **Followers**: Active subscriber count.
3. **Videos**: Count of drops containing video attachments or reels.
4. **Drops**: Total drops transmitted by this operative.
5. **Drop Views**: Aggregated sum of `viewsCount` across all author drops.

---

## 3. Dedicated Content Tabs

The profile provides 5 dedicated tabs with icons and badge indicators:

| Tab | Icon | Filter Logic | Layout |
|---|---|---|---|
| **Drops** | `fa-layer-group` | All drops by author | Full Drop Card Stream |
| **Videos** | `fa-video` | `mediaType === 'video'` or video URL (`.mp4`, `.webm`, etc.) | 2-Column High-Definition Video Grid (`.x-profile-videos-grid`) with play badge, duration overlay, likes, and views |
| **Media** | `fa-image` | Drops with image attachments | Photo & Media Grid |
| **Replies** | `fa-comment` | Discussion replies committed by author | Threaded Reply Cards with parent context |
| **Likes** | `fa-heart` | Drops where `likes.includes(targetUid)` | Liked Drops Stream |

---

## 4. Universal Click-to-Profile Routing Blueprint

All user touchpoints across the entire NEXCHAT client route into `openUserProfile(targetUid, authorData)`:

1. **Timeline Drop Cards**:
   - Tapping `.x-drop-avatar-col` or `.x-drop-avatar`
   - Tapping `.x-drop-author-name`
   - Tapping `.x-drop-author-handle`
2. **Discussion Thread Modal**:
   - Tapping parent author container (`.x-thread-parent-author-info`)
   - Tapping reply author avatar (`.x-thread-reply-left`)
   - Tapping reply author name (`.x-thread-reply-author`)
3. **Direct & Group Chats**:
   - Tapping `.nex-msg-sender` or `.message-avatar` on received chat bubbles opens the transmitter's profile.
4. **One-Click Direct Messaging (CTA)**:
   - Tapping the `Envelope` icon on any user profile automatically launches direct messaging (`window.openChat(uid, name, photo, 'direct')`) and transitions to chat view.

---

## 5. File Inventory

- `chat.html`: Profile modal container (`#globalDropUserProfileModal`), sticky header, tabs, and stats row.
- `css/global-drop.css`: Section 10 profile styling, video grid, and responsive rules.
- `src/js/global-drop-engine.js`: `openUserProfile()`, `renderProfileFilteredDrops()`, tenure calculator, drop views aggregator, and click delegation.

/**
 * NEXCHAT - Master 100-Feature Cyber Matrix & Settings Control System
 * Provides centralized toggle controls, state persistence, live filtering,
 * and event dispatching for all 100 advanced modules across 10 tactical domains.
 * STRICTLY NO EMOJIS: Clean typography, FontAwesome icons, and cyberpunk badges.
 */

(function() {
  'use strict';

  const FEATURE_CATALOG = [
    // DOMAIN 1: NEXT-GEN CRYPTOGRAPHY & ZERO-KNOWLEDGE SYSTEMS
    { id: 1, key: 'zk_snark_identity', domain: 'Cryptography & ZK Systems', title: 'Zero-Knowledge Proof (zk-SNARK) Identity', desc: 'Verify operative credentials and clearance without revealing wallet keys or usernames.', default: true },
    { id: 2, key: 'kyber768_quantum', domain: 'Cryptography & ZK Systems', title: 'Post-Quantum Kyber-768 Lattice Handshake', desc: 'Hybrid ECDSA plus lattice-based quantum-resistant key encapsulation for forward secrecy.', default: true },
    { id: 3, key: 'shamir_secret_split', domain: 'Cryptography & ZK Systems', title: 'Threshold Secret Sharing (Shamir 3-of-5)', desc: 'Distribute channel master keys across 5 operatives requiring a 3-member quorum to decrypt.', default: true },
    { id: 4, key: 'blind_envelope_route', domain: 'Cryptography & ZK Systems', title: 'Blinded Carbon Copies (BCC-Blind Relay)', desc: 'Route encrypted payloads through proxy relays where intermediate nodes cannot determine destination index.', default: true },
    { id: 5, key: 'homomorphic_search', domain: 'Cryptography & ZK Systems', title: 'Homomorphic Encrypted Search Indexer', desc: 'Execute client-side full-text searches across encrypted stores without exposing plaintext.', default: true },
    { id: 6, key: 'treekem_ratchet', domain: 'Cryptography & ZK Systems', title: 'Ephemeral Multi-Party Ratchet (TreeKEM)', desc: 'Asynchronous group messaging ratcheting with logarithmic tree key updates.', default: true },
    { id: 7, key: 'distress_passphrase', domain: 'Cryptography & ZK Systems', title: 'Anti-Coercion Plausible Deniability Decoy', desc: 'Secondary distress PIN swaps active keystores with a convincing decoy database.', default: true },
    { id: 8, key: 'vdf_proof_of_work', domain: 'Cryptography & ZK Systems', title: 'Cryptographic Time-Delay Proof of Work', desc: 'Verifiable delay function puzzles required on high-volume broadcast channels to thwart spam.', default: true },
    { id: 9, key: 'pgp_web_of_trust', domain: 'Cryptography & ZK Systems', title: 'PGP Cross-Signatures Web of Trust', desc: 'Operatives cross-sign public keys to compute decentralized reputation graph scores.', default: true },
    { id: 10, key: 'did_credential_vault', domain: 'Cryptography & ZK Systems', title: 'Self-Sovereign Identity (DID) Credential Vault', desc: 'Portable decentralized ID profiles containing verifiable clearance certificates.', default: true },

    // DOMAIN 2: AUTONOMOUS AI AGENTS & NEURAL OPERATIVES
    { id: 11, key: 'ai_counter_intel', domain: 'AI Agents & Neural Systems', title: 'AI Counter-Intel Fact-Checking Sentinel', desc: 'Real-time factual integrity scanner cross-referencing verified public intelligence ledgers.', default: true },
    { id: 12, key: 'ai_meeting_scribe', domain: 'AI Agents & Neural Systems', title: 'Automated Meeting Scribe & Task Synthesizer', desc: 'Extracts action items, code snippets, and sprint directives from voice channel transcripts.', default: true },
    { id: 13, key: 'ai_sentiment_radar', domain: 'AI Agents & Neural Systems', title: 'Adversarial Neural Sentiment Radar', desc: 'Visualizes team morale, stress vectors, and tactical tension heatmaps in channel streams.', default: true },
    { id: 14, key: 'ai_scenario_simulator', domain: 'AI Agents & Neural Systems', title: 'Multi-Agent Autonomous Scenario Simulator', desc: 'Executes simulated cyber wargames in sandboxed channels to stress-test contingency plans.', default: true },
    { id: 15, key: 'ai_tone_neutralizer', domain: 'AI Agents & Neural Systems', title: 'Dynamic Tactical Tone Neutralizer', desc: 'Client-side filter converting emotionally charged prose into standard military-spec briefs.', default: true },
    { id: 16, key: 'ai_deepfake_guard', domain: 'AI Agents & Neural Systems', title: 'Synthetic Impersonation & Deepfake Guard', desc: 'Analyzes vocal formants and typing cadence drift to detect compromised peer accounts.', default: true },
    { id: 17, key: 'ai_cve_parser', domain: 'AI Agents & Neural Systems', title: 'Autonomous Threat Intel & CVE Parser', desc: 'Ingests zero-day bulletins and security feeds directly into interactive warning cards.', default: true },
    { id: 18, key: 'ai_jargon_decryptor', domain: 'AI Agents & Neural Systems', title: 'Neural Technical Jargon Decryptor', desc: 'Translates complex cryptographic papers and kernel exploit writeups into plain summaries.', default: true },
    { id: 19, key: 'ai_auto_moderator', domain: 'AI Agents & Neural Systems', title: 'Autonomous Channel Protocol Moderator', desc: 'Enforces rate-limits and operational security compliance with automated escalation rules.', default: true },
    { id: 20, key: 'ai_mission_generator', domain: 'AI Agents & Neural Systems', title: 'Procedural Intel Mission & Scavenger Engine', desc: 'Generates daily cryptographic challenges, code audits, and token bounty missions.', default: true },

    // DOMAIN 3: IMMERSIVE WEBGL, 3D CANVAS & SPATIAL COMPUTING
    { id: 21, key: 'webgl_holo_globe', domain: '3D WebGL & Spatial Computing', title: 'WebGL 3D Tactical Holo-Globe', desc: 'Interactive 3D planetary sphere showing relay hops, latency spikes, and active node clusters.', default: true },
    { id: 22, key: 'webgl_virtual_enclave', domain: '3D WebGL & Spatial Computing', title: 'Virtual Cyber Enclave 3D War Room', desc: 'Three.js isometric briefing room where operatives navigate avatars with spatial audio proximity.', default: true },
    { id: 23, key: 'crt_phosphor_shaders', domain: '3D WebGL & Spatial Computing', title: 'Procedural CRT Scanline & Phosphor Shaders', desc: 'Customizable retro-tactical post-processing filters (Green P1, Amber P3, Blue Neon).', default: true },
    { id: 24, key: 'node_topology_graph', domain: '3D WebGL & Spatial Computing', title: 'Real-Time 3D Force-Directed Node Graph', desc: 'Visualizes channel hierarchies, peer connections, and mesh routing paths in 3D space.', default: true },
    { id: 25, key: 'spatial_doc_viewport', domain: '3D WebGL & Spatial Computing', title: 'Spatial 3D Document Inspection Viewport', desc: 'Examine PDF intel, CAD schematics, and GLB models in a floating 360-degree wireframe viewport.', default: true },
    { id: 26, key: 'audio_reactive_matrix', domain: '3D WebGL & Spatial Computing', title: 'Audio-Reactive Neural Matrix Particles', desc: 'Ambient particle shader responding to channel throughput velocity and voice call decibels.', default: true },
    { id: 27, key: 'webxr_hud_companion', domain: '3D WebGL & Spatial Computing', title: 'WebXR Headset Tactical Companion', desc: 'Renders immersive floating heads-up display chat windows in WebXR-compatible VR/AR headsets.', default: true },
    { id: 28, key: 'collaborative_3d_pinboard', domain: '3D WebGL & Spatial Computing', title: 'Collaborative 3D Tactical Pinboard', desc: 'Spatial whiteboard for pinning forensic evidence cards connected with neon tactical threads.', default: true },
    { id: 29, key: 'cad_wireframe_viewer', domain: '3D WebGL & Spatial Computing', title: 'Holographic CAD Wireframe Inspector', desc: 'Interactive technical model inspector with cross-section cutting planes and caliper rulers.', default: true },
    { id: 30, key: 'drone_route_replay', domain: '3D WebGL & Spatial Computing', title: 'Procedural Drone Telemetry 3D Replay', desc: 'Replays GPS coordinate trajectories and aerial telemetry over a synthetic heightmap grid.', default: true },

    // DOMAIN 4: PROVABLY-FAIR MICRO-ECONOMY & WAGERING DUELS
    { id: 31, key: 'liquidity_swap_bar', domain: 'Micro-Economy & Wagering Duels', title: 'In-Chat Multi-Currency Liquidity Swap', desc: 'Zero-spread instant asset exchange between NEX tokens, syndicate credits, and testnet gas.', default: true },
    { id: 32, key: 'polyhedral_dice_duels', domain: 'Micro-Economy & Wagering Duels', title: 'Provably-Fair Polyhedral Dice Duels', desc: 'Cryptographic commit-reveal multi-sided dice rolls (d4, d6, d20, d100) for tactical disputes.', default: true },
    { id: 33, key: 'p2p_collateral_loans', domain: 'Micro-Economy & Wagering Duels', title: 'Peer-to-Peer Collateralized Micro-Loans', desc: 'Deploy micro-lending contracts in chat bubbles with collateral escrow and auto-repayment.', default: true },
    { id: 34, key: 'quadratic_funding_cards', domain: 'Micro-Economy & Wagering Duels', title: 'Quadratic Funding Voting Cards', desc: 'Collective tooling grants where voting power scales quadratically to prevent plutocracy.', default: true },
    { id: 35, key: 'prediction_oracles', domain: 'Micro-Economy & Wagering Duels', title: 'Prediction Market Settlement Oracles', desc: 'Wager on operational milestones with automated multi-sig arbiter payout verification.', default: true },
    { id: 36, key: 'fractional_syndicate_shares', domain: 'Micro-Economy & Wagering Duels', title: 'Fractional Syndicate Asset Ownership', desc: 'Subdivide high-value guild vaults, licenses, and tooling into tradeable micro-shares.', default: true },
    { id: 37, key: 'micro_tipping_faucet', domain: 'Micro-Economy & Wagering Duels', title: 'Automated Micro-Tipping Stream Faucet', desc: 'Continuous streaming token drips for helpful code reviewers, debaters, and bug reporters.', default: true },
    { id: 38, key: 'sealed_bid_auctions', domain: 'Micro-Economy & Wagering Duels', title: 'In-Chat Blind Sealed-Bid Auctions', desc: 'Submit encrypted bids for rare channel assets with simultaneous reveal upon round expiry.', default: true },
    { id: 39, key: 'gas_sponsorship_bounties', domain: 'Micro-Economy & Wagering Duels', title: 'Token Gas Sponsorship Bounties', desc: 'Lead engineers sponsor network transaction gas for junior operatives executing contracts.', default: true },
    { id: 40, key: 'deflationary_burn_fee', domain: 'Micro-Economy & Wagering Duels', title: 'Deflationary Message Burn Protocol', desc: 'High-priority room rule requiring a 1 NEX token burn per dispatch to eliminate noise.', default: true },

    // DOMAIN 5: TACTICAL AUDIO, ACOUSTIC STEGANOGRAPHY & SONAR
    { id: 41, key: 'ultrasonic_data_beacon', domain: 'Tactical Audio & Sonar', title: 'High-Frequency Ultrasonic Data Beacon', desc: 'Modulates encrypted token handshakes into inaudible 19-21kHz audio bursts for air-gap sync.', default: true },
    { id: 42, key: 'neural_rnnoise_gate', domain: 'Tactical Audio & Sonar', title: 'Neural Noise Suppression & De-Reverb', desc: 'WebAssembly RNNoise model filtering out mechanical keyboard clatter, fans, and sirens.', default: true },
    { id: 43, key: 'voice_disguise_dsp', domain: 'Tactical Audio & Sonar', title: 'Operative Voice Disguise Formant Shifter', desc: 'Real-time Web Audio API DSP formant modulation masking fundamental vocal signatures.', default: true },
    { id: 44, key: 'binaural_3d_spatial', domain: 'Tactical Audio & Sonar', title: 'Binaural 3D Spatial Audio Positioning', desc: 'Drag peer avatars across a virtual stage to position voices spatially in stereo headphones.', default: true },
    { id: 45, key: 'keylogger_acoustic_mask', domain: 'Tactical Audio & Sonar', title: 'Acoustic Keylogger Resistance Generator', desc: 'Injects pseudo-random ultrasonic micro-pulses during microphone broadcast to mask keystrokes.', default: true },
    { id: 46, key: 'military_radio_sfx', domain: 'Tactical Audio & Sonar', title: 'Procedural Tactical Radio Static & Squelch', desc: 'Authentic military push-to-talk tones, frequency drift crackle, and channel squelch SFX.', default: true },
    { id: 47, key: 'multitrack_stem_recorder', domain: 'Tactical Audio & Sonar', title: 'Multi-Track Conference Stem Recorder', desc: 'Exports group voice channels as synchronized individual FLAC/WAV audio tracks for debriefs.', default: true },
    { id: 48, key: 'stegano_audio_watermark', domain: 'Tactical Audio & Sonar', title: 'Steganographic Audio Watermarking', desc: 'Embeds imperceptible author hashes into recorded voice notes to trace classified leaks.', default: true },
    { id: 49, key: 'whisper_sub_routing', domain: 'Tactical Audio & Sonar', title: 'Tactical Audio Whisper Sub-Routing', desc: 'Commanders broadcast tactical directives directly into specific operator channels privately.', default: true },
    { id: 50, key: 'morse_telegraph_cipher', domain: 'Tactical Audio & Sonar', title: 'Morse Code & Acoustic Cipher Engine', desc: 'Converts classified dispatches into acoustic Morse telegraph pulses and vice versa.', default: true },

    // DOMAIN 6: PEER-TO-PEER MESH & RESILIENT NETWORKING
    { id: 51, key: 'webrtc_data_mesh', domain: 'P2P Mesh & Resilient Network', title: 'WebRTC P2P Data Mesh Relay', desc: 'Channels survive server outages by relaying encrypted dispatches peer-to-peer across browsers.', default: true },
    { id: 52, key: 'ble_airdrop_fallback', domain: 'P2P Mesh & Resilient Network', title: 'Bluetooth Low Energy (BLE) Air-Drop', desc: 'Local line-of-sight hardware beaconing for internet-free peer discovery and dispatching.', default: true },
    { id: 53, key: 'multipath_socket_bonding', domain: 'P2P Mesh & Resilient Network', title: 'Multi-Path Socket & Connection Bonding', desc: 'Seamlessly bonds Wi-Fi and Cellular networks to eliminate packet drops during voice calls.', default: true },
    { id: 54, key: 'chunked_torrent_swarms', domain: 'P2P Mesh & Resilient Network', title: 'BitTorrent-Style Chunked Swarm Downloads', desc: 'Large attachments download concurrently in 512KB slices from multiple active room peers.', default: true },
    { id: 55, key: 'onion_routed_proxy', domain: 'P2P Mesh & Resilient Network', title: 'Onion-Routed Proxy Relay Tunnel', desc: 'Routes WebRTC signaling through 3 encrypted internal hops to prevent IP discovery.', default: true },
    { id: 56, key: 'crdt_partition_heal', domain: 'P2P Mesh & Resilient Network', title: 'CRDT Partition Auto-Healing Engine', desc: 'Conflict-Free Replicated Data Types seamlessly reconcile offline split-brain chat edits.', default: true },
    { id: 57, key: 'lofi_satellite_profile', domain: 'P2P Mesh & Resilient Network', title: 'Bandwidth-Starved 2-Bit Lo-Fi Mode', desc: 'Compresses dispatches down to 2-bit ASCII payloads for 9600-baud tactical satellite links.', default: true },
    { id: 58, key: 'relay_health_telemetry', domain: 'P2P Mesh & Resilient Network', title: 'Decentralized Relay Health Dashboard', desc: 'Real-time telemetry showing latency, jitter, and packet drop percentages for every node.', default: true },
    { id: 59, key: 'webtorrent_media_stream', domain: 'P2P Mesh & Resilient Network', title: 'Ephemeral WebTorrent Streaming Player', desc: 'Stream video and audio logs immediately while seeding slices to peers in chat.', default: true },
    { id: 60, key: 'lan_subnet_discovery', domain: 'P2P Mesh & Resilient Network', title: 'Local Subnet Zero-Config Peer Scanner', desc: 'Automatic mDNS-style LAN peer scanning for immediate bunker and campus mesh setups.', default: true },

    // DOMAIN 7: COLLABORATIVE WORKSPACES & DEVELOPER MATRIX
    { id: 61, key: 'multi_cursor_editor', domain: 'Collaborative Dev Workspaces', title: 'Multi-Cursor Collaborative Code Editor', desc: 'Real-time paired code editing in chat panels with syntax highlighting for 40+ languages.', default: true },
    { id: 62, key: 'wasm_sqlite_studio', domain: 'Collaborative Dev Workspaces', title: 'Embedded WebAssembly SQLite Query Studio', desc: 'Run SQL queries, join chat datasets, and inspect structured telemetry in client memory.', default: true },
    { id: 63, key: 'in_chat_git_diff', domain: 'Collaborative Dev Workspaces', title: 'In-Chat Git Branch & Diff Reviewer', desc: 'Examine side-by-side colorized git diffs and approve pull requests via webhook actions.', default: true },
    { id: 64, key: 'webcontainer_node_vm', domain: 'Collaborative Dev Workspaces', title: 'WebContainer Node.js Virtual Machine', desc: 'Run live microservices, execute npm packages, and spin up test servers in browser RAM.', default: true },
    { id: 65, key: 'api_workbench_tester', domain: 'Collaborative Dev Workspaces', title: 'REST & GraphQL API Test Workbench', desc: 'Build and dispatch test requests with headers, JSON payloads, and response timers in chat.', default: true },
    { id: 66, key: 'regex_pattern_lab', domain: 'Collaborative Dev Workspaces', title: 'Regex & Entropy String Laboratory', desc: 'Collaborative regex validator, entropy calculator, and string hashing laboratory.', default: true },
    { id: 67, key: 'cicd_pipeline_stream', domain: 'Collaborative Dev Workspaces', title: 'Automated CI/CD Pipeline Telemetry', desc: 'Real-time build status chips, test failure traces, and deploy triggers in chat streams.', default: true },
    { id: 68, key: 'collab_markdown_docs', domain: 'Collaborative Dev Workspaces', title: 'Collaborative Markdown Technical Docs', desc: 'Shared living technical documentation with table-of-contents, Mermaid charts, and history.', default: true },
    { id: 69, key: 'hex_binary_inspector', domain: 'Collaborative Dev Workspaces', title: 'Hexadecimal & Memory Dump Inspector', desc: 'Inspect binary payload dumps with ASCII sidebars, byte searching, and endianness toggles.', default: true },
    { id: 70, key: 'jupyter_notebook_cells', domain: 'Collaborative Dev Workspaces', title: 'In-Chat Jupyter-Style Compute Cells', desc: 'Execute interleaved Markdown explanations and runnable Python/JS compute blocks.', default: true },

    // DOMAIN 8: SOCIAL ADDICTIVE MECHANICS & GUILD WARFARE
    { id: 71, key: 'operative_battle_pass', domain: 'Social & Guild Warfare', title: 'Operative Battle Pass & Clearance Tiers', desc: 'Progress through 100 seasonal clearance tiers by completing code reviews, debates, and drops.', default: true },
    { id: 72, key: 'syndicate_territory_war', domain: 'Social & Guild Warfare', title: 'Syndicate vs Syndicate Territory Conquest', desc: 'Factions compete in time-locked cryptanalytic challenges to claim dashboard quadrants.', default: true },
    { id: 73, key: 'rarity_badge_forge', domain: 'Social & Guild Warfare', title: 'Dynamic Holographic Badge Forge', desc: 'Combine duplicate skill badges to forge upgraded insignias (Rare, Epic, Legendary, Classified).', default: true },
    { id: 74, key: 'daily_login_streaks', domain: 'Social & Guild Warfare', title: 'Daily Operative Check-In Matrix & Streaks', desc: 'Progressive token multipliers and prestige medals for consecutive 24-hour network activity.', default: true },
    { id: 75, key: 'cyber_trivia_showdown', domain: 'Social & Guild Warfare', title: 'Synchronized Cyber Trivia Showdowns', desc: 'Multiplayer speed trivia on network defense, cryptography, and systems engineering.', default: true },
    { id: 76, key: 'hall_of_fame_podium', domain: 'Social & Guild Warfare', title: 'Channel Leaderboards & MVP Hall of Fame', desc: 'Dynamic podium showcasing top bounty hunters, wager winners, and dispute resolvers.', default: true },
    { id: 77, key: 'custom_profile_studio', domain: 'Social & Guild Warfare', title: 'Holographic Profile Banner Studio', desc: 'Layer procedural shader canvas backdrops, military service ribbons, and animated borders.', default: true },
    { id: 78, key: 'syndicate_vault_staking', domain: 'Social & Guild Warfare', title: 'Syndicate Vault Staking & Yield Drops', desc: 'Guilds stake pooled NEX tokens to unlock bandwidth boosts, server badges, and custom roles.', default: true },
    { id: 79, key: 'secret_achievements', domain: 'Social & Guild Warfare', title: 'Classified Operative Achievements Matrix', desc: 'Hidden unlockable milestones (e.g. Sent packet during jamming, Won 5 debate audits).', default: true },
    { id: 80, key: 'guild_war_horn_alert', domain: 'Social & Guild Warfare', title: 'Emergency Guild War Horn Summoner', desc: 'Guild commanders trigger an acoustic alert summoning squad members to urgent raid channels.', default: true },

    // DOMAIN 9: GEOLOCATION, RADAR & AUGMENTED REALITY
    { id: 81, key: 'squad_gps_formation', domain: 'Geolocation, Radar & AR', title: 'Tactical Squad GPS Formation Grid', desc: 'Visualizes real-time relative squad coordinates and perimeter envelopes on a tactical map.', default: true },
    { id: 82, key: 'dead_drop_geocache', domain: 'Geolocation, Radar & AR', title: 'Dead-Drop Coordinate Geocache', desc: 'Virtual encrypted message containers that unlock only when an operative walks to the GPS zone.', default: true },
    { id: 83, key: 'proximity_room_autojoin', domain: 'Geolocation, Radar & AR', title: 'Proximity Ephemeral Channel Auto-Join', desc: 'Automatically joins local encrypted chat rooms when walking within 50 meters of a beacon.', default: true },
    { id: 84, key: 'geofenced_blackouts', domain: 'Geolocation, Radar & AR', title: 'Geofenced Security Channel Blackouts', desc: 'Prevents classified rooms from being accessed or decrypted outside verified compound boundaries.', default: true },
    { id: 85, key: 'ar_compass_navigation', domain: 'Geolocation, Radar & AR', title: 'Augmented Reality (WebXR) Waypoint Compass', desc: 'Points phone cameras toward horizon to render glowing 3D vector waypoints toward team members.', default: true },
    { id: 86, key: 'anti_gps_spoofing', domain: 'Geolocation, Radar & AR', title: 'GPS Spoofing & Relocation Detection', desc: 'Validates genuine cellular and Wi-Fi triangulations against report latencies to prevent fakes.', default: true },
    { id: 87, key: 'elevation_barometer_loc', domain: 'Geolocation, Radar & AR', title: 'Tactical Elevation & Barometer Beacon', desc: 'Distinguishes team operatives on different skyscraper floors using device altimeter sensors.', default: true },
    { id: 88, key: 'route_breadcrumb_tracker', domain: 'Geolocation, Radar & AR', title: 'Coordinate Breadcrumb Route Tracker', desc: 'Records encrypted trajectory tracks with speed profiles and waypoint markers for field extraction.', default: true },
    { id: 89, key: 'offline_map_caching', domain: 'Geolocation, Radar & AR', title: 'Offline Vector Map Tile Caching', desc: 'Pre-caches satellite and topographic map slices in IndexedDB for zero-connectivity field ops.', default: true },
    { id: 90, key: 'solar_terminator_calc', domain: 'Geolocation, Radar & AR', title: 'Solar Terminator & Celestial Angle Calculator', desc: 'Calculates day/night shadow boundaries and sun azimuth to assist tactical reconnaissance.', default: true },

    // DOMAIN 10: DIGITAL FORENSICS, ANTI-TAMPER & PANIC ARCHITECTURE
    { id: 91, key: 'fido2_webauthn_lock', domain: 'Forensics & Anti-Tamper', title: 'Hardware Security Key (FIDO2 / WebAuthn)', desc: 'Mandates physical YubiKey or biometric touch prompts to decrypt high-clearance dispatches.', default: true },
    { id: 92, key: 'honey_document_canary', domain: 'Forensics & Anti-Tamper', title: 'Canary Token & Honey-Document Traps', desc: 'Generates trackable decoy attachments that alert administrators the moment an intruder opens them.', default: true },
    { id: 93, key: 'screenshot_dom_guard', domain: 'Forensics & Anti-Tamper', title: 'DOM Screen Capture & Window Blur Shield', desc: 'Detects devtools inspection, window blur, and canvas capture, immediately obfuscating viewports.', default: true },
    { id: 94, key: 'triple_pass_incinerator', domain: 'Forensics & Anti-Tamper', title: 'Triple-Pass Cryptographic RAM Incinerator', desc: 'Shreds IndexedDB storage, session keys, and cache memory with triple-pass random overwrites in <500ms.', default: true },
    { id: 95, key: 'anti_forensic_zeroization', domain: 'Forensics & Anti-Tamper', title: 'Anti-Forensic RAM Zeroization on Unload', desc: 'Overwrites all cryptographic byte buffers in memory immediately upon window close or idle timeout.', default: true },
    { id: 96, key: 'exfiltration_honeypot', domain: 'Forensics & Anti-Tamper', title: 'Automated Exfiltration Honeypot API Keys', desc: 'Deploys fake API keys in chat that, when polled by an intruder, immediately isolate their IP.', default: true },
    { id: 97, key: 'merkle_timeline_audit', domain: 'Forensics & Anti-Tamper', title: 'Merkle Hash Tree Timeline Audit', desc: 'Every message links to previous message digests; any database alteration invalidates the entire chain.', default: true },
    { id: 98, key: 'micro_steganography_tracer', domain: 'Forensics & Anti-Tamper', title: 'Forensic Micro-Steganography Leak Tracer', desc: 'Embeds invisible zero-width whitespace identifiers into text copies to pinpoint leak sources.', default: true },
    { id: 99, key: 'cold_start_recovery_qr', domain: 'Forensics & Anti-Tamper', title: 'Cold-Start Lockdown Recovery Key', desc: 'Requires physical paper QR codes split among senior engineers to boot an incinerated system.', default: true },
    { id: 100, key: 'deep_space_amoled_mode', domain: 'Forensics & Anti-Tamper', title: 'Deep-Space AMOLED Zero Optical Emission', desc: 'Pure #000000 dark mode with low-lux red-only phosphor illumination for covert night ops.', default: true }
  ];

  class CyberFeatureMatrix {
    constructor() {
      this.catalog = FEATURE_CATALOG;
      this.storageKey = 'nexchat_feature_flags_v1';
      this.flags = this.loadFlags();
      this.listeners = new Set();
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    loadFlags() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          const map = {};
          this.catalog.forEach(f => {
            map[f.id] = (parsed[f.id] !== undefined) ? !!parsed[f.id] : f.default;
          });
          return map;
        }
      } catch (e) {}

      // Default: all enabled
      const defaults = {};
      this.catalog.forEach(f => {
        defaults[f.id] = f.default;
      });
      return defaults;
    }

    saveFlags() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.flags));
      } catch (e) {}
    }

    isEnabled(idOrKey) {
      if (typeof idOrKey === 'number') {
        return !!this.flags[idOrKey];
      }
      const item = this.catalog.find(f => f.key === idOrKey || f.id === parseInt(idOrKey, 10));
      return item ? !!this.flags[item.id] : true;
    }

    toggleFeature(id, forcedState = null) {
      const numId = parseInt(id, 10);
      const cur = !!this.flags[numId];
      const next = (forcedState !== null) ? !!forcedState : !cur;
      this.flags[numId] = next;
      this.saveFlags();
      this.notifyListeners(numId, next);
      this.updateUIReflection(numId, next);
      return next;
    }

    setDomainState(domainName, enable) {
      this.catalog.filter(f => f.domain === domainName).forEach(f => {
        this.flags[f.id] = !!enable;
        this.notifyListeners(f.id, !!enable);
      });
      this.saveFlags();
      this.refreshMatrixView();
    }

    setAllFeatures(enable) {
      this.catalog.forEach(f => {
        this.flags[f.id] = !!enable;
        this.notifyListeners(f.id, !!enable);
      });
      this.saveFlags();
      this.refreshMatrixView();
    }

    getSummary() {
      const total = this.catalog.length;
      let active = 0;
      this.catalog.forEach(f => {
        if (this.flags[f.id]) active++;
      });
      return { total, active, disabled: total - active };
    }

    onToggle(fn) {
      this.listeners.add(fn);
    }

    notifyListeners(id, state) {
      this.listeners.forEach(fn => {
        try { fn(id, state); } catch (e) {}
      });
    }

    bindDOM() {
      this.injectSettingsTab();
      this.injectHeaderTrigger();
      this.injectModal();
    }

    injectSettingsTab() {
      // Check if sidebar has the tab already
      const sidebar = document.getElementById('settingsSidebar');
      if (sidebar && !document.querySelector('.settings-nav-tab[data-tab="tab-cyber-features-matrix"]')) {
        const group = document.createElement('div');
        group.className = 'settings-nav-group';
        group.innerHTML = `
          <span class="settings-nav-group-title">ADVANCED ARCHITECTURE</span>
          <button type="button" class="settings-nav-tab" data-tab="tab-cyber-features-matrix">
            <i class="fa-solid fa-sliders" style="color: #00f3ff;"></i>
            <span>100 Cyber Matrix</span>
            <span class="settings-tab-microbadge" style="background: rgba(0,243,255,0.15); color: #00f3ff; border: 1px solid rgba(0,243,255,0.4);">100 FLAGS</span>
          </button>
        `;
        sidebar.appendChild(group);

        // Bind click on new tab
        const tabBtn = group.querySelector('.settings-nav-tab');
        tabBtn.addEventListener('click', () => {
          document.querySelectorAll('.settings-nav-tab').forEach(t => t.classList.remove('active'));
          tabBtn.classList.add('active');
          document.querySelectorAll('.settings-tab-pane').forEach(p => p.classList.remove('active'));
          const pane = document.getElementById('tab-cyber-features-matrix');
          if (pane) {
            pane.classList.add('active');
            this.renderMatrixIntoContainer(pane.querySelector('#cyberMatrixContentArea'));
          }
        });
      }

      // Check if tab-pane exists
      let pane = document.getElementById('tab-cyber-features-matrix');
      if (!pane) {
        const panesContainer = document.querySelector('.settings-content') || 
                               document.querySelector('.settings-body') || 
                               document.querySelector('.settings-layout');
        if (panesContainer) {
          pane = document.createElement('div');
          pane.id = 'tab-cyber-features-matrix';
          pane.className = 'settings-tab-pane';
          pane.innerHTML = `
            <div class="settings-pane-header">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-bold text-white text-base">
                    <i class="fa-solid fa-sliders text-[#00f3ff]"></i> 100 CYBER MATRIX & FEATURE TOGGLES
                  </h3>
                  <p class="text-xs text-gray-400 mt-0.5">Toggle and calibrate any of the 100 enterprise cybersecurity modules in real time.</p>
                </div>
                <span class="matrix-status-pill" id="matrixMasterStatusBadge">100 / 100 ACTIVE</span>
              </div>
            </div>

            <div class="matrix-controls-bar mt-3">
              <div class="flex gap-2 flex-wrap sm:flex-nowrap items-center">
                <div class="matrix-search-box flex-1">
                  <i class="fa-solid fa-magnifying-glass text-[#00f3ff]"></i>
                  <input type="text" id="matrixSearchInput" class="matrix-search-input" placeholder="Search 100 features by ID, name, or domain..." />
                </div>
                <button type="button" class="matrix-quick-btn" id="matrixEnableAllBtn">
                  <i class="fa-solid fa-check-double"></i> ENABLE ALL
                </button>
                <button type="button" class="matrix-quick-btn danger" id="matrixDisableAllBtn">
                  <i class="fa-solid fa-power-off"></i> DISABLE ALL
                </button>
              </div>
            </div>

            <div class="matrix-content-scroll mt-3" id="cyberMatrixContentArea">
              <!-- Dynamically populated 10 domains -->
            </div>
          `;
          panesContainer.appendChild(pane);

          // Wire search and mass toggle buttons
          const searchInput = pane.querySelector('#matrixSearchInput');
          searchInput.addEventListener('input', (e) => {
            this.filterMatrix(e.target.value.trim().toLowerCase());
          });

          pane.querySelector('#matrixEnableAllBtn').addEventListener('click', () => {
            this.setAllFeatures(true);
          });

          pane.querySelector('#matrixDisableAllBtn').addEventListener('click', () => {
            this.setAllFeatures(false);
          });
        }
      }
    }

    injectHeaderTrigger() {
      const headerActions = document.querySelector('.header-right') || 
                            document.querySelector('.chat-detail-header-actions');
      if (headerActions && !document.getElementById('cyberMatrixBtnHeader')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'cyberMatrixBtnHeader';
        btn.className = 'header-icon-btn';
        btn.title = '100 Cyber Feature Matrix Toggles';
        btn.innerHTML = `<i class="fa-solid fa-sliders text-[#00f3ff]"></i>`;
        btn.addEventListener('click', () => this.openModal());
        headerActions.appendChild(btn);
      }
    }

    injectModal() {
      if (document.getElementById('cyberMatrixModal')) return;

      const modal = document.createElement('div');
      modal.id = 'cyberMatrixModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window matrix-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-sliders text-[#00f3ff] text-lg"></i>
              <h3 class="font-bold text-white text-base">100 CYBER FEATURE MATRIX</h3>
              <span class="matrix-modal-badge" id="modalMatrixStatusBadge">100 FLAGS</span>
            </div>
            <button type="button" class="cyber-modal-close" id="closeMatrixModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="matrix-modal-body">
            <div class="matrix-controls-bar">
              <div class="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                <div class="matrix-search-box flex-1">
                  <i class="fa-solid fa-magnifying-glass text-[#00f3ff]"></i>
                  <input type="text" id="modalMatrixSearchInput" class="matrix-search-input" placeholder="Search 100 features by ID, name, or domain..." />
                </div>
                <button type="button" class="matrix-quick-btn" id="modalMatrixEnableAllBtn">
                  <i class="fa-solid fa-check-double"></i> ENABLE ALL
                </button>
                <button type="button" class="matrix-quick-btn danger" id="modalMatrixDisableAllBtn">
                  <i class="fa-solid fa-power-off"></i> DISABLE ALL
                </button>
              </div>
            </div>

            <div class="matrix-content-scroll mt-3" id="modalMatrixContentArea">
              <!-- Dynamically populated 10 domains -->
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#closeMatrixModalBtn').addEventListener('click', () => this.closeModal());

      const searchInput = modal.querySelector('#modalMatrixSearchInput');
      searchInput.addEventListener('input', (e) => {
        this.filterMatrix(e.target.value.trim().toLowerCase(), '#modalMatrixContentArea');
      });

      modal.querySelector('#modalMatrixEnableAllBtn').addEventListener('click', () => {
        this.setAllFeatures(true);
      });

      modal.querySelector('#modalMatrixDisableAllBtn').addEventListener('click', () => {
        this.setAllFeatures(false);
      });
    }

    openModal() {
      const modal = document.getElementById('cyberMatrixModal');
      if (!modal) return;
      modal.style.display = 'flex';
      const container = modal.querySelector('#modalMatrixContentArea');
      this.renderMatrixIntoContainer(container);
    }

    closeModal() {
      const modal = document.getElementById('cyberMatrixModal');
      if (modal) modal.style.display = 'none';
    }

    renderMatrixIntoContainer(container) {
      if (!container) return;

      const domains = [
        'Cryptography & ZK Systems',
        'AI Agents & Neural Systems',
        '3D WebGL & Spatial Computing',
        'Micro-Economy & Wagering Duels',
        'Tactical Audio & Sonar',
        'P2P Mesh & Resilient Network',
        'Collaborative Dev Workspaces',
        'Social & Guild Warfare',
        'Geolocation, Radar & AR',
        'Forensics & Anti-Tamper'
      ];

      const domainIcons = {
        'Cryptography & ZK Systems': 'fa-key',
        'AI Agents & Neural Systems': 'fa-brain',
        '3D WebGL & Spatial Computing': 'fa-cube',
        'Micro-Economy & Wagering Duels': 'fa-coins',
        'Tactical Audio & Sonar': 'fa-satellite-dish',
        'P2P Mesh & Resilient Network': 'fa-network-wired',
        'Collaborative Dev Workspaces': 'fa-code',
        'Social & Guild Warfare': 'fa-shield-halved',
        'Geolocation, Radar & AR': 'fa-location-crosshairs',
        'Forensics & Anti-Tamper': 'fa-lock'
      };

      let html = '';

      domains.forEach((dom, domIdx) => {
        const domFeatures = this.catalog.filter(f => f.domain === dom);
        const allEnabled = domFeatures.every(f => this.flags[f.id]);
        const activeCount = domFeatures.filter(f => this.flags[f.id]).length;
        const iconClass = domainIcons[dom] || 'fa-microchip';

        html += `
          <div class="matrix-domain-card" data-domain="${dom}">
            <div class="matrix-domain-header" onclick="this.parentElement.classList.toggle('collapsed')">
              <div class="flex items-center gap-2">
                <i class="fa-solid ${iconClass} text-[#00f3ff]"></i>
                <span class="matrix-domain-title">DOMAIN ${domIdx + 1}: ${dom.toUpperCase()}</span>
                <span class="matrix-domain-count">${activeCount}/${domFeatures.length} ACTIVE</span>
              </div>
              <div class="flex items-center gap-2" onclick="event.stopPropagation()">
                <button type="button" class="matrix-dom-toggle-btn ${allEnabled ? 'active' : ''}" 
                  onclick="window.cyberFeatureMatrix.setDomainState('${dom}', ${!allEnabled})">
                  <i class="fa-solid ${allEnabled ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                  <span>${allEnabled ? 'DOMAIN ON' : 'DOMAIN OFF'}</span>
                </button>
                <i class="fa-solid fa-chevron-down matrix-collapse-icon"></i>
              </div>
            </div>

            <div class="matrix-features-grid">
        `;

        domFeatures.forEach(feat => {
          const isEn = !!this.flags[feat.id];
          const paddedId = feat.id.toString().padStart(2, '0');

          html += `
            <div class="matrix-feature-item ${isEn ? 'enabled' : 'disabled'}" id="matrixItem_${feat.id}" data-search="${feat.id} ${feat.key} ${feat.title.toLowerCase()} ${feat.desc.toLowerCase()}">
              <div class="matrix-item-left">
                <div class="flex items-center gap-2">
                  <span class="matrix-item-id">[${paddedId}]</span>
                  <span class="matrix-item-title">${feat.title}</span>
                  <span class="matrix-status-tag ${isEn ? 'tag-enabled' : 'tag-disabled'}">${isEn ? 'ACTIVE' : 'OFF'}</span>
                </div>
                <div class="matrix-item-desc">${feat.desc}</div>
              </div>
              <div class="matrix-item-right">
                <label class="matrix-switch">
                  <input type="checkbox" ${isEn ? 'checked' : ''} onchange="window.cyberFeatureMatrix.toggleFeature(${feat.id}, this.checked)" />
                  <span class="matrix-slider"></span>
                </label>
              </div>
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
      this.updateMasterCounters();
    }

    refreshMatrixView() {
      const container1 = document.querySelector('#cyberMatrixContentArea');
      if (container1) this.renderMatrixIntoContainer(container1);
      const container2 = document.querySelector('#modalMatrixContentArea');
      if (container2) this.renderMatrixIntoContainer(container2);
    }

    updateUIReflection(id, state) {
      // Update DOM items across all rendered matrices
      document.querySelectorAll(`#matrixItem_${id}`).forEach(el => {
        if (state) {
          el.classList.remove('disabled');
          el.classList.add('enabled');
        } else {
          el.classList.remove('enabled');
          el.classList.add('disabled');
        }
        const tag = el.querySelector('.matrix-status-tag');
        if (tag) {
          tag.className = `matrix-status-tag ${state ? 'tag-enabled' : 'tag-disabled'}`;
          tag.textContent = state ? 'ACTIVE' : 'OFF';
        }
        const chk = el.querySelector('input[type="checkbox"]');
        if (chk) chk.checked = state;
      });

      this.updateMasterCounters();
    }

    updateMasterCounters() {
      const summary = this.getSummary();
      const txt = `${summary.active} / ${summary.total} ACTIVE`;
      const badge1 = document.getElementById('matrixMasterStatusBadge');
      if (badge1) badge1.textContent = txt;
      const badge2 = document.getElementById('modalMatrixStatusBadge');
      if (badge2) badge2.textContent = `${summary.active} / 100 FLAGS`;
    }

    filterMatrix(term, selector = '#cyberMatrixContentArea') {
      const area = document.querySelector(selector);
      if (!area) return;

      if (!term) {
        area.querySelectorAll('.matrix-feature-item').forEach(el => el.style.display = 'flex');
        area.querySelectorAll('.matrix-domain-card').forEach(el => el.style.display = 'block');
        return;
      }

      area.querySelectorAll('.matrix-domain-card').forEach(card => {
        let matchingInDomain = 0;
        card.querySelectorAll('.matrix-feature-item').forEach(item => {
          const s = item.dataset.search || '';
          if (s.includes(term)) {
            item.style.display = 'flex';
            matchingInDomain++;
          } else {
            item.style.display = 'none';
          }
        });
        card.style.display = matchingInDomain > 0 ? 'block' : 'none';
      });
    }
  }

  window.CyberFeatureMatrix = CyberFeatureMatrix;
  window.cyberFeatureMatrix = new CyberFeatureMatrix();
})();

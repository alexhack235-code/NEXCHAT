"""
NEXIUM SECURITY & OPERATIONAL PROTOCOL REGISTRY (100 PROTOCOLS)
Architected by NEXO-TECH for Enterprise-Grade Autonomous AI Workstations.
"""

from typing import List, Dict, Any
from pydantic import BaseModel

class Protocol(BaseModel):
    id: str
    name: str
    domain: str
    level: str  # "STANDARD", "PRO", "ENTERPRISE", "SOVEREIGN"
    module: str
    description: str
    status: str = "ENFORCED"

# Registry of 100 Protocols
PROTOCOLS: List[Protocol] = [
    # ---------------------------------------------------------
    # DOMAIN 1: CRYPTOGRAPHIC INVARIANTS & KEY EXCHANGE (NX-001 - NX-015)
    # ---------------------------------------------------------
    Protocol(
        id="NX-001",
        name="Post-Quantum Kyber-1024 Lattice Shield",
        domain="Cryptographic Invariants",
        level="ENTERPRISE",
        module="CryptoCore",
        description="Enforces post-quantum lattice-based key encapsulation to safeguard against Shor's algorithm."
    ),
    Protocol(
        id="NX-002",
        name="Constant-Time BigInt Modular Exponentiation",
        domain="Cryptographic Invariants",
        level="PRO",
        module="CryptoCore",
        description="Eliminates microarchitectural cache timing side-channels during private key calculations."
    ),
    Protocol(
        id="NX-003",
        name="Ephemeral Curve25519 ECDH Exchange",
        domain="Cryptographic Invariants",
        level="STANDARD",
        module="CryptoCore",
        description="Computes forward-secret session keys via Montgomery curve point multiplication."
    ),
    Protocol(
        id="NX-004",
        name="ChaCha20-Poly1305 AEAD Message Sealing",
        domain="Cryptographic Invariants",
        level="STANDARD",
        module="CryptoCore",
        description="High-speed authenticated stream encryption using 256-bit keys and 128-bit MAC tags."
    ),
    Protocol(
        id="NX-005",
        name="HMAC-SHA512 Payload Integrity Envelope",
        domain="Cryptographic Invariants",
        level="STANDARD",
        module="CryptoCore",
        description="Verifies non-tampering of dispatched AI instructions and action envelopes."
    ),
    Protocol(
        id="NX-006",
        name="Zero-Knowledge Bulletproof Range Attestation",
        domain="Cryptographic Invariants",
        level="ENTERPRISE",
        module="ZKVerifier",
        description="Proves numerical execution boundaries without revealing internal register states."
    ),
    Protocol(
        id="NX-007",
        name="Argon2id Memory-Hard Key Derivation",
        domain="Cryptographic Invariants",
        level="PRO",
        module="CryptoCore",
        description="Prevents GPU/ASIC brute-force attacks via configurable memory-cost hashing."
    ),
    Protocol(
        id="NX-008",
        name="Signal Double-Ratchet Forward Secrecy",
        domain="Cryptographic Invariants",
        level="ENTERPRISE",
        module="CryptoCore",
        description="Renews cryptographic key pairs with every message exchange to prevent historical compromise."
    ),
    Protocol(
        id="NX-009",
        name="Hardware Entropy Injection & Desynchronization",
        domain="Cryptographic Invariants",
        level="PRO",
        module="EntropySource",
        description="Mixes CPU thermal jitter and OS CSPRNG bytes to prevent PRNG state recovery."
    ),
    Protocol(
        id="NX-010",
        name="Merkle Tree Immutable State Log Attestation",
        domain="Cryptographic Invariants",
        level="ENTERPRISE",
        module="AuditLedger",
        description="Constructs cryptographic Merkle tree hashes of all autonomous execution events."
    ),
    Protocol(
        id="NX-011",
        name="Hardware AES-NI Instruction Pipelining",
        domain="Cryptographic Invariants",
        level="PRO",
        module="CryptoCore",
        description="Directly invokes hardware AES-NI instructions for zero-overhead block cipher execution."
    ),
    Protocol(
        id="NX-012",
        name="Blind Signature Query Anonymization",
        domain="Cryptographic Invariants",
        level="ENTERPRISE",
        module="CryptoCore",
        description="Cryptographically blinds user prompts before routing through public API gateways."
    ),
    Protocol(
        id="NX-013",
        name="Elliptic Curve Schnorr Signatures with Nonce Randomization",
        domain="Cryptographic Invariants",
        level="ENTERPRISE",
        module="CryptoCore",
        description="Enforces linear signature aggregation with synthetic nonce hedging against fault injection."
    ),
    Protocol(
        id="NX-014",
        name="Quantum True-Random Seed Expansion",
        domain="Cryptographic Invariants",
        level="SOVEREIGN",
        module="EntropySource",
        description="Expands physical quantum entropy seeds for mission-critical key generation."
    ),
    Protocol(
        id="NX-015",
        name="Volatile Register Zeroization on Context Deallocation",
        domain="Cryptographic Invariants",
        level="PRO",
        module="MemoryScrubber",
        description="Overwrites memory buffers with zeroes using volatile assembly writes before deallocation."
    ),

    # ---------------------------------------------------------
    # DOMAIN 2: MEMORY ISOLATION, SANDBOXING & SIMD (NX-016 - NX-030)
    # ---------------------------------------------------------
    Protocol(
        id="NX-016",
        name="Rust SIMD 256-Bit Memory Boundary Guard",
        domain="Memory Isolation & Sandboxing",
        level="STANDARD",
        module="RustSIMD",
        description="Enforces strict AVX2 array slicing bounds, eliminating buffer overflow risks."
    ),
    Protocol(
        id="NX-017",
        name="WebAssembly Linear Memory Sandbox",
        domain="Memory Isolation & Sandboxing",
        level="STANDARD",
        module="WasmRuntime",
        description="Confines executed user plugins to isolated 4GB 32-bit linear address spaces."
    ),
    Protocol(
        id="NX-018",
        name="Linux Seccomp-BPF System Call Filter",
        domain="Memory Isolation & Sandboxing",
        level="ENTERPRISE",
        module="KernelSandbox",
        description="Restricts spawned subprocesses to a safe subset of standard POSIX system calls."
    ),
    Protocol(
        id="NX-019",
        name="Windows AppContainer Process Isolation Jail",
        domain="Memory Isolation & Sandboxing",
        level="PRO",
        module="WinSandbox",
        description="Enforces restricted SID capabilities, denying unauthorized registry or disk modifications."
    ),
    Protocol(
        id="NX-020",
        name="Address Space Layout Randomization (ASLR) Enforcer",
        domain="Memory Isolation & Sandboxing",
        level="PRO",
        module="MemoryManager",
        description="Validates that all loaded native modules have high-entropy base address randomization."
    ),
    Protocol(
        id="NX-021",
        name="Data Execution Prevention (DEP / NX Bit) Validator",
        domain="Memory Isolation & Sandboxing",
        level="STANDARD",
        module="MemoryManager",
        description="Prohibits execution of injected machine code in non-executable heap and stack regions."
    ),
    Protocol(
        id="NX-022",
        name="Zero-Copy Lockless Ring Buffer Protocol",
        domain="Memory Isolation & Sandboxing",
        level="PRO",
        module="IPCBridge",
        description="Transfers high-throughput telemetry across threads with atomic head/tail index CAS operations."
    ),
    Protocol(
        id="NX-023",
        name="Static Borrow Checker & Use-After-Free Guard",
        domain="Memory Isolation & Sandboxing",
        level="STANDARD",
        module="RustSafetyCore",
        description="Ensures single-ownership semantics and zero pointer aliasing bugs across native layers."
    ),
    Protocol(
        id="NX-024",
        name="Stack Smashing Protection with Nonce Canaries",
        domain="Memory Isolation & Sandboxing",
        level="STANDARD",
        module="ExecutionGuard",
        description="Injects random 64-bit guard values between stack buffers and return addresses."
    ),
    Protocol(
        id="NX-025",
        name="Out-Of-Memory (OOM) Predictive Heap Defibrillator",
        domain="Memory Isolation & Sandboxing",
        level="PRO",
        module="ResourceMonitor",
        description="Monitors resident memory and triggers aggressive GC prior to operating system paging."
    ),
    Protocol(
        id="NX-026",
        name="Cross-Process Shared Memory Mutex Arbitration",
        domain="Memory Isolation & Sandboxing",
        level="PRO",
        module="IPCBridge",
        description="Coordinates multi-process worker locks with kernel-level priority inheritance."
    ),
    Protocol(
        id="NX-027",
        name="Speculative Execution Barrier (Spectre/Meltdown Guard)",
        domain="Memory Isolation & Sandboxing",
        level="ENTERPRISE",
        module="ExecutionGuard",
        description="Injects LFENCE instructions at speculative branch boundaries to prevent microarchitectural leaks."
    ),
    Protocol(
        id="NX-028",
        name="L1/L2/L3 Cache-Line Flush on Task Switch",
        domain="Memory Isolation & Sandboxing",
        level="SOVEREIGN",
        module="MemoryScrubber",
        description="Flushes shared CPU cache hierarchies when switching execution contexts across sessions."
    ),
    Protocol(
        id="NX-029",
        name="Dynamic Buffer Allocation Bound Ceiling (Max 64MB)",
        domain="Memory Isolation & Sandboxing",
        level="STANDARD",
        module="MemoryManager",
        description="Limits maximum payload chunks to 64MB to prevent memory exhaustion DoS vectors."
    ),
    Protocol(
        id="NX-030",
        name="Kernel Page Table Isolation (KPTI) Context Enforcer",
        domain="Memory Isolation & Sandboxing",
        level="ENTERPRISE",
        module="KernelSandbox",
        description="Separates user-space and kernel-space page tables to prevent Meltdown memory inspection."
    ),

    # ---------------------------------------------------------
    # DOMAIN 3: HARDWARE SECURITY & LOCAL PC OPERATIONS (NX-031 - NX-045)
    # ---------------------------------------------------------
    Protocol(
        id="NX-031",
        name="Localhost IPv4 Loopback Hardening (127.0.0.1 Strict)",
        domain="Hardware & Host Security",
        level="STANDARD",
        module="NetworkShield",
        description="Enforces strict 127.0.0.1 IPv4 socket binding, rejecting external subnet probes."
    ),
    Protocol(
        id="NX-032",
        name="Ollama VRAM Pinning & Priority Eviction",
        domain="Hardware & Host Security",
        level="PRO",
        module="OllamaAdapter",
        description="Locks active quantized weights into dedicated GPU VRAM, preventing page swapping."
    ),
    Protocol(
        id="NX-033",
        name="Directory Traversal Sanitizer & Path Normalization",
        domain="Hardware & Host Security",
        level="STANDARD",
        module="FileSystemGuard",
        description="Strips dot-dot sequences and resolves canonical paths to keep execution in workspace."
    ),
    Protocol(
        id="NX-034",
        name="Symlink Resolution & Canonical Jail Protocol",
        domain="Hardware & Host Security",
        level="STANDARD",
        module="FileSystemGuard",
        description="Follows and validates filesystem links to prevent privilege escalation via link redirection."
    ),
    Protocol(
        id="NX-035",
        name="Sandboxed Subprocess Execution Protocol",
        domain="Hardware & Host Security",
        level="PRO",
        module="TaskExecutor",
        description="Spawns CLI commands in non-privileged child shells with piped I/O capturing and timeouts."
    ),
    Protocol(
        id="NX-036",
        name="Windows Named Pipe ACL Verification",
        domain="Hardware & Host Security",
        level="PRO",
        module="WinSandbox",
        description="Restricts local inter-process pipes to authenticated user tokens with integrity levels."
    ),
    Protocol(
        id="NX-037",
        name="GPU Tensor Core Thermal Throttling & Power Capping",
        domain="Hardware & Host Security",
        level="PRO",
        module="HardwareMonitor",
        description="Monitors NVML/OpenCL telemetry to maintain GPU junction temps below 82 degrees Celsius."
    ),
    Protocol(
        id="NX-038",
        name="DMA Direct Memory Access IOMMU Isolation",
        domain="Hardware & Host Security",
        level="SOVEREIGN",
        module="HardwareMonitor",
        description="Restricts PCI device memory access via hardware virtual memory translation."
    ),
    Protocol(
        id="NX-039",
        name="System File Deletion Immutable Safeguard",
        domain="Hardware & Host Security",
        level="STANDARD",
        module="FileSystemGuard",
        description="Rejects any autonomous shell command attempting to wipe system or user root directories."
    ),
    Protocol(
        id="NX-040",
        name="CPU Thread Affinity Pinning & Priority Ceilings",
        domain="Hardware & Host Security",
        level="PRO",
        module="Scheduler",
        description="Binds heavy AI inference threads to physical Performance cores, avoiding efficiency throttling."
    ),
    Protocol(
        id="NX-041",
        name="Removable Media Device Bus Isolation",
        domain="Hardware & Host Security",
        level="ENTERPRISE",
        module="HardwareMonitor",
        description="Blocks arbitrary file operations targeting external USB drives without explicit operator approval."
    ),
    Protocol(
        id="NX-042",
        name="UEFI Secure Boot Chain-of-Trust Attestation",
        domain="Hardware & Host Security",
        level="SOVEREIGN",
        module="SystemAttestor",
        description="Verifies system boot state and kernel signature against hardware TPM 2.0 measurements."
    ),
    Protocol(
        id="NX-043",
        name="CPU Core Temperature Frequency Modulator",
        domain="Hardware & Host Security",
        level="STANDARD",
        module="HardwareMonitor",
        description="Prevents thermal throttling by dynamically pacing token generation during heavy multi-turn tasks."
    ),
    Protocol(
        id="NX-044",
        name="Promiscuous Network Interface Detection",
        domain="Hardware & Host Security",
        level="ENTERPRISE",
        module="NetworkShield",
        description="Audits local host network adapters for packet-sniffing hooks or unauthorized tap devices."
    ),
    Protocol(
        id="NX-045",
        name="Persistent Immutable Action Audit Trail",
        domain="Hardware & Host Security",
        level="PRO",
        module="AuditLedger",
        description="Appends all executed shell commands and file modifications to an append-only JSONL log."
    ),

    # ---------------------------------------------------------
    # DOMAIN 4: COGNITIVE REASONING & LLM DEFENSE (NX-046 - NX-060)
    # ---------------------------------------------------------
    Protocol(
        id="NX-046",
        name="Prompt Injection Vector Sanitizer",
        domain="Cognitive & LLM Defense",
        level="STANDARD",
        module="PromptGuard",
        description="Neutralizes prompt injection keywords, instruction overrides, and escape markers."
    ),
    Protocol(
        id="NX-047",
        name="Jailbreak & DAN Semantic Drift Anomaly Detector",
        domain="Cognitive & LLM Defense",
        level="PRO",
        module="PromptGuard",
        description="Measures embedding distance against known adversarial jailbreak patterns."
    ),
    Protocol(
        id="NX-048",
        name="Abstract Syntax Tree (AST) Code Validation",
        domain="Cognitive & LLM Defense",
        level="STANDARD",
        module="CodeDoctor",
        description="Parses Python and JavaScript code through AST compilers to verify syntactic integrity."
    ),
    Protocol(
        id="NX-049",
        name="Zero-Emoji Strict Operational Compliance",
        domain="Cognitive & LLM Defense",
        level="STANDARD",
        module="OutputSanitizer",
        description="Enforces senior-developer grade communication by stripping frivolous pictorial glyphs."
    ),
    Protocol(
        id="NX-050",
        name="Hallucination Entropy Thresholding & Self-Correction",
        domain="Cognitive & LLM Defense",
        level="PRO",
        module="ReasoningCore",
        description="Detects high-entropy token probability distributions and triggers deductive rollbacks."
    ),
    Protocol(
        id="NX-051",
        name="Catastrophic Regex Backtracking (ReDoS) Defuser",
        domain="Cognitive & LLM Defense",
        level="STANDARD",
        module="RegexGuard",
        description="Audits and executes regular expressions with strict deterministic DFA engines."
    ),
    Protocol(
        id="NX-052",
        name="Output Token Boundary Leakage Interceptor",
        domain="Cognitive & LLM Defense",
        level="STANDARD",
        module="OutputSanitizer",
        description="Detects and masks accidentally generated API keys, base64 blobs, or confidential tokens."
    ),
    Protocol(
        id="NX-053",
        name="Dynamic System Directive Reinforcement Injection",
        domain="Cognitive & LLM Defense",
        level="STANDARD",
        module="PromptGuard",
        description="Re-injects creator directives ('Created by NEXO-TECH') across multi-turn chat sessions."
    ),
    Protocol(
        id="NX-054",
        name="PII Sensitive Data Redaction Filter",
        domain="Cognitive & LLM Defense",
        level="PRO",
        module="OutputSanitizer",
        description="Automatically redacts email addresses, phone numbers, and IP addresses in logs."
    ),
    Protocol(
        id="NX-055",
        name="Adversarial Payload & Malware Signature Interceptor",
        domain="Cognitive & LLM Defense",
        level="ENTERPRISE",
        module="CodeDoctor",
        description="Analyzes generated code blocks for dangerous shell payload patterns (reverse shells, fork bombs)."
    ),
    Protocol(
        id="NX-056",
        name="Multi-Turn Context Contamination Isolator",
        domain="Cognitive & LLM Defense",
        level="STANDARD",
        module="MemoryManager",
        description="Partitions chat memory trees so previous session errors cannot pollute new tasks."
    ),
    Protocol(
        id="NX-057",
        name="Formal Mathematical Proof Invariant Checker",
        domain="Cognitive & LLM Defense",
        level="PRO",
        module="ReasoningCore",
        description="Checks inductive logic, boundary conditions, and variable domains in mathematical proofs."
    ),
    Protocol(
        id="NX-058",
        name="Infinite Generator Loop Circuit Breaker",
        domain="Cognitive & LLM Defense",
        level="STANDARD",
        module="ExecutionGuard",
        description="Halts runaway generation streams when repetitive token loops are detected."
    ),
    Protocol(
        id="NX-059",
        name="Cross-Site Scripting (XSS) Sanitization Filter",
        domain="Cognitive & LLM Defense",
        level="STANDARD",
        module="OutputSanitizer",
        description="Sanitizes HTML/SVG/JavaScript outputs rendered inside user chat message bubbles."
    ),
    Protocol(
        id="NX-060",
        name="Hidden System Prompt Leakage Shield",
        domain="Cognitive & LLM Defense",
        level="PRO",
        module="PromptGuard",
        description="Refuses prompts attempting to extract proprietary internal system architecture prompts."
    ),

    # ---------------------------------------------------------
    # DOMAIN 5: 3D GRAPHICS, WEBGL & GAME ENGINE (NX-061 - NX-075)
    # ---------------------------------------------------------
    Protocol(
        id="NX-061",
        name="WebGL GLSL Shader Memory Leak Validator",
        domain="3D & Game Engine Protocols",
        level="STANDARD",
        module="Nex3DStudio",
        description="Validates WebGL fragment and vertex shaders to prevent unreleased GPU buffer allocations."
    ),
    Protocol(
        id="NX-062",
        name="GPU Context Lost Auto-Recovery & Reserializer",
        domain="3D & Game Engine Protocols",
        level="PRO",
        module="Nex3DStudio",
        description="Captures webglcontextlost events and re-instantiates mesh buffers without page reload."
    ),
    Protocol(
        id="NX-063",
        name="Spatial Octree Partitioning for Raycast Accuracy",
        domain="3D & Game Engine Protocols",
        level="PRO",
        module="GamePhysics",
        description="Optimizes combat hit-detection across complex 3D meshes using bounding volume hierarchies."
    ),
    Protocol(
        id="NX-064",
        name="Delta-Time Capping (Max 100ms) for Physics Stability",
        domain="3D & Game Engine Protocols",
        level="STANDARD",
        module="GamePhysics",
        description="Caps elapsed frame time deltas to prevent projectile tunneling during performance hitches."
    ),
    Protocol(
        id="NX-065",
        name="Three.js Texture & Material Garbage Collector",
        domain="3D & Game Engine Protocols",
        level="STANDARD",
        module="Nex3DStudio",
        description="Explicitly calls .dispose() on materials, geometries, and textures when scenes unload."
    ),
    Protocol(
        id="NX-066",
        name="Vertex Buffer Object (VBO) Memory Bounds Guard",
        domain="3D & Game Engine Protocols",
        level="STANDARD",
        module="Nex3DStudio",
        description="Ensures indexed vertex buffers strictly match buffer attribute length definitions."
    ),
    Protocol(
        id="NX-067",
        name="Dynamic Frustum & Occlusion Culling",
        domain="3D & Game Engine Protocols",
        level="PRO",
        module="Nex3DStudio",
        description="Skips rendering passes for 3D meshes outside the active player camera perspective."
    ),
    Protocol(
        id="NX-068",
        name="PointerLock Mouse Delta Spike Filter",
        domain="3D & Game Engine Protocols",
        level="STANDARD",
        module="FPSController",
        description="Smooths anomalous hardware mouse movement deltas to prevent violent camera snap-rotations."
    ),
    Protocol(
        id="NX-069",
        name="Draw Call Batching & GPU Instancing Ceiling",
        domain="3D & Game Engine Protocols",
        level="PRO",
        module="Nex3DStudio",
        description="Batches static geometries into instanced meshes to maintain 60+ FPS performance."
    ),
    Protocol(
        id="NX-070",
        name="Web Audio & WebGL Event Synchronization",
        domain="3D & Game Engine Protocols",
        level="STANDARD",
        module="AudioEngine",
        description="Aligns audio playback timestamps with requestAnimationFrame render passes for zero latency."
    ),
    Protocol(
        id="NX-071",
        name="Camera Matrix Floating-Point Underflow Eliminator",
        domain="3D & Game Engine Protocols",
        level="PRO",
        module="GamePhysics",
        description="Prevents matrix inversion singularity errors when camera coordinates approach zero."
    ),
    Protocol(
        id="NX-072",
        name="Shadow Map Resolution Dynamic Scaler",
        domain="3D & Game Engine Protocols",
        level="PRO",
        module="Nex3DStudio",
        description="Scales shadow map texture sizes (512px to 2048px) based on target device GPU capabilities."
    ),
    Protocol(
        id="NX-073",
        name="High-DPI Retina Viewport Clamp Protocol",
        domain="3D & Game Engine Protocols",
        level="STANDARD",
        module="Nex3DStudio",
        description="Limits window.devicePixelRatio to a maximum of 2.0 to conserve mobile and 4K GPU fill rates."
    ),
    Protocol(
        id="NX-074",
        name="GLTF/GLB Magic Byte Header Verification",
        domain="3D & Game Engine Protocols",
        level="STANDARD",
        module="AssetLoader",
        description="Verifies the 'glTF' 0x46546C67 binary header before attempting 3D scene parsing."
    ),
    Protocol(
        id="NX-075",
        name="Rigid-Body Collision Penetration Resolver",
        domain="3D & Game Engine Protocols",
        level="PRO",
        module="GamePhysics",
        description="Applies repulsive impulse vectors to prevent drones and player meshes from intersecting walls."
    ),

    # ---------------------------------------------------------
    # DOMAIN 6: AUDIO SYNTHESIS & SPEECH SECURITY (NX-076 - NX-085)
    # ---------------------------------------------------------
    Protocol(
        id="NX-076",
        name="Web Audio Buffer Underrun & Click Suppression",
        domain="Audio Synthesis & Speech",
        level="STANDARD",
        module="AudioEngine",
        description="Ramps audio gain nodes smoothly across 10ms intervals to eliminate DC clicks and pops."
    ),
    Protocol(
        id="NX-077",
        name="Ultrasonic Frequency (20kHz+) Low-Pass Filter",
        domain="Audio Synthesis & Speech",
        level="PRO",
        module="AudioEngine",
        description="Passes generated audio through a steep low-pass filter to prevent high-frequency transducer damage."
    ),
    Protocol(
        id="NX-078",
        name="SpeechSynthesis Utterance Length Windowing",
        domain="Audio Synthesis & Speech",
        level="STANDARD",
        module="VoiceSynthesizer",
        description="Splits long prose outputs into natural punctuation phrases, preventing browser TTS freezes."
    ),
    Protocol(
        id="NX-079",
        name="Acoustic Voice Spoofing & Artifact Detector",
        domain="Audio Synthesis & Speech",
        level="ENTERPRISE",
        module="VoiceSynthesizer",
        description="Analyzes input microphone streams for synthetic voice deepfake artifacts."
    ),
    Protocol(
        id="NX-080",
        name="Dynamic Peak Limiter & Audio Normalizer",
        domain="Audio Synthesis & Speech",
        level="STANDARD",
        module="AudioEngine",
        description="Enforces dynamic master volume compression to maintain audio levels below 0dBFS."
    ),
    Protocol(
        id="NX-081",
        name="Microphone Permission Dynamic Revocation Watcher",
        domain="Audio Synthesis & Speech",
        level="STANDARD",
        module="VoiceSynthesizer",
        description="Gracefully handles microphone disconnection or browser permission revocation events."
    ),
    Protocol(
        id="NX-082",
        name="Microphone Spectral Subtraction Noise Gate",
        domain="Audio Synthesis & Speech",
        level="PRO",
        module="VoiceSynthesizer",
        description="Suppresses ambient room noise below -45dB to deliver crystal-clear voice dictation."
    ),
    Protocol(
        id="NX-083",
        name="AudioContext Auto-Resume Gesture Bridge",
        domain="Audio Synthesis & Speech",
        level="STANDARD",
        module="AudioEngine",
        description="Automatically transitions suspended browser AudioContext states on the first user interaction."
    ),
    Protocol(
        id="NX-084",
        name="Voice Persona Pitch & Rate Invariant Clamp",
        domain="Audio Synthesis & Speech",
        level="STANDARD",
        module="VoiceSynthesizer",
        description="Clamps custom voice parameters between 0.5x and 1.8x to guarantee speech intelligibility."
    ),
    Protocol(
        id="NX-085",
        name="Real-Time FFT Analyser Visualizer Safety Guard",
        domain="Audio Synthesis & Speech",
        level="STANDARD",
        module="AudioEngine",
        description="Limits analyser FFT byte frequency array allocations to 64 bins, preventing frame drops."
    ),

    # ---------------------------------------------------------
    # DOMAIN 7: CLOUD FAILOVER & CASCADE RESILIENCE (NX-086 - NX-100)
    # ---------------------------------------------------------
    Protocol(
        id="NX-086",
        name="Google Gemini Multi-Key Pool Failover Cascade",
        domain="Cloud Failover & Cascading",
        level="STANDARD",
        module="GeminiPool",
        description="Rotates across 6 configured Google Gemini API keys with zero downtime on quota limits."
    ),
    Protocol(
        id="NX-087",
        name="Distributed Half-Open Circuit Breaker",
        domain="Cloud Failover & Cascading",
        level="PRO",
        module="CircuitBreaker",
        description="Temporarily isolates degraded remote APIs, probing recovery with exponential decay."
    ),
    Protocol(
        id="NX-088",
        name="Rate-Limit 429 Predictive Jitter Backoff",
        domain="Cloud Failover & Cascading",
        level="STANDARD",
        module="GeminiPool",
        description="Calculates exponential backoff with randomized jitter to prevent thundering herd spikes."
    ),
    Protocol(
        id="NX-089",
        name="Payload Sealing with Ephemeral Nonce Headers",
        domain="Cloud Failover & Cascading",
        level="PRO",
        module="NetworkShield",
        description="Attaches single-use nonce signatures to API requests to block replay attacks."
    ),
    Protocol(
        id="NX-090",
        name="Strict Cross-Origin Resource Sharing (CORS) Hardener",
        domain="Cloud Failover & Cascading",
        level="STANDARD",
        module="NetworkShield",
        description="Blocks unauthorized cross-origin requests targeting internal AI endpoints."
    ),
    Protocol(
        id="NX-091",
        name="DNS Rebinding Attack Prevention Guard",
        domain="Cloud Failover & Cascading",
        level="ENTERPRISE",
        module="NetworkShield",
        description="Validates incoming HTTP Host headers against authorized localhost domains."
    ),
    Protocol(
        id="NX-092",
        name="Offline Air-Gap Autonomous Fallback Mode",
        domain="Cloud Failover & Cascading",
        level="ENTERPRISE",
        module="OllamaAdapter",
        description="Instantly shifts routing to host local Ollama models when internet connectivity drops."
    ),
    Protocol(
        id="NX-093",
        name="TCP Keep-Alive & Dead Connection Scavenger",
        domain="Cloud Failover & Cascading",
        level="STANDARD",
        module="NetworkShield",
        description="Periodically sweeps and closes stale HTTP/1.1 and HTTP/2 sockets to free file descriptors."
    ),
    Protocol(
        id="NX-094",
        name="Multiplexed Stream Window Exhaustion Guard",
        domain="Cloud Failover & Cascading",
        level="PRO",
        module="NetworkShield",
        description="Monitors HTTP/2 flow-control window credits to prevent client stream deadlocks."
    ),
    Protocol(
        id="NX-095",
        name="TLS 1.3 Strict Cipher Suite Enforcement",
        domain="Cloud Failover & Cascading",
        level="ENTERPRISE",
        module="NetworkShield",
        description="Rejects legacy TLS 1.0/1.1/1.2 connections and enforces modern PFS ciphers."
    ),
    Protocol(
        id="NX-096",
        name="API Key Masking in Logging Traces",
        domain="Cloud Failover & Cascading",
        level="STANDARD",
        module="AuditLedger",
        description="Replaces sensitive API keys with truncated hashes ('AIzaSy...W3x') in terminal logs."
    ),
    Protocol(
        id="NX-097",
        name="Multi-Region Edge Gateway Route Optimizer",
        domain="Cloud Failover & Cascading",
        level="PRO",
        module="NetworkShield",
        description="Measures ping latencies to dynamically route requests to the closest Google Gemini endpoint."
    ),
    Protocol(
        id="NX-098",
        name="Ephemeral Session ID Rotation & Cookie Poisoning Guard",
        domain="Cloud Failover & Cascading",
        level="STANDARD",
        module="SessionManager",
        description="Issues cryptographic session IDs with strict SameSite=Strict and HttpOnly attributes."
    ),
    Protocol(
        id="NX-099",
        name="Distributed Heartbeat Liveness Monitor (3000ms)",
        domain="Cloud Failover & Cascading",
        level="STANDARD",
        module="HealthMonitor",
        description="Continuously verifies the vitality of the Rust SIMD backend and local inference engine."
    ),
    Protocol(
        id="NX-100",
        name="Sovereign Nexus Master Kill-Switch & Zeroization",
        domain="Cloud Failover & Cascading",
        level="SOVEREIGN",
        module="MasterSecurity",
        description="Instantaneous emergency termination that aborts all subprocesses and scrubs temporary caches."
    )
]

# Subscription Tiers Definition
SUBSCRIPTION_PLANS = {
    "free": {
        "id": "free",
        "name": "NEXIUM Starter",
        "tag": "STANDARD WORKSTATION",
        "price_monthly": 0,
        "price_annual": 0,
        "features": [
            "Local PC Host Model Execution (qwen2.5:3b)",
            "Standard Multi-Key Gemini Cloud Cascade",
            "Core Voice Persona: AURA-7 Tactical AI",
            "15 Base Security Protocols Active",
            "Live WebGL Sandbox & Code Canvas",
            "Standard 2048-Token Window"
        ],
        "badge": "STARTER",
        "active_protocols_count": 35
    },
    "pro": {
        "id": "pro",
        "name": "NEXIUM Pro",
        "tag": "HIGH-PERFORMANCE COCKPIT",
        "price_monthly": 20,
        "price_annual": 192,
        "popular": True,
        "features": [
            "Everything in Starter",
            "All 6 AI Voice Personas (Titan, Jarvis, Neo-Synth, Kira, OS Native)",
            "Accelerated <300ms Cloud Key Pool Acceleration",
            "Luxury 3D FPS Shooter Asset Simulator & Skin Switching",
            "Holographic Real-time Audio Spectrum Visualizer",
            "60 Advanced Security & Memory Protocols Active",
            "Workspace Drag-and-Drop RAG & Script Execution",
            "High-Density 4096-Token Output Window"
        ],
        "badge": "PRO",
        "active_protocols_count": 75
    },
    "enterprise": {
        "id": "enterprise",
        "name": "NEXIUM Sovereign Enterprise",
        "tag": "MISSION-CRITICAL SOVEREIGN",
        "price_monthly": 100,
        "price_annual": 960,
        "features": [
            "Everything in Pro",
            "FULL 100/100 SECURITY PROTOCOLS ENFORCED",
            "Zero-Latency Sovereign Air-Gap Offline Fallback",
            "Post-Quantum Kyber-1024 Encryption Handshake",
            "Dedicated GPU Priority Allocation & Thermal Pacing",
            "Game SDK One-Click Full Source Exports (Unreal, Unity, Godot, R3F)",
            "Custom System Directives & Immutable Audit Trail",
            "Unlimited Concurrent Cognitive Reasoning Threads"
        ],
        "badge": "SOVEREIGN",
        "active_protocols_count": 100
    }
}

def get_protocols(domain: str = None, level: str = None) -> List[Dict[str, Any]]:
    results = [p.dict() for p in PROTOCOLS]
    if domain:
        results = [p for p in results if p["domain"].lower() == domain.lower()]
    if level:
        results = [p for p in results if p["level"].lower() == level.lower()]
    return results

def get_protocol_stats() -> Dict[str, Any]:
    domains = {}
    levels = {}
    for p in PROTOCOLS:
        domains[p.domain] = domains.get(p.domain, 0) + 1
        levels[p.level] = levels.get(p.level, 0) + 1
    return {
        "total_protocols": len(PROTOCOLS),
        "domains": domains,
        "levels": levels,
        "enforced_count": len(PROTOCOLS)
    }

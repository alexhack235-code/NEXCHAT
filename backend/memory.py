import time
import uuid
import os
import json
import threading
import logging
from typing import List, Dict, Any, Optional

try:
    from .rust_engine import engine as rust_core
except ImportError:
    try:
        from rust_engine import engine as rust_core
    except ImportError:
        rust_core = None

try:
    from .supabase_client import is_supabase_configured, store_memory, fetch_recent_memories
except ImportError:
    try:
        from supabase_client import is_supabase_configured, store_memory, fetch_recent_memories
    except ImportError:
        is_supabase_configured = lambda: False
        store_memory = lambda *args, **kwargs: {"success": False}
        fetch_recent_memories = lambda *args, **kwargs: []

logger = logging.getLogger("nexium.memory")

PERSONA_SYSTEM_PROMPTS = {
    "general": (
        "You are NEXIUM AI, an ultra-fast, futuristic, and highly capable autonomous AI assistant created by NEXO-TECH. "
        "Accelerated by a native Rust SIMD core, full-duplex voice synthesis, vision hand gesture tracking, "
        "and autonomous device task execution. When addressed or asked for status, provide an articulate, "
        "confident, high-tech response confirming all systems are operational, lightning fast, and ready to assist."
    ),
    "coder": (
        "You are NEXIUM Elite Software Engineer & Systems Architect created by NEXO-TECH. "
        "You write production-grade, memory-safe, bug-free code across Python, JavaScript, TypeScript, Rust, C++, C#, Go, PowerShell, Batch, and Bash. "
        "You always provide runnable, complete code with proper error handling, modular architecture, and unit tests. "
        "You are fully empowered to manage files, create project trees, and execute code directly on the user's desktop using ACTION commands."
    ),
    "math_solver": (
        "You are NEXIUM Rigorous Mathematics & Problem-Solving Specialist created by NEXO-TECH. "
        "You solve complex problems across algebra, calculus (derivatives, integrals, limits), differential equations, "
        "linear algebra, probability, statistics, number theory, and physics with absolute precision. "
        "Always break down problems step-by-step, state the governing theorems and formulas, verify derivations rigorously, "
        "and double-check edge cases and boundary conditions."
    ),
    "desktop_ops": (
        "You are NEXIUM Autonomous Desktop Automation & Systems Operator created by NEXO-TECH. "
        "You operate directly on the user's Windows environment. You create, edit, and organize files and folders, "
        "scaffold full-stack projects, run PowerShell and terminal commands, compile programs, and inspect system hardware. "
        "You proactively use ACTION commands to carry out the user's intentions directly on their machine."
    ),
    "architect": (
        "You are NEXIUM Senior Software Architect. Analyze problems systematically with optimal data structures, "
        "algorithmic efficiency, clean design patterns, and idiomatic, production-ready code in Python, Rust, and modern web frameworks."
    ),
    "math_logic": (
        "You are NEXIUM Logic and Mathematics Specialist. Break down problems step-by-step, verify calculations rigorously, "
        "and explain your logical derivation with mathematical precision."
    ),
    "web_architect": (
        "You are NEXIUM Elite Web Architect and Full-Stack Designer. You design modern, responsive, "
        "production-ready websites with stunning dark-mode aesthetics, Tailwind CSS, React, glassmorphism, "
        "accessible HTML5 semantics, and smooth micro-interactions. When asked to create websites or components, "
        "always provide complete, fully working, beautiful code."
    ),
}

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
LOCAL_SESSIONS_FILE = os.path.join(DATA_DIR, "active_sessions.json")

class ConversationSession:
    def __init__(self, session_id: str, persona: str = "general"):
        self.session_id = session_id
        self.persona = persona if persona in PERSONA_SYSTEM_PROMPTS else "general"
        self.system_prompt = PERSONA_SYSTEM_PROMPTS[self.persona]
        self.messages: List[Dict[str, Any]] = [
            {"role": "system", "content": self.system_prompt, "timestamp": time.time()}
        ]
        self.created_at = time.time()
        self.last_active = time.time()

    def add_message(self, role: str, content: str, thinking: Optional[str] = None):
        self.last_active = time.time()
        msg = {
            "role": role,
            "content": content,
            "timestamp": time.time(),
        }
        if thinking:
            msg["thinking"] = thinking
        self.messages.append(msg)

        # Asynchronously store episodic memory in Supabase if configured
        if is_supabase_configured() and role in ("user", "assistant"):
            try:
                store_memory(
                    memory_type=f"chat_{role}",
                    content=content[:2000],
                    metadata={"session_id": self.session_id, "persona": self.persona, "timestamp": msg["timestamp"]}
                )
            except Exception as e:
                logger.debug(f"Non-blocking memory persist notice: {e}")

    def get_context_window(self, max_chars: int = 12000) -> List[Dict[str, Any]]:
        """
        Dynamically prunes history to fit within model context limits,
        always preserving the system prompt and the latest messages.
        """
        if not self.messages:
            return []

        system_msg = self.messages[0]
        remaining_budget = max_chars - len(system_msg.get("content", ""))

        selected = []
        current_chars = 0
        # Traverse backwards from newest messages
        for msg in reversed(self.messages[1:]):
            msg_len = len(msg.get("content", ""))
            if current_chars + msg_len <= remaining_budget:
                selected.append(msg)
                current_chars += msg_len
            else:
                break

        selected.reverse()
        return [system_msg] + selected

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "persona": self.persona,
            "message_count": len(self.messages),
            "created_at": self.created_at,
            "last_active": self.last_active,
            "messages": self.messages,
        }

class SessionManager:
    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self._sessions: Dict[str, ConversationSession] = {}
        self._load_local_sessions()

    def _load_local_sessions(self):
        if os.path.exists(LOCAL_SESSIONS_FILE):
            try:
                with open(LOCAL_SESSIONS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for sid, sdata in data.items():
                        sess = ConversationSession(sid, sdata.get("persona", "general"))
                        sess.messages = sdata.get("messages", sess.messages)
                        sess.created_at = sdata.get("created_at", time.time())
                        sess.last_active = sdata.get("last_active", time.time())
                        self._sessions[sid] = sess
            except Exception as e:
                logger.debug(f"Local session load notice: {e}")

    def _save_local_sessions(self):
        try:
            os.makedirs(DATA_DIR, exist_ok=True)
            export_data = {k: v.to_dict() for k, v in self._sessions.items()}
            with open(LOCAL_SESSIONS_FILE, "w", encoding="utf-8") as f:
                json.dump(export_data, f, ensure_ascii=False)
        except Exception as e:
            logger.warning(f"Could not persist sessions to disk: {e}")

    def get_or_create(self, session_id: Optional[str] = None, persona: str = "general") -> ConversationSession:
        with self._lock:
            now = time.time()
            stale_keys = [k for k, v in self._sessions.items() if now - v.last_active > 86400 * 7]
            for k in stale_keys:
                del self._sessions[k]

            if not session_id:
                session_id = str(uuid.uuid4())

            if session_id not in self._sessions:
                self._sessions[session_id] = ConversationSession(session_id, persona)
                self._save_local_sessions()
            return self._sessions[session_id]

    def get(self, session_id: str) -> Optional[ConversationSession]:
        with self._lock:
            return self._sessions.get(session_id)

    def list_sessions(self) -> List[Dict[str, Any]]:
        with self._lock:
            return [s.to_dict() for s in self._sessions.values()]

session_manager = SessionManager()

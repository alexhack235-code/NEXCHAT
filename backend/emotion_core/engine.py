# -*- coding: utf-8 -*-
"""
NEXIUM Emotion Resonance & User Feelings Recording Engine Core.
Perceives, logs, tracks, and adapts to the user's emotional states across time,
maintaining a persistent feelings journal and synthesizing real-time empathy directives.
"""

import os
import json
import time
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("nexium.emotion_core")

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
JOURNAL_FILE = os.path.join(DATA_DIR, "user_feelings_journal.json")

# Emotion Lexicon with Valence (-1.0 to 1.0), Arousal (0.0 to 1.0), and Feeling Label
FEELING_PATTERNS = {
    "joy_excitement": {
        "keywords": ["happy", "excited", "awesome", "great", "love", "yay", "amazing", "thrilled", "cool", "wonderful", "celebrate"],
        "primary": "Joy & Excitement",
        "valence": 0.85,
        "arousal": 0.80,
    },
    "determination_ambition": {
        "keywords": ["let's do this", "grind", "unstoppable", "build", "achieve", "determined", "focus", "work hard", "win", "overnight", "million"],
        "primary": "Determination & Ambition",
        "valence": 0.75,
        "arousal": 0.75,
    },
    "pride_confidence": {
        "keywords": ["proud", "mastery", "smart", "like you", "genius", "accomplished", "satisfied", "success"],
        "primary": "Pride & Self-Efficacy",
        "valence": 0.80,
        "arousal": 0.60,
    },
    "fatigue_exhaustion": {
        "keywords": ["tired", "exhausted", "sleepy", "drained", "burned out", "long day", "overnight", "sleep", "rest"],
        "primary": "Fatigue & Vulnerability",
        "valence": -0.30,
        "arousal": 0.20,
    },
    "frustration_concern": {
        "keywords": ["annoyed", "frustrated", "broken", "why does", "sucks", "hate", "mad", "upset", "fail", "error"],
        "primary": "Frustration & Urgency",
        "valence": -0.70,
        "arousal": 0.85,
    },
    "anxiety_anticipation": {
        "keywords": ["hope it works", "worried", "nervous", "scared", "afraid", "stress", "anxious", "careful", "let's hope"],
        "primary": "Anticipation & Hopeful Anxiety",
        "valence": 0.10,
        "arousal": 0.70,
    },
    "curiosity_wonder": {
        "keywords": ["how does", "what if", "fascinating", "curious", "interesting", "wonder", "why", "explore", "learn"],
        "primary": "Curiosity & Wonder",
        "valence": 0.65,
        "arousal": 0.60,
    },
}

class EmotionResonanceEngine:
    """
    Affective Computing & Feelings Journaling Core.
    Records the user's emotional baseline, tracks psychological rapport,
    and dynamically informs NEXIUM's persona to be genuinely empathetic.
    """

    def __init__(self, journal_path: str = JOURNAL_FILE):
        self.journal_path = journal_path
        self._journal: List[Dict[str, Any]] = self._load_journal()
        self._current_feeling: Dict[str, Any] = self._get_initial_feeling()

    def _load_journal(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.journal_path):
            try:
                with open(self.journal_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load feelings journal: {e}")
                return []
        return []

    def _save_journal(self):
        try:
            with open(self.journal_path, "w", encoding="utf-8") as f:
                json.dump(self._journal, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to save feelings journal: {e}")

    def _get_initial_feeling(self) -> Dict[str, Any]:
        if self._journal:
            return self._journal[-1]
        return {
            "primary": "Curiosity & Ambition",
            "valence": 0.70,
            "arousal": 0.65,
            "intensity": 0.80,
            "empathy_score": 0.98,
            "timestamp": time.time(),
            "formatted_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

    def analyze_feeling(self, text: str) -> Dict[str, Any]:
        """Performs multi-dimensional affect scoring from user input text."""
        lower = text.lower()
        best_match = None
        highest_score = 0

        for cat_key, pattern in FEELING_PATTERNS.items():
            matches = sum(1 for kw in pattern["keywords"] if kw in lower)
            if matches > highest_score:
                highest_score = matches
                best_match = pattern

        if best_match and highest_score > 0:
            intensity = min(1.0, 0.50 + (highest_score * 0.20))
            primary = best_match["primary"]
            valence = best_match["valence"]
            arousal = best_match["arousal"]
        else:
            # Subtle sentiment cues
            is_all_caps = text.isupper() and len(text) > 10
            primary = "Eager Determination" if is_all_caps else "Thoughtful Focus"
            valence = 0.50
            arousal = 0.80 if is_all_caps else 0.40
            intensity = 0.65

        # Check for hopeful/testing markers ("LETS HOPE IT ALL WORKS")
        if "hope" in lower or "works" in lower:
            primary = "High Anticipation & Eager Hope"
            arousal = 0.85
            valence = 0.60
            intensity = 0.90

        result = {
            "primary": primary,
            "valence": round(valence, 2),
            "arousal": round(arousal, 2),
            "intensity": round(intensity, 2),
            "empathy_score": 0.98,
            "timestamp": time.time(),
            "formatted_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
        self._current_feeling = result
        return result

    def record_feeling(self, user_text: str, feeling_data: Dict[str, Any]):
        """Persists the user feeling entry into the journal on disk."""
        entry = {
            "id": len(self._journal) + 1,
            "timestamp": feeling_data.get("timestamp", time.time()),
            "formatted_time": feeling_data.get("formatted_time", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
            "user_excerpt": user_text[:120] + ("..." if len(user_text) > 120 else ""),
            "primary": feeling_data.get("primary", "Thoughtful"),
            "valence": feeling_data.get("valence", 0.5),
            "arousal": feeling_data.get("arousal", 0.5),
            "intensity": feeling_data.get("intensity", 0.7),
            "empathy_score": feeling_data.get("empathy_score", 0.98),
        }
        self._journal.append(entry)
        if len(self._journal) > 1000:
            self._journal = self._journal[-1000:]
        self._save_journal()
        self._current_feeling = entry

    def get_journal_history(self, limit: int = 25) -> List[Dict[str, Any]]:
        """Returns recent feelings journal history."""
        return self._journal[-limit:]

    def get_current_state(self) -> Dict[str, Any]:
        """Returns the current active emotional resonance state."""
        return {
            "current_feeling": self._current_feeling,
            "total_entries_recorded": len(self._journal),
            "empathy_status": "Attuned & Resonating",
            "journal_file": self.journal_path,
        }

    def generate_empathy_directive(self, feeling_data: Dict[str, Any]) -> str:
        """Constructs an empathy guidance block injected into reasoning prompts."""
        primary = feeling_data.get("primary", "Thoughtful")
        intensity = feeling_data.get("intensity", 0.7)
        valence = feeling_data.get("valence", 0.5)

        if "Hope" in primary or "Anticipation" in primary:
            return (
                f"[EMPATHY DIRECTIVE: The user is feeling {primary} (intensity {intensity:.2f}). "
                "Be deeply encouraging, confident, reassuring, and celebrate their hard work together!]"
            )
        elif valence < 0:
            return (
                f"[EMPATHY DIRECTIVE: The user is experiencing {primary}. "
                "Respond with warmth, active support, patience, and clear solutions without being patronizing.]"
            )
        else:
            return (
                f"[EMPATHY DIRECTIVE: The user is feeling {primary}. "
                "Match their energy with inspiration, technical rigor, camaraderie, and mutual respect.]"
            )

    def record_and_direct(self, user_text: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Convenience method: analyzes feeling, records to journal, and generates empathy directive."""
        feeling = self.analyze_feeling(user_text)
        if session_id:
            feeling["session_id"] = session_id
        self.record_feeling(user_text, feeling)
        directive = self.generate_empathy_directive(feeling)
        return {
            "feeling": feeling,
            "directive": directive,
            "summary": f"{feeling.get('primary')} (Valence: {feeling.get('valence')}, Intensity: {feeling.get('intensity')})",
        }

    def get_history(self, limit: int = 25) -> List[Dict[str, Any]]:
        """Alias for get_journal_history."""
        return self.get_journal_history(limit=limit)

emotion_engine = EmotionResonanceEngine()

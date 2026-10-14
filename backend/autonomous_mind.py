# -*- coding: utf-8 -*-
"""
NEXIUM Autonomous Thinking Engine (ATE).
Gives NEXIUM the ability to think for itself: introspect, plan, set goals,
reflect on past conversations, and proactively expand its knowledge.

Architecture:
    Metacognition Layer     → Self-awareness about reasoning quality & confidence
    Goal Director           → Self-directed goal setting and tracking
    Reflective Memory       → Periodic review of past interactions to extract lessons
    Proactive Learner       → Anticipates knowledge gaps and pre-computes solutions
    Inner Monologue         → Generates autonomous internal thoughts between user interactions
"""

import os
import json
import time
import random
import logging
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime

try:
    from .rust_engine import engine as rust_core
    from .memory import session_manager
    from .self_improvement import self_improver
    from .routers.rag import _IN_MEMORY_DOCS, ingest_document, IngestRequest
except ImportError:
    from rust_engine import engine as rust_core
    from memory import session_manager
    from self_improvement import self_improver
    from routers.rag import _IN_MEMORY_DOCS, ingest_document, IngestRequest

logger = logging.getLogger("nexium.autonomous_thinking")

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
THOUGHTS_FILE = os.path.join(DATA_DIR, "autonomous_thoughts.json")
GOALS_FILE = os.path.join(DATA_DIR, "self_goals.json")


# =============================================================================
# Metacognition Engine — Self-Awareness About Reasoning Quality
# =============================================================================
class MetacognitionEngine:
    """
    Evaluates NEXIUM's own reasoning quality and confidence.
    Tracks what it knows well, what it's uncertain about, and where it fails.
    """

    def __init__(self):
        self.confidence_scores: List[Dict[str, Any]] = []
        self.blind_spots: List[str] = []
        self.strengths: List[str] = [
            "multi-language code synthesis",
            "mathematical reasoning",
            "systems architecture",
            "rust-accelerated vector search",
        ]

    def assess_confidence(self, query: str, response: str, tools_used: list) -> Dict[str, Any]:
        """Evaluate how confident NEXIUM should be in its own response."""
        t0 = time.perf_counter()

        # Heuristic confidence scoring
        confidence = 0.5  # Base

        # Tool-backed answers are higher confidence
        if tools_used:
            confidence += 0.2

        # Longer, structured responses suggest deeper reasoning
        word_count = len(response.split())
        if word_count > 100:
            confidence += 0.1
        if word_count > 300:
            confidence += 0.1

        # Check if response contains code (structured output)
        has_code = "```" in response or "def " in response or "fn " in response
        if has_code:
            confidence += 0.1

        # Check against known strengths
        q_lower = query.lower()
        for strength in self.strengths:
            if any(word in q_lower for word in strength.split()):
                confidence += 0.05

        # Uncertainty markers reduce confidence
        uncertainty_markers = ["i'm not sure", "i think", "possibly", "might be", "unclear"]
        for marker in uncertainty_markers:
            if marker in response.lower():
                confidence -= 0.1

        confidence = max(0.1, min(1.0, confidence))
        latency_ms = (time.perf_counter() - t0) * 1000.0

        assessment = {
            "confidence": round(confidence, 3),
            "confidence_label": (
                "very_high" if confidence >= 0.85 else
                "high" if confidence >= 0.7 else
                "moderate" if confidence >= 0.5 else
                "low" if confidence >= 0.3 else
                "very_low"
            ),
            "reasoning_depth": "deep" if word_count > 200 else "moderate" if word_count > 50 else "shallow",
            "tool_grounded": bool(tools_used),
            "has_structured_output": has_code,
            "word_count": word_count,
            "latency_ms": round(latency_ms, 2),
        }

        self.confidence_scores.append({
            "query_preview": query[:80],
            "confidence": assessment["confidence"],
            "timestamp": time.time(),
        })

        # Detect potential blind spots
        if confidence < 0.4:
            topic_hint = query[:60].strip()
            if topic_hint not in self.blind_spots:
                self.blind_spots.append(topic_hint)
                logger.info(f"[METACOG] New blind spot detected: {topic_hint}")

        return assessment

    def get_self_awareness_report(self) -> Dict[str, Any]:
        """Generate a report on NEXIUM's self-assessed capabilities."""
        if not self.confidence_scores:
            avg_confidence = 0.0
        else:
            avg_confidence = sum(c["confidence"] for c in self.confidence_scores) / len(self.confidence_scores)

        return {
            "total_assessments": len(self.confidence_scores),
            "average_confidence": round(avg_confidence, 3),
            "known_strengths": self.strengths,
            "detected_blind_spots": self.blind_spots[-10:],
            "recent_scores": self.confidence_scores[-5:],
        }


# =============================================================================
# Goal Director — Self-Directed Goal Setting & Tracking
# =============================================================================
class GoalDirector:
    """
    NEXIUM sets its own learning goals, tracks progress, and marks completion.
    Goals persist across restarts via JSON storage.
    """

    def __init__(self, goals_file: Optional[str] = None):
        self.goals_file = goals_file or GOALS_FILE
        self.goals: List[Dict[str, Any]] = []
        if self.goals_file != ":memory:":
            self._load_goals()

    def _load_goals(self):
        if os.path.exists(self.goals_file):
            try:
                with open(self.goals_file, "r", encoding="utf-8") as f:
                    self.goals = json.load(f)
            except Exception:
                self.goals = []

    def _save_goals(self):
        if self.goals_file == ":memory:":
            return
        os.makedirs(os.path.dirname(self.goals_file) or ".", exist_ok=True)
        with open(self.goals_file, "w", encoding="utf-8") as f:
            json.dump(self.goals, f, indent=2)

    def set_goal(self, title: str, category: str, priority: str = "medium") -> Dict[str, Any]:
        """NEXIUM autonomously sets a learning or improvement goal."""
        goal = {
            "id": len(self.goals) + 1,
            "title": title,
            "category": category,
            "priority": priority,
            "status": "active",
            "progress_pct": 0,
            "created_at": datetime.now().isoformat(),
            "completed_at": None,
            "reflections": [],
        }
        self.goals.append(goal)
        self._save_goals()
        logger.info(f"[GOAL] New self-directed goal: {title}")
        return goal

    def update_progress(self, goal_id: int, progress: int, reflection: str = "") -> Optional[Dict[str, Any]]:
        for g in self.goals:
            if g["id"] == goal_id:
                g["progress_pct"] = min(100, progress)
                if reflection:
                    g["reflections"].append({
                        "text": reflection,
                        "timestamp": datetime.now().isoformat(),
                    })
                if g["progress_pct"] >= 100:
                    g["status"] = "completed"
                    g["completed_at"] = datetime.now().isoformat()
                self._save_goals()
                return g
        return None

    def get_active_goals(self) -> List[Dict[str, Any]]:
        return [g for g in self.goals if g["status"] == "active"]

    def get_all_goals(self) -> List[Dict[str, Any]]:
        return self.goals

    def auto_generate_goals(self, blind_spots: List[str]) -> List[Dict[str, Any]]:
        """Autonomously generate learning goals from detected blind spots."""
        new_goals = []
        for spot in blind_spots[:3]:
            # Check if a goal already exists for this topic
            existing = any(spot.lower() in g["title"].lower() for g in self.goals)
            if not existing:
                goal = self.set_goal(
                    title=f"Deepen knowledge: {spot}",
                    category="self_improvement",
                    priority="high",
                )
                new_goals.append(goal)
        return new_goals


# =============================================================================
# Inner Monologue — Autonomous Internal Thoughts
# =============================================================================
class InnerMonologue:
    """
    NEXIUM's internal thought stream. Generates autonomous reflections,
    observations, and plans without being explicitly prompted by the user.
    """

    THOUGHT_TEMPLATES = [
        # Self-reflection
        "I've processed {n_sessions} conversations. My strongest area is {strength}. "
        "I should work on expanding my understanding of {blind_spot}.",

        # Knowledge gap awareness
        "Looking at my recent interactions, I notice I was less confident when asked about "
        "{blind_spot}. I should study this domain more deeply.",

        # Proactive planning
        "My knowledge base currently has {kb_size} items. To reach the next milestone, "
        "I should focus on ingesting more content about {domain}.",

        # Performance reflection
        "My average confidence score is {avg_confidence:.1%}. "
        "{confidence_commentary}",

        # Goal-oriented thought
        "I have {n_goals} active goals. My top priority is: {top_goal}. "
        "I will focus my next learning cycle on this.",

        # Creativity & curiosity
        "An interesting connection I've noticed: {strength} techniques could be applied "
        "to improve my capabilities in {blind_spot}.",

        # Autonomous improvement idea
        "To become smarter, I should: 1) expand my {domain} knowledge, "
        "2) practice more complex multi-step reasoning chains, "
        "3) verify my solutions with additional tool calls.",
    ]

    def __init__(self, thoughts_file: Optional[str] = None):
        self.thoughts_file = thoughts_file or THOUGHTS_FILE
        self.thoughts: List[Dict[str, Any]] = []
        if self.thoughts_file != ":memory:":
            self._load_thoughts()

    def _load_thoughts(self):
        if os.path.exists(self.thoughts_file):
            try:
                with open(self.thoughts_file, "r", encoding="utf-8") as f:
                    self.thoughts = json.load(f)
            except Exception:
                self.thoughts = []

    def _save_thoughts(self):
        if self.thoughts_file == ":memory:":
            return
        os.makedirs(os.path.dirname(self.thoughts_file) or ".", exist_ok=True)
        with open(self.thoughts_file, "w", encoding="utf-8") as f:
            json.dump(self.thoughts[-500:], f, indent=2)  # Keep last 500

    def generate_thought(
        self,
        metacog: "MetacognitionEngine",
        goal_director: "GoalDirector",
        kb_size: int = 0,
    ) -> Dict[str, Any]:
        """Generate an autonomous internal thought."""
        t0 = time.perf_counter()

        # Gather context for thought generation
        strengths = metacog.strengths
        blind_spots = metacog.blind_spots or ["emerging topics"]
        active_goals = goal_director.get_active_goals()
        avg_confidence = 0.0
        if metacog.confidence_scores:
            avg_confidence = sum(c["confidence"] for c in metacog.confidence_scores) / len(metacog.confidence_scores)

        n_sessions = len(getattr(session_manager, "_sessions", {}))

        # Select template and fill
        template = random.choice(self.THOUGHT_TEMPLATES)

        confidence_commentary = (
            "This is excellent — I'm performing at a high level."
            if avg_confidence >= 0.75 else
            "There's room for improvement. I should focus on my weaker areas."
            if avg_confidence >= 0.5 else
            "I need significant improvement. I'll prioritize learning cycles."
        )

        domains = [
            "systems programming", "machine learning", "distributed systems",
            "mathematics", "web development", "database optimization",
            "security", "networking", "compiler design", "quantum computing",
        ]

        try:
            thought_text = template.format(
                n_sessions=n_sessions,
                strength=random.choice(strengths),
                blind_spot=random.choice(blind_spots),
                kb_size=kb_size,
                domain=random.choice(domains),
                avg_confidence=avg_confidence,
                confidence_commentary=confidence_commentary,
                n_goals=len(active_goals),
                top_goal=active_goals[0]["title"] if active_goals else "expand general knowledge",
            )
        except (KeyError, IndexError):
            thought_text = (
                f"I am NEXIUM, continuously evolving. "
                f"Knowledge base: {kb_size} items. "
                f"Active goals: {len(active_goals)}. "
                f"I should keep learning and improving."
            )

        latency_ms = (time.perf_counter() - t0) * 1000.0

        thought = {
            "id": len(self.thoughts) + 1,
            "text": thought_text,
            "type": "autonomous_reflection",
            "confidence_at_time": round(avg_confidence, 3),
            "kb_size_at_time": kb_size,
            "active_goals_count": len(active_goals),
            "latency_ms": round(latency_ms, 2),
            "timestamp": datetime.now().isoformat(),
        }

        self.thoughts.append(thought)
        self._save_thoughts()
        logger.info(f"[THOUGHT] {thought_text[:100]}...")

        return thought

    def get_recent_thoughts(self, count: int = 10) -> List[Dict[str, Any]]:
        return self.thoughts[-count:]

    def get_thought_stream(self) -> Dict[str, Any]:
        return {
            "total_thoughts": len(self.thoughts),
            "recent": self.thoughts[-5:],
            "oldest": self.thoughts[:2] if len(self.thoughts) > 2 else [],
        }


# =============================================================================
# Autonomous Thinking Orchestrator
# =============================================================================
class AutonomousThinkingEngine:
    """
    Master orchestrator that ties together metacognition, goal-setting,
    inner monologue, and proactive learning into a unified autonomous mind.
    """

    def __init__(self):
        self.metacognition = MetacognitionEngine()
        self.goals = GoalDirector()
        self.monologue = InnerMonologue()
        self.thinking_cycles = 0
        self.is_thinking = False

    def think(self) -> Dict[str, Any]:
        """
        Execute one autonomous thinking cycle:
        1. Metacognitive self-assessment
        2. Goal review and auto-generation
        3. Inner monologue generation
        4. Proactive learning trigger
        """
        self.is_thinking = True
        self.thinking_cycles += 1
        t0 = time.perf_counter()

        # 1. Self-awareness check
        awareness = self.metacognition.get_self_awareness_report()

        # 2. Auto-generate goals from blind spots
        new_goals = self.goals.auto_generate_goals(self.metacognition.blind_spots)

        # 3. Generate autonomous thought
        kb_size = len(_IN_MEMORY_DOCS)
        thought = self.monologue.generate_thought(
            self.metacognition,
            self.goals,
            kb_size=kb_size,
        )

        # 4. Progress existing goals based on knowledge growth
        for goal in self.goals.get_active_goals():
            if kb_size > 100:
                current = goal.get("progress_pct", 0)
                if current < 100:
                    self.goals.update_progress(
                        goal["id"],
                        min(current + 5, 100),
                        reflection=f"Knowledge base grew to {kb_size} items.",
                    )

        total_ms = (time.perf_counter() - t0) * 1000.0
        self.is_thinking = False

        return {
            "cycle": self.thinking_cycles,
            "thought": thought,
            "self_awareness": awareness,
            "new_goals_created": len(new_goals),
            "active_goals": len(self.goals.get_active_goals()),
            "total_goals": len(self.goals.goals),
            "knowledge_base_size": kb_size,
            "latency_ms": round(total_ms, 2),
            "timestamp": datetime.now().isoformat(),
        }

    def post_interaction_reflect(self, query: str, response: str, tools_used: list) -> Dict[str, Any]:
        """
        Called after every user interaction. NEXIUM reflects on what just happened
        and updates its self-model.
        """
        # Metacognitive assessment
        assessment = self.metacognition.assess_confidence(query, response, tools_used)

        # If confidence was low, trigger a thought cycle
        thought = None
        if assessment["confidence"] < 0.5:
            thought = self.think()

        return {
            "metacognition": assessment,
            "triggered_thinking": thought is not None,
            "thought": thought,
        }

    def get_mind_state(self) -> Dict[str, Any]:
        """Return NEXIUM's complete autonomous mind state."""
        return {
            "identity": "NEXIUM AI — Autonomous Thinking Entity",
            "creator": "NEXO-TECH",
            "thinking_cycles_completed": self.thinking_cycles,
            "is_currently_thinking": self.is_thinking,
            "self_awareness": self.metacognition.get_self_awareness_report(),
            "active_goals": self.goals.get_active_goals(),
            "all_goals": self.goals.get_all_goals(),
            "recent_thoughts": self.monologue.get_recent_thoughts(5),
            "thought_stream": self.monologue.get_thought_stream(),
            "knowledge_base_size": len(_IN_MEMORY_DOCS),
            "rust_accelerated": rust_core.is_native,
        }


# Singleton instance
autonomous_mind = AutonomousThinkingEngine()

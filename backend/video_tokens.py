# -*- coding: utf-8 -*-
"""
NEXIUM VideoFactory Token and Free Limit System.

Rules:
- Free tier: 2 videos per user per day. Resets at 00:00 Africa/Lagos (WAT).
- Elite tier: Token based (35 tokens per video).
  - Script generation: 5 tokens
  - Voice generation: 10 tokens
  - Video render: 20 tokens
  - Total: 35 tokens per video
- Token Packs:
  - Starter: 5 USD = 100 tokens (~2 videos)
  - Pro: 20 USD = 500 tokens (~14 videos) - Faster render
  - Agency: 50 USD = 1500 tokens (~42 videos) - Includes API access
"""

import os
import json
import time
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional, List
from zoneinfo import ZoneInfo

logger = logging.getLogger("nexium.video_tokens")

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(ROOT_DIR, "data", "videofactory_users.json")
LAGOS_TZ = ZoneInfo("Africa/Lagos")

COST_PER_VIDEO = {
    "script_generation": 5,
    "voice_generation": 10,
    "video_render": 20,
    "total": 35
}

TOKEN_PACKS = {
    "starter": {
        "key": "starter",
        "name": "Starter",
        "price_usd": 5,
        "tokens": 100,
        "approx_videos": 2,
        "description": "Starter - 5 USD = 100 tokens (2 videos)",
        "pay_command": "BUY 5"
    },
    "pro": {
        "key": "pro",
        "name": "Pro",
        "price_usd": 20,
        "tokens": 500,
        "approx_videos": 14,
        "description": "Pro - 20 USD = 500 tokens (14 videos) - Faster render",
        "pay_command": "BUY 20"
    },
    "agency": {
        "key": "agency",
        "name": "Agency",
        "price_usd": 50,
        "tokens": 1500,
        "approx_videos": 42,
        "description": "Agency - 50 USD = 1500 tokens (42 videos) - Includes API access",
        "pay_command": "BUY 50"
    }
}

UPGRADE_MENU_TEXT = """ELITE PLANS - Token System:
Starter - 5 USD = 100 tokens (2 videos)
Pro - 20 USD = 500 tokens (14 videos) - Faster render
Agency - 50 USD = 1500 tokens (42 videos) - Includes API access
Reply BUY 5, BUY 20, or BUY 50 to pay via Paystack"""

class VideoTokenManager:
    def __init__(self, data_file: str = USERS_FILE):
        self.data_file = data_file
        self.users: Dict[str, Dict[str, Any]] = {}
        self._load_users()

    def get_wat_now(self) -> datetime:
        """Returns current timestamp in Africa/Lagos (WAT, UTC+1)."""
        return datetime.now(LAGOS_TZ)

    def get_wat_date_str(self) -> str:
        """Returns current YYYY-MM-DD in Africa/Lagos timezone."""
        return self.get_wat_now().strftime("%Y-%m-%d")

    def _load_users(self):
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, "r", encoding="utf-8") as f:
                    self.users = json.load(f)
            except Exception as e:
                logger.warning(f"[VideoTokenManager] Failed to load users file: {e}")
                self.users = {}
        else:
            self.users = {}

    def _save_users(self):
        try:
            os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
            with open(self.data_file, "w", encoding="utf-8") as f:
                json.dump(self.users, f, indent=2)
        except Exception as e:
            logger.error(f"[VideoTokenManager] Failed to save users file: {e}")

    def get_or_create_user(self, user_id: str = "default_user") -> Dict[str, Any]:
        """Gets user record, creating default free user if new."""
        current_wat_date = self.get_wat_date_str()
        if user_id not in self.users:
            self.users[user_id] = {
                "user_id": user_id,
                "tier": "free",
                "tokens": 0,
                "videos_today": 0,
                "last_reset_date": current_wat_date,
                "total_videos_created": 0,
                "created_at": time.time(),
                "transactions": []
            }
            self._save_users()
        else:
            # Check for daily WAT midnight reset on read
            user = self.users[user_id]
            if user.get("last_reset_date") != current_wat_date:
                user["videos_today"] = 0
                user["last_reset_date"] = current_wat_date
                self._save_users()

        return self.users[user_id]

    def reset_all_free_users_daily(self) -> int:
        """
        Daily reset:
        UPDATE users SET videos_today = 0 WHERE tier = 'free'
        Executed at midnight Africa/Lagos (WAT).
        """
        current_wat_date = self.get_wat_date_str()
        count = 0
        for uid, user in self.users.items():
            if user.get("tier") == "free":
                user["videos_today"] = 0
                user["last_reset_date"] = current_wat_date
                count += 1
        self._save_users()
        logger.info(f"[VideoTokenManager] Midnight WAT daily reset executed. Reset {count} free tier accounts.")
        return count

    def check_can_generate(self, user_id: str = "default_user") -> Tuple[bool, str, Dict[str, Any]]:
        """
        Evaluates user tier and limits:
        If user.tier == free:
            If user.videos_today >= 2:
                Reply: "You have used your 2 free videos for today. Upgrade to Elite to continue. Type UPGRADE to see plans."
                Stop execution
            Else:
                Generate video
        If user.tier == elite:
            If user.tokens < 35:
                Reply: "You are out of tokens. You have {tokens} left, you need 35 per video. Type BUY TOKENS to refill."
                Stop execution
            Else:
                Generate video
        """
        user = self.get_or_create_user(user_id)
        tier = user.get("tier", "free")
        videos_today = user.get("videos_today", 0)
        tokens = user.get("tokens", 0)

        if tier == "free":
            if videos_today >= 2:
                msg = "You have used your 2 free videos for today. Upgrade to Elite to continue. Type UPGRADE to see plans."
                return False, msg, user
            return True, "Authorized (Free Tier: 1 video allocation remaining today)", user

        elif tier == "elite":
            if tokens < 35:
                msg = f"You are out of tokens. You have {tokens} left, you need 35 per video. Type BUY TOKENS to refill."
                return False, msg, user
            return True, f"Authorized (Elite Tier: {tokens} tokens available)", user

        return True, "Authorized", user

    def deduct_for_video(self, user_id: str = "default_user") -> Tuple[bool, str, Dict[str, Any]]:
        """
        Executes quota consumption post-video synthesis:
        Free tier: increment videos_today by 1
        Elite tier: deduct 35 tokens, reply with remaining tokens and approx videos left.
        """
        user = self.get_or_create_user(user_id)
        tier = user.get("tier", "free")

        if tier == "free":
            user["videos_today"] = user.get("videos_today", 0) + 1
            user["total_videos_created"] = user.get("total_videos_created", 0) + 1
            self._save_users()
            used = user["videos_today"]
            reply = f"Video completed. Free videos used today: {used}/2 (Resets at 00:00 Africa/Lagos)."
            return True, reply, user

        elif tier == "elite":
            user["tokens"] = max(0, user.get("tokens", 0) - 35)
            user["total_videos_created"] = user.get("total_videos_created", 0) + 1
            self._save_users()
            tokens_left = user["tokens"]
            videos_left = tokens_left // 35
            reply = f"Video completed. Remaining balance: {tokens_left} tokens, approximately {videos_left} videos left."
            return True, reply, user

        return True, "Video completed.", user

    def purchase_pack(self, user_id: str, pack_identifier: str, paystack_ref: Optional[str] = None) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Processes token pack purchase:
        BUY 5 -> Starter ($5 = 100 tokens)
        BUY 20 -> Pro ($20 = 500 tokens)
        BUY 50 -> Agency ($50 = 1500 tokens)
        """
        user = self.get_or_create_user(user_id)
        clean_id = pack_identifier.upper().strip()

        pack = None
        if "50" in clean_id or "AGENCY" in clean_id:
            pack = TOKEN_PACKS["agency"]
        elif "20" in clean_id or "PRO" in clean_id:
            pack = TOKEN_PACKS["pro"]
        elif "5" in clean_id or "STARTER" in clean_id:
            pack = TOKEN_PACKS["starter"]

        if not pack:
            return False, f"Invalid token pack. Available packs:\n{UPGRADE_MENU_TEXT}", user

        # Upgrade user to elite and add tokens
        user["tier"] = "elite"
        user["tokens"] = user.get("tokens", 0) + pack["tokens"]
        tx = {
            "pack": pack["key"],
            "amount_usd": pack["price_usd"],
            "tokens_added": pack["tokens"],
            "timestamp": time.time(),
            "paystack_ref": paystack_ref or f"pstk_{uuid_hex()[:10]}"
        }
        user.setdefault("transactions", []).append(tx)
        self._save_users()

        approx_videos = user["tokens"] // 35
        msg = (
            f"Successfully activated {pack['name']} Pack (+{pack['tokens']} tokens).\n"
            f"Current Balance: {user['tokens']} tokens (Approximately {approx_videos} videos).\n"
            f"Tier: ELITE (Paystack Ref: {tx['paystack_ref']})"
        )
        return True, msg, user

    def get_user_status(self, user_id: str = "default_user") -> Dict[str, Any]:
        """Returns complete user quota, tier, and reset countdown."""
        user = self.get_or_create_user(user_id)
        now_wat = self.get_wat_now()
        
        # Calculate time until midnight WAT
        tomorrow_wat = (now_wat + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        secs_until_reset = max(0, int((tomorrow_wat - now_wat).total_seconds()))
        h, rem = divmod(secs_until_reset, 3600)
        m, s = divmod(rem, 60)
        countdown_str = f"{h:02d}h {m:02d}m {s:02d}s"

        return {
            "user_id": user_id,
            "tier": user.get("tier", "free"),
            "tokens": user.get("tokens", 0),
            "videos_today": user.get("videos_today", 0),
            "videos_today_limit": 2 if user.get("tier") == "free" else "Unlimited (Token Billed)",
            "approx_videos_left": user.get("tokens", 0) // 35 if user.get("tier") == "elite" else max(0, 2 - user.get("videos_today", 0)),
            "cost_per_video": COST_PER_VIDEO["total"],
            "cost_breakdown": COST_PER_VIDEO,
            "wat_current_time": now_wat.strftime("%Y-%m-%d %H:%M:%S WAT"),
            "reset_countdown_wat": countdown_str,
            "total_videos_created": user.get("total_videos_created", 0),
            "packs": TOKEN_PACKS
        }

def uuid_hex():
    import uuid
    return uuid.uuid4().hex

token_manager = VideoTokenManager()

# Background Midnight WAT Cron Task
async def midnight_wat_cron_worker():
    """
    Cron loop firing at midnight Africa/Lagos (00:00 WAT):
    UPDATE users SET videos_today = 0 WHERE tier = 'free'
    """
    logger.info("[VideoTokenManager] Midnight WAT Cron Worker initialized.")
    while True:
        try:
            now_wat = token_manager.get_wat_now()
            # Calculate sleep duration until next midnight WAT
            next_midnight = (now_wat + timedelta(days=1)).replace(hour=0, minute=0, second=5, microsecond=0)
            sleep_secs = max(5.0, (next_midnight - now_wat).total_seconds())
            logger.info(f"[VideoTokenManager] Next WAT midnight reset scheduled in {round(sleep_secs/3600, 2)} hours ({next_midnight.strftime('%Y-%m-%d %H:%M:%S WAT')})")
            await asyncio.sleep(sleep_secs)
            
            # Fire daily reset
            token_manager.reset_all_free_users_daily()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"[VideoTokenManager] Cron worker error: {e}")
            await asyncio.sleep(60)

# -*- coding: utf-8 -*-
"""
Verification suite for VideoFactory Token and Free Limit System.
Tests:
1. Free tier limit (2 videos per user per day).
2. Exact prompt reply on free limit exceeded.
3. Upgrade menu text matching.
4. Token pack purchase (BUY 5, BUY 20, BUY 50).
5. Elite tier 35 tokens per video deduction.
6. Exact prompt reply on elite completion (balance & approx videos left).
7. Out of tokens handling (< 35 tokens).
8. Daily midnight Africa/Lagos (WAT) reset.
"""

import sys
import os
import json

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from video_tokens import (
    VideoTokenManager,
    UPGRADE_MENU_TEXT,
    TOKEN_PACKS,
    COST_PER_VIDEO
)

def run_tests():
    print("==================================================")
    print("STARTING VIDEOFACTORY TOKEN & FREE LIMIT TESTS")
    print("==================================================")

    # Use a temporary test database file
    test_db = os.path.join(os.path.dirname(__file__), "backend", "data", "test_vf_users.json")
    if os.path.exists(test_db):
        try: os.remove(test_db)
        except Exception: pass

    mgr = VideoTokenManager(data_file=test_db)

    # TEST 1: New user starts in Free Tier with 0 videos used
    u1 = mgr.get_or_create_user("user_free_test")
    assert u1["tier"] == "free", f"Expected free tier, got {u1['tier']}"
    assert u1["videos_today"] == 0, f"Expected 0 videos today, got {u1['videos_today']}"
    assert u1["tokens"] == 0, f"Expected 0 tokens, got {u1['tokens']}"
    print("[PASS] Test 1: Initial free user state verified.")

    # TEST 2: Check authorization for video 1 and 2
    can_gen, reason, _ = mgr.check_can_generate("user_free_test")
    assert can_gen is True, "User should be authorized for video 1"
    mgr.deduct_for_video("user_free_test")
    
    can_gen, reason, _ = mgr.check_can_generate("user_free_test")
    assert can_gen is True, "User should be authorized for video 2"
    mgr.deduct_for_video("user_free_test")

    u1_after2 = mgr.get_or_create_user("user_free_test")
    assert u1_after2["videos_today"] == 2, f"Expected 2 videos today, got {u1_after2['videos_today']}"
    print("[PASS] Test 2: Free user generated 2 videos successfully.")

    # TEST 3: Attempt video 3 (Should be BLOCKED with exact required reply)
    can_gen, reason, _ = mgr.check_can_generate("user_free_test")
    assert can_gen is False, "User should be BLOCKED on 3rd video"
    expected_free_blocked = "You have used your 2 free videos for today. Upgrade to Elite to continue. Type UPGRADE to see plans."
    assert reason == expected_free_blocked, f"Blocked reply mismatch!\nGot: {reason}\nExpected: {expected_free_blocked}"
    print("[PASS] Test 3: Free user blocked on 3rd video with exact prompt string.")

    # TEST 4: Verify Upgrade Menu Text matches specification exactly
    expected_menu = """ELITE PLANS - Token System:
Starter - 5 USD = 100 tokens (2 videos)
Pro - 20 USD = 500 tokens (14 videos) - Faster render
Agency - 50 USD = 1500 tokens (42 videos) - Includes API access
Reply BUY 5, BUY 20, or BUY 50 to pay via Paystack"""
    assert UPGRADE_MENU_TEXT.strip() == expected_menu.strip(), f"Menu text mismatch!\nGot:\n{UPGRADE_MENU_TEXT}\nExpected:\n{expected_menu}"
    print("[PASS] Test 4: Upgrade menu text matches exact specification.")

    # TEST 5: Purchase Starter Pack (BUY 5)
    ok, msg, elite_u = mgr.purchase_pack("user_free_test", "BUY 5")
    assert ok is True
    assert elite_u["tier"] == "elite", f"Expected elite tier, got {elite_u['tier']}"
    assert elite_u["tokens"] == 100, f"Expected 100 tokens, got {elite_u['tokens']}"
    print(f"[PASS] Test 5: Activated Starter Pack (+100 tokens). Balance: {elite_u['tokens']}")

    # TEST 6: Elite Tier Video 1 (100 tokens -> deduct 35 = 65 tokens, ~1 video left)
    can_gen, _, _ = mgr.check_can_generate("user_free_test")
    assert can_gen is True
    deducted, reply, elite_u1 = mgr.deduct_for_video("user_free_test")
    assert deducted is True
    assert elite_u1["tokens"] == 65, f"Expected 65 tokens, got {elite_u1['tokens']}"
    expected_reply_1 = "Video completed. Remaining balance: 65 tokens, approximately 1 videos left."
    assert reply == expected_reply_1, f"Reply mismatch!\nGot: {reply}\nExpected: {expected_reply_1}"
    print(f"[PASS] Test 6: Elite Video 1 deducted 35 tokens. Exact reply: '{reply}'")

    # TEST 7: Elite Tier Video 2 (65 tokens -> deduct 35 = 30 tokens, ~0 videos left)
    can_gen, _, _ = mgr.check_can_generate("user_free_test")
    assert can_gen is True
    deducted, reply, elite_u2 = mgr.deduct_for_video("user_free_test")
    assert elite_u2["tokens"] == 30, f"Expected 30 tokens, got {elite_u2['tokens']}"
    expected_reply_2 = "Video completed. Remaining balance: 30 tokens, approximately 0 videos left."
    assert reply == expected_reply_2, f"Reply mismatch!\nGot: {reply}\nExpected: {expected_reply_2}"
    print(f"[PASS] Test 7: Elite Video 2 deducted 35 tokens. Exact reply: '{reply}'")

    # TEST 8: Elite Tier out of tokens (< 35 tokens, user has 30 left)
    can_gen, reason, _ = mgr.check_can_generate("user_free_test")
    assert can_gen is False
    expected_out_of_tokens = "You are out of tokens. You have 30 left, you need 35 per video. Type BUY TOKENS to refill."
    assert reason == expected_out_of_tokens, f"Out of tokens mismatch!\nGot: {reason}\nExpected: {expected_out_of_tokens}"
    print(f"[PASS] Test 8: Elite blocked with exact string: '{reason}'")

    # TEST 9: Refill with Pro Pack (BUY 20 = 500 tokens -> 30 + 500 = 530 tokens)
    ok, msg, elite_u3 = mgr.purchase_pack("user_free_test", "BUY 20")
    assert ok is True
    assert elite_u3["tokens"] == 530, f"Expected 530 tokens, got {elite_u3['tokens']}"
    print(f"[PASS] Test 9: Refilled Pro Pack (+500 tokens). Balance: {elite_u3['tokens']} (~{530//35} videos)")

    # TEST 10: Refill with Agency Pack (BUY 50 = 1500 tokens -> 530 + 1500 = 2030 tokens)
    ok, msg, elite_u4 = mgr.purchase_pack("user_free_test", "BUY 50")
    assert ok is True
    assert elite_u4["tokens"] == 2030, f"Expected 2030 tokens, got {elite_u4['tokens']}"
    print(f"[PASS] Test 10: Refilled Agency Pack (+1500 tokens). Balance: {elite_u4['tokens']} (~{2030//35} videos)")

    # TEST 11: Daily Midnight WAT Reset for Free Tier Users
    mgr.get_or_create_user("user_free_2")
    mgr.deduct_for_video("user_free_2")
    mgr.deduct_for_video("user_free_2")
    assert mgr.get_or_create_user("user_free_2")["videos_today"] == 2

    # Execute daily reset
    reset_count = mgr.reset_all_free_users_daily()
    assert reset_count >= 1
    assert mgr.get_or_create_user("user_free_2")["videos_today"] == 0, "Free user videos_today must be 0 after reset"
    # Elite tokens should remain untouched
    assert mgr.get_or_create_user("user_free_test")["tokens"] == 2030, "Elite tokens should not be reset by free reset"
    print(f"[PASS] Test 11: Daily Midnight WAT Reset confirmed. Free tier reset to 0, Elite untouched.")

    # Cleanup test db
    if os.path.exists(test_db):
        try: os.remove(test_db)
        except Exception: pass

    print("==================================================")
    print("ALL 11 TOKEN SYSTEM TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()

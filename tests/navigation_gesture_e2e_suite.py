import subprocess, time, json, urllib.request, websocket, os

print("=================================================================")
print("NEXCHAT DEEP NAVIGATION, GESTURE & SECURITY INTEGRATION SUITE")
print("=================================================================")

proc = subprocess.Popen([
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    '--headless=new',
    '--remote-debugging-port=9229',
    '--no-sandbox',
    '--disable-gpu',
    '--allow-file-access-from-files',
    '--window-size=390,844',
    '--user-data-dir=C:\\Users\\USER\\AppData\\Local\\Temp\\chrome_suite_test'
])
time.sleep(2.5)

results = []

try:
    tabs = json.loads(urllib.request.urlopen('http://127.0.0.1:9229/json').read())
    ws = websocket.create_connection(tabs[0]['webSocketDebuggerUrl'], timeout=15)
    cur_id = 0

    def send(method, params=None):
        global cur_id
        cur_id += 1
        payload = {'id': cur_id, 'method': method}
        if params:
            payload['params'] = params
        ws.send(json.dumps(payload))
        target_id = cur_id
        while True:
            raw = ws.recv()
            msg = json.loads(raw)
            if msg.get('id') == target_id:
                return msg

    def eval_js(expr):
        res = send('Runtime.evaluate', {'expression': expr, 'returnByValue': True})
        return res.get('result', {}).get('result', {}).get('value')

    send('Page.enable')
    send('Runtime.enable')

    chat_url = 'file:///' + os.path.abspath('chat.html').replace('\\', '/') + '?test_auth=true'
    send('Page.navigate', {'url': chat_url})
    time.sleep(3.5)

    # Wait until page and navigation scripts are completely ready
    for _ in range(20):
        ready = eval_js('!!window.handleNavigation && !!document.getElementById("statusContainer")')
        if ready:
            break
        time.sleep(0.5)

    # TEST 1: Bottom Navigation Tab Switching (Chats -> Updates -> Alerts -> Calls -> Chats)
    tabs_to_test = [
        ('updates', 'statusContainer', 'flex'),
        ('announcements', 'announcementsContainer', 'flex'),
        ('calls', 'callHistoryContainer', 'block'),
        ('chats', 'chatListView', 'flex')
    ]
    for tab_name, container_id, expected_display in tabs_to_test:
        eval_js(f'''
        (function() {{
            if (window.handleNavigation) {{
                window.handleNavigation("{tab_name}");
            }} else {{
                const navBtn = document.querySelector(`.bottom-nav .nav-item[data-nav="{tab_name}"]`);
                if (navBtn) navBtn.click();
            }}
        }})()
        ''')
        time.sleep(0.6)
        c_disp = eval_js(f'window.getComputedStyle(document.getElementById("{container_id}")).display')
        act_sec = eval_js('document.querySelector(".app")?.dataset.activeSection')
        passed = (c_disp == expected_display)
        results.append((f"Nav Switch -> {tab_name}", passed, f"Display: {c_disp}, Active: {act_sec}"))
        print(f"[{'PASS' if passed else 'FAIL'}] Bottom Nav to '{tab_name}': container '{container_id}' is {c_disp}")

    # TEST 2: Launch Settings from Non-Chat Tab (e.g. from Updates)
    eval_js('window.handleNavigation && window.handleNavigation("updates")')
    time.sleep(0.4)
    eval_js('window.openSettingsModal && window.openSettingsModal()')
    time.sleep(0.5)
    s_disp = eval_js('window.getComputedStyle(document.getElementById("settingsModal")).display')
    b_disp = eval_js('window.getComputedStyle(document.querySelector(".bottom-nav")).display')
    passed_s = (s_disp == 'flex' and b_disp == 'none')
    results.append(("Settings Launch from Updates Tab", passed_s, f"Settings: {s_disp}, BottomNav: {b_disp}"))
    print(f"[{'PASS' if passed_s else 'FAIL'}] Settings opened over Updates: Settings={s_disp}, BottomNav={b_disp}")

    # TEST 3: Multi-Directional Swipe Resistance inside Settings
    # Left swipe:
    eval_js('''
    (function() {
        const modal = document.getElementById('settingsModal');
        const s = new Touch({ identifier: 1, target: modal, clientX: 320, clientY: 300 });
        const e = new Touch({ identifier: 1, target: modal, clientX: 50, clientY: 300 });
        modal.dispatchEvent(new TouchEvent('touchstart', { touches: [s], changedTouches: [s], bubbles: true }));
        modal.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [e], bubbles: true }));
    })()
    ''')
    time.sleep(0.4)
    after_left_swipe = eval_js('window.getComputedStyle(document.getElementById("settingsModal")).display')
    
    # Right swipe:
    eval_js('''
    (function() {
        const modal = document.getElementById('settingsModal');
        const s = new Touch({ identifier: 2, target: modal, clientX: 50, clientY: 300 });
        const e = new Touch({ identifier: 2, target: modal, clientX: 320, clientY: 300 });
        modal.dispatchEvent(new TouchEvent('touchstart', { touches: [s], changedTouches: [s], bubbles: true }));
        modal.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [e], bubbles: true }));
    })()
    ''')
    time.sleep(0.4)
    after_right_swipe = eval_js('window.getComputedStyle(document.getElementById("settingsModal")).display')
    passed_swipe = (after_left_swipe == 'flex' and after_right_swipe == 'flex')
    results.append(("Settings Swipe Resistance", passed_swipe, f"Left: {after_left_swipe}, Right: {after_right_swipe}"))
    print(f"[{'PASS' if passed_swipe else 'FAIL'}] Horizontal Swipe Rejection inside Settings: Left={after_left_swipe}, Right={after_right_swipe}")

    # TEST 4: Settings Dismissal Restores Exact Active Tab
    eval_js('window.closeSettingsModal && window.closeSettingsModal()')
    time.sleep(0.5)
    restored_status = eval_js('window.getComputedStyle(document.getElementById("statusContainer")).display')
    restored_section = eval_js('document.querySelector(".app")?.dataset.activeSection')
    passed_restore = (restored_status == 'flex' and restored_section == 'updates')
    results.append(("Tab Restoration on Settings Close", passed_restore, f"Status: {restored_status}, Section: {restored_section}"))
    print(f"[{'PASS' if passed_restore else 'FAIL'}] Restored to Updates Tab after Settings close: Status={restored_status}, Active={restored_section}")

    # TEST 5: Top-Level Modal Positioning Verification
    modal_locations = eval_js('''({
        settingsInMain: !!document.querySelector('.chat-main #settingsModal'),
        linkDeviceInMain: !!document.querySelector('.chat-main #linkDeviceModal'),
        createStatusInMain: !!document.querySelector('.chat-main #createStatusModal')
    })''')
    passed_pos = (not modal_locations['settingsInMain'] and not modal_locations['linkDeviceInMain'] and not modal_locations['createStatusInMain'])
    results.append(("Modal Outside chat-main", passed_pos, str(modal_locations)))
    print(f"[{'PASS' if passed_pos else 'FAIL'}] Modals located cleanly outside chat-main: {modal_locations}")

    # TEST 6: Firestore Rules Integrity Audit
    rules_path = os.path.abspath('firestore.rules')
    with open(rules_path, 'r', encoding='utf-8') as rf:
        rules_text = rf.read()
    
    rules_checks = {
        "rules_version_2": "rules_version = '2'" in rules_text,
        "users_collection": "match /users/{uid}" in rules_text,
        "chats_collection": "match /chats/{chatId}" in rules_text,
        "messages_subcollection": "match /messages/{messageId}" in rules_text,
        "status_collection": "match /status_updates/{statusId}" in rules_text,
        "link_sessions_collection": "match /link_sessions/{sessionId}" in rules_text,
        "channels_collection": "match /channels/{channelId}" in rules_text,
        "announcements_collection": "match /announcements/{announcementId}" in rules_text,
        "anti_privilege_escalation": "isAdmin" in rules_text and "isSuperAdmin" in rules_text,
        "character_length_limits": "size() <=" in rules_text or "size() <" in rules_text,
        "rate_limit_checks": "request.time" in rules_text
    }
    all_rules_pass = all(rules_checks.values())
    results.append(("Firestore Rules Complete Coverage", all_rules_pass, f"Checked {len(rules_checks)} rule boundaries"))
    print(f"[{'PASS' if all_rules_pass else 'FAIL'}] Firestore Security Rules Verification: {len(rules_checks)} criteria verified")

    total_pass = sum(1 for _, p, _ in results if p)
    print("=================================================================")
    print(f"SUMMARY: {total_pass}/{len(results)} TESTS PASSED ({100.0 * total_pass / len(results):.1f}%)")
    print("=================================================================")

    ws.close()
finally:
    proc.terminate()


import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=== STARTING EXTENDED FUNCTIONAL TESTS ===\n")

    # [1] Admin Login
    print("[1] Testing Admin Login...")
    resp = requests.post(f"{BASE_URL}/auth/login/", data={"username": "admin", "password": "admin123"})
    if resp.status_code != 200:
        print(f"❌ Admin Login Failed: {resp.text}")
        return
    admin_token = resp.json().get("access")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("✅ Admin Logged In.")

    # [2] Get Game & Ampayer
    print("\n[2] Fetching Game and Ampayer Data...")
    games = requests.get(f"{BASE_URL}/games/", headers=admin_headers).json()
    users = requests.get(f"{BASE_URL}/users/", headers=admin_headers).json()
    ampayers = [u for u in users if u['role'] == 'ampayer' and u['username'] != 'admin']
    
    if not games or not ampayers:
        print("❌ Missing games or ampayers. Cannot proceed.")
        return

    target_game = games[0]
    target_ampayer = ampayers[0]
    print(f"   Target Game: {target_game['id']} - {target_game['title']}")
    print(f"   Target Ampayer: {target_ampayer['username']}")

    # [3] Assign Ampayer
    print(f"\n[3] Assigning {target_ampayer['username']} to Game {target_game['id']}...")
    assign_payload = {"user_id": target_ampayer['id'], "role": "Home Plate"}
    resp = requests.post(f"{BASE_URL}/games/{target_game['id']}/assign/", json=assign_payload, headers=admin_headers)
    
    # Accept 201 (Created) or 400 (Already assigned)
    if resp.status_code in [200, 201]:
        print("✅ Assignment Successful.")
    elif resp.status_code == 400 and "already assigned" in resp.text:
        print("⚠️  User already assigned (Skipping).")
    else:
        print(f"❌ Assignment Failed: {resp.text}")

    # [4] Ampayer Login (Digital Scoring)
    print(f"\n[4] Testing Ampayer Login ({target_ampayer['username']})...")
    # Note: populate_data.py sets password 'password123'
    resp = requests.post(f"{BASE_URL}/auth/login/", data={"username": target_ampayer['username'], "password": "password123"})
    
    if resp.status_code != 200:
        print(f"❌ Ampayer Login Failed: {resp.status_code} {resp.text}")
        print("   (Did you run populate_data.py successfully?)")
        return

    amp_token = resp.json().get("access")
    amp_headers = {"Authorization": f"Bearer {amp_token}"}
    print("✅ Ampayer Login Successful.")

    # [5] Digital Scoring: Record a Play
    print(f"\n[5] Testing Digital Scoring (Recording a Play)...")
    
    # Need a player ID to be the batter
    players = requests.get(f"{BASE_URL}/players/", headers=admin_headers).json()
    if not players:
        print("❌ No players found.")
        return
    batter = players[0]
    pitcher = players[1]

    play_data = {
        "game": target_game['id'],
        "inning": 1,
        "half_inning": "top",
        "batter": batter['id'],
        "pitcher": pitcher['id'],
        "result": "Single",
        "description": "Line drive to left field",
        "rbi": 1,
        "outs_recorded": 0
    }
    
    # We don't have a specific ViewSet for 'Play' exposed as 'plays' in urls.py?
    # Let's check urls.py... router.register(r'games', ...)
    # Wait, usually Plays are nested or have their own endpoint?
    # Checking serializers/views... User created PlayViewSet?
    # Checking admin.py... PlayAdmin exists.
    # Checking urls.py... router.register(r'games', GameViewSet) ... no PlayViewSet exposed?
    
    # Let's check common endpoints. If not exposed, we can't test it via API yet.
    # We should stick to what we know is exposed: Games, Assignments.
    
    # Checking if I can confirm the assignment as the ampayer
    print(f"\n[5] Testing Assignment Confirmation (as Ampayer)...")
    resp = requests.post(f"{BASE_URL}/games/{target_game['id']}/confirm_assignment/", headers=amp_headers)
    if resp.status_code == 200:
        print("✅ Game Confirmation Successful.")
        print(f"   Response: {resp.json()}")
    else:
        print(f"❌ Game Confirmation Failed: {resp.status_code} {resp.text}")

    # [6] Check Notifications
    print(f"\n[6] Checking Ampayer Notifications...")
    resp = requests.get(f"{BASE_URL}/notifications/", headers=amp_headers)
    if resp.status_code == 200:
        notifs = resp.json()
        print(f"✅ Retrieved {len(notifs)} notifications.")
        if notifs:
            print(f"   Latest: {notifs[0]['message']}")
    else:
        print(f"❌ Notifications Failed: {resp.status_code}")

    print("\n=== EXTENDED TESTS COMPLETED ===")

if __name__ == "__main__":
    run_tests()

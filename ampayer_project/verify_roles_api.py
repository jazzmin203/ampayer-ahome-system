
import requests
import json

BASE_URL = "http://localhost:8000/api"

def get_token(username, password):
    res = requests.post(f"{BASE_URL}/auth/login/", json={"username": username, "password": password})
    if res.status_code == 200:
        return res.json()['access']
    return None

def test_role(name, username, password):
    print(f"\n--- Testing Role: {name} ({username}) ---")
    token = get_token(username, password)
    if not token:
        print(f"FAILED: Could not get token for {username}")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Check 'me' endpoint
    res = requests.get(f"{BASE_URL}/users/me/", headers=headers)
    print(f"Status /me: {res.status_code}")
    if res.status_code == 200:
        print(f"User Role: {res.json().get('role')}")
    
    # Check access to different modules
    modules = {
        "Games": "/games/",
        "Leagues": "/leagues/",
        "Users": "/users/",
        "Notifications": "/notifications/"
    }
    
    for mod_name, endpoint in modules.items():
        res = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
        print(f"Access to {mod_name}: {res.status_code} {'(ALLOWED)' if res.status_code == 200 else '(DENIED)'}")

    # Specific role actions
    try:
        games_res = requests.get(f"{BASE_URL}/games/", headers=headers).json()
        # Handle both paginated and non-paginated responses
        games_list = games_res.get('results', games_res) if isinstance(games_res, dict) else games_res
        
        if games_list and len(games_list) > 0:
            game_id = games_list[0]['id']
            
            if username == "scorer_1":
                res = requests.post(f"{BASE_URL}/games/{game_id}/record_play/", headers=headers, json={
                    "inning": 1, "half_inning": "top", "result": "Strike", "runs_scored": 0, "outs_recorded": 0, "batter": 1, "pitcher": 2
                })
                print(f"Action: Record Play: {res.status_code} {'(SUCCESS)' if res.status_code == 201 else '(FAILED)'}")
                if res.status_code != 201:
                    print(f"Error Response: {res.text}")

            if username == "amp_1":
                res = requests.post(f"{BASE_URL}/games/{game_id}/confirm_assignment/", headers=headers)
                print(f"Action: Confirm Assignment: {res.status_code} {'(SUCCESS)' if res.status_code == 200 else '(FAILED)'}")
                if res.status_code != 200:
                    print(f"Error Response: {res.text}")
    except Exception as e:
        print(f"Error during specific action test: {e}")

if __name__ == "__main__":
    test_role("Administrator", "admin_user", "pass123")
    test_role("President", "pres_user", "pass123")
    test_role("Ampayer", "amp_1", "pass123")
    test_role("Scorer", "scorer_1", "pass123")

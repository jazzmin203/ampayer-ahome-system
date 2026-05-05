
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def get_token(username, password):
    try:
        res = requests.post(f"{BASE_URL}/auth/login/", json={"username": username, "password": password})
        if res.status_code == 200:
            return res.json()['access']
        print(f"Login failed for {username}: {res.status_code} {res.text}")
    except Exception as e:
        print(f"Connection error: {e}")
    return None

def verify_features():
    print("--- 1. Testing Role Filtering ---")
    # Admin should see all games
    admin_token = get_token("admin_user", "pass123")
    if admin_token:
        headers = {"Authorization": f"Bearer {admin_token}"}
        res = requests.get(f"{BASE_URL}/games/", headers=headers)
        print(f"Admin Games Count: {len(res.json().get('results', [])) if res.status_code==200 else res.status_code}")

    # Ampayer should see only assigned games (assuming amp_1 is assigned to something or nothing)
    amp_token = get_token("amp_1", "pass123")
    if amp_token:
        headers = {"Authorization": f"Bearer {amp_token}"}
        res = requests.get(f"{BASE_URL}/games/", headers=headers)
        print(f"Ampayer Games Count: {len(res.json().get('results', [])) if res.status_code==200 else res.status_code}")

    print("\n--- 2. Testing Game Cancellation ---")
    if admin_token:
        headers = {"Authorization": f"Bearer {admin_token}"}
        # Get first game
        games = requests.get(f"{BASE_URL}/games/", headers=headers).json().get('results', [])
        if games:
            game_id = games[0]['id']
            print(f"Cancelling game {game_id}...")
            res = requests.post(f"{BASE_URL}/games/{game_id}/cancel/", headers=headers, json={"reason": "Lluvia intensa"})
            print(f"Cancel Status: {res.status_code}")
            print(f"Response: {res.json()}")
    
    print("\n--- 3. Testing Umpire Report ---")
    if amp_token:
        headers = {"Authorization": f"Bearer {amp_token}"}
        # Try to submit report for a game (using the game_id from above if possible, or just 1)
        # Note: In real logic, umpire must be assigned. We assume amp_1 might be assignable.
        # Let's just try creating a report.
        if 'game_id' in locals():
            report_data = {
                "game": game_id,
                "content": "Juego cancelado por lluvia, pero todo en orden antes de eso."
            }
            res = requests.post(f"{BASE_URL}/reports/", headers=headers, json=report_data)
            print(f"Report Creation Status: {res.status_code}")
            if res.status_code == 201:
                print("Report created successfully.")
            else:
                print(f"Error: {res.text}")

if __name__ == "__main__":
    verify_features()

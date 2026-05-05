
import os
import django
import random
from datetime import date, time, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampayer_project.settings')
django.setup()

from core.models import (
    User, UserProfile, League, Season, Category, Stadium, Team, Player,
    Game, AvailabilityBlock
)

def create_users():
    print("Creating Users...")
    # President
    if not User.objects.filter(username="president").exists():
        u = User.objects.create_user("president", "pres@example.com", "password123", role=User.Role.LEAGUE_PRESIDENT)
        UserProfile.objects.create(user=u, phone_number="555-0001")
    
    # Ampayers (Explicitly set password)
    ampayers = []
    for i in range(1, 6):
        username = f"ampayer{i}"
        password = "password123"
        if not User.objects.filter(username=username).exists():
            u = User.objects.create_user(username, f"amp{i}@example.com", password, role=User.Role.AMPAYER)
            UserProfile.objects.create(user=u, certification_level="Level A", years_experience=random.randint(1, 15))
            ampayers.append(u)
        else:
            # If exists, reset password to be sure
            u = User.objects.get(username=username)
            u.set_password(password)
            u.save()
            ampayers.append(u)

    # Scorers
    scorers = []
    for i in range(1, 3):
        username = f"scorer{i}"
        if not User.objects.filter(username=username).exists():
            u = User.objects.create_user(username, f"score{i}@example.com", "password123", role=User.Role.SCORER)
            UserProfile.objects.create(user=u)
            scorers.append(u)
        else:
            scorers.append(User.objects.get(username=username))

    return ampayers, scorers

# ... rest of the file same as before ... 
# (Redefining the rest to ensure it runs standalone)

def create_league_structure(president):
    print("Creating League Structure...")
    if League.objects.exists():
        league = League.objects.first()
        season = league.seasons.first()
        categories = list(season.categories.all())
        # Assuming we created them in order or by name
        cat_major = next(c for c in categories if c.name == "Mayor")
        cat_junior = next(c for c in categories if c.name == "Junior")
        return season, cat_major, cat_junior

    league = League.objects.create(
        name="Liga Municipal de Béisbol",
        slug="liga-municipal",
        city="Hermosillo",
        president=president
    )
    
    season = Season.objects.create(
        league=league,
        name="Temporada 2024",
        start_date=date(2024, 1, 1),
        end_date=date(2024, 6, 30)
    )
    
    cat_major = Category.objects.create(season=season, name="Mayor")
    cat_junior = Category.objects.create(season=season, name="Junior")
    
    return season, cat_major, cat_junior

def create_teams(season, cat_major, cat_junior):
    print("Creating Teams...")
    if Team.objects.exists():
        return Team.objects.all()

    teams = []
    names_major = ["Tigres", "Diablos", "Sultanes", "Leones"]
    for name in names_major:
        teams.append(Team.objects.create(category=cat_major, name=name, short_name=name[:3].upper()))

    names_junior = ["Lobos", "Águilas", "Toros", "Venados"]
    for name in names_junior:
        teams.append(Team.objects.create(category=cat_junior, name=name, short_name=name[:3].upper()))
        
    return teams

def create_stadiums():
    print("Creating Stadiums...")
    if Stadium.objects.exists():
        return Stadium.objects.all()
        
    stadiums = []
    for i in range(1, 4):
        stadiums.append(Stadium.objects.create(name=f"Estadio Municipal {i}", address=f"Calle {i}"))
    return stadiums

def create_players(teams):
    print("Creating Players...")
    if Player.objects.exists():
        return Player.objects.all()
    
    players = []
    for team in teams:
        for i in range(1, 10): # 9 players per team
            players.append(Player.objects.create(
                team=team,
                first_name=f"Player{i}",
                last_name=f"{team.short_name}",
                jersey_number=i,
                positions="P" if i==1 else "C"
            ))
    return players

def create_games(season, teams, stadiums, ampayers):
    print("Creating Games...")
    if Game.objects.exists():
        return

    # Create games for next Saturday
    game_date = date.today() + timedelta(days=(5 - date.today().weekday() + 7) % 7)
    
    random.shuffle(teams)
    
    for i in range(0, len(teams), 2):
        if i+1 < len(teams):
            home = teams[i]
            away = teams[i+1]
            stadium = random.choice(stadiums)
            
            Game.objects.create(
                season=season,
                category=home.category,
                stadium=stadium,
                local_team=home,
                visitor_team=away,
                date=game_date,
                time=time(10 + i, 0), # 10:00, 12:00, etc.
                status=Game.Status.PENDING
            )

    print("Sample Data Created Successfully!")

if __name__ == "__main__":
    ampayers, scorers = create_users()
    president = User.objects.get(username="president")
    season, cat_major, cat_junior = create_league_structure(president)
    teams = create_teams(season, cat_major, cat_junior)
    stadiums = create_stadiums()
    create_players(teams)
    create_games(season, list(teams), list(stadiums), ampayers)


import os
import sys
import django
import random

# Setup django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampayer_project.settings')
django.setup()

from core.models import Team, Player

FIRST_NAMES = [
    "Juan", "Jose", "Luis", "Carlos", "Roberto", "Miguel", "Antonio", "Fernando", 
    "Pedro", "Francisco", "Jorge", "Manuel", "Daniel", "Ricardo", "Eduardo", 
    "Andrés", "Oscar", "Raúl", "Sergio", "Alejandro"
]

LAST_NAMES = [
    "Garcia", "Rodriguez", "Hernandez", "Lopez", "Gonzalez", "Perez", "Sanchez", 
    "Martinez", "Ramirez", "Torres", "Flores", "Rivera", "Gomez", "Diaz", "Cruz", 
    "Morales", "Ortiz", "Gutierrez", "Bravo", "Bernal"
]

POSITIONS = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"]

def populate_players():
    print("Encontrando equipos...")
    teams = Team.objects.all()
    if not teams.exists():
        print("❌ No hay equipos en la base de datos. Corre populate_liga_ahome.py primero.")
        return

    print(f"Añadiendo jugadores a {teams.count()} equipos...")
    
    total_players = 0
    for team in teams:
        # Check if team already has players
        if team.players.exists():
            print(f"  ⏩ El equipo {team.name} ya tiene jugadores. Saltando.")
            continue
            
        print(f"  ⚾ Añadiendo jugadores al equipo: {team.name}")
        
        # Create 12 players per team
        numbers = list(range(1, 100))
        random.shuffle(numbers)
        
        for i in range(12):
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)
            jersey = numbers.pop()
            
            # Pick 1-2 positions
            num_pos = random.randint(1, 2)
            pos_list = random.sample(POSITIONS, num_pos)
            positions = ", ".join(pos_list)
            
            Player.objects.create(
                team=team,
                first_name=first_name,
                last_name=last_name,
                jersey_number=jersey,
                positions=positions
            )
            total_players += 1
            
    print(f"\n✅ Se crearon {total_players} jugadores de prueba.")

if __name__ == "__main__":
    populate_players()

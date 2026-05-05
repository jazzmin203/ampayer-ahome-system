import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampayer_project.settings')
django.setup()

from core.models import Game, Team, Stadium, Category, Season

def add_games():
    print("--- Agregando juegos faltantes de la imagen fbc3fa76 ---")
    
    # Get objects
    season = Season.objects.get(name="Temporada 2026", is_active=True)
    
    stadiums = {
        "Centenario 1": Stadium.objects.get(name="Polideportivo Centenario Campo #1"),
        "Aurelio 1": Stadium.objects.get(name="Cd. Dep. Aurelio Rodriguez Campo #1"),
        "Aurelio 2": Stadium.objects.get(name="Cd. Dep. Aurelio Rodriguez Campo #2"),
        "Valdivia": Stadium.objects.get(name="UDI Valdivia"),
    }
    
    categories = {
        "Novatos": Category.objects.get(name="NOVATOS", season=season),
        "Intermedia": Category.objects.get(name="INTERMEDIA", season=season),
        "Avanzada": Category.objects.get(name="AVANZADA", season=season),
    }

    games_to_add = [
        {"time": "21:00", "local": "FORTALEZA BROTHERS", "visitor": "CACHORROS", "stadium": stadiums["Centenario 1"], "cat": categories["Novatos"]},
        {"time": "21:00", "local": "AHOME GASOLINERA", "visitor": "SUPLAST", "stadium": stadiums["Aurelio 1"], "cat": categories["Intermedia"]},
        {"time": "21:00", "local": "LOS MOLACHOS", "visitor": "PHILLIPS", "stadium": stadiums["Aurelio 2"], "cat": categories["Novatos"]},
        {"time": "21:00", "local": "ECOTERRA NUTRICIÓN VEG.", "visitor": "CREMERÍA MOCHIS", "stadium": stadiums["Valdivia"], "cat": categories["Avanzada"]},
    ]

    for g in games_to_add:
        local, _ = Team.objects.get_or_create(name=g['local'], category=g['cat'])
        visitor, _ = Team.objects.get_or_create(name=g['visitor'], category=g['cat'])
        
        Game.objects.get_or_create(
            date="2026-05-05",
            time=g['time'],
            local_team=local,
            visitor_team=visitor,
            stadium=g['stadium'],
            category=g['cat'],
            defaults={"status": Game.Status.PENDING}
        )
        print(f"Agregado: {g['local']} vs {g['visitor']}")

if __name__ == "__main__":
    add_games()

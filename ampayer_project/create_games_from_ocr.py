import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampayer_project.settings')
django.setup()

from core.models import Game, Team, Category, Stadium, League
import datetime

# Helper for fuzzy matching / getting or creating teams
def get_or_create_team(name, category=None):
    from django.db.models import Q
    teams = Team.objects.filter(name__icontains=name)
    if teams.exists():
        return teams.first()
    if not category: category = Category.objects.first()
    return Team.objects.create(name=name, category=category)

def get_category(name_fragment):
    cat = Category.objects.filter(name__icontains=name_fragment).first()
    return cat

def get_stadium(name_fragment):
    if not name_fragment: return Stadium.objects.first()
    stad = Stadium.objects.filter(name__icontains=name_fragment).first()
    return stad if stad else Stadium.objects.first()

def create_game(date, time, local_name, visitor_name, category_name, stadium_name=None):
    category = get_category(category_name)
    local_team = get_or_create_team(local_name, category)
    visitor_team = get_or_create_team(visitor_name, category)
    stadium = get_stadium(stadium_name) if stadium_name else Stadium.objects.first()
    
    # Check if game exists to avoid duplicates
    if not Game.objects.filter(date=date, local_team=local_team, visitor_team=visitor_team).exists():
        Game.objects.create(
            date=date,
            time=time,
            local_team=local_team,
            visitor_team=visitor_team,
            category=category,
            stadium=stadium,
            status='pending'
        )
        print(f"Created: {local_name} vs {visitor_name} at {time} on {date}")
    else:
        print(f"Skipped (Exists): {local_name} vs {visitor_name} at {time} on {date}")


def run_ocr_games():
    today = datetime.date(2026, 5, 11)
    yesterday = today - datetime.timedelta(days=1)

    print("--- Generating LMSA Games ---")
    lmsa_games = [
        ("19:00:00", "HOSPITAL FATIMA", "LIC. CRISTIAN LOPEZ", "NOVATOS", "Polideportivo Centenario Campo #1"),
        ("19:00:00", "CRUSTATEC", "SAMA SOFTBALL TEAM", "AVANZADA", "Cd. Dep. Aurelio Rodriguez Campo #1"),
        ("19:00:00", "AHOME GASOLINERA", "TERCOS", "INTERMEDIA", "Polideportivo Centenario Campo #2"),
        ("19:00:00", "CROM JR", "Equipo Pendiente", "INTERMEDIA", "UDI Valdivia"),
        ("21:00:00", "TRONCOS", "CACHORROS", "NOVATOS", "Polideportivo Centenario Campo #2"),
        ("21:00:00", "DESPRECIADOS", "LA PANDILLA", "INTERMEDIA", "UDI Agrónomo"),
        ("21:00:00", "ARABES", "VICIOSOS", "AVANZADA", "UDI Valdivia"),
        ("21:00:00", "IPAYC", "ETIQUETAS GRAFICAS", "INTERMEDIA", "Polideportivo Centenario Campo #1"),
        ("21:00:00", "RANCHO ARDIENDO", "MALVINAS", "INTERMEDIA", "Cd. Dep. Aurelio Rodriguez Campo #2")
    ]

    for time_str, local, visitor, cat, stad in lmsa_games:
        create_game(today, time_str, local, visitor, cat, stad)


    print("--- Generating AHOME Games ---")
    ahome_games = [
        (yesterday, "08:30:00", "RANGERS", "YANKEES", "Escuelita", "Ochoa"),
        (today, "16:30:00", "PIRATAS 16-17", "PIRATAS 15", "Juvenil Mayor", None),
        (yesterday, "08:30:00", "TIGRES DE TEHUOCO", "ASTROS", "Escuelita", "Alonso Araujo"),
        (yesterday, "08:30:00", "MARINEROS", "CHEVROLET", "Pinguica", "Gudino"),
        (yesterday, "10:30:00", "ROYALS", "MARINEROS", "Pinguica", "Gudino")
    ]

    for d, time_str, local, visitor, cat, stad in ahome_games:
        create_game(d, time_str, local, visitor, cat, stad)

    print("Done generating games!")

if __name__ == '__main__':
    run_ocr_games()

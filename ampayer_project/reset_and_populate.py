import os
import django
import datetime
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampayer_project.settings')
django.setup()

from core.models import User, League, Season, Category, Stadium, Team, Game, GameAssignment, Play, LineupEntry, Notification

def populate():
    print("--- Limpiando datos antiguos (excepto usuarios, campos y ligas) ---")
    Game.objects.all().delete()
    Play.objects.all().delete()
    LineupEntry.objects.all().delete()
    GameAssignment.objects.all().delete()
    Notification.objects.all().delete()

    # 1. Configurar Usuarios Críticos
    print("--- Configurando Usuarios ---")
    password = "pass123"
    
    # Coordinador: Frank Bernal
    frank, _ = User.objects.update_or_create(
        username="frank_bernal",
        defaults={
            "first_name": "Frank",
            "last_name": "Bernal",
            "role": User.Role.ADMIN_AMPAYER,
            "is_active": True,
            "email": "frank@example.com"
        }
    )
    frank.set_password(password)
    frank.save()
    
    # Presidente
    president, _ = User.objects.update_or_create(
        username="president",
        defaults={
            "first_name": "Presidente",
            "last_name": "Liga",
            "role": User.Role.LEAGUE_PRESIDENT,
            "is_active": True
        }
    )
    president.set_password(password)
    president.save()

    # Asegurar que todos los ampayers y anotadores tengan el mismo password para el demo
    User.objects.filter(role__in=[User.Role.AMPAYER, User.Role.SCORER]).update(is_active=True)
    for u in User.objects.filter(role__in=[User.Role.AMPAYER, User.Role.SCORER]):
        u.set_password(password)
        u.save()

    # 2. Estructura de Ligas y Categorías
    print("--- Configurando Estructura ---")
    league, _ = League.objects.get_or_create(
        name="Liga Municipal de Softbol de Ahome",
        defaults={"slug": "lmsa", "president": president, "city": "Los Mochis"}
    )
    
    season, _ = Season.objects.get_or_create(
        league=league,
        name="Temporada 2026",
        defaults={"start_date": "2026-01-01", "end_date": "2026-12-31", "is_active": True}
    )

    cats_names = ["INTERMEDIA", "NOVATOS", "AVANZADA", "SEMI RÁPIDA"]
    categories = {}
    for name in cats_names:
        cat, _ = Category.objects.get_or_create(season=season, name=name)
        categories[name] = cat

    # 3. Estadios
    print("--- Configurando Estadios ---")
    stadium_names = [
        "Polideportivo Centenario Campo #1",
        "Polideportivo Centenario Campo #2",
        "Cd. Dep. Aurelio Rodriguez Campo #1",
        "Cd. Dep. Aurelio Rodriguez Campo #2",
        "UDI Agrónomo",
        "UDI Valdivia"
    ]
    stadiums = {}
    for name in stadium_names:
        std, _ = Stadium.objects.get_or_create(name=name)
        stadiums[name] = std

    # 4. Equipos y Juegos
    print("--- Creando Juegos de las Imágenes ---")
    
    games_data = [
        # Martes 05 Mayo 2026 (De la imagen 1)
        {"date": "2026-05-05", "time": "19:00", "local": "LA REZAGA SOFTBOL", "visitor": "YANKEES LM", "stadium": "Polideportivo Centenario Campo #2", "cat": "NOVATOS"},
        {"date": "2026-05-05", "time": "19:00", "local": "BANDA LA FULANITA", "visitor": "CYRISA - CHAVORRUCOS", "stadium": "Cd. Dep. Aurelio Rodriguez Campo #1", "cat": "INTERMEDIA"},
        {"date": "2026-05-05", "time": "19:00", "local": "ISA - JUAN JOSÉ RÍOS", "visitor": "TERCOS", "stadium": "Polideportivo Centenario Campo #1", "cat": "INTERMEDIA"},
        {"date": "2026-05-05", "time": "19:00", "local": "MADERAS EL ÁLAMO", "visitor": "PATANES", "stadium": "Cd. Dep. Aurelio Rodriguez Campo #2", "cat": "NOVATOS"},
        {"date": "2026-05-05", "time": "19:00", "local": "CHUTAMEROS DE LA MEMOR", "visitor": "PESCADERÍA LA JAPONESA", "stadium": "UDI Agrónomo", "cat": "INTERMEDIA"},
        {"date": "2026-05-05", "time": "19:00", "local": "EL TERRENO", "visitor": "LIC. CRISTIAN LÓPEZ", "stadium": "UDI Valdivia", "cat": "NOVATOS"},
        {"date": "2026-05-05", "time": "21:00", "local": "AUTO TRASLADOS MOCHIS", "visitor": "CSJ SOLAR - PACSA", "stadium": "Polideportivo Centenario Campo #2", "cat": "AVANZADA"},
        {"date": "2026-05-05", "time": "21:00", "local": "BUCHEROS - ECO AVALÚOS", "visitor": "LA MARISQUEÑA - IMAGIA", "stadium": "UDI Agrónomo", "cat": "SEMI RÁPIDA"},
        
        # Miércoles 06 Mayo 2026 (De la imagen 2)
        {"date": "2026-05-06", "time": "19:00", "local": "CARNICERIA SAN MARTIN", "visitor": "JHPL TRANSPORTES", "stadium": "UDI Agrónomo", "cat": "INTERMEDIA"},
        {"date": "2026-05-06", "time": "21:00", "local": "TREMENDOS", "visitor": "MAGISTE", "stadium": "UDI Agrónomo", "cat": "NOVATOS"},
    ]

    for g in games_data:
        # Create teams if not exist
        local, _ = Team.objects.get_or_create(name=g['local'], category=categories[g['cat']])
        visitor, _ = Team.objects.get_or_create(name=g['visitor'], category=categories[g['cat']])
        
        Game.objects.create(
            date=g['date'],
            time=g['time'],
            local_team=local,
            visitor_team=visitor,
            stadium=stadiums[g['stadium']],
            category=categories[g['cat']],
            status=Game.Status.PENDING
        )

    print(f"--- Proceso completado. Frank Bernal y {Game.objects.count()} juegos creados. ---")

if __name__ == "__main__":
    populate()

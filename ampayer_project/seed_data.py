import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampayer_project.settings')
django.setup()

from core.models import Category, Stadium, Team, User, Season
from django.db import transaction

LIGAS = [
    "Liga Infantil y Juvenil de Béisbol Municipal de Ahome A.C.",
    "Liga de Sóftbol Femenil Daniela Romero Cuevas",
    "Liga Sabatina de Béisbol Gildardo Leyva",
    "Liga de Béisbol Kililo Ledesma",
    "Sóftbol Femenil Río Fuerte",
    "Liga Juvenil Aníbal Leyva",
    "Liga UAS",
    "Auténtica Liga de Béisbol 3ra Fuerza Toño Castro",
    "Liga de Sóftbol del Ayuntamiento de Ahome",
    "Liga Municipal de Sóftbol de Ahome (LMSA)"
]

ESTADIOS = [
    # Río Fuerte
    "Nuevo San Miguel", "Flor Azul", "Leyva Solano", "Compuertas",
    "San Miguel", "Cohuibampo", "Goros", "Tosalibampo", "El Guayabo",
    # Deportivos
    "Las Mañanitas 1", "Las Mañanitas 2",
    "Polideportivo Centenario Campo #1", "Polideportivo Centenario Campo #2",
    "Ciudad Deportiva Aurelio Rodríguez Ituarte Campo #1", "Ciudad Deportiva Aurelio Rodríguez Ituarte Campo #2",
    "Unidad Deportiva Infantil (UDI) - Agrónomo", "Unidad Deportiva Infantil (UDI) - Valdivia",
    "Campo 1 Campo Beisbol", "Campo 2 Campo Beisbol", "Campo 1 Campo Softbol", "Campo 2 Campo Softbol",
    "Estadio del Poblado", "Estadio Galaz", "Taxtes", "Estadio Mara Sañudo",
    "Vialacahui", "Rosales", "2 de Abril", "La Termo", "El Rincón", "Buenavista", "Pochotal"
]

EQUIPOS_POR_LIGA = {
    "Liga de Sóftbol Femenil Daniela Romero Cuevas": [
        "Cachorras Centenario", "Las Aguerridas Centenario", "Patrinas", 
        "Angels Flores Magón", "Jorvid Team Softbol Club", "Indomables", 
        "Academia MP Softbol", "Diba"
    ],
    "Auténtica Liga de Béisbol 3ra Fuerza Toño Castro": [
        "Vialacahui", "Gegenes", "Rosales", "Caimanes", "2 de Abril", "Dep. Sanchez",
        "San Blas", "Pochotal Larreta", "Pascoleros del Rincón", "Camajoa New", 
        "Buena Vista", "Los Patos", "Cachorros Pochotal", "Mini Rezaga"
    ],
    "Liga de Béisbol Kililo Ledesma": [
        "Los Gallos", "Rancheros", "Los Topos", "La Pacundiza", "Taxtes Luna's", 
        "Taxtes Vaquilla", "Ejidatarios", "5 de Mayo"
    ],
    "Liga Sabatina de Béisbol Gildardo Leyva": [
        "Cachorros", "Toros", "El Carrizo", "Camaroneros", "Venados", 
        "Agricultores", "Poblado 5"  # Ejidatarios ya está arriba, lo omitimos si es el mismo, pero aquí lo agregamos asociado
    ],
    "Liga Municipal de Sóftbol de Ahome (LMSA)": [
        "La Rezaga Softbol", "Yankees LM", "Banda La Fulanita", "Cyrisa - Chavorrucos", 
        "ISA - Juan José Ríos", "Tercos", "Maderas El Álamo", "Patanes", 
        "Chutameros de la Memoria", "Pescadería La Japonesa", "El Terreno", 
        "Lic. Cristian López", "Auto Traslados Mochis", "CSJ Solar - PACSA", 
        "Bucheros - Eco Avalúos", "La Marisqueña - Imagia", "Carvel Agro", 
        "Sables de Oro", "Palacios", "Plásticos El Globo", "Curricanes", "Incumplidos", 
        "Todo para tu celular", "Bazar Chito", "Camelios", "Rockers", "Compadres", 
        "Calma Team", "Brujos", "Acumuladores Jacs", "Pechochos", "Lavadoras ROA", 
        "Ciclistas", "Generales", "Packers", "Los Reds", "Equireno", "Neuro Mac", 
        "Rompecosturas", "Consentidos", "Ecoterra Nutrición Vegetal", "Cremería Mochis", 
        "Corsa", "Red Cell", "Titanes", "Maniackos", "Mercado Libre", "Troncos", 
        "Molachos", "Philips", "Luxe Autolavado", "Rookies", "Vikingos Roa", 
        "La Pandilla", "Hawks", "Pichurrias", "Total Black", "Super Avila", 
        "Carnicería San Martin", "JHPL Transportes", "Tremendos", "Magiste", 
        "Torno y Maquinado", "Curtis", "Packersillos", "Dental Valdez", "Gallos", 
        "Minsa", "Distribuidora Villegas", "Autos JL", "Taller Guerrero", "IPAYC", 
        "Machiguis", "Etiquetas Gráficas", "Chureas UAIM", "MG Dental", "Ramcell", 
        "Jairo Zamago", "Agropacific", "Bárbaros", "SNTE 53", "Viza Bros", "Batallososo", 
        "Auto Traslado LM", "Acarreados", "La Michoacana", "Capibaras", "Grupo Corerepe", 
        "Panadería La Mejor", "Bulls", "Fortaleza Brothers", "Suplast"
    ]
}

def run():
    print("Iniciando carga de datos...")
    with transaction.atomic():
        # 0. League and Season
        from core.models import League
        league, _ = League.objects.get_or_create(
            slug="liga-general", 
            defaults={"name": "Ligas de Ahome", "city": "Los Mochis"}
        )
        season, _ = Season.objects.get_or_create(
            name="Temporada 2026", 
            defaults={
                "league": league,
                "start_date": "2026-01-01",
                "end_date": "2026-12-31",
                "is_active": True
            }
        )
        
        # 1. Ligas
        category_objects = {}
        for liga_name in LIGAS:
            cat, created = Category.objects.get_or_create(name=liga_name, defaults={'season': season})
            category_objects[liga_name] = cat
            if created:
                print(f"Liga creada: {liga_name}")

        # 2. Estadios
        for estadio_name in ESTADIOS:
            _, created = Stadium.objects.get_or_create(name=estadio_name)
            if created:
                print(f"Estadio creado: {estadio_name}")

        # 3. Equipos
        for liga_name, equipos in EQUIPOS_POR_LIGA.items():
            categoria = category_objects.get(liga_name)
            for equipo_name in equipos:
                _, created = Team.objects.get_or_create(
                    name=equipo_name,
                    category=categoria,
                    defaults={'short_name': equipo_name[:10]}
                )
                if created:
                    print(f"Equipo creado: {equipo_name} ({liga_name})")

        # 4. Ampayers Reales
        AMPAYERS = [
            ("Itsmari Zurisadai", "Armenta Gonzalez"),
            ("Mario Alberto", "Apodaca Prieto"),
            ("Francisco Javier", "Bernal Leal"),
            ("Fernando", "Bernal Ortiz"),
            ("Pedro", "Bojorquez Reyes"),
            ("Jose David", "Castillo Campos"),
            ("Jorge Luis", "Castro Machado"),
            ("Ramon Alberto", "Cota Chavez"),
            ("Cesar Dario", "Espinoza Armenta"),
            ("Carlos Ramon", "Felix Quintero"),
            ("Jose Agapito", "Garcia Cota"),
            ("Rommel", "Gamez Soto"),
            ("Cristhian Adrian", "Guillen Encinas"),
            ("Florentino Eduardo", "Guillen Encinas"),
            ("Linda Esmeralda", "Iriarte Felix"),
            ("Fredy Martin", "Leal Guillen"),
            ("Frida Lizeth", "Leal Manzanarez"),
            ("Jesus Ricardo", "Lizarraga Montoya"),
            ("Laura Diana", "Lopez Beltran"),
            ("Juan Carlos", "Lopez Murillo"),
            ("Juan De Dios", "Lopez Orozco"),
            ("Leonel", "Lopez Ruiz"),
            ("Lizeth Berenice", "Manzanarez Gastelum"),
            ("Guadalupe", "Martinez Miranda"),
            ("Maria Fernanda", "Meza Flores"),
            ("Arely Lisseth", "Moreno Ahumada"),
            ("Misael Adriel", "Montiel Urias"),
            ("Sandra Lizbeth", "Nuñez Valenzuela"),
            ("Jesus", "Robles Ruiz"),
            ("Juan", "Sarabia Ontiveros"),
            ("Alfredo", "Valdez Leyva"),
            ("Tomas Armando", "Vazquez Sanchez"),
            ("Jesus Guadalupe", "Valles Vazquez"),
            ("Julio Cesar", "Vega Ruiz")
        ]
        
        import unicodedata
        def sanitize_username(first_name, last_name):
            name_part = first_name.split()[0].lower()
            last_part = last_name.replace(" ", "").lower()
            raw_username = f"{name_part}_{last_part}"
            # Quitar acentos
            username = ''.join(c for c in unicodedata.normalize('NFD', raw_username) if unicodedata.category(c) != 'Mn')
            return username

        print("\n--- CARGA DE AMPAYERS REALES ---")
        for first_name, last_name in AMPAYERS:
            username = sanitize_username(first_name, last_name)
            
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'role': User.Role.AMPAYER
                }
            )
            if created:
                user.set_password("pass123")
                user.save()
                print(f"Ampayer creado: {username} (pass123) - {first_name} {last_name}")
            else:
                print(f"Ampayer ya existía: {username}")
                
    print("\nCarga de datos completada exitosamente.")

if __name__ == "__main__":
    run()

"""
=========================================================================
POBLACIÓN DE DATOS REALES - LIGA DE AHOME
Liga Infantil y Juvenil de Beisbol Municipal de Ahome, A.C.
Temporada 2025-2026 "LCP Jorge Armando Gámez Manzanarez"
Jornada 13 - 28 de Febrero al 01 de Marzo de 2026
=========================================================================
"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampayer_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import (
    User, UserProfile, League, Season, Category, Stadium, Team, Game, GameAssignment
)
from datetime import date, time

User = get_user_model()


# =============================================================================
# LISTA DE AMPAYERS Y ANOTADORES (del documento oficial)
# =============================================================================
AMPAYERS_ANOTADORES = [
    {"nombre": "Itsmari Zurisadai Armenta Gonzalez", "curp": "AEGI000114MSLRNTA2"},
    {"nombre": "Mario Alberto Apodaca Prieto", "curp": "AOPL871121HSLPRR03"},
    {"nombre": "Francisco Javier Bernal Leal", "curp": "BELF891206HSLRLR03"},
    {"nombre": "Fernando Bernal Ortiz", "curp": "BEOF630520HSLRRR00"},
    {"nombre": "Pedro Bojorquez Reyes", "curp": "BORP650503HSLJYD09"},
    {"nombre": "Castillo Campos José David", "curp": "CACD040205HSLSMVA4"},
    {"nombre": "Jorge Luis Castro Machado", "curp": "CAMJ940402HSLSCR13"},
    {"nombre": "Ramón Alberto Cota Chávez", "curp": "COCR740705HSLTHM06"},
    {"nombre": "César Darío Espinoza Armenta", "curp": "EIAC801219HSLSRS06"},
    {"nombre": "Carlos Ramón Félix Quintero", "curp": "FEQC780501HSLLNR08"},
    {"nombre": "José Agapito García Cota", "curp": "GACA650703HSRTGO4"},
    {"nombre": "Rommel Gamez Soto", "curp": "GASR790102HSLMTM03"},
    {"nombre": "Cristhian Adrián Guillén Encinas", "curp": "GUEC910904HSLLNR0"},
    {"nombre": "Florentino Eduardo Guillen Encinas", "curp": "GUEF890318HSLLNL07"},
    {"nombre": "Iriarte Félix Linda Esmeralda", "curp": "IIFL990225MSLRLN07"},
    {"nombre": "Fredy Martin Leal Guillén", "curp": "LEGF760102HSLLLR00"},
    {"nombre": "Frida Lizeth Leal Manzanarez", "curp": "LEMF031004MSLLNRA4"},
    {"nombre": "Jesús Ricardo Lizárraga Montoya", "curp": "LIMJ850205HSLZNS01"},
    {"nombre": "Laura Diana Lopez Beltrán", "curp": "LOBL940821MSLPLR08"},
    {"nombre": "Juan Carlos López Murillo", "curp": "LOMJ810223HSLPRN00"},
    {"nombre": "Juan De Dios Lopez Orozco", "curp": "LOOJ670914HSRPRN04"},
    {"nombre": "Leonel López Ruiz", "curp": "LORL861018HSLPZN02"},
    {"nombre": "Manzanarez Gastélum Lizeth Bereni", "curp": "MAGL810123MSLNSZ06"},
    {"nombre": "Guadalupe Martínez Miranda", "curp": "MAMG911102HSLRRD06"},
    {"nombre": "Maria Fernanda Meza Flores", "curp": "MEFF950125MSLZLR01"},
    {"nombre": "Moreno Ahumada Arely Lisseth", "curp": "MOAA921023MSLRHR01"},
    {"nombre": "Misael Adriel Montiel Urías", "curp": "MOUM820420HSLNRS02"},
    {"nombre": "Sandra Lizbeth Núñez Valenzuela", "curp": "NUVS820929MSLXLN06"},
    {"nombre": "Jesus Robles Ruiz", "curp": "RORJ720602HSLBZS09"},
    {"nombre": "Sarabia Ontiveros Juan", "curp": "SAOJ690516HSLRNNO"},
    {"nombre": "Alfredo Valdez Leyva", "curp": "VALA660728HSLLYL04"},
    {"nombre": "Vázquez Sánchez Tomas Armando", "curp": "VAST910322HSLZNM07"},
    {"nombre": "Jesús Guadalupe Valles Vázquez", "curp": "VAVJ661110HDFLZS09"},
    {"nombre": "Julio Cesar Vega Ruiz", "curp": "VERJ731010HSLGZL02"},
]

# =============================================================================
# CAMPOS / ESTADIOS
# =============================================================================
CAMPOS = [
    {"name": "Rodrigo Mendoza", "address": "Los Mochis, Ahome, Sinaloa"},
    {"name": "Ramirez Mexicano", "address": "Los Mochis, Ahome, Sinaloa"},
    {"name": "Reyes Felix", "address": "Los Mochis, Ahome, Sinaloa"},
    {"name": "MAS", "address": "Los Mochis, Ahome, Sinaloa"},
    {"name": "Agronomo", "address": "Los Mochis, Ahome, Sinaloa"},
    {"name": "Softbol #1 (Normal)", "address": "Los Mochis, Ahome, Sinaloa"},
    {"name": "Chema Leal", "address": "Los Mochis, Ahome, Sinaloa"},
    {"name": "El Rotario", "address": "Los Mochis, Ahome, Sinaloa"},
]

# =============================================================================
# CATEGORÍAS Y EQUIPOS (de las imágenes de programación)
# =============================================================================

# ---- CATEGORÍA NUEVOS VALORES ----
CATEGORIAS_NV = {
    # Escuelita Nuevos Valores
    "Escuelita Nuevos Valores": {
        "equipos": [
            "ESNV_DEP Sair Uzarraga", "Blue Jays",
            "ESNV_DEP Luis Almeida", "Red Sox",
            "ESNV_DEP Carlos Serrano", "ESNV_DEP Omar Amado",
            "ESNV_DEP Fortunato Ruiz",
        ],
        "juegos": [
            {"hora": "16:30", "local": "ESNV_DEP Sair Uzarraga", "visitante": "Blue Jays", "campo": "Rodrigo Mendoza", "fecha": "2026-02-28"},
            {"hora": "08:30", "local": "ESNV_DEP Luis Almeida", "visitante": "Red Sox", "campo": "Rodrigo Mendoza", "fecha": "2026-03-01"},
            {"hora": "11:00", "local": "ESNV_DEP Carlos Serrano", "visitante": "ESNV_DEP Omar Amado", "campo": "Rodrigo Mendoza", "fecha": "2026-03-01"},
        ],
        "descansa": "ESNV_DEP Fortunato Ruiz",
    },
    # Pinguica Nuevos Valores
    "Pinguica Nuevos Valores": {
        "equipos": [
            "Sushi Tai", "Transportes Mardan",
            "Cachorros", "Tostadas Miriam",
            "PINV_DEP Antonio Ortega Jr", "El 22 Sublimacion",
            "PINV_DEP Agustin Flores",
        ],
        "juegos": [
            {"hora": "08:30", "local": "Sushi Tai", "visitante": "Transportes Mardan", "campo": "Ramirez Mexicano", "fecha": "2026-02-28"},
            {"hora": "11:30", "local": "Cachorros", "visitante": "Tostadas Miriam", "campo": "Ramirez Mexicano", "fecha": "2026-02-28"},
            {"hora": "15:00", "local": "PINV_DEP Antonio Ortega Jr", "visitante": "El 22 Sublimacion", "campo": "Ramirez Mexicano", "fecha": "2026-03-02"},
        ],
        "descansa": "PINV_DEP Agustin Flores",
    },
    # Infantil Menor Nuevos Valores
    "Infantil Menor Nuevos Valores": {
        "equipos": [
            "Potato LR", "Bayer Instituto Andes",
            "Cañoneros", "IMNV_DEP Mochicahui",
            "OCA Agroinsumos", "Dbacks",
            "IMNV_DEP Deyvin Valdez", "Potrillo Inmobiliario",
            "Padres",
        ],
        "juegos": [
            {"hora": "08:30", "local": "Potato LR", "visitante": "Bayer Instituto Andes", "campo": "Reyes Felix", "fecha": "2026-02-28"},
            {"hora": "11:30", "local": "Cañoneros", "visitante": "IMNV_DEP Mochicahui", "campo": "Reyes Felix", "fecha": "2026-02-28"},
            {"hora": "14:00", "local": "OCA Agroinsumos", "visitante": "Dbacks", "campo": "Reyes Felix", "fecha": "2026-02-28"},
            {"hora": "17:00", "local": "IMNV_DEP Deyvin Valdez", "visitante": "Potrillo Inmobiliario", "campo": "Reyes Felix", "fecha": "2026-02-28"},
        ],
        "descansa": "Padres",
    },
    # Infantil Mayor Nuevos Valores
    "Infantil Mayor Nuevos Valores": {
        "equipos": [
            "MVP Uniformes Valeria", "Transportes Aledarma",
            "IMNV_Toros Mochicahui", "IMNV_DEP JL Atondo",
            "Autotraslados Rubio", "El 22 Sublimacion",
            "Cachorros Emme", "IMNV_DEP Luis Villegas",
            "La Consentida", "Yankees",
        ],
        "juegos": [
            {"hora": "15:30", "local": "MVP Uniformes Valeria", "visitante": "Transportes Aledarma", "campo": "MAS", "fecha": "2026-02-27"},
            {"hora": "08:30", "local": "IMNV_Toros Mochicahui", "visitante": "IMNV_DEP JL Atondo", "campo": "MAS", "fecha": "2026-02-28"},
            {"hora": "11:30", "local": "Autotraslados Rubio", "visitante": "El 22 Sublimacion", "campo": "MAS", "fecha": "2026-02-28"},
            {"hora": "14:00", "local": "Cachorros Emme", "visitante": "IMNV_DEP Luis Villegas", "campo": "MAS", "fecha": "2026-02-28"},
            {"hora": "17:00", "local": "La Consentida", "visitante": "Yankees", "campo": "MAS", "fecha": "2026-02-28"},
        ],
    },
    # Juvenil Menor Nuevos Valores
    "Juvenil Menor Nuevos Valores": {
        "equipos": [
            "JMNV_DEP Fortunato Ruiz", "JMNV_DEP Ignacio Almeida",
            "JMNV_DEP Jose Luis Atondo", "JMNV_DEP Mochicahui",
            "Molinera del Fuerte", "Granja Trevizo",
            "Diez 89", "JMNV_Toros Mochicahui",
            "Nik Clean Power",
        ],
        "juegos": [
            {"hora": "08:30", "local": "JMNV_DEP Fortunato Ruiz", "visitante": "JMNV_DEP Ignacio Almeida", "campo": "Agronomo", "fecha": "2026-02-28"},
            {"hora": "11:30", "local": "JMNV_DEP Jose Luis Atondo", "visitante": "JMNV_DEP Mochicahui", "campo": "Agronomo", "fecha": "2026-02-28"},
            {"hora": "08:30", "local": "Molinera del Fuerte", "visitante": "Granja Trevizo", "campo": "Softbol #1 (Normal)", "fecha": "2026-02-28"},
            {"hora": "13:30", "local": "Diez 89", "visitante": "JMNV_Toros Mochicahui", "campo": "Softbol #1 (Normal)", "fecha": "2026-02-28"},
        ],
        "descansa": "Nik Clean Power",
    },
}

# ---- CATEGORÍA PESADA ----
CATEGORIAS_PESADA = {
    # Pañalitos (Pesada)
    "Pañalitos Pesada": {
        "equipos": [
            "DEP Jesus Perez", "D-Backs Arizona",
            "Llantera Herrera", "Megablock",
            "Baby Beis", "Sandoval Baseball Academy",
            "Cocina Sra Chayito MVP",
        ],
        "juegos": [
            {"hora": "16:30", "local": "DEP Jesus Perez", "visitante": "D-Backs Arizona", "campo": "Chema Leal", "fecha": "2026-03-02"},
            {"hora": "08:30", "local": "Llantera Herrera", "visitante": "Megablock", "campo": "Chema Leal", "fecha": "2026-03-01"},
            {"hora": "11:00", "local": "Baby Beis", "visitante": "Sandoval Baseball Academy", "campo": "Chema Leal", "fecha": "2026-03-01"},
        ],
        "descansa": "Cocina Sra Chayito MVP",
    },
    # Escuelita Pesada
    "Escuelita Pesada": {
        "equipos": [
            "Yankees de Colores", "Sandoval Baseball Academy",
            "Baby Beis", "Mariscos El Tungar",
            "MVP Agrosanidad", "Univormes Inova",
        ],
        "juegos": [
            {"hora": "16:30", "local": "Yankees de Colores", "visitante": "Sandoval Baseball Academy", "campo": "El Rotario", "fecha": "2026-02-27"},
            {"hora": "08:30", "local": "Baby Beis", "visitante": "Mariscos El Tungar", "campo": "El Rotario", "fecha": "2026-03-01"},
            {"hora": "11:00", "local": "MVP Agrosanidad", "visitante": "Univormes Inova", "campo": "El Rotario", "fecha": "2026-03-01"},
        ],
    },
    # Pinguica Pesada
    "Pinguica Pesada": {
        "equipos": [
            "MVP Taco Parado", "Sandoval Baseball Academy",
            "Uniformes Valeria", "DEP Mingo Vazquez",
            "Uniformes Inova", "El 22 Sublimacion",
        ],
        "juegos": [
            {"hora": "08:30", "local": "MVP Taco Parado", "visitante": "Sandoval Baseball Academy", "campo": "Ramirez Mexicano", "fecha": "2026-03-01"},
            {"hora": "11:30", "local": "Uniformes Valeria", "visitante": "DEP Mingo Vazquez", "campo": "Ramirez Mexicano", "fecha": "2026-03-01"},
            {"hora": "14:00", "local": "Uniformes Inova", "visitante": "El 22 Sublimacion", "campo": "Ramirez Mexicano", "fecha": "2026-03-01"},
        ],
    },
    # Infantil Menor Pesada
    "Infantil Menor Pesada": {
        "equipos": [
            "Marva", "Uniformes Inova",
            "Progagrop", "Sandoval Baseball Academy",
            "IMEP_MVP Athletes", "Electrica Perez - Cardenales",
            "Taller SAC",
        ],
        "juegos": [
            {"hora": "08:30", "local": "Marva", "visitante": "Uniformes Inova", "campo": "Reyes Felix", "fecha": "2026-03-01"},
            {"hora": "11:30", "local": "Progagrop", "visitante": "Sandoval Baseball Academy", "campo": "Reyes Felix", "fecha": "2026-03-01"},
            {"hora": "14:00", "local": "IMEP_MVP Athletes", "visitante": "Electrica Perez - Cardenales", "campo": "Reyes Felix", "fecha": "2026-03-01"},
        ],
        "descansa": "Taller SAC",
    },
    # Infantil Mayor Pesada
    "Infantil Mayor Pesada": {
        "equipos": [
            "Diablos DEP Almeida", "Hit & Pitch",
            "Marver Refacciones", "MVP Classico",
            "Sandoval Baseball Academy", "Rejalab",
            "Pescaderia Escalante", "BIL SC",
        ],
        "juegos": [
            {"hora": "08:30", "local": "Diablos DEP Almeida", "visitante": "Hit & Pitch", "campo": "MAS", "fecha": "2026-03-01"},
            {"hora": "11:30", "local": "Marver Refacciones", "visitante": "MVP Classico", "campo": "MAS", "fecha": "2026-03-01"},
            {"hora": "14:00", "local": "Sandoval Baseball Academy", "visitante": "Rejalab", "campo": "MAS", "fecha": "2026-03-01"},
            {"hora": "17:00", "local": "Pescaderia Escalante", "visitante": "BIL SC", "campo": "MAS", "fecha": "2026-03-02"},
        ],
    },
    # Juvenil Menor Pesada
    "Juvenil Menor Pesada": {
        "equipos": [
            "Arizona ATLM-Kelly", "DEP Esparragoza",
            "MVP", "Instituto CIMA",
            "Sandoval Baseball Academy", "Rodriguez Talamante",
            "Five Brothers", "BIL SC",
            "Dekalb DEP Almeida",
        ],
        "juegos": [
            {"hora": "08:30", "local": "Arizona ATLM-Kelly", "visitante": "DEP Esparragoza", "campo": "Agronomo", "fecha": "2026-03-01"},
            {"hora": "08:30", "local": "MVP", "visitante": "Instituto CIMA", "campo": "Softbol #1 (Normal)", "fecha": "2026-03-01"},
            {"hora": "11:30", "local": "Sandoval Baseball Academy", "visitante": "Rodriguez Talamante", "campo": "Agronomo", "fecha": "2026-03-01"},
            {"hora": "11:30", "local": "Five Brothers", "visitante": "BIL SC", "campo": "Softbol #1 (Normal)", "fecha": "2026-03-01"},
        ],
        "descansa": "Dekalb DEP Almeida",
    },
}


def crear_ampayers_anotadores():
    """Crea usuarios para cada ampayer/anotador de la lista oficial."""
    print("\n" + "="*60)
    print("📋 CREANDO AMPAYERS Y ANOTADORES...")
    print("="*60)
    
    creados = 0
    existentes = 0
    
    for i, persona in enumerate(AMPAYERS_ANOTADORES):
        nombre_completo = persona["nombre"]
        curp = persona["curp"]
        
        # Generar username basado en nombre
        partes = nombre_completo.lower().split()
        if len(partes) >= 2:
            username = f"{partes[0]}_{partes[1]}"
        else:
            username = partes[0]
        
        # Limitar longitud de username
        username = username[:20]
        
        # Separar nombres
        if len(partes) >= 3:
            first_name = " ".join(partes[:2])
            last_name = " ".join(partes[2:])
        elif len(partes) == 2:
            first_name = partes[0]
            last_name = partes[1]
        else:
            first_name = partes[0]
            last_name = ""
        
        # Alternar entre roles AMPAYER y SCORER
        # Los primeros 25 serán ampayers, los últimos 9 anotadores
        # (distribución aproximada basada en necesidad)
        if i < 25:
            role = User.Role.AMPAYER
        else:
            role = User.Role.SCORER
        
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': f'{username}@ligaahome.com',
                'first_name': first_name.title(),
                'last_name': last_name.title(),
                'role': role,
            }
        )
        
        if created:
            user.set_password('pass123')
            user.save()
            # Crear perfil
            UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'phone_number': '',
                    'certification_level': 'Nivel Local',
                }
            )
            creados += 1
            role_display = "🟢 Ampayer" if role == User.Role.AMPAYER else "🔵 Anotador"
            print(f"  ✅ {role_display}: {nombre_completo} -> usuario: {username}")
        else:
            existentes += 1
            print(f"  ⏩ Ya existe: {nombre_completo} -> {username}")
    
    print(f"\n  📊 Resultado: {creados} creados, {existentes} ya existían")
    return creados


def crear_liga_ahome():
    """Crea la Liga de Ahome, temporada y estructura."""
    print("\n" + "="*60)
    print("🏆 CREANDO LIGA DE AHOME...")
    print("="*60)
    
    # Buscar o crear presidente
    pres, _ = User.objects.get_or_create(
        username='pres_ahome',
        defaults={
            'email': 'presidente@ligaahome.com',
            'first_name': 'Presidente',
            'last_name': 'Liga Ahome',
            'role': User.Role.LEAGUE_PRESIDENT,
        }
    )
    if not pres.has_usable_password():
        pres.set_password('pass123')
        pres.save()
    
    # Liga
    liga, created = League.objects.get_or_create(
        slug='liga-ahome',
        defaults={
            'name': 'Liga Infantil y Juvenil de Beisbol Municipal de Ahome, A.C.',
            'city': 'Los Mochis, Ahome, Sinaloa',
            'president': pres,
            'description': 'Afiliada a la Asociación de Ligas Infantiles de Beisbol de la República Mexicana, A.C. y a la Federación Mexicana de Beisbol. Región VII.',
        }
    )
    if created:
        print(f"  ✅ Liga creada: {liga.name}")
    else:
        print(f"  ⏩ Liga ya existe: {liga.name}")
    
    # Temporada
    temporada, created = Season.objects.get_or_create(
        league=liga,
        name='Temporada 2025-2026 "LCP Jorge Armando Gámez Manzanarez"',
        defaults={
            'start_date': date(2025, 9, 1),
            'end_date': date(2026, 6, 30),
            'is_active': True,
        }
    )
    if created:
        print(f"  ✅ Temporada creada: {temporada.name}")
    else:
        print(f"  ⏩ Temporada ya existe: {temporada.name}")
    
    return liga, temporada


def crear_campos():
    """Crea los campos/estadios de la Liga de Ahome."""
    print("\n" + "="*60)
    print("🏟️  CREANDO CAMPOS...")
    print("="*60)
    
    campos_creados = {}
    for campo_data in CAMPOS:
        campo, created = Stadium.objects.get_or_create(
            name=campo_data["name"],
            defaults={'address': campo_data["address"]}
        )
        campos_creados[campo_data["name"]] = campo
        status_icon = "✅" if created else "⏩"
        print(f"  {status_icon} Campo: {campo.name}")
    
    return campos_creados


def crear_categorias_y_equipos(temporada, categorias_dict, grupo_nombre):
    """Crea categorías y equipos para un grupo (Nuevos Valores o Pesada)."""
    print(f"\n  📂 Grupo: {grupo_nombre}")
    
    categorias_creadas = {}
    
    for cat_nombre, cat_data in categorias_dict.items():
        full_name = f"{cat_nombre} (Jornada 13 - Segunda Vuelta)"
        categoria, created = Category.objects.get_or_create(
            season=temporada,
            name=cat_nombre,
            defaults={'description': f'{grupo_nombre} - Jornada 13'}
        )
        status_icon = "✅" if created else "⏩"
        print(f"    {status_icon} Categoría: {cat_nombre}")
        
        # Crear equipos
        equipos_creados = {}
        for equipo_nombre in cat_data["equipos"]:
            short = equipo_nombre[:3].upper()
            equipo, eq_created = Team.objects.get_or_create(
                category=categoria,
                name=equipo_nombre,
                defaults={'short_name': short}
            )
            equipos_creados[equipo_nombre] = equipo
            if eq_created:
                print(f"      ⚾ Equipo: {equipo_nombre}")
        
        categorias_creadas[cat_nombre] = {
            'categoria': categoria,
            'equipos': equipos_creados,
            'juegos': cat_data.get('juegos', []),
        }
    
    return categorias_creadas


def crear_juegos(categorias_creadas, campos):
    """Crea los juegos de la jornada."""
    print("\n" + "="*60)
    print("📅 CREANDO JUEGOS DE LA JORNADA 13...")
    print("="*60)
    
    juegos_creados = 0
    juegos_existentes = 0
    
    # Obtener lista de ampayers y anotadores para asignar
    ampayers_disponibles = list(User.objects.filter(role=User.Role.AMPAYER).order_by('id'))
    anotadores_disponibles = list(User.objects.filter(role=User.Role.SCORER).order_by('id'))
    
    amp_index = 0
    anot_index = 0
    
    for cat_nombre, cat_info in categorias_creadas.items():
        categoria = cat_info['categoria']
        equipos = cat_info['equipos']
        juegos = cat_info['juegos']
        
        for juego_data in juegos:
            local_nombre = juego_data['local']
            visitante_nombre = juego_data['visitante']
            campo_nombre = juego_data['campo']
            fecha_str = juego_data['fecha']
            hora_str = juego_data['hora']
            
            # Buscar equipos
            local_team = equipos.get(local_nombre)
            visitante_team = equipos.get(visitante_nombre)
            
            if not local_team or not visitante_team:
                print(f"  ⚠️  Equipo no encontrado: {local_nombre} o {visitante_nombre} en categoría {cat_nombre}")
                continue
            
            # Buscar campo
            campo = campos.get(campo_nombre)
            if not campo:
                print(f"  ⚠️  Campo no encontrado: {campo_nombre}")
                continue
            
            # Parsear fecha y hora
            fecha = date.fromisoformat(fecha_str)
            h, m = hora_str.split(':')
            hora = time(int(h), int(m))
            
            # Obtener temporada desde la categoría
            temporada = categoria.season
            
            # Asignar ampayers y anotadores de forma rotatoria
            amp1 = ampayers_disponibles[amp_index % len(ampayers_disponibles)] if ampayers_disponibles else None
            amp2 = ampayers_disponibles[(amp_index + 1) % len(ampayers_disponibles)] if ampayers_disponibles else None
            scorer1 = anotadores_disponibles[anot_index % len(anotadores_disponibles)] if anotadores_disponibles else None
            
            amp_index += 2
            anot_index += 1
            
            game, created = Game.objects.get_or_create(
                local_team=local_team,
                visitor_team=visitante_team,
                date=fecha,
                time=hora,
                defaults={
                    'season': temporada,
                    'category': categoria,
                    'stadium': campo,
                    'status': Game.Status.PENDING,
                    'ampayer_1': amp1,
                    'ampayer_2': amp2,
                    'scorer_1': scorer1,
                }
            )
            
            if created:
                juegos_creados += 1
                amp1_name = amp1.first_name if amp1 else "Sin asignar"
                amp2_name = amp2.first_name if amp2 else "Sin asignar"
                scorer1_name = scorer1.first_name if scorer1 else "Sin asignar"
                print(f"  ✅ {fecha} {hora_str} | {local_nombre} vs {visitante_nombre} @ {campo_nombre}")
                print(f"     👨‍⚖️ Amp1: {amp1_name} | Amp2: {amp2_name} | 📋 Anot: {scorer1_name}")
            else:
                juegos_existentes += 1
    
    print(f"\n  📊 Resultado: {juegos_creados} juegos creados, {juegos_existentes} ya existían")
    return juegos_creados


def crear_admin_ahome():
    """Crea usuario administrador para la asociación de ampayers."""
    print("\n" + "="*60)
    print("👤 CREANDO ADMINISTRADOR DE AMPAYERS...")
    print("="*60)

    admin, created = User.objects.get_or_create(
        username='admin_ahome',
        defaults={
            'email': 'admin@ligaahome.com',
            'first_name': 'Admin',
            'last_name': 'Ampayers Ahome',
            'role': User.Role.ADMIN_AMPAYER,
            'is_staff': True,
        }
    )
    if created or not admin.has_usable_password():
        admin.set_password('pass123')
        admin.save()
        print(f"  ✅ Admin creado: admin_ahome (pass123)")
    else:
        print(f"  ⏩ Admin ya existe: admin_ahome")


def main():
    print("\n" + "🔵" * 30)
    print("  LIGA INFANTIL Y JUVENIL DE BEISBOL")
    print("  MUNICIPAL DE AHOME, A.C.")
    print("  Temporada 2025-2026")
    print("  Jornada 13 - 28 Feb al 01 Mar 2026")
    print("🔵" * 30)
    
    # 1. Crear Admin
    crear_admin_ahome()
    
    # 2. Crear Ampayers y Anotadores
    crear_ampayers_anotadores()
    
    # 3. Crear Liga y Temporada
    liga, temporada = crear_liga_ahome()
    
    # 4. Crear Campos
    campos = crear_campos()
    
    # 5. Crear Categorías Nuevos Valores
    print("\n" + "="*60)
    print("⚾ CREANDO CATEGORÍAS Y EQUIPOS...")
    print("="*60)
    
    cats_nv = crear_categorias_y_equipos(temporada, CATEGORIAS_NV, "Categoría Nuevos Valores")
    cats_pesada = crear_categorias_y_equipos(temporada, CATEGORIAS_PESADA, "Categoría Pesada")
    
    # 6. Combinar todas las categorías
    todas_categorias = {**cats_nv, **cats_pesada}
    
    # 7. Crear Juegos
    crear_juegos(todas_categorias, campos)
    
    # Resumen final
    print("\n" + "="*60)
    print("📊 RESUMEN FINAL")
    print("="*60)
    print(f"  👥 Ampayers/Anotadores: {User.objects.filter(role__in=[User.Role.AMPAYER, User.Role.SCORER]).count()}")
    print(f"  🏆 Ligas: {League.objects.count()}")
    print(f"  📅 Temporadas: {Season.objects.count()}")
    print(f"  📂 Categorías: {Category.objects.count()}")
    print(f"  ⚾ Equipos: {Team.objects.count()}")
    print(f"  🏟️  Campos: {Stadium.objects.count()}")
    print(f"  🎮 Juegos: {Game.objects.count()}")
    print(f"\n  ✅ ¡Datos de la Liga de Ahome cargados exitosamente!")
    print("="*60)


if __name__ == '__main__':
    main()

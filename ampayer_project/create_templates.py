from openpyxl import Workbook
import os

def create_template(filename, headers):
    wb = Workbook()
    ws = wb.active
    ws.title = "Plantilla"
    for col_num, header in enumerate(headers, 1):
        ws.cell(row=1, column=col_num, value=header)
    
    # Save to templates directory
    if not os.path.exists('templates'):
        os.makedirs('templates')
    
    path = os.path.join('templates', filename)
    wb.save(path)
    print(f"Created {path}")

# Stadiums
create_template("plantilla_estadios.xlsx", ["Nombre", "Direccion", "Capacidad", "Contacto Manager"])

# Teams
create_template("plantilla_equipos.xlsx", ["Liga", "Temporada", "Categoria", "Nombre Equipo", "Nombre Corto", "Manager"])

# Players
create_template("plantilla_jugadores.xlsx", ["Equipo", "Nombre", "Apellido", "Numero Jersey", "Posiciones (separadas por coma)"])

# Hierarchy
create_template("plantilla_jerarquia.xlsx", ["Liga", "Temporada", "Temporada Fecha Inicio (YYYY-MM-DD)", "Temporada Fecha Fin (YYYY-MM-DD)", "Categoria"])

# Users (Ampayers/Scorers)
create_template("plantilla_personal.xlsx", ["Username", "Nombre", "Apellido", "Email", "Password", "Rol (ampayer/scorer)"])

print("\nAll templates created in /templates/ directory. bitumen.")

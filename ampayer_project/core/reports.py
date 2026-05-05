import io
from django.http import HttpResponse
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, Border, Side
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from .models import Game, LineupEntry, PitchingStats

def generate_excel_boxscore(game: Game):
    """
    Generate an Excel file with the box score of the game.
    """
    wb = Workbook()
    ws = wb.active
    ws.title = f"Box Score {game.id}"

    # Header
    ws['A1'] = f"{game.local_team.name} vs {game.visitor_team.name}"
    ws['A1'].font = Font(bold=True, size=14)
    ws.merge_cells('A1:I1')
    
    ws['A2'] = f"Estadio: {game.stadium.name} | Fecha: {game.date}"
    ws.merge_cells('A2:I2')

    row_num = 4

    # Function to add team stats
    def add_team_stats(team, lineups, title):
        nonlocal row_num
        ws.cell(row=row_num, column=1, value=title).font = Font(bold=True)
        row_num += 1
        
        headers = ['Jugador', 'Pos', 'AB', 'R', 'H', 'RBI', 'BB', 'SO', 'AVG']
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=row_num, column=col, value=header)
            cell.font = Font(bold=True)
            cell.border = Border(bottom=Side(style='thin'))
        row_num += 1

        for entry in lineups:
            avg = "0.000" # Placeholder logic, ideally calc from model
            # Use stats from entry (some fields might be missing in model if not migrated yet?)
            # Assuming stats fields exist as per previous task
            ws.cell(row=row_num, column=1, value=f"{entry.player.first_name} {entry.player.last_name}")
            ws.cell(row=row_num, column=2, value=entry.field_position)
            ws.cell(row=row_num, column=3, value=entry.AB)
            ws.cell(row=row_num, column=4, value=entry.R)
            ws.cell(row=row_num, column=5, value=entry.H)
            ws.cell(row=row_num, column=6, value=entry.RBI)
            ws.cell(row=row_num, column=7, value=entry.BB)
            ws.cell(row=row_num, column=8, value=entry.SO)
            ws.cell(row=row_num, column=9, value=str(entry.avg_val if hasattr(entry, 'avg_val') else 0.000))
            row_num += 1
        
        row_num += 2

    # Local Team
    local_lineup = LineupEntry.objects.filter(game=game, team=game.local_team).order_by('batting_order')
    add_team_stats(game.local_team, local_lineup, f"Equipo Local: {game.local_team.name}")

    # Visitor Team
    visitor_lineup = LineupEntry.objects.filter(game=game, team=game.visitor_team).order_by('batting_order')
    add_team_stats(game.visitor_team, visitor_lineup, f"Equipo Visitante: {game.visitor_team.name}")

    # Adjust widths
    ws.column_dimensions['A'].width = 25
    

    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = f'attachment; filename=boxscore_{game.id}.xlsx'
    wb.save(response)
    return response

def generate_pdf_boxscore(game: Game):
    """
    Generate a PDF file with the box score.
    """
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename=boxscore_{game.id}.pdf'

    doc = SimpleDocTemplate(response, pagesize=landscape(letter))
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = styles['Title']
    normal_style = styles['Normal']

    # Header
    elements.append(Paragraph(f"{game.local_team.name} vs {game.visitor_team.name}", title_style))
    elements.append(Paragraph(f"Estadio: {game.stadium.name} | Fecha: {game.date}", normal_style))
    elements.append(Spacer(1, 12))

    # Helper for table data
    def get_team_data(team, lineups):
        data = [['Jugador', 'Pos', 'AB', 'R', 'H', 'RBI', 'BB', 'SO']]
        for entry in lineups:
            data.append([
                f"{entry.player.first_name} {entry.player.last_name}",
                entry.field_position,
                str(entry.AB),
                str(entry.R),
                str(entry.H),
                str(entry.RBI),
                str(entry.BB),
                str(entry.SO),
            ])
        return data

    # Local Team Table
    elements.append(Paragraph(f"<b>Equipo Local: {game.local_team.name}</b>", normal_style))
    local_lineup = LineupEntry.objects.filter(game=game, team=game.local_team).order_by('batting_order')
    local_data = get_team_data(game.local_team, local_lineup)
    
    t_local = Table(local_data)
    t_local.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(t_local)
    elements.append(Spacer(1, 20))

    # Visitor Team Table
    elements.append(Paragraph(f"<b>Equipo Visitante: {game.visitor_team.name}</b>", normal_style))
    visitor_lineup = LineupEntry.objects.filter(game=game, team=game.visitor_team).order_by('batting_order')
    visitor_data = get_team_data(game.visitor_team, visitor_lineup)
    
    t_visitor = Table(visitor_data)
    t_visitor.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(t_visitor)

    doc.build(elements)
    return response

def generate_digital_acta(game: Game):
    """
    Generate a comprehensive Digital Minute (Acta Digital) PDF.
    Includes Box Score, Substitutions, and Play-by-Play.
    """
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename=acta_digital_{game.id}.pdf'

    doc = SimpleDocTemplate(response, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    header_style = styles['Title']
    subheader_style = styles['Heading2']
    section_style = styles['Heading3']
    normal_style = styles['Normal']

    # 1. Page Header
    elements.append(Paragraph(f"ACTA DIGITAL DE JUEGO", header_style))
    elements.append(Paragraph(f"<b>{game.local_team.name} vs {game.visitor_team.name}</b>", subheader_style))
    elements.append(Spacer(1, 10))
    
    # 2. Game Info
    info_data = [
        [f"Fecha: {game.date}", f"Hora: {game.time}", f"Estadio: {game.stadium.name}"],
        [f"Categoría: {game.category.name if game.category else '-'}", f"Temporada: {game.season.name if game.season else '-'}", ""],
        [f"Anotador: {game.scorer_1 if game.scorer_1 else '-'}", f"Ampayer: {game.ampayer_1 if game.ampayer_1 else '-'}", ""]
    ]
    t_info = Table(info_data, colWidths=[180, 150, 180])
    t_info.setStyle(TableStyle([
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey)
    ]))
    elements.append(t_info)
    elements.append(Spacer(1, 15))

    # 3. Lineups with History
    def add_lineup_section(title, team):
        elements.append(Paragraph(title, section_style))
        lineup = LineupEntry.objects.filter(game=game, team=team).order_by('batting_order', 'entry_inning')
        
        data = [['#', 'Jugador', 'Pos', 'E. Ent', 'E. Sal', 'AB', 'R', 'H', 'RBI']]
        for entry in lineup:
            data.append([
                str(entry.batting_order),
                f"{entry.player.first_name} {entry.player.last_name}",
                entry.field_position,
                str(entry.entry_inning),
                str(entry.exit_inning) if entry.exit_inning else "-",
                str(entry.AB), str(entry.R), str(entry.H), str(entry.RBI)
            ])
        
        t = Table(data, hAlign='LEFT')
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e3a8a")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('FONTSIZE', (0,0), (-1,-1), 8)
        ]))
        elements.append(t)
        elements.append(Spacer(1, 10))

    add_lineup_section(f"Lineup Local: {game.local_team.name}", game.local_team)
    add_lineup_section(f"Lineup Visitante: {game.visitor_team.name}", game.visitor_team)

    # 4. Play-by-Play Log
    elements.append(Paragraph("Resumen de Jugadas / Bitácora", section_style))
    plays = game.plays.all().order_by('id')
    
    play_data = [['Inn', 'Mitad', 'Bateador', 'Evento', 'R', 'O', 'Detalle']]
    for p in plays:
        play_data.append([
            str(p.inning),
            "Alta" if p.half == 'top' else "Baja",
            f"{p.batter.first_name if p.batter else 'Sust'}",
            p.event_type.capitalize(),
            str(p.runs_scored),
            str(p.outs_recorded),
            p.play_description or "-"
        ])
    
    if len(play_data) > 1:
        t_plays = Table(play_data, colWidths=[30, 40, 90, 80, 20, 20, 200])
        t_plays.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#d1d5db")),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('FONTSIZE', (0,0), (-1,-1), 7)
        ]))
        elements.append(t_plays)
    else:
        elements.append(Paragraph("No hay jugadas registradas aún.", normal_style))

    # 5. Summary and Signatures
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(f"Puntuación Final: {game.local_team.name} {game.home_score} - {game.away_score} {game.visitor_team.name}", normal_style))
    
    sig_data = [
        ["_"*30, "_"*30],
        ["Firma Anotador", "Firma Ampayer Principal"]
    ]
    t_sig = Table(sig_data, colWidths=[250, 250])
    t_sig.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 40)
    ]))
    elements.append(t_sig)

    doc.build(elements)
    return response

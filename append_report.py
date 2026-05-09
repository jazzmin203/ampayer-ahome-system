
new_func = """

def generate_umpire_distribution_pdf(games_queryset):
    from reportlab.lib.units import cm
    from reportlab.lib.enums import TA_CENTER
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import HRFlowable
    import datetime

    response = HttpResponse(content_type="application/pdf")
    today_str = str(datetime.date.today())
    response["Content-Disposition"] = "attachment; filename=distribucion_ampayers_" + today_str + ".pdf"

    doc = SimpleDocTemplate(
        response, pagesize=letter,
        rightMargin=1.5*cm, leftMargin=1.5*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )
    elements = []
    styles = getSampleStyleSheet()

    C_NAVY    = colors.HexColor("#1e3a5f")
    C_BLUE    = colors.HexColor("#2563eb")
    C_LIGHT   = colors.HexColor("#e8f0fe")
    C_WHITE   = colors.white
    C_GRAY50  = colors.HexColor("#f9fafb")
    C_GRAY200 = colors.HexColor("#e5e7eb")
    C_GRAY700 = colors.HexColor("#374151")
    C_GREEN   = colors.HexColor("#16a34a")
    C_AMBER   = colors.HexColor("#d97706")
    C_RED     = colors.HexColor("#dc2626")

    def ps(name, **kw):
        return ParagraphStyle(name, parent=styles["Normal"], **kw)

    title_s    = ps("RT",  fontSize=18, fontName="Helvetica-Bold", textColor=C_WHITE, alignment=TA_CENTER)
    subtitle_s = ps("RS",  fontSize=9,  fontName="Helvetica",      textColor=C_LIGHT, alignment=TA_CENTER)
    head_s     = ps("HS",  fontSize=7,  fontName="Helvetica-Bold", textColor=C_WHITE, alignment=TA_CENTER)
    cell_s     = ps("CS",  fontSize=7,  fontName="Helvetica",      textColor=C_GRAY700, alignment=TA_CENTER)
    bold_s     = ps("BS",  fontSize=7,  fontName="Helvetica-Bold", textColor=C_NAVY, alignment=TA_CENTER)
    footer_s   = ps("FS",  fontSize=7,  fontName="Helvetica",      textColor=colors.HexColor("#9ca3af"), alignment=TA_CENTER)
    stat_s     = ps("STC", fontSize=8,  fontName="Helvetica-Bold", textColor=C_WHITE, alignment=TA_CENTER)

    hdr_t = Table([[Paragraph("DISTRIBUCION DE AMPAYERS Y ANOTADORES", title_s)]], colWidths=[doc.width])
    hdr_t.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,-1), C_NAVY),
        ("ALIGN",        (0,0),(-1,-1), "CENTER"),
        ("TOPPADDING",   (0,0),(-1,-1), 14),
        ("BOTTOMPADDING",(0,0),(-1,-1), 6),
    ]))
    elements.append(hdr_t)

    date_label = datetime.date.today().strftime("%d/%m/%Y")
    sub_t = Table([[Paragraph("Coordinacion de Oficiales  |  Emitido: " + date_label, subtitle_s)]], colWidths=[doc.width])
    sub_t.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,-1), C_BLUE),
        ("ALIGN",        (0,0),(-1,-1), "CENTER"),
        ("TOPPADDING",   (0,0),(-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
    ]))
    elements.append(sub_t)
    elements.append(Spacer(1, 14))

    games_list = list(games_queryset.select_related(
        "local_team","visitor_team","stadium","category",
        "ampayer_1","ampayer_2","ampayer_3","scorer_1","scorer_2"
    ).order_by("date","time"))

    total      = len(games_list)
    assigned   = sum(1 for g in games_list if g.ampayer_1)
    unassigned = total - assigned

    stats_t = Table([[
        Paragraph("<b>" + str(total) + "</b>\\nJuegos Totales", stat_s),
        Paragraph("<b>" + str(assigned) + "</b>\\nCon Ampayer",  stat_s),
        Paragraph("<b>" + str(unassigned) + "</b>\\nPor Asignar", stat_s),
    ]], colWidths=[doc.width/3]*3)
    stats_t.setStyle(TableStyle([
        ("BACKGROUND", (0,0),(0,-1), C_BLUE),
        ("BACKGROUND", (1,0),(1,-1), C_GREEN),
        ("BACKGROUND", (2,0),(2,-1), C_AMBER if unassigned > 0 else C_GREEN),
        ("ALIGN",      (0,0),(-1,-1), "CENTER"),
        ("VALIGN",     (0,0),(-1,-1), "MIDDLE"),
        ("TOPPADDING", (0,0),(-1,-1), 10),
        ("BOTTOMPADDING",(0,0),(-1,-1), 10),
        ("GRID",       (0,0),(-1,-1), 1, C_WHITE),
    ]))
    elements.append(stats_t)
    elements.append(Spacer(1, 12))

    col_widths = [22, 65, 42, 38, 105, 80, 95, 78]

    def amp_cell(game):
        lines = []
        labels = ["Principal","Base 1","Base 2"]
        for i, field in enumerate(["ampayer_1","ampayer_2","ampayer_3"]):
            amp = getattr(game, field, None)
            if amp:
                lines.append(str(i+1) + ". " + amp.first_name + " " + amp.last_name + " (" + labels[i] + ")")
        if not lines:
            return Paragraph("<i>Sin asignar</i>",
                ps("na" + str(id(game)), fontSize=7, textColor=C_RED, fontName="Helvetica-Oblique"))
        return Paragraph("<br/>".join(lines),
            ps("ac" + str(id(game)), fontSize=7, fontName="Helvetica", textColor=C_NAVY))

    def scr_cell(game):
        lines = []
        if game.scorer_1:
            lines.append("Ofic. " + game.scorer_1.first_name + " " + game.scorer_1.last_name)
        if game.scorer_2:
            lines.append("Aux. " + game.scorer_2.first_name + " " + game.scorer_2.last_name)
        if not lines:
            return Paragraph("<i>Sin asignar</i>",
                ps("na2" + str(id(game)), fontSize=7, textColor=colors.HexColor("#9ca3af"), fontName="Helvetica-Oblique"))
        return Paragraph("<br/>".join(lines),
            ps("sc" + str(id(game)), fontSize=7, fontName="Helvetica", textColor=C_GRAY700))

    headers = ["#","Categoria","Fecha","Hora","Juego","Estadio","Ampayers","Anotadores"]
    table_data = [[Paragraph("<b>" + h + "</b>", head_s) for h in headers]]

    for idx, game in enumerate(games_list, 1):
        match_s = ps("mt" + str(idx), fontSize=7, fontName="Helvetica-Bold", textColor=C_NAVY, alignment=TA_CENTER)
        row = [
            Paragraph("<b>" + str(idx) + "</b>", bold_s),
            Paragraph(game.category.name if game.category else "-", cell_s),
            Paragraph(game.date.strftime("%d/%m/%y") if game.date else "-", cell_s),
            Paragraph(str(game.time)[:5] if game.time else "-", cell_s),
            Paragraph("<b>" + game.local_team.name + "</b><br/>vs<br/><b>" + game.visitor_team.name + "</b>", match_s),
            Paragraph(game.stadium.name if game.stadium else "-", cell_s),
            amp_cell(game),
            scr_cell(game),
        ]
        table_data.append(row)

    main_t = Table(table_data, colWidths=col_widths, repeatRows=1)
    t_cmds = [
        ("BACKGROUND",    (0,0),(-1,0),  C_NAVY),
        ("ALIGN",         (0,0),(-1,-1), "CENTER"),
        ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
        ("FONTSIZE",      (0,0),(-1,-1), 7),
        ("TOPPADDING",    (0,0),(-1,-1), 4),
        ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ("LEFTPADDING",   (0,0),(-1,-1), 3),
        ("RIGHTPADDING",  (0,0),(-1,-1), 3),
        ("GRID",          (0,0),(-1,-1), 0.5, C_GRAY200),
        ("LINEBELOW",     (0,0),(-1,0),  1.5, C_BLUE),
    ]
    for i in range(1, len(table_data)):
        t_cmds.append(("BACKGROUND", (0,i),(-1,i), C_GRAY50 if i % 2 == 0 else C_WHITE))
    main_t.setStyle(TableStyle(t_cmds))
    elements.append(main_t)

    umpire_load = {}
    for game in games_list:
        for field in ["ampayer_1","ampayer_2","ampayer_3"]:
            amp = getattr(game, field, None)
            if amp:
                key = amp.first_name + " " + amp.last_name
                entry = (game.local_team.name + " vs " + game.visitor_team.name +
                         " (" + (game.date.strftime("%d/%m") if game.date else "") + ")")
                umpire_load.setdefault(key, []).append(entry)

    if umpire_load:
        elements.append(Spacer(1, 18))
        elements.append(HRFlowable(width=doc.width, thickness=1.5, color=C_NAVY))
        elements.append(Spacer(1, 6))
        elements.append(Paragraph("RESUMEN DE CARGA POR AMPAYER",
            ps("rh", fontSize=10, fontName="Helvetica-Bold", textColor=C_NAVY, spaceAfter=6)))

        sum_col_w = [130, 45, doc.width - 175]
        sum_data = [[
            Paragraph("<b>Ampayer</b>", head_s),
            Paragraph("<b>Juegos</b>",  head_s),
            Paragraph("<b>Partidos Asignados</b>", head_s),
        ]]
        for i, (name, glist) in enumerate(sorted(umpire_load.items(), key=lambda x: -len(x[1]))):
            sum_data.append([
                Paragraph("<b>" + name + "</b>", ps("sn" + str(i), fontSize=8, fontName="Helvetica-Bold", textColor=C_NAVY)),
                Paragraph("<b>" + str(len(glist)) + "</b>", ps("sc2" + str(i), fontSize=9, fontName="Helvetica-Bold",
                    textColor=C_BLUE, alignment=TA_CENTER)),
                Paragraph("  .  ".join(glist), ps("sd" + str(i), fontSize=7, textColor=C_GRAY700)),
            ])

        sum_t = Table(sum_data, colWidths=sum_col_w)
        sc = [
            ("BACKGROUND",    (0,0),(-1,0),  C_NAVY),
            ("GRID",          (0,0),(-1,-1), 0.5, C_GRAY200),
            ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
            ("TOPPADDING",    (0,0),(-1,-1), 4),
            ("BOTTOMPADDING", (0,0),(-1,-1), 4),
            ("LEFTPADDING",   (0,0),(-1,-1), 4),
        ]
        for i in range(1, len(sum_data)):
            sc.append(("BACKGROUND", (0,i),(-1,i), C_LIGHT if i % 2 == 0 else C_WHITE))
        sum_t.setStyle(TableStyle(sc))
        elements.append(sum_t)

    elements.append(Spacer(1, 18))
    elements.append(HRFlowable(width=doc.width, thickness=0.5, color=C_GRAY200))
    elements.append(Spacer(1, 6))
    date_gen = datetime.date.today().strftime("%d/%m/%Y")
    sig_t = Table([[
        Paragraph("____________________________\\nFirma Coordinador de Ampayers", footer_s),
        Paragraph("Sistema Ampayer - Liga Infantil y Juvenil de Beisbol\\nGenerado el " + date_gen, footer_s),
        Paragraph("____________________________\\nFirma Presidente de Liga", footer_s),
    ]], colWidths=[doc.width/3]*3)
    sig_t.setStyle(TableStyle([
        ("ALIGN",      (0,0),(-1,-1), "CENTER"),
        ("VALIGN",     (0,0),(-1,-1), "TOP"),
        ("TOPPADDING", (0,0),(-1,-1), 8),
    ]))
    elements.append(sig_t)

    doc.build(elements)
    return response
"""

with open(r'c:\Programacion_ampayers_para_IA\ampayer_project\core\reports.py', 'a', encoding='utf-8') as f:
    f.write(new_func)

print('Done! Function appended successfully.')

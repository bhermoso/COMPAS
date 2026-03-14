# Corrección terminológica: determinantes → EAS/indicadores EAS
# Solo textos visibles. NO toca funciones, variables, IDs, rutas Firebase.
import sys
path = r'C:\Users\blash\Desktop\COMPAS\index.html'
with open(path, 'rb') as f:
    content = f.read().decode('utf-8')

original_len = len(content)
cambios = []

def replace_exact(old, new, desc, required=True):
    global content
    n = content.count(old)
    if n == 0:
        if required:
            print("MISSING (%s): %r" % (desc, old[:80]))
        return
    content = content.replace(old, new)
    cambios.append((desc, n, old[:80], new[:80]))
    print("OK [%dx] %s" % (n, desc))

# ── 1. Portada — tarjeta "Analizar" ─────────────────────────────────────────
replace_exact(
    'Perfil de salud local, determinantes, indicadores y síntesis analítica.',
    'Perfil de salud local, indicadores EAS y síntesis analítica.',
    'portada tarjeta Analizar'
)

# ── 2. Gestor de fuentes — cabecera del bloque EAS ──────────────────────────
replace_exact(
    '<strong>Determinantes (EAS)</strong>',
    '<strong>Encuesta Andaluza de Salud (EAS)</strong>',
    'gestor-fuentes cabecera bloque EAS'
)

# ── 3. Kit previo — ítem de lista ───────────────────────────────────────────
replace_exact(
    '<li style="padding: 0.4rem 0; border-bottom: 1px solid #f1f5f9;">🏠 Determinantes de la salud</li>',
    '<li style="padding: 0.4rem 0; border-bottom: 1px solid #f1f5f9;">🏠 Indicadores EAS</li>',
    'kit-previo ítem lista'
)

# ── 4. Acordeón TAB 2 — cabecera sección EAS ────────────────────────────────
replace_exact(
    '<span>03 Determinantes de la salud (Selección EAS 2023)</span>',
    '<span>03 Encuesta Andaluza de Salud (EAS) — Selección 2023</span>',
    'acordeón TAB2 cabecera sección EAS'
)

# ── 5. Badge inicial badge-determinantes ────────────────────────────────────
replace_exact(
    '>📊 Determinantes: --</span>',
    '>📊 EAS: --</span>',
    'badge inicial EAS'
)

# ── 6. Badge JS dinámico (3 apariciones idénticas) ──────────────────────────
replace_exact(
    "badgeDet.textContent = '📊 Determinantes: ' + numDet + '/' + TOTAL_DETERMINANTES_EPVSA;",
    "badgeDet.textContent = '📊 EAS: ' + numDet + '/' + TOTAL_DETERMINANTES_EPVSA;",
    'badge JS dinámico (todas las apariciones)',
    required=True
)

# ── 7. Check IA panel ────────────────────────────────────────────────────────
replace_exact(
    '>⬜ Determinantes EAS</div>',
    '>⬜ Indicadores EAS</div>',
    'check-IA panel label HTML'
)
replace_exact(
    "' Determinantes EAS'",
    "' Indicadores EAS'",
    'check-IA label texto JS'
)

# ── 8. Confirm borrar datos — ítem lista ─────────────────────────────────────
replace_exact(
    '• Determinantes\n',
    '• Indicadores EAS\n',
    'confirm borrar datos ítem'
)

# ── 9. Alertas de carga CSV ──────────────────────────────────────────────────
replace_exact(
    "alert('❌ No se encontraron determinantes válidos en el CSV');",
    "alert('❌ No se encontraron indicadores EAS válidos en el CSV');",
    'alert carga CSV sin datos'
)

# ── 10. Estado HTML tras carga CSV (estado-determinantes) ────────────────────
replace_exact(
    "' + resultado.contador + '/' + TOTAL_DETERMINANTES_EPVSA + ' determinantes</span>';",
    "' + resultado.contador + '/' + TOTAL_DETERMINANTES_EPVSA + ' indicadores EAS</span>';",
    'estado HTML carga CSV OK'
)
replace_exact(
    "alertMsg = '✅ ' + resultado.contador + ' determinantes cargados correctamente';",
    "alertMsg = '✅ ' + resultado.contador + ' indicadores EAS cargados correctamente';",
    'alertMsg carga CSV OK'
)
replace_exact(
    "alertMsg = '⚠️ ' + resultado.contador + '/' + TOTAL_DETERMINANTES_EPVSA + ' determinantes cargados (faltan ' + faltan + ')';",
    "alertMsg = '⚠️ ' + resultado.contador + '/' + TOTAL_DETERMINANTES_EPVSA + ' indicadores EAS cargados (faltan ' + faltan + ')';",
    'alertMsg carga CSV parcial'
)

# ── 11. Lista de fuentes/ayuda ────────────────────────────────────────────────
replace_exact(
    '<li>Determinantes EAS (CSV)</li>',
    '<li>Indicadores EAS (CSV)</li>',
    'lista ayuda fuentes'
)

# ── 12. Descripción modal/tarjeta motor síntesis ─────────────────────────────
replace_exact(
    'Informe de salud, estudios complementarios, determinantes e indicadores integrados con conclusiones y recomendaciones.',
    'Informe de salud, estudios complementarios, datos EAS e indicadores integrados con conclusiones y recomendaciones.',
    'descripción tarjeta motor síntesis'
)

# ── 13. Descripción motor priorización ───────────────────────────────────────
replace_exact(
    'a partir de indicadores, determinantes y priorización ciudadana. Requiere validación técnica.',
    'a partir de indicadores EAS y priorización ciudadana. Requiere validación técnica.',
    'descripción motor priorización'
)

# ── 14. Actas / documentos — análisis de determinantes ───────────────────────
replace_exact(
    'el análisis de determinantes y un proceso de priorización participativo.',
    'el análisis de indicadores EAS y un proceso de priorización participativo.',
    'actas diagnóstico comunitario'
)

# ── 15. Actas / documentos — perfil de salud local ───────────────────────────
replace_exact(
    'Diagnóstico de la situación de salud, determinantes y activos para la salud',
    'Diagnóstico de la situación de salud, indicadores EAS y activos para la salud',
    'actas perfil salud local'
)

# ── 16. Orden del día — punto 2 y encabezado EAS ─────────────────────────────
replace_exact(
    'Presentación de los Determinantes de Salud de ${nombre}</strong> — Encuesta de Activos y Salud (EAS)',
    'Presentación de los Indicadores EAS de ${nombre}</strong> — Encuesta Andaluza de Salud (EAS)',
    'orden del día punto 2 + corrección nombre EAS'
)

# ── 17. Orden del día — material de la sesión ────────────────────────────────
replace_exact(
    'Los informes de determinantes e indicadores se enviarán',
    'Los indicadores EAS se enviarán',
    'material sesión texto'
)

# ── 18. Acta de sesión — sección 2 ───────────────────────────────────────────
replace_exact(
    '<h3>2. Determinantes de Salud presentados</h3>',
    '<h3>2. Indicadores EAS presentados</h3>',
    'acta sección 2 título'
)
replace_exact(
    '<p>Principales hallazgos de la Encuesta de Activos y Salud (EAS):</p>',
    '<p>Principales hallazgos de la Encuesta Andaluza de Salud (EAS):</p>',
    'acta sección 2 subtítulo + corrección nombre EAS'
)

# ── 19. Hoja de ruta — lista de fases ────────────────────────────────────────
replace_exact(
    'Determinantes sociales &middot; Indicadores &middot;',
    'Datos EAS &middot; Indicadores &middot;',
    'hoja de ruta fases lista'
)

# ── 20. Hoja de ruta — descripción kit año 1 ─────────────────────────────────
replace_exact(
    'Diagnóstico basado en informe de salud, determinantes e indicadores con priorización ciudadana',
    'Diagnóstico basado en informe de salud, datos EAS e indicadores con priorización ciudadana',
    'kit año 1 descripción'
)
replace_exact(
    'Revisión de indicadores, determinantes y evidencias disponibles',
    'Revisión de indicadores EAS y evidencias disponibles',
    'kit años siguientes descripción'
)

# ── 21. Agenda seguimiento ────────────────────────────────────────────────────
replace_exact(
    'Revisión de indicadores, determinantes y nuevas evidencias disponibles.',
    'Revisión de indicadores EAS y nuevas evidencias disponibles.',
    'agenda seguimiento revisión'
)

# ── Guardar ──────────────────────────────────────────────────────────────────
with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("\n--- RESUMEN ---")
print("Chars antes: %d | despues: %d | delta: %+d" % (original_len, len(content), len(content) - original_len))
print("Total grupos de cambio aplicados: %d" % len(cambios))
for desc, n, old, new in cambios:
    print("  [%dx] %s" % (n, desc))

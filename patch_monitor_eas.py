"""
patch_monitor_eas.py
1. Inserta easMonitor_abrir() justo antes de generarSeccionDeterminantes()
2. Modifica generarSeccionDeterminantes() para añadir tarjeta resumen + boton monitor EAS
   al principio del contenido del acordeon.
"""
import sys, re

path = r'C:\Users\blash\Desktop\COMPAS\index.html'
with open(path, 'rb') as f:
    content = f.read().decode('utf-8')

original_len = len(content)
cambios = []

# =============================================================================
# PASO 1: Insertar easMonitor_abrir() antes de generarSeccionDeterminantes()
# =============================================================================
FN_ANCHOR = '// Generar HTML de sección Determinantes\nfunction generarSeccionDeterminantes()'

if 'function easMonitor_abrir' in content:
    print('SKIP: easMonitor_abrir ya existe')
else:
    idx = content.find(FN_ANCHOR)
    if idx == -1:
        # probar CRLF
        FN_ANCHOR2 = '// Generar HTML de secci\u00f3n Determinantes\r\nfunction generarSeccionDeterminantes()'
        idx = content.find(FN_ANCHOR2)
    if idx == -1:
        # busqueda mas flexible
        idx = content.find('function generarSeccionDeterminantes()')
        if idx == -1:
            print('FATAL: anchor generarSeccionDeterminantes no encontrado')
            sys.exit(1)

    NEW_FN = (
        '// -- Monitor EAS: escribe datos en localStorage y abre monitor_eas.html --\n'
        '// Lee valoresMunicipio y referenciasEAS (globals de index.html)\n'
        'function easMonitor_abrir() {\n'
        '    var valores = (typeof valoresMunicipio !== \'undefined\') ? valoresMunicipio : {};\n'
        '    var referencias = (typeof referenciasEAS !== \'undefined\') ? referenciasEAS : {};\n'
        '    var municipio = (typeof getMunicipioActual === \'function\') ? getMunicipioActual() : \'\';\n'
        '    var municipioNombre = (typeof getNombreMunicipio === \'function\') ? getNombreMunicipio(municipio) : \'\';\n'
        '\n'
        '    // Tambien leer inputs del DOM por si valoresMunicipio no esta sincronizado\n'
        '    var valoresDOM = {};\n'
        '    try {\n'
        '        document.querySelectorAll(\'.det-input\').forEach(function(inp) {\n'
        '            if (inp.value !== \'\') {\n'
        '                var cod = inp.id.replace(\'det-\', \'\');\n'
        '                valoresDOM[cod] = parseFloat(inp.value);\n'
        '            }\n'
        '        });\n'
        '    } catch(e) {}\n'
        '    var valoresFinal = Object.assign({}, valores, valoresDOM);\n'
        '\n'
        '    if (Object.keys(valoresFinal).length === 0 && Object.keys(referencias).length === 0) {\n'
        '        alert(\'No hay datos EAS cargados. Introduce valores en la tabla antes de abrir el monitor.\');\n'
        '        return;\n'
        '    }\n'
        '\n'
        '    var payload = {\n'
        '        municipio:       municipio,\n'
        '        municipioNombre: municipioNombre,\n'
        '        valores:         valoresFinal,\n'
        '        referencias:     referencias,\n'
        '        timestamp:       Date.now()\n'
        '    };\n'
        '    try { localStorage.setItem(\'compas_monitor_eas\', JSON.stringify(payload)); } catch(e) {}\n'
        '\n'
        '    var url = \'monitor_eas.html\';\n'
        '    var win = window.open(url, \'monitor_eas\',\n'
        '        \'width=1100,height=820,scrollbars=yes,resizable=yes\');\n'
        '    if (!win) { window.open(url, \'_blank\'); }\n'
        '}\n'
        '\n'
    )

    content = content[:idx] + NEW_FN + content[idx:]
    cambios.append('easMonitor_abrir() insertada antes de generarSeccionDeterminantes')
    print('OK: easMonitor_abrir() insertada')

# =============================================================================
# PASO 2: Modificar generarSeccionDeterminantes() para añadir tarjeta resumen
# Buscar el bloque que comienza con la primera linea del template literal
# y añadir la tarjeta antes del primer div existente
# =============================================================================
# Patron: justo despues de "return `" en generarSeccionDeterminantes
# Buscamos el string unico que abre el template:
OLD_OPEN = (
    '    return `\n'
    '    <div class="acordeon-item">\n'
    '        <div class="acordeon-header" onclick="toggleAcordeon(this)">\n'
    '            <span>03 Encuesta Andaluza de Salud (EAS)'
)
OLD_OPEN_CRLF = (
    '    return `\r\n'
    '    <div class="acordeon-item">\r\n'
    '        <div class="acordeon-header" onclick="toggleAcordeon(this)">\r\n'
    '            <span>03 Encuesta Andaluza de Salud (EAS)'
)

# La tarjeta resumen a insertar al inicio del contenido del acordeon
CARD_INSERT = (
    '    return `\n'
    '    <div style="margin-bottom:1.25rem;">\n'
    '        <div style="display:flex;align-items:flex-start;gap:1rem;background:white;border:1px solid #e2e8f0;border-radius:12px;padding:1rem 1.25rem;box-shadow:0 1px 3px rgba(0,0,0,0.06);">\n'
    '            <div style="width:42px;height:42px;border-radius:10px;background:#eff6ff;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;">📊</div>\n'
    '            <div style="flex:1;min-width:0;">\n'
    '                <div style="font-weight:700;font-size:0.9rem;color:#1e293b;margin-bottom:0.2rem;">Encuesta Andaluza de Salud (EAS) 2023</div>\n'
    '                <div style="font-size:0.78rem;color:#64748b;margin-bottom:0.5rem;">Estimación municipal Bettersurveys · 55 indicadores en 3 áreas · Autorreporte poblacional (CAPI)</div>\n'
    '                <div id="eas-resumen-badge" style="font-size:0.75rem;color:#0369a1;background:#eff6ff;border-radius:6px;padding:0.2rem 0.5rem;display:inline-block;">Cargando estado...</div>\n'
    '            </div>\n'
    '            <div style="display:flex;flex-direction:column;gap:0.5rem;flex-shrink:0;">\n'
    '                <button onclick="easMonitor_abrir()" style="background:linear-gradient(135deg,#0074c8,#00acd9);color:white;border:none;border-radius:8px;padding:0.45rem 0.9rem;font-size:0.8rem;font-weight:600;cursor:pointer;white-space:nowrap;">📊 Abrir monitor EAS</button>\n'
    '            </div>\n'
    '        </div>\n'
    '    </div>\n'
    '    <div class="acordeon-item">\n'
    '        <div class="acordeon-header" onclick="toggleAcordeon(this)">\n'
    '            <span>03 Encuesta Andaluza de Salud (EAS)'
)

n_old = content.count(OLD_OPEN)
if n_old == 1:
    content = content.replace(OLD_OPEN, CARD_INSERT)
    cambios.append('tarjeta resumen EAS añadida en generarSeccionDeterminantes (LF)')
    print('OK: tarjeta resumen EAS añadida (LF)')
else:
    n_old2 = content.count(OLD_OPEN_CRLF)
    if n_old2 == 1:
        CARD_INSERT_CRLF = CARD_INSERT.replace('\n', '\r\n')
        content = content.replace(OLD_OPEN_CRLF, CARD_INSERT_CRLF)
        cambios.append('tarjeta resumen EAS añadida en generarSeccionDeterminantes (CRLF)')
        print('OK: tarjeta resumen EAS añadida (CRLF)')
    else:
        print('WARN: patron return` de generarSeccionDeterminantes no encontrado exacto')
        print('  apariciones LF: %d | CRLF: %d' % (n_old, n_old2))
        # Intentar reemplazo mas corto: solo el titulo unico
        SHORT_OLD = '<span>03 Encuesta Andaluza de Salud (EAS) \u2014 Selecci\u00f3n 2023</span>'
        n_short = content.count(SHORT_OLD)
        print('  apariciones titulo EAS: %d' % n_short)
        if n_short >= 1:
            print('  INFO: la funcion existe pero el template abre diferente. Revisa manualmente.')

# =============================================================================
# PASO 3: Añadir actualizacion del badge resumen despues de cargar determinantes
# En cargarDeterminantes(), después de que actualiza colores, actualizar el badge
# =============================================================================
BADGE_UPDATE = (
    '\n'
    '    // Actualizar badge resumen EAS\n'
    '    try {\n'
    '        var badgeEl = document.getElementById(\'eas-resumen-badge\');\n'
    '        if (badgeEl) {\n'
    '            var nCargados = 0;\n'
    '            document.querySelectorAll(\'.det-input\').forEach(function(inp) {\n'
    '                if (inp.value !== \'\') nCargados++;\n'
    '            });\n'
    '            badgeEl.textContent = nCargados + \'/55 indicadores cargados\';\n'
    '            badgeEl.style.background = nCargados > 0 ? \'#dcfce7\' : \'#fef9c3\';\n'
    '            badgeEl.style.color = nCargados > 0 ? \'#166534\' : \'#854d0e\';\n'
    '        }\n'
    '    } catch(eB) {}\n'
)

# Buscar el final de actualizarColoresDeterminantes() que se llama en cargarDeterminantes
AFTER_COLORES = 'actualizarColoresDeterminantes();'
n_after = content.count(AFTER_COLORES)
if n_after >= 1:
    # Solo modificar la primera aparicion (la que esta en cargarDeterminantes)
    # Buscamos el contexto: dentro de la funcion cargarDeterminantes
    idx_cargar = content.find('function cargarDeterminantes()')
    if idx_cargar == -1:
        idx_cargar = content.find('function cargarDeterminantes ()')
    if idx_cargar >= 0:
        # buscar actualizarColoresDeterminantes() despues de idx_cargar
        idx_call = content.find(AFTER_COLORES, idx_cargar)
        if idx_call >= 0:
            after_str = content[idx_call + len(AFTER_COLORES):]
            content = content[:idx_call + len(AFTER_COLORES)] + BADGE_UPDATE + after_str
            cambios.append('badge resumen EAS actualizado tras cargarDeterminantes')
            print('OK: badge update añadido tras actualizarColoresDeterminantes en cargarDeterminantes')
        else:
            print('WARN: actualizarColoresDeterminantes() no encontrada dentro de cargarDeterminantes')
    else:
        print('WARN: función cargarDeterminantes() no encontrada')
else:
    print('WARN: actualizarColoresDeterminantes() no encontrada')

# =============================================================================
# Guardar
# =============================================================================
with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

after_len = len(content)
print('\n--- RESUMEN ---')
print('Chars antes: %d | despues: %d | delta: %+d' % (original_len, after_len, after_len - original_len))
print('Cambios aplicados:')
for c in cambios:
    print('  + ' + c)

print('\nVerificaciones:')
print('  easMonitor_abrir definida:', 'OK' if 'function easMonitor_abrir' in content else 'MISSING')
print('  tarjeta resumen EAS:', 'OK' if 'Abrir monitor EAS' in content else 'MISSING')
print('  badge eas-resumen-badge:', 'OK' if 'eas-resumen-badge' in content else 'MISSING')
print('  generarSeccionDeterminantes intacta:', 'OK' if 'function generarSeccionDeterminantes' in content else 'MISSING')
print('  guardarDeterminantes intacta:', 'OK' if 'function guardarDeterminantes' in content else 'MISSING')

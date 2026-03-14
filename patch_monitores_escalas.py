"""
patch_monitores_escalas.py
1. Inserta escalaMonitor_abrir(escalaId) antes de _renderTarjetaEstudio()
2. Cambia monitorFn de las 4 escalas en renderizarSeccionEstudios():
   - abrirModalEscalasDiagnosticas('sf12')   → escalaMonitor_abrir('sf12')
   - abrirModalEscalasDiagnosticas('duke')   → escalaMonitor_abrir('duke')
   - abrirModalEscalasDiagnosticas('cage')   → escalaMonitor_abrir('cage')
   - abrirModalEscalasDiagnosticas('predimed') → escalaMonitor_abrir('predimed')
3. Añade botón secundario "Registrar datos" para cada escala sin datos
   (mantiene acceso al modal de registro)
"""
import sys

path = r'C:\Users\blash\Desktop\COMPAS\index.html'
with open(path, 'rb') as f:
    content = f.read().decode('utf-8')

original_len = len(content)
cambios = []

# ─────────────────────────────────────────────────────────────────────────────
# PASO 1: Insertar escalaMonitor_abrir() justo antes de _renderTarjetaEstudio()
# ─────────────────────────────────────────────────────────────────────────────
ANCHOR = '// \u2500\u2500 Helper: tarjeta com\u00fan para cualquier estudio complementario'
# Verificar que no existe ya la funcion
if 'function escalaMonitor_abrir' in content:
    print('SKIP: escalaMonitor_abrir ya existe')
else:
    anchor_idx = content.find(ANCHOR)
    if anchor_idx == -1:
        print('FATAL: anchor de _renderTarjetaEstudio no encontrado')
        sys.exit(1)

    NEW_FN = (
        '// \u2500\u2500 Monitor real de escalas diagn\u00f3sticas \u2014 abre monitor_escalas.html?tipo= \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n'
        '// Escribe los datos de la escala en localStorage y abre el monitor en ventana nueva.\n'
        '// Si la escala no tiene datos registrados, muestra el modal de registro.\n'
        'function escalaMonitor_abrir(escalaId) {\n'
        '    var mapaNombre = { sf12:\'SF-12\', duke:\'Duke-UNC\', cage:\'CAGE\', predimed:\'PREDIMED\' };\n'
        '    var nombreEscala = mapaNombre[escalaId] || escalaId;\n'
        '    var escalas = (typeof _compasEscalasGet === \'function\') ? _compasEscalasGet() : [];\n'
        '    var datos   = escalas.find(function(e){ return e.nombre_escala === nombreEscala; }) || null;\n'
        '\n'
        '    // Sin datos registrados \u2192 abrir modal de registro preseleccionado\n'
        '    if (!datos || !datos.resultado_principal) {\n'
        '        if (typeof abrirModalEscalasDiagnosticas === \'function\') {\n'
        '            abrirModalEscalasDiagnosticas(escalaId);\n'
        '        }\n'
        '        return;\n'
        '    }\n'
        '\n'
        '    // Con datos \u2192 escribir en localStorage y abrir monitor\n'
        '    var payload = {\n'
        '        tipo:             escalaId,\n'
        '        escala:           datos,\n'
        '        municipio:        (typeof getMunicipioActual === \'function\') ? getMunicipioActual() : \'\',\n'
        '        municipioNombre:  (typeof getNombreMunicipio === \'function\') ? getNombreMunicipio(getMunicipioActual()) : \'\',\n'
        '        timestamp:        Date.now()\n'
        '    };\n'
        '    try { localStorage.setItem(\'compas_monitor_escala\', JSON.stringify(payload)); } catch(e) {}\n'
        '\n'
        '    var url = \'monitor_escalas.html?tipo=\' + escalaId;\n'
        '    var win = window.open(url, \'monitor_escala_\' + escalaId,\n'
        '        \'width=960,height=760,scrollbars=yes,resizable=yes\');\n'
        '    if (!win) {\n'
        '        // Popup bloqueado: abrir en pesta\u00f1a nueva\n'
        '        window.open(url, \'_blank\');\n'
        '    }\n'
        '}\n'
        '\n'
    )

    content = content[:anchor_idx] + NEW_FN + content[anchor_idx:]
    cambios.append('escalaMonitor_abrir() insertada antes de _renderTarjetaEstudio')
    print('OK: escalaMonitor_abrir() insertada')

# ─────────────────────────────────────────────────────────────────────────────
# PASO 2: Cambiar monitorFn en ESCALAS_CFG loop (escalas con datos)
# Las 4 escalas generan tarjetas con monitorFn:
#   monitorFn: 'abrirModalEscalasDiagnosticas(\'' + cfg.id + '\')',
# → cambiar a:
#   monitorFn: 'escalaMonitor_abrir(\'' + cfg.id + '\')',
# ─────────────────────────────────────────────────────────────────────────────

# Cambio de monitorFn en el loop de ESCALAS_CFG (renderizarSeccionEstudios)
old_mon = "monitorFn: 'abrirModalEscalasDiagnosticas(\\'' + cfg.id + '\\')',"
new_mon = "monitorFn: 'escalaMonitor_abrir(\\'' + cfg.id + '\\')',"
n_mon = content.count(old_mon)
if n_mon:
    content = content.replace(old_mon, new_mon)
    cambios.append('monitorFn escalas (loop) [%dx]' % n_mon)
    print('OK [%dx] monitorFn loop escalas' % n_mon)
else:
    # buscar con comilla simple escapada de otra forma
    old_mon2 = "monitorFn: 'abrirModalEscalasDiagnosticas(\\u0027' + cfg.id + '\\u0027)',"
    n_mon2 = content.count(old_mon2)
    if n_mon2:
        content = content.replace(old_mon2, "monitorFn: 'escalaMonitor_abrir(\\u0027' + cfg.id + '\\u0027)',")
        cambios.append('monitorFn escalas (loop unicode) [%dx]' % n_mon2)
        print('OK [%dx] monitorFn loop escalas (unicode)' % n_mon2)
    else:
        # Busqueda mas flexible: cualquier aparicion del patron
        import re
        pattern = r"monitorFn:\s*'abrirModalEscalasDiagnosticas\(\\''\s*\+\s*cfg\.id\s*\+\s*'\\''\)'"
        m = re.search(pattern, content)
        if m:
            content = content[:m.start()] + "monitorFn: 'escalaMonitor_abrir(\\'' + cfg.id + '\\')'" + content[m.end():]
            cambios.append('monitorFn escalas (loop regex)')
            print('OK monitorFn loop escalas (regex)')
        else:
            print('MISSING: monitorFn loop escalas — busca manual necesaria')
            # Mostrar contexto para debug
            idx_loop = content.find('ESCALAS_CFG.forEach')
            if idx_loop >= 0:
                print('  Contexto loop:')
                print(repr(content[idx_loop:idx_loop+600]))

# ─────────────────────────────────────────────────────────────────────────────
# PASO 3: Añadir boton "Registrar" a las tarjetas sin datos de las escalas
# El patron actual para la tarjeta sin datos de escala:
#   monitorLabel: '\ud83d\udcca Abrir monitor',
#   accionesHtml: '',
# Queremos:
#   monitorLabel: '\ud83d\udcca Abrir monitor',
#   accionesHtml: '<button onclick="abrirModalEscalasDiagnosticas(\''+cfg.id+'\')" ...>✏️ Registrar datos</button>',
# ─────────────────────────────────────────────────────────────────────────────
# Este bloque se encuentra dentro del forEach de ESCALAS_CFG, rama !tieneDatos.
# La rama sin datos tiene:
#   estado: tieneDatos ? '\u2713 Registrada' : 'Sin datos',
#   ...
#   monitorFn: 'escalaMonitor_abrir(\'' + cfg.id + '\')',   <-- ya cambiado
#   monitorLabel: '\ud83d\udcca Abrir monitor',
#   accionesHtml: '',
# Añadir el boton de registro:
old_acc = (
    "monitorFn: 'escalaMonitor_abrir(\\'' + cfg.id + '\\')'"  + ',\n'
    "            monitorLabel: '\\ud83d\\udcca Abrir monitor',\n"
    "            accionesHtml: '',\n"
)
new_acc = (
    "monitorFn: 'escalaMonitor_abrir(\\'' + cfg.id + '\\')'" + ',\n'
    "            monitorLabel: '\\ud83d\\udcca Abrir monitor',\n"
    "            accionesHtml: tieneDatos ? '' :\n"
    "                '<button onclick=\"abrirModalEscalasDiagnosticas(\\'' + cfg.id + '\\')\" '\n"
    "                + 'style=\"background:white;border:1px solid #e2e8f0;border-radius:7px;'\n"
    "                + 'padding:0.36rem 0.65rem;font-size:0.74rem;font-weight:600;color:#475569;cursor:pointer;\"\n"
    "                + 'title=\"Abrir formulario de registro de datos\">\\u270f\\ufe0f Registrar datos</button>',\n"
)
n_acc = content.count(old_acc)
if n_acc:
    content = content.replace(old_acc, new_acc)
    cambios.append('accionesHtml escalas registro [%dx]' % n_acc)
    print('OK [%dx] accionesHtml escalas + boton Registrar' % n_acc)
else:
    print('WARN: accionesHtml escalas no encontrado exacto - verificar manualmente')
    # Buscar el string mas simple
    tst = "monitorLabel: '\\ud83d\\udcca Abrir monitor',\n            accionesHtml: ''"
    n_tst = content.count(tst)
    print('  Apariciones de monitorLabel+accionesHtml vacias: %d' % n_tst)
    if n_tst == 1:
        repl = (
            "monitorLabel: '\\ud83d\\udcca Abrir monitor',\n"
            "            accionesHtml: tieneDatos ? '' :\n"
            "                '<button onclick=\"abrirModalEscalasDiagnosticas(\\'' + cfg.id + '\\')\" '\n"
            "                + 'style=\"background:white;border:1px solid #e2e8f0;border-radius:7px;'\n"
            "                + 'padding:0.36rem 0.65rem;font-size:0.74rem;font-weight:600;color:#475569;cursor:pointer;\"\n"
            "                + 'title=\"Abrir formulario de registro de datos\">\\u270f\\ufe0f Registrar datos</button>'"
        )
        content = content.replace(tst, repl)
        cambios.append('accionesHtml escalas (fallback)')
        print('  OK accionesHtml escalas (fallback)')

# ─────────────────────────────────────────────────────────────────────────────
# Guardar
# ─────────────────────────────────────────────────────────────────────────────
with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

after_len = len(content)
print('\n--- RESUMEN ---')
print('Chars antes: %d | despues: %d | delta: %+d' % (original_len, after_len, after_len - original_len))
print('Cambios aplicados:')
for c in cambios:
    print('  + ' + c)

print('\nVerificaciones:')
print('  escalaMonitor_abrir definida:', 'OK' if 'function escalaMonitor_abrir' in content else 'MISSING')
print('  escalaMonitor_abrir llamada en monitorFn:', 'OK' if "escalaMonitor_abrir(\\'' + cfg.id" in content else 'MISSING')
print('  boton Registrar datos:', 'OK' if 'Registrar datos' in content else 'MISSING')
print('  abrirModalEscalasDiagnosticas sigue existiendo:', 'OK' if 'function abrirModalEscalasDiagnosticas' in content else 'MISSING')
print('  IBSE monitor sin cambiar:', 'OK' if "monitorFn:'ibseMonitor_abrir()'" in content or "monitorFn:'ibseMonitor_abrir()'" in content else '?')

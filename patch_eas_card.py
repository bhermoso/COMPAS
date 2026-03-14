"""
patch_eas_card.py
Inserta tarjeta resumen EAS al inicio del template de generarSeccionDeterminantes()
"""
path = r'C:\Users\blash\Desktop\COMPAS\index.html'
with open(path, 'rb') as f:
    raw = f.read()
content = raw.decode('utf-8')

original_len = len(content)

# Buscar el inicio del template en generarSeccionDeterminantes
# El inicio unico es el titulo "03 Encuesta Andaluza de Salud (EAS) - Seleccion 2023"
# dentro de esa funcion. El anchor mas corto y seguro:
ANCHOR_OLD = '<span>03 Encuesta Andaluza de Salud (EAS)'

idx = content.find(ANCHOR_OLD)
if idx == -1:
    print('FATAL: anchor no encontrado')
    import sys; sys.exit(1)

# La tarjeta va antes del primer <div class="acordeon-item"> que precede al anchor
# Buscamos hacia atras el <div class="acordeon-item"> mas cercano
BEFORE = '<div class="acordeon-item">'
start_search = max(0, idx - 500)
chunk = content[start_search:idx]
rel_idx = chunk.rfind(BEFORE)
if rel_idx == -1:
    print('FATAL: div acordeon-item no encontrado antes del anchor')
    import sys; sys.exit(1)

insert_pos = start_search + rel_idx

CARD_HTML = (
    '<div style="margin-bottom:1.25rem;">\n'
    '        <div style="display:flex;align-items:flex-start;gap:1rem;background:white;border:1px solid #e2e8f0;border-radius:12px;padding:1rem 1.25rem;box-shadow:0 1px 3px rgba(0,0,0,0.06);">\n'
    '            <div style="width:42px;height:42px;border-radius:10px;background:#eff6ff;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;">\U0001f4ca</div>\n'
    '            <div style="flex:1;min-width:0;">\n'
    '                <div style="font-weight:700;font-size:0.9rem;color:#1e293b;margin-bottom:0.2rem;">Encuesta Andaluza de Salud (EAS) 2023</div>\n'
    '                <div style="font-size:0.78rem;color:#64748b;margin-bottom:0.5rem;">Estimaci\u00f3n municipal Bettersurveys \u00b7 55 indicadores en 3 \u00e1reas \u00b7 Autorreporte poblacional (CAPI)</div>\n'
    '                <div id="eas-resumen-badge" style="font-size:0.75rem;color:#0369a1;background:#eff6ff;border-radius:6px;padding:0.2rem 0.5rem;display:inline-block;">Sin datos cargados</div>\n'
    '            </div>\n'
    '            <div style="display:flex;flex-direction:column;gap:0.5rem;flex-shrink:0;">\n'
    '                <button onclick="easMonitor_abrir()" style="background:linear-gradient(135deg,#0074c8,#00acd9);color:white;border:none;border-radius:8px;padding:0.45rem 0.9rem;font-size:0.8rem;font-weight:600;cursor:pointer;white-space:nowrap;">\U0001f4ca Abrir monitor EAS</button>\n'
    '            </div>\n'
    '        </div>\n'
    '    </div>\n'
    '    '
)

content = content[:insert_pos] + CARD_HTML + content[insert_pos:]
print('OK: tarjeta EAS insertada antes del acordeon-item en generarSeccionDeterminantes')

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

after_len = len(content)
print('Chars antes: %d | despues: %d | delta: %+d' % (original_len, after_len, after_len - original_len))
print('tarjeta monitor EAS:', 'OK' if 'Abrir monitor EAS' in content else 'MISSING')
print('eas-resumen-badge:', 'OK' if 'eas-resumen-badge' in content else 'MISSING')

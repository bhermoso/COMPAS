# Rediseño acordeón estudios complementarios TAB 2
# Sustituye renderizarSeccionEstudios() e inserta helpers comunes
import sys
path = r'C:\Users\blash\Desktop\COMPAS\index.html'
with open(path, 'rb') as f:
    raw = f.read()
content = raw.decode('utf-8')

# ── Marcadores exactos ─────────────────────────────────────────────────────
START_MARKER = 'function renderizarSeccionEstudios() {'
END_MARKER   = '// Renderizar secci\u00f3n 04 \u2014 Visor unificado de priorizaci\u00f3n ciudadana'

idx_start = content.find(START_MARKER)
assert idx_start > 0, "START no encontrado"

idx_end = content.find(END_MARKER, idx_start)
assert idx_end > 0, "END no encontrado"

# Retroceder para incluir los saltos de línea antes del marcador END
while idx_end > 0 and content[idx_end-1] in ('\n', '\r'):
    idx_end -= 1
idx_end += 1  # keep one newline as separator

print(f"Bloque a reemplazar: chars {idx_start}..{idx_end}")

# ── Nuevo código ──────────────────────────────────────────────────────────
NEW_CODE = r"""// ── Helper: tarjeta común para cualquier estudio complementario ──────────────
// cfg: { icon, iconBg, nombre, descripcion, estado, estadoBg, estadoFg,
//        datoHtml, monitorFn, monitorLabel, accionesHtml, detalleHtml }
function _renderTarjetaEstudio(cfg) {
    var monitorLabel = cfg.monitorLabel || '📊 Abrir monitor';
    var detalle = cfg.detalleHtml
        ? '<details style="margin-top:0.55rem;">' +
          '<summary style="font-size:0.74rem;color:#64748b;cursor:pointer;font-weight:600;' +
          'list-style:none;display:inline-flex;align-items:center;gap:0.3rem;">▸ Ver descripción</summary>' +
          '<div style="margin-top:0.45rem;padding:0.55rem 0.7rem;background:#f8fafc;border-radius:7px;' +
          'font-size:0.75rem;color:#475569;line-height:1.6;">' + cfg.detalleHtml + '</div>' +
          '</details>'
        : '';
    return (
        '<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;' +
        'margin-bottom:0.7rem;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.05);">' +
            // Cabecera
            '<div style="display:flex;align-items:center;gap:0.6rem;padding:0.75rem 1rem;' +
            'border-bottom:1px solid #f1f5f9;background:#fafbfc;">' +
                '<div style="width:2.1rem;height:2.1rem;border-radius:9px;background:' +
                (cfg.iconBg||'#f0f9ff') + ';display:flex;align-items:center;' +
                'justify-content:center;font-size:1rem;flex-shrink:0;">' + (cfg.icon||'📄') + '</div>' +
                '<div style="flex:1;min-width:0;">' +
                    '<div style="font-weight:700;font-size:0.86rem;color:#1e293b;line-height:1.3;">' +
                    cfg.nombre + '</div>' +
                    (cfg.descripcion
                        ? '<div style="font-size:0.71rem;color:#64748b;margin-top:0.04rem;">' +
                          cfg.descripcion + '</div>'
                        : '') +
                '</div>' +
                '<span style="background:' + (cfg.estadoBg||'#f1f5f9') + ';color:' +
                (cfg.estadoFg||'#475569') + ';padding:0.13rem 0.5rem;border-radius:999px;' +
                'font-size:0.66rem;font-weight:700;flex-shrink:0;white-space:nowrap;">' +
                (cfg.estado||'') + '</span>' +
            '</div>' +
            // Cuerpo
            '<div style="padding:0.75rem 1rem;">' +
                (cfg.datoHtml || '') +
                '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:' +
                (cfg.datoHtml ? '0.6rem' : '0') + ';">' +
                    '<button onclick="' + cfg.monitorFn + '" style="background:#0074c8;color:white;' +
                    'border:none;border-radius:7px;padding:0.36rem 0.85rem;font-size:0.77rem;' +
                    'font-weight:600;cursor:pointer;flex-shrink:0;">' + monitorLabel + '</button>' +
                    (cfg.accionesHtml || '') +
                '</div>' +
                detalle +
            '</div>' +
        '</div>'
    );
}

// ── Visor de texto para estudios sin monitor propio ───────────────────────
function estudiosComplementarios_abrirVisor(nombre, texto) {
    var m = document.getElementById('modal-visor-estudio');
    if (!m) {
        m = document.createElement('div');
        m.id = 'modal-visor-estudio';
        m.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);' +
            'z-index:20000;display:flex;align-items:flex-start;justify-content:center;' +
            'padding:2rem;overflow-y:auto;';
        m.onclick = function(e){ if (e.target === m) m.style.display = 'none'; };
        document.body.appendChild(m);
    }
    m.innerHTML =
        '<div style="background:white;border-radius:16px;max-width:820px;width:100%;' +
        'box-shadow:0 20px 50px rgba(0,0,0,0.2);overflow:hidden;">' +
            '<div style="background:linear-gradient(135deg,#0074c8,#00acd9);color:white;' +
            'padding:1rem 1.5rem;display:flex;justify-content:space-between;align-items:center;">' +
                '<div style="display:flex;align-items:center;gap:0.6rem;">' +
                    '<span style="font-size:1.1rem;">📄</span>' +
                    '<strong style="font-size:0.95rem;">' + nombre + '</strong>' +
                '</div>' +
                '<button onclick="document.getElementById(\'modal-visor-estudio\').style.display=\'none\'" ' +
                'style="background:rgba(255,255,255,0.2);border:none;color:white;width:32px;height:32px;' +
                'border-radius:50%;cursor:pointer;font-size:1rem;">✕</button>' +
            '</div>' +
            '<div style="padding:1.5rem;max-height:65vh;overflow-y:auto;font-size:0.83rem;' +
            'color:#334155;line-height:1.7;white-space:pre-wrap;font-family:inherit;">' +
            (texto || '(Sin contenido)') + '</div>' +
        '</div>';
    m.style.display = 'flex';
}

// ── Acceso por índice para onclick inline ─────────────────────────────────
function _estudioComplementarioVisor(idx) {
    var e = (window.estudiosComplementarios || [])[idx];
    if (e) estudiosComplementarios_abrirVisor(e.nombre, e.texto);
}

function renderizarSeccionEstudios() {
    var el = document.getElementById('seccion-estudios-complementarios');
    if (!el) return;

    var html = '<div style="padding:0.75rem;">';

    // ══ TARJETA 1 — IBSE ══════════════════════════════════════════════════
    var ibseTieneDatos = window.datosIBSE && window.datosIBSE.ibse !== undefined;
    if (ibseTieneDatos) {
        var sc  = Math.round(window.datosIBSE.ibse);
        var n   = window.datosIBSE.n || '';
        var col = sc >= 70 ? '#16a34a' : sc >= 50 ? '#d97706' : '#dc2626';
        var bg  = sc >= 70 ? '#dcfce7' : sc >= 50 ? '#fef3c7' : '#fee2e2';
        var ico = sc >= 70 ? '🟢' : sc >= 50 ? '🟡' : '🔴';
        var factBars = [{k:'vinculo',l:'Vínculo'},{k:'situacion',l:'Situación'},
                        {k:'control',l:'Control'},{k:'persona',l:'Persona'}]
            .map(function(f) {
                var v = window.datosIBSE[f.k];
                if (v == null) return '';
                var p = Math.round(v);
                return '<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.1rem;">' +
                    '<span style="font-size:0.63rem;color:#64748b;width:3.8rem;flex-shrink:0;">' + f.l + '</span>' +
                    '<div style="flex:1;height:3px;background:#e5e7eb;border-radius:2px;overflow:hidden;">' +
                    '<div style="height:100%;width:' + p + '%;background:' + col + ';border-radius:2px;"></div>' +
                    '</div>' +
                    '<span style="font-size:0.63rem;font-weight:600;color:' + col + ';min-width:1.6rem;text-align:right;">' + p + '</span>' +
                    '</div>';
            }).join('');
        var datoIBSE =
            '<div style="display:flex;align-items:flex-start;gap:0.75rem;padding:0.55rem 0.7rem;' +
            'background:' + bg + ';border-radius:8px;border:1px solid ' + col + '30;">' +
                '<div style="text-align:center;flex-shrink:0;">' +
                    '<span style="font-size:1.5rem;font-weight:800;color:' + col + ';line-height:1;">' + sc + '</span>' +
                    '<div style="font-size:0.6rem;color:' + col + ';opacity:.75;">/100</div>' +
                    (n ? '<div style="font-size:0.6rem;color:' + col + ';opacity:.65;margin-top:0.15rem;">n=' + n + '</div>' : '') +
                '</div>' +
                '<div style="flex:1;">' + factBars + '</div>' +
            '</div>';
        var accionesIBSE =
            '<label style="background:white;border:1px solid #e2e8f0;border-radius:7px;' +
            'padding:0.36rem 0.7rem;cursor:pointer;font-size:0.74rem;font-weight:600;color:#475569;">' +
            '<input type="file" accept=".csv" onchange="ibse_cargarCSV(this)" hidden>📁 Recargar CSV</label>' +
            '<button onclick="ibse_borrarDatos()" style="background:white;border:1px solid #fca5a5;' +
            'border-radius:7px;padding:0.36rem 0.55rem;font-size:0.72rem;color:#dc2626;cursor:pointer;" ' +
            'title="Borrar datos IBSE">🗑️</button>';
        html += _renderTarjetaEstudio({
            icon:'📊', iconBg:'#ecfdf5',
            nombre:'IBSE — Índice de Bienestar Socioemocional',
            descripcion:'Cuestionario de 8 ítems · 4 factores · Escala 0–100',
            estado: ico + ' ' + sc + '/100', estadoBg:bg, estadoFg:col,
            datoHtml: datoIBSE,
            monitorFn:'ibseMonitor_abrir()',
            accionesHtml: accionesIBSE,
            detalleHtml:'Factores: Vínculo · Situación · Control · Persona.<br>' +
                'Umbral óptimo: ≥70 · Riesgo moderado: 50–69 · Riesgo elevado: &lt;50.'
        });
    } else {
        html += _renderTarjetaEstudio({
            icon:'📊', iconBg:'#f0f9ff',
            nombre:'IBSE — Índice de Bienestar Socioemocional',
            descripcion:'Cuestionario de 8 ítems · 4 factores · Escala 0–100',
            estado:'Sin datos', estadoBg:'#f1f5f9', estadoFg:'#94a3b8',
            datoHtml:'',
            monitorFn:'ibseMonitor_abrir()',
            accionesHtml:'<label style="background:white;border:1px solid #e2e8f0;border-radius:7px;' +
                'padding:0.36rem 0.7rem;cursor:pointer;font-size:0.74rem;font-weight:600;color:#475569;">' +
                '<input type="file" accept=".csv" onchange="ibse_cargarCSV(this)" hidden>📁 Cargar CSV REDCap</label>',
            detalleHtml:'Factores: Vínculo · Situación · Control · Persona.<br>' +
                'Umbral óptimo: ≥70 · Riesgo moderado: 50–69 · Riesgo elevado: &lt;50.<br>' +
                'Carga un CSV exportado desde REDCap para activar este estudio.'
        });
    }

    // ══ TARJETA(S) 2 — ESTUDIOS COMPLEMENTARIOS (PDF, Word, txt, CSV) ═════
    if (!window.estudiosComplementarios || !window.estudiosComplementarios.length) {
        html += _renderTarjetaEstudio({
            icon:'📁', iconBg:'#f0f9ff',
            nombre:'Estudios complementarios',
            descripcion:'PDF, Word, CSV, txt — documentos del municipio',
            estado:'Sin cargar', estadoBg:'#f1f5f9', estadoFg:'#94a3b8',
            datoHtml:
                '<label style="display:block;background:#f0f9ff;border:1.5px dashed #7dd3fc;' +
                'border-radius:8px;padding:0.55rem 0.9rem;text-align:center;cursor:pointer;' +
                'font-size:0.8rem;font-weight:600;color:#0369a1;margin-bottom:0.4rem;">' +
                '<input type="file" accept=".pdf,.docx,.doc,.txt,.csv" multiple ' +
                'onchange="cargarEstudiosComplementarios(this)" hidden>' +
                '📁 Seleccionar archivos (Word, PDF, txt, CSV)</label>' +
                '<div style="font-size:0.73rem;color:#64748b;text-align:center;margin:0.3rem 0;">— o pega texto directamente —</div>' +
                '<textarea id="texto-estudio-libre-sec03" placeholder="Pega aquí el texto del estudio..." rows="3" ' +
                'style="width:100%;padding:0.4rem;border:1px solid #bae6fd;border-radius:6px;' +
                'font-size:0.77rem;resize:vertical;box-sizing:border-box;" ' +
                'onchange="cargarEstudioTextoLibreSec03(this)"></textarea>',
            monitorFn:'estudiosComplementarios_abrirVisor(\'Sin estudios cargados\',\'\')',
            monitorLabel:'📊 Abrir visor',
            accionesHtml:'',
            detalleHtml:'Puedes cargar informes epidemiológicos, estudios locales, memorias de ' +
                'servicios sociales u otros documentos relevantes para el diagnóstico comunitario. ' +
                'También puedes cargar desde ⚙️ Gestionar fuentes.'
        });
    } else {
        window.estudiosComplementarios.forEach(function(e, idx) {
            var esIBSE = (e.tipo === 'ibse' || (e.nombre && /ibse/i.test(e.nombre)));
            var words  = Math.round(((e.texto||'').length) / 5);
            var resumen = (e.texto||'').slice(0, 280) + ((e.texto||'').length > 280 ? '…' : '');
            html += _renderTarjetaEstudio({
                icon: esIBSE ? '📊' : '📄',
                iconBg: esIBSE ? '#ecfdf5' : '#f0f9ff',
                nombre: e.nombre,
                descripcion: (esIBSE ? 'IBSE' : (e.tipo || 'Estudio')) +
                    (words > 0 ? ' · ~' + words + ' palabras' : ''),
                estado:'📄 Cargado', estadoBg:'#f0fdf4', estadoFg:'#16a34a',
                datoHtml: resumen
                    ? '<p style="font-size:0.77rem;color:#475569;margin:0;line-height:1.55;' +
                      'max-height:64px;overflow:hidden;">' + resumen + '</p>'
                    : '',
                monitorFn:'_estudioComplementarioVisor(' + idx + ')',
                monitorLabel:'📊 Abrir visor',
                accionesHtml:'',
                detalleHtml:''
            });
        });
        html += '<label style="display:block;background:white;border:1.5px dashed #93c5fd;' +
            'border-radius:10px;padding:0.5rem 1rem;text-align:center;cursor:pointer;' +
            'font-size:0.77rem;font-weight:700;color:#0369a1;margin-bottom:0.75rem;">' +
            '<input type="file" accept=".pdf,.docx,.doc,.txt,.csv" multiple ' +
            'onchange="cargarEstudiosComplementarios(this)" hidden>' +
            '➕ Añadir más estudios</label>';
    }

    // ══ TARJETA 3 — ESCALAS DIAGNÓSTICAS ══════════════════════════════════
    var resumenEscalas = generarResumenEscalasDiagnosticas();
    var numEsc = resumenEscalas ? (resumenEscalas.match(/<li/g) || []).length : 0;
    html += _renderTarjetaEstudio({
        icon:'🧪', iconBg:'#f0fdfa',
        nombre:'Escalas diagnósticas complementarias',
        descripcion:'SF-12, Duke-UNC, CAGE, PREDIMED',
        estado: numEsc > 0 ? numEsc + ' registrada' + (numEsc > 1 ? 's' : '') : 'Sin registrar',
        estadoBg: numEsc > 0 ? '#f0fdf4' : '#f1f5f9',
        estadoFg: numEsc > 0 ? '#16a34a' : '#94a3b8',
        datoHtml: resumenEscalas
            ? '<div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;' +
              'padding:0.6rem 0.75rem;"><ul style="margin:0 0 0 1rem;padding:0;font-size:0.77rem;' +
              'color:#334155;line-height:1.6;">' + resumenEscalas + '</ul></div>'
            : '<p style="font-size:0.77rem;color:#94a3b8;margin:0;font-style:italic;">' +
              'No hay escalas diagnósticas registradas todavía.</p>',
        monitorFn:'abrirModalEscalasDiagnosticas()',
        monitorLabel:'📊 Abrir monitor',
        accionesHtml:'',
        detalleHtml:'Instrumentos estandarizados: salud percibida (SF-12), apoyo social (Duke-UNC), ' +
            'consumo de alcohol (CAGE) y dieta mediterránea (PREDIMED). El registro de resultados ' +
            'apoya el diagnóstico comunitario.'
    });

    html += '</div>';
    el.innerHTML = html;
}"""

# Sustituir: desde START_MARKER hasta END_MARKER (sin incluir END_MARKER)
new_content = content[:idx_start] + NEW_CODE + content[idx_end:]

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(new_content)

print(f"OK: archivo guardado ({len(content)} -> {len(new_content)} chars)")

# Verificaciones
checks = [
    '_renderTarjetaEstudio',
    'estudiosComplementarios_abrirVisor',
    '_estudioComplementarioVisor',
    'TARJETA 1',
    'TARJETA(S) 2',
    'TARJETA 3',
    'ibseMonitor_abrir()',
    'abrirModalEscalasDiagnosticas()',
]
with open(path, 'rb') as f:
    verify = f.read().decode('utf-8')
for c in checks:
    ok = c in verify
    print(f"{'OK' if ok else 'MISSING'}: {c}")

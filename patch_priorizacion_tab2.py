"""
patch_priorizacion_tab2.py
Redisena el acordeon de Priorizacion (TAB 2) con 3 tarjetas config-driven:
  1. Priorizacion ciudadana
  2. Priorizacion tecnica
  3. VRELAS
Patron visual identico a renderizarSeccionEstudios / _renderTarjetaEstudio.
"""
import sys, re

path = r'C:\Users\blash\Desktop\COMPAS\index.html'
with open(path, 'rb') as f:
    content = f.read().decode('utf-8')

original_len = len(content)

# ─────────────────────────────────────────────────────────────────────────────
# PASO 1: Actualizar badge del acordeon HTML
# ─────────────────────────────────────────────────────────────────────────────
OLD_BADGE = (
    'Estrategi\u0301a &middot; Tema\u0301tica &middot; Mixta'
)
# primero probar version exacta del HTML
old_header = (
    '<span>04 Priorizaci\u00f3n ciudadana</span>\n'
    '                        <span style="background:#f0f9ff; color:#0369a1; padding:0.15rem 0.5rem; border-radius:10px; font-size:0.7rem; font-weight:600;">'
    '\U0001f3af Estrat\u00e9gica \u00b7 Tem\u00e1tica \u00b7 Mixta</span>'
)
new_header = (
    '<span>04 Priorizaci\u00f3n</span>\n'
    '                        <span style="background:#f0f9ff; color:#0369a1; padding:0.15rem 0.5rem; border-radius:10px; font-size:0.7rem; font-weight:600;">'
    '\U0001f3af Ciudadana \u00b7 T\u00e9cnica \u00b7 VRELAS</span>'
)
n_header = content.count(old_header)
if n_header:
    content = content.replace(old_header, new_header)
    print('OK [%dx] badge acordeon' % n_header)
else:
    print('MISSING badge acordeon — buscando variante...')
    # variante con \r
    old_h2 = old_header.replace('\n', '\r\n')
    n_h2 = content.count(old_h2)
    if n_h2:
        new_h2 = new_header.replace('\n', '\r\n')
        content = content.replace(old_h2, new_h2)
        print('  OK [%dx] badge acordeon (CRLF)' % n_h2)
    else:
        # intento minimo: solo el span del badge
        old_sp = ('\U0001f3af Estrat\u00e9gica \u00b7 Tem\u00e1tica \u00b7 Mixta')
        new_sp = ('\U0001f3af Ciudadana \u00b7 T\u00e9cnica \u00b7 VRELAS')
        n_sp = content.count(old_sp)
        content = content.replace(old_sp, new_sp)
        print('  OK [%dx] badge span (fallback)' % n_sp)

    # tambien actualizar onclick del header del acordeon
    old_title = '<span>04 Priorizaci\u00f3n ciudadana</span>'
    new_title = '<span>04 Priorizaci\u00f3n</span>'
    n_t = content.count(old_title)
    if n_t:
        content = content.replace(old_title, new_title)
        print('  OK [%dx] titulo span acordeon' % n_t)

# ─────────────────────────────────────────────────────────────────────────────
# PASO 2: Reemplazar el bloque completo de renderizarSeccionPriorizacion()
#         y las funciones auxiliares nuevas
# ─────────────────────────────────────────────────────────────────────────────
START_MARKER = '// Renderizar secci\u00f3n 04 \u2014 Visor unificado de priorizaci\u00f3n ciudadana'
END_MARKER   = '// ============================================================'
# END_MARKER puede aparecer varias veces; queremos el que sigue a la funcion
# Buscar START primero
start_idx = content.find(START_MARKER)
if start_idx == -1:
    print('FATAL: START_MARKER no encontrado')
    sys.exit(1)

# Buscar END_MARKER a partir del start (es el separador que viene DESPUES)
end_idx = content.find(END_MARKER, start_idx + len(START_MARKER))
if end_idx == -1:
    print('FATAL: END_MARKER no encontrado')
    sys.exit(1)

# Retroceder para incluir \r y \n antes del separador
while end_idx > 0 and content[end_idx - 1] in ('\r', '\n'):
    end_idx -= 1
end_idx += 1  # dejar un salto al final

old_block = content[start_idx:end_idx]
print('Bloque encontrado: %d chars (linea aprox %d)' % (
    len(old_block),
    content[:start_idx].count('\n') + 1
))

# ─────────────────────────────────────────────────────────────────────────────
# NUEVO BLOQUE
# ─────────────────────────────────────────────────────────────────────────────
NEW_BLOCK = r"""// Renderizar sección 04 — Métodos de priorización (config-driven: Ciudadana · Técnica · VRELAS)

// ── Helper: tarjeta común para cualquier método de priorización ───────────────
// cfg: { icon, iconBg, nombre, descripcion, estado, estadoBg, estadoFg,
//        datoHtml, monitorFn, monitorLabel, accionesHtml, detalleHtml }
function _renderTarjetaPriorizacion(cfg) {
    var monitorLabel = cfg.monitorLabel || '\ud83d\udcca Abrir monitor';
    var detalle = cfg.detalleHtml
        ? '<details style="margin-top:0.55rem;">' +
          '<summary style="font-size:0.74rem;color:#64748b;cursor:pointer;font-weight:600;' +
          'list-style:none;display:inline-flex;align-items:center;gap:0.3rem;">\u25b8 Ver descripci\u00f3n</summary>' +
          '<div style="margin-top:0.45rem;padding:0.55rem 0.7rem;background:#f8fafc;border-radius:7px;' +
          'font-size:0.75rem;color:#475569;line-height:1.6;">' + cfg.detalleHtml + '</div>' +
          '</details>'
        : '';
    return (
        '<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;' +
        'margin-bottom:0.7rem;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.05);">' +
            '<div style="display:flex;align-items:center;gap:0.6rem;padding:0.75rem 1rem;' +
            'border-bottom:1px solid #f1f5f9;background:#fafbfc;">' +
                '<div style="width:2.1rem;height:2.1rem;border-radius:9px;background:' +
                (cfg.iconBg || '#f0f9ff') + ';display:flex;align-items:center;' +
                'justify-content:center;font-size:1rem;flex-shrink:0;">' + (cfg.icon || '\ud83d\udcc4') + '</div>' +
                '<div style="flex:1;min-width:0;">' +
                    '<div style="font-weight:700;font-size:0.86rem;color:#1e293b;line-height:1.3;">' +
                    cfg.nombre + '</div>' +
                    (cfg.descripcion
                        ? '<div style="font-size:0.71rem;color:#64748b;margin-top:0.04rem;">' +
                          cfg.descripcion + '</div>'
                        : '') +
                '</div>' +
                '<span style="background:' + (cfg.estadoBg || '#f1f5f9') + ';color:' +
                (cfg.estadoFg || '#475569') + ';padding:0.13rem 0.5rem;border-radius:999px;' +
                'font-size:0.66rem;font-weight:700;flex-shrink:0;white-space:nowrap;">' +
                (cfg.estado || '') + '</span>' +
            '</div>' +
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

// ── Monitor de priorización — modal inline (placeholder mientras no existe monitor_priorizacion.html)
function priorizacion_abrirMonitor(tipo) {
    var m = document.getElementById('modal-monitor-priorizacion');
    if (!m) {
        m = document.createElement('div');
        m.id = 'modal-monitor-priorizacion';
        m.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);' +
            'z-index:20000;display:flex;align-items:flex-start;justify-content:center;' +
            'padding:2rem;overflow-y:auto;';
        m.onclick = function(e){ if (e.target === m) m.style.display = 'none'; };
        document.body.appendChild(m);
    }

    var TEMAS = (typeof VRELAS_TEMAS !== 'undefined') ? VRELAS_TEMAS : {};
    var ICONOS = (typeof VRELAS_ICONOS_TEMAS !== 'undefined') ? VRELAS_ICONOS_TEMAS : {};
    var HABITOS = (typeof RELAS_HABITOS !== 'undefined') ? RELAS_HABITOS : {};
    var PROBLEMAS = (typeof RELAS_PROBLEMAS !== 'undefined') ? RELAS_PROBLEMAS : {};

    var titulos = {
        ciudadana: '\ud83c\udfaf Monitor — Priorizaci\u00f3n ciudadana',
        tecnica:   '\ud83d\udcca Monitor — Priorizaci\u00f3n t\u00e9cnica',
        vrelas:    '\ud83d\uddf3\ufe0f Monitor — VRELAS'
    };
    var colores = { ciudadana: '#be185d', tecnica: '#1d4ed8', vrelas: '#0369a1' };
    var titulo = titulos[tipo] || ('Monitor — ' + tipo);
    var color  = colores[tipo] || '#0074c8';

    var cuerpo = '';

    if (tipo === 'ciudadana') {
        var pTem = window.datosParticipacionCiudadana;
        var pEst = window.COMPAS && window.COMPAS.prioridades && window.COMPAS.prioridades.epvsa;
        var pMix = window.COMPAS && window.COMPAS.prioridades && window.COMPAS.prioridades.relas;
        var tieneEst = !!(pEst && (pEst.n > 0 || (pEst.rankingObjetivos && pEst.rankingObjetivos.length)));
        if (!tieneEst && pTem && !pTem.temasFreq && pTem.rankingObjetivos && pTem.rankingObjetivos.length) {
            tieneEst = true; pEst = pTem;
        }
        var tieneTem = !!(pTem && pTem.temasFreq);
        var tieneMix = !!(pMix && pMix.n > 0);
        var hayAlgo = tieneEst || tieneTem || tieneMix;

        if (!hayAlgo) {
            cuerpo = '<div style="text-align:center;padding:2rem;color:#94a3b8;font-size:0.9rem;">' +
                '\u23f3 Sin datos de priorizaci\u00f3n ciudadana confirmados.<br>' +
                '<span style="font-size:0.8rem;">Usa las herramientas de votaci\u00f3n para registrar resultados.</span></div>';
        } else {
            if (tieneEst && pEst && pEst.rankingObjetivos && pEst.rankingObjetivos.length) {
                cuerpo += '<h4 style="color:#be185d;font-size:0.85rem;margin:0 0 0.5rem;">\ud83c\udfaf Priorizaci\u00f3n Estrat\u00e9gica — ' +
                    (pEst.n || '?') + ' participantes</h4>';
                pEst.rankingObjetivos.slice(0, 5).forEach(function(o, i) {
                    cuerpo += '<div style="display:flex;align-items:center;gap:0.5rem;padding:0.35rem 0.6rem;' +
                        'background:#fdf4ff;border:1px solid #f3e8ff;border-radius:7px;margin-bottom:0.2rem;">' +
                        '<span style="font-weight:700;color:#be185d;min-width:1.4rem;font-size:0.75rem;">' + (i+1) + '\u00ba</span>' +
                        '<span style="flex:1;font-size:0.8rem;color:#1e293b;">' + (o.icono||'\ud83c\udfaf') + ' ' + o.texto + '</span>' +
                        '<span style="color:#9d174d;font-weight:600;font-size:0.75rem;">' + (o.votos||0) + ' v.</span>' +
                        '</div>';
                });
            }
            if (tieneTem && pTem && pTem.temasFreq) {
                cuerpo += '<h4 style="color:#0369a1;font-size:0.85rem;margin:0.8rem 0 0.5rem;">\ud83d\uddf3\ufe0f Priorizaci\u00f3n Tem\u00e1tica — ' +
                    (pTem.n || pTem.totalParticipantes || '?') + ' participantes</h4>';
                Object.entries(pTem.temasFreq)
                    .map(function(e){ return { k: parseInt(e[0]), v: e[1] }; })
                    .sort(function(a,b){ return b.v - a.v; })
                    .slice(0, 5)
                    .forEach(function(item, i) {
                        var ico = ICONOS[item.k] || '\u2022';
                        var lbl = TEMAS[item.k] || ('Tema ' + item.k);
                        var nR  = pTem.n || pTem.totalParticipantes || 1;
                        var pct = nR !== '?' ? Math.round(item.v / nR * 100) : '?';
                        cuerpo += '<div style="display:flex;align-items:center;gap:0.5rem;padding:0.3rem 0.6rem;' +
                            'background:#f0f9ff;border:1px solid #bae6fd;border-radius:7px;margin-bottom:0.2rem;">' +
                            '<span style="font-size:0.85rem;">' + ico + '</span>' +
                            '<span style="flex:1;font-size:0.78rem;color:#1e293b;">' + lbl + '</span>' +
                            '<span style="color:#0074c8;font-weight:600;font-size:0.75rem;">' + pct + '%</span>' +
                            '</div>';
                    });
            }
            if (tieneMix && pMix) {
                var _toFreqObj = function(arr) {
                    var o = {}; (arr||[]).forEach(function(x){ if (x && x.id !== undefined) o[x.id] = x.n; }); return o;
                };
                var topH = pMix.topHab || (pMix.habitosMasFrecuentes ? _toFreqObj(pMix.habitosMasFrecuentes) : {});
                var topP = pMix.topProb || (pMix.problemasMasFrecuentes ? _toFreqObj(pMix.problemasMasFrecuentes) : {});
                cuerpo += '<h4 style="color:#166534;font-size:0.85rem;margin:0.8rem 0 0.5rem;">\ud83d\uddc2\ufe0f Priorizaci\u00f3n Mixta — ' +
                    (pMix.n || '?') + ' participantes</h4>';
                if (topH && Object.keys(topH).length) {
                    cuerpo += '<div style="font-size:0.73rem;font-weight:600;color:#2d6a4f;margin-bottom:0.2rem;">\ud83c\udfc3 H\u00e1bitos</div>';
                    Object.entries(topH).sort(function(a,b){return b[1]-a[1];}).slice(0,3).forEach(function(e){
                        var lbl = HABITOS[e[0]] || ('H\u00e1bito ' + e[0]);
                        cuerpo += '<div style="font-size:0.77rem;padding:0.2rem 0.5rem;background:#f0fdf4;' +
                            'border:1px solid #d1fae5;border-radius:5px;margin-bottom:0.12rem;display:flex;' +
                            'justify-content:space-between;"><span>' + lbl + '</span><span style="color:#2d6a4f;font-weight:600;">' + e[1] + '</span></div>';
                    });
                }
                if (topP && Object.keys(topP).length) {
                    cuerpo += '<div style="font-size:0.73rem;font-weight:600;color:#dc2626;margin-top:0.4rem;margin-bottom:0.2rem;">\u26a0\ufe0f Problemas</div>';
                    Object.entries(topP).sort(function(a,b){return b[1]-a[1];}).slice(0,3).forEach(function(e){
                        var lbl = PROBLEMAS[e[0]] || ('Problema ' + e[0]);
                        cuerpo += '<div style="font-size:0.77rem;padding:0.2rem 0.5rem;background:#fff9f9;' +
                            'border:1px solid #fecaca;border-radius:5px;margin-bottom:0.12rem;display:flex;' +
                            'justify-content:space-between;"><span>' + lbl + '</span><span style="color:#dc2626;font-weight:600;">' + e[1] + '</span></div>';
                    });
                }
            }
        }
    } else if (tipo === 'tecnica') {
        var decision = window.decisionPriorizacionActual;
        var metodosTxt = { epidemiologica: 'Epidemiol\u00f3gica', ciudadana: 'Ciudadana', integracion: 'Integrada (70% epid. + 30% ciudadana)' };
        if (!decision || !decision.metodo) {
            cuerpo = '<div style="text-align:center;padding:2rem;color:#94a3b8;font-size:0.9rem;">' +
                '\u23f3 Sin decisi\u00f3n t\u00e9cnica registrada.<br>' +
                '<span style="font-size:0.8rem;">Usa la herramienta de priorizaci\u00f3n dual para registrar una decisi\u00f3n.</span></div>' +
                '<div style="text-align:center;margin-top:1rem;">' +
                '<button onclick="document.getElementById(\'modal-monitor-priorizacion\').style.display=\'none\';mostrarPriorizacionDual();" ' +
                'style="background:#6366f1;color:white;border:none;border-radius:8px;padding:0.5rem 1rem;font-size:0.85rem;font-weight:600;cursor:pointer;">' +
                '\u2696\ufe0f Ir a priorizaci\u00f3n dual</button></div>';
        } else {
            cuerpo = '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:0.75rem 1rem;margin-bottom:0.6rem;">' +
                '<div style="font-size:0.8rem;font-weight:700;color:#1d4ed8;margin-bottom:0.3rem;">\u2714 Decisi\u00f3n registrada</div>' +
                '<div style="font-size:0.82rem;color:#1e293b;"><strong>M\u00e9todo:</strong> ' + (metodosTxt[decision.metodo] || decision.metodo) + '</div>' +
                (decision.areaPrioritaria ? '<div style="font-size:0.78rem;color:#475569;margin-top:0.2rem;"><strong>\u00c1rea prioritaria:</strong> ' + decision.areaPrioritaria + '</div>' : '') +
                (decision.objetivo ? '<div style="font-size:0.78rem;color:#475569;margin-top:0.2rem;"><strong>Objetivo:</strong> ' + decision.objetivo + '</div>' : '') +
                '</div>';
            var fusion = window.datosFusionPriorizacion;
            if (fusion && fusion.ranking && fusion.ranking.length) {
                cuerpo += '<h4 style="font-size:0.83rem;color:#1d4ed8;margin:0.5rem 0;">Ranking integrado</h4>';
                fusion.ranking.slice(0, 5).forEach(function(r, i) {
                    cuerpo += '<div style="display:flex;align-items:center;gap:0.5rem;padding:0.3rem 0.6rem;' +
                        'background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;margin-bottom:0.2rem;">' +
                        '<span style="font-weight:700;color:#1d4ed8;min-width:1.3rem;font-size:0.75rem;">' + (i+1) + '\u00ba</span>' +
                        '<span style="flex:1;font-size:0.78rem;color:#1e293b;">' + (r.area || r.label || r.texto || '') + '</span>' +
                        '<span style="color:#1d4ed8;font-weight:600;font-size:0.73rem;">' + (r.puntuacion != null ? r.puntuacion : '') + '</span>' +
                        '</div>';
                });
            }
        }
    } else if (tipo === 'vrelas') {
        var pV = window.datosParticipacionCiudadana;
        var tieneV = !!(pV && pV.temasFreq);
        if (!tieneV) {
            cuerpo = '<div style="text-align:center;padding:2rem;color:#94a3b8;font-size:0.9rem;">' +
                '\u23f3 Sin datos VRELAS confirmados.<br>' +
                '<span style="font-size:0.8rem;">Usa la herramienta de votaci\u00f3n tem\u00e1tica para registrar resultados.</span></div>' +
                '<div style="text-align:center;margin-top:1rem;">' +
                '<button onclick="document.getElementById(\'modal-monitor-priorizacion\').style.display=\'none\';cambiarTabManual(\'votacion-relas\');" ' +
                'style="background:#0074c8;color:white;border:none;border-radius:8px;padding:0.5rem 1rem;font-size:0.85rem;font-weight:600;cursor:pointer;">' +
                '\ud83d\uddf3\ufe0f Abrir herramienta VRELAS</button></div>';
        } else {
            var nV = pV.n || pV.totalParticipantes || '?';
            cuerpo = '<div style="font-size:0.8rem;color:#0369a1;font-weight:700;margin-bottom:0.5rem;">' +
                '\ud83d\uddf3\ufe0f Resultados tem\u00e1ticos \u2014 ' + nV + ' participantes</div>';
            var sorted = Object.entries(pV.temasFreq)
                .map(function(e){ return { k: parseInt(e[0]), v: e[1] }; })
                .sort(function(a,b){ return b.v - a.v; });
            var maxV = sorted[0] ? sorted[0].v : 1;
            var medallas = ['\ud83e\udd47','\ud83e\udd48','\ud83e\udd49'];
            sorted.forEach(function(item, i) {
                var ico  = ICONOS[item.k] || '\u2022';
                var lbl  = TEMAS[item.k] || ('Tema ' + item.k);
                var pct  = nV !== '?' ? Math.round(item.v / nV * 100) : '?';
                var barW = Math.round(item.v / maxV * 100);
                var isTop = i < 3;
                var bg  = isTop ? '#f0f9ff' : '#f8fafc';
                var brd = isTop ? '#bae6fd' : '#f0f0f0';
                var acc = isTop ? '#0074c8' : '#64748b';
                var medal = medallas[i] || '';
                cuerpo += '<div style="display:flex;align-items:center;gap:0.45rem;padding:' + (isTop ? '0.4rem 0.6rem' : '0.25rem 0.6rem') + ';' +
                    'background:' + bg + ';border:1px solid ' + brd + ';border-radius:7px;margin-bottom:0.2rem;">' +
                    (medal ? '<span style="font-size:' + (isTop ? '0.9rem' : '0.72rem') + ';flex-shrink:0;">' + medal + '</span>'
                           : '<span style="width:1.2rem;text-align:center;font-size:0.62rem;color:#94a3b8;font-weight:700;flex-shrink:0;">' + (i+1) + '\u00ba</span>') +
                    '<span style="font-size:' + (isTop ? '0.9rem' : '0.78rem') + ';flex-shrink:0;">' + ico + '</span>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="font-size:' + (isTop ? '0.78rem' : '0.7rem') + ';font-weight:' + (isTop ? '600' : '400') + ';color:#1e293b;' +
                        'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + lbl + '</div>' +
                        '<div style="height:3px;background:#e5e7eb;border-radius:2px;margin-top:0.1rem;overflow:hidden;">' +
                        '<div style="height:100%;width:' + barW + '%;background:' + acc + ';border-radius:2px;"></div>' +
                        '</div>' +
                    '</div>' +
                    '<span style="font-size:' + (isTop ? '0.77rem' : '0.67rem') + ';font-weight:700;color:' + acc + ';flex-shrink:0;min-width:2rem;text-align:right;">' + pct + '%</span>' +
                    '</div>';
            });
        }
    }

    m.innerHTML =
        '<div style="background:white;border-radius:16px;max-width:820px;width:100%;' +
        'box-shadow:0 20px 50px rgba(0,0,0,0.2);overflow:hidden;">' +
            '<div style="background:linear-gradient(135deg,' + color + ',' + color + 'cc);color:white;' +
            'padding:1rem 1.5rem;display:flex;justify-content:space-between;align-items:center;">' +
                '<div style="display:flex;align-items:center;gap:0.6rem;">' +
                    '<span style="font-size:1.1rem;">\ud83d\udcca</span>' +
                    '<strong style="font-size:0.95rem;">' + titulo + '</strong>' +
                '</div>' +
                '<button onclick="document.getElementById(\'modal-monitor-priorizacion\').style.display=\'none\'" ' +
                'style="background:rgba(255,255,255,0.2);border:none;color:white;width:32px;height:32px;' +
                'border-radius:50%;cursor:pointer;font-size:1rem;">\u2715</button>' +
            '</div>' +
            '<div style="padding:1.5rem;max-height:70vh;overflow-y:auto;">' +
                cuerpo +
                '<div style="margin-top:1.2rem;padding-top:0.8rem;border-top:1px solid #f1f5f9;' +
                'font-size:0.72rem;color:#94a3b8;text-align:center;">' +
                'Monitor provisional \u2014 monitor_priorizacion.html en desarrollo</div>' +
            '</div>' +
        '</div>';
    m.style.display = 'flex';
}

// ── Borrar priorización ciudadana (in-memory + re-render)
function priorizacion_borrarCiudadana() {
    if (!confirm('Borrar datos de priorizaci\u00f3n ciudadana cargados en memoria?\n\nEsto no borra datos en Firebase.')) return;
    window.datosParticipacionCiudadana = null;
    window.datosParticipacionCiudadanaMunicipio = null;
    if (window.COMPAS && window.COMPAS.prioridades) {
        window.COMPAS.prioridades.epvsa = null;
    }
    try { renderizarSeccionPriorizacion(); } catch(e) {}
    try { actualizarChecklistIA(); } catch(e) {}
}

// ── Borrar datos VRELAS (in-memory + re-render)
function priorizacion_borrarVrelas() {
    if (!confirm('Borrar datos VRELAS cargados en memoria?\n\nEsto no borra datos en Firebase.')) return;
    window.datosParticipacionCiudadana = null;
    window.datosParticipacionCiudadanaMunicipio = null;
    if (window.COMPAS && window.COMPAS.prioridades) {
        window.COMPAS.prioridades.relas = null;
    }
    try { renderizarSeccionPriorizacion(); } catch(e) {}
    try { actualizarChecklistIA(); } catch(e) {}
}

// ── Borrar decisión técnica (in-memory + re-render)
function priorizacion_borrarTecnica() {
    if (!confirm('Borrar la decisi\u00f3n t\u00e9cnica de priorizaci\u00f3n en memoria?\n\nEsto no borra datos en Firebase.')) return;
    window.decisionPriorizacionActual = null;
    window.datosFusionPriorizacion = null;
    if (window.COMPAS && window.COMPAS.prioridades) {
        window.COMPAS.prioridades.fusion = null;
    }
    try { renderizarSeccionPriorizacion(); } catch(e) {}
}

function renderizarSeccionPriorizacion() {
    var el = document.getElementById('seccion-priorizacion-popular');
    if (!el) return;
    var municipio = (typeof getMunicipioActual === 'function') ? getMunicipioActual() : null;

    // ── Estado: Priorización ciudadana ────────────────────────────────────────
    var pTem = window.datosParticipacionCiudadana;
    // [M1-GUARDIA] descartar si pertenece a otro municipio
    if (pTem && window.datosParticipacionCiudadanaMunicipio && municipio &&
        window.datosParticipacionCiudadanaMunicipio !== municipio) { pTem = null; }
    var tieneTem = !!(pTem && (pTem.temasFreq || pTem.fuente === 'votacion_relas'));
    var nTem = tieneTem ? (pTem.n || pTem.totalParticipantes || '?') : null;

    var pEst = window.COMPAS && window.COMPAS.prioridades && window.COMPAS.prioridades.epvsa;
    var tieneEst = !!(pEst && (pEst.n > 0 || (pEst.rankingObjetivos && pEst.rankingObjetivos.length)));
    var nEst = tieneEst ? (pEst.n || '?') : null;
    if (!tieneEst && pTem && !pTem.temasFreq && pTem.rankingObjetivos && pTem.rankingObjetivos.length) {
        tieneEst = true; pEst = pTem; nEst = pTem.totalParticipantes || pTem.n || '?';
    }

    var pMix = window.COMPAS && window.COMPAS.prioridades && window.COMPAS.prioridades.relas;
    var tieneMix = !!(pMix && pMix.n > 0);
    if (!tieneMix && typeof relas_globalData !== 'undefined' && relas_globalData && relas_globalData._n) {
        pMix = { n: relas_globalData._n, fuente: 'relas_datos',
                 topHab: relas_globalData._habFreq, topProb: relas_globalData._probFreq };
        tieneMix = true;
    }
    // Normalizar pMix: habitosMasFrecuentes (array) → topHab (objeto)
    if (tieneMix && pMix && pMix.habitosMasFrecuentes && !pMix.topHab) {
        var _toFreqObj = function(arr) {
            var o = {}; (arr||[]).forEach(function(x){ if (x && x.id !== undefined) o[x.id] = x.n; }); return o;
        };
        pMix = { n: pMix.n, fuente: pMix.fuente,
                 topHab: _toFreqObj(pMix.habitosMasFrecuentes),
                 topProb: _toFreqObj(pMix.problemasMasFrecuentes) };
    }
    var nMix = tieneMix ? (pMix.n || '?') : null;

    var tieneCiudadana = tieneTem || tieneEst || tieneMix;
    var nCiudadana = nTem || nEst || nMix;

    // ── Estado: Priorización técnica ──────────────────────────────────────────
    var decision = window.decisionPriorizacionActual;
    var tieneTecnica = !!(decision && decision.metodo);
    var metodosTxt = { epidemiologica: 'Epidemiol\u00f3gica', ciudadana: 'Ciudadana', integracion: 'Integrada' };

    // ── Estado: VRELAS ────────────────────────────────────────────────────────
    var tieneVrelas = !!(pTem && pTem.temasFreq);
    var nVrelas = tieneVrelas ? (pTem.n || pTem.totalParticipantes || '?') : null;

    // Auto-carga silenciosa si no hay datos
    if (!tieneCiudadana && municipio) {
        resolverPriorizacionCiudadana(municipio).then(function(res){
            if (res) { try { renderizarSeccionPriorizacion(); } catch(e) {} }
        });
    }

    var html = '<div style="padding:0.75rem;">';

    // ══ TARJETA 1 — PRIORIZACIÓN CIUDADANA ════════════════════════════════════
    var datoHtmlCiudadana = '';
    if (tieneCiudadana) {
        // Resumen de tipos disponibles
        var subtipos = [];
        if (tieneEst) subtipos.push('<span style="background:#fce7f3;color:#be185d;padding:.1rem .38rem;' +
            'border-radius:6px;font-size:.64rem;font-weight:600;">\ud83c\udfaf Estrat\u00e9gica ' + nEst + '</span>');
        if (tieneTem) subtipos.push('<span style="background:#e0f2fe;color:#0369a1;padding:.1rem .38rem;' +
            'border-radius:6px;font-size:.64rem;font-weight:600;">\ud83d\uddf3\ufe0f Tem\u00e1tica ' + nTem + '</span>');
        if (tieneMix) subtipos.push('<span style="background:#dcfce7;color:#166534;padding:.1rem .38rem;' +
            'border-radius:6px;font-size:.64rem;font-weight:600;">\ud83d\uddc2\ufe0f Mixta ' + nMix + '</span>');
        datoHtmlCiudadana = '<div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.4rem;">' +
            subtipos.join('') + '</div>';
        // Top objetivo estratégico si existe
        if (tieneEst && pEst && pEst.rankingObjetivos && pEst.rankingObjetivos.length) {
            var topObj = pEst.rankingObjetivos[0];
            datoHtmlCiudadana += '<div style="display:flex;align-items:center;gap:0.4rem;padding:0.32rem 0.55rem;' +
                'background:#fdf4ff;border:1px solid #f3e8ff;border-radius:6px;">' +
                '<span style="font-size:0.85rem;">\ud83e\udd47</span>' +
                '<span style="flex:1;font-size:0.76rem;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
                (topObj.icono||'\ud83c\udfaf') + ' ' + topObj.texto + '</span>' +
                '<span style="font-size:0.7rem;color:#9d174d;font-weight:600;flex-shrink:0;">' + (topObj.votos||0) + ' v.</span>' +
                '</div>';
        } else if (tieneVrelas && pTem && pTem.temasFreq) {
            // Top tema temático como resumen
            var temas = Object.entries(pTem.temasFreq)
                .map(function(e){ return { k: parseInt(e[0]), v: e[1] }; })
                .sort(function(a,b){ return b.v - a.v; });
            if (temas.length) {
                var top1 = temas[0];
                var TEMAS_L = (typeof VRELAS_TEMAS !== 'undefined') ? VRELAS_TEMAS : {};
                var ICONOS_L = (typeof VRELAS_ICONOS_TEMAS !== 'undefined') ? VRELAS_ICONOS_TEMAS : {};
                var nTot = pTem.n || pTem.totalParticipantes || 1;
                var pct1 = nTot !== '?' ? Math.round(top1.v / nTot * 100) : '?';
                datoHtmlCiudadana += '<div style="display:flex;align-items:center;gap:0.4rem;padding:0.32rem 0.55rem;' +
                    'background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;">' +
                    '<span style="font-size:0.85rem;">\ud83e\udd47</span>' +
                    '<span style="font-size:0.88rem;flex-shrink:0;">' + (ICONOS_L[top1.k]||'\u2022') + '</span>' +
                    '<span style="flex:1;font-size:0.76rem;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
                    (TEMAS_L[top1.k]||('Tema ' + top1.k)) + '</span>' +
                    '<span style="font-size:0.7rem;color:#0074c8;font-weight:600;flex-shrink:0;">' + pct1 + '%</span>' +
                    '</div>';
            }
        }
    }
    var btnsCiudadana =
        '<button onclick="cambiarTabManual(\'votacion\')" ' +
        'style="background:white;border:1px solid #e2e8f0;border-radius:7px;' +
        'padding:0.36rem 0.65rem;font-size:0.74rem;font-weight:600;color:#475569;cursor:pointer;" ' +
        'title="Herramienta de votaci\u00f3n estrat\u00e9gica">\ud83c\udfaf Estrat\u00e9gica</button>' +
        '<button onclick="cambiarTabManual(\'votacion-relas\')" ' +
        'style="background:white;border:1px solid #e2e8f0;border-radius:7px;' +
        'padding:0.36rem 0.65rem;font-size:0.74rem;font-weight:600;color:#475569;cursor:pointer;" ' +
        'title="Herramienta de votaci\u00f3n tem\u00e1tica VRELAS">\ud83d\uddf3\ufe0f Tem\u00e1tica</button>' +
        (tieneCiudadana
            ? '<button onclick="priorizacion_borrarCiudadana()" ' +
              'style="background:white;border:1px solid #fca5a5;border-radius:7px;' +
              'padding:0.36rem 0.55rem;font-size:0.72rem;color:#dc2626;cursor:pointer;" ' +
              'title="Borrar datos ciudadanos en memoria">\ud83d\uddd1\ufe0f</button>'
            : '');
    html += _renderTarjetaPriorizacion({
        icon: '\ud83c\udfaf', iconBg: tieneCiudadana ? '#fdf4ff' : '#f8f0ff',
        nombre: 'Priorizaci\u00f3n ciudadana',
        descripcion: 'Estrat\u00e9gica \u00b7 Tem\u00e1tica \u00b7 Mixta',
        estado: tieneCiudadana ? ('\ud83d\udfe2 ' + nCiudadana + ' part.') : 'Sin datos',
        estadoBg: tieneCiudadana ? '#fce7f3' : '#f1f5f9',
        estadoFg: tieneCiudadana ? '#be185d' : '#94a3b8',
        datoHtml: datoHtmlCiudadana,
        monitorFn: 'priorizacion_abrirMonitor(\'ciudadana\')',
        monitorLabel: '\ud83d\udcca Abrir monitor',
        accionesHtml: btnsCiudadana,
        detalleHtml: 'Incluye priorizaci\u00f3n estrat\u00e9gica (objetivos EPVSA), tem\u00e1tica (10 temas de salud — VRELAS) ' +
            'y mixta (h\u00e1bitos, problemas y colectivos — RELAS). Usa las herramientas de votaci\u00f3n para registrar resultados.'
    });

    // ══ TARJETA 2 — PRIORIZACIÓN TÉCNICA ══════════════════════════════════════
    var datoHtmlTecnica = '';
    if (tieneTecnica) {
        datoHtmlTecnica = '<div style="display:flex;align-items:center;gap:0.5rem;padding:0.38rem 0.6rem;' +
            'background:#eff6ff;border:1px solid #bfdbfe;border-radius:7px;">' +
            '<span style="font-size:0.85rem;">\u2714\ufe0f</span>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:0.76rem;font-weight:700;color:#1d4ed8;">Decisi\u00f3n registrada</div>' +
            '<div style="font-size:0.72rem;color:#475569;margin-top:0.08rem;">' +
            (metodosTxt[decision.metodo] || decision.metodo) +
            (decision.areaPrioritaria ? ' \u00b7 ' + decision.areaPrioritaria : '') + '</div>' +
            '</div></div>';
    }
    var btnsTecnica =
        '<button onclick="mostrarPriorizacionDual()" ' +
        'style="background:white;border:1px solid #e2e8f0;border-radius:7px;' +
        'padding:0.36rem 0.65rem;font-size:0.74rem;font-weight:600;color:#475569;cursor:pointer;" ' +
        'title="Priorizaci\u00f3n dual: epidemiol\u00f3gica vs ciudadana">\u2696\ufe0f Priorizar</button>' +
        (tieneTecnica
            ? '<button onclick="priorizacion_borrarTecnica()" ' +
              'style="background:white;border:1px solid #fca5a5;border-radius:7px;' +
              'padding:0.36rem 0.55rem;font-size:0.72rem;color:#dc2626;cursor:pointer;" ' +
              'title="Borrar decisi\u00f3n t\u00e9cnica en memoria">\ud83d\uddd1\ufe0f</button>'
            : '');
    html += _renderTarjetaPriorizacion({
        icon: '\ud83d\udcca', iconBg: tieneTecnica ? '#eff6ff' : '#f0f4ff',
        nombre: 'Priorizaci\u00f3n t\u00e9cnica',
        descripcion: 'An\u00e1lisis epidemiol\u00f3gico integrado',
        estado: tieneTecnica ? ('\u2714 ' + (metodosTxt[decision.metodo]||decision.metodo)) : 'Sin decisi\u00f3n',
        estadoBg: tieneTecnica ? '#eff6ff' : '#f1f5f9',
        estadoFg: tieneTecnica ? '#1d4ed8' : '#94a3b8',
        datoHtml: datoHtmlTecnica,
        monitorFn: 'priorizacion_abrirMonitor(\'tecnica\')',
        monitorLabel: '\ud83d\udcca Abrir monitor',
        accionesHtml: btnsTecnica,
        detalleHtml: 'Combina el an\u00e1lisis epidemiol\u00f3gico del perfil de salud con la priorizaci\u00f3n ciudadana para ' +
            'generar una decisi\u00f3n t\u00e9cnica integrada (70% epidemiol\u00f3gico + 30% ciudadano, u otros m\u00e9todos).'
    });

    // ══ TARJETA 3 — VRELAS ════════════════════════════════════════════════════
    var datoHtmlVrelas = '';
    if (tieneVrelas && pTem && pTem.temasFreq) {
        var ICONOS_V = (typeof VRELAS_ICONOS_TEMAS !== 'undefined') ? VRELAS_ICONOS_TEMAS : {};
        var TEMAS_V  = (typeof VRELAS_TEMAS !== 'undefined') ? VRELAS_TEMAS : {};
        var sortedV = Object.entries(pTem.temasFreq)
            .map(function(e){ return { k: parseInt(e[0]), v: e[1] }; })
            .sort(function(a,b){ return b.v - a.v; })
            .slice(0, 5);
        var maxVV = sortedV[0] ? sortedV[0].v : 1;
        var nRV   = pTem.n || pTem.totalParticipantes || 1;
        var medallasV = ['\ud83e\udd47','\ud83e\udd48','\ud83e\udd49'];
        datoHtmlVrelas = '<div style="display:flex;flex-direction:column;gap:0.2rem;">';
        sortedV.forEach(function(item, i) {
            var ico  = ICONOS_V[item.k] || '\u2022';
            var lbl  = TEMAS_V[item.k]  || ('Tema ' + item.k);
            var pct  = nRV !== '?' ? Math.round(item.v / nRV * 100) : '?';
            var barW = Math.round(item.v / maxVV * 100);
            var isTop = i < 3;
            var bg   = isTop ? '#f0f9ff' : '#f8fafc';
            var brd  = isTop ? '#bae6fd' : '#f0f0f0';
            var acc  = isTop ? '#0074c8' : '#64748b';
            var mdl  = medallasV[i] || '';
            datoHtmlVrelas +=
                '<div style="display:flex;align-items:center;gap:0.45rem;padding:' +
                (isTop ? '0.4rem 0.55rem' : '0.25rem 0.55rem') +
                ';background:' + bg + ';border:1px solid ' + brd + ';border-radius:6px;">' +
                (mdl ? '<span style="font-size:' + (isTop ? '0.9rem' : '0.72rem') + ';flex-shrink:0;">' + mdl + '</span>'
                     : '<span style="width:1.1rem;text-align:center;font-size:.6rem;color:#94a3b8;font-weight:700;flex-shrink:0;">' + (i+1) + '\u00ba</span>') +
                '<span style="font-size:' + (isTop ? '0.9rem' : '0.78rem') + ';flex-shrink:0;">' + ico + '</span>' +
                '<div style="flex:1;min-width:0;">' +
                    '<div style="font-size:' + (isTop ? '0.76rem' : '0.69rem') + ';font-weight:' + (isTop ? '600' : '400') + ';' +
                    'color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + lbl + '</div>' +
                    '<div style="height:3px;background:#e5e7eb;border-radius:2px;margin-top:0.12rem;overflow:hidden;">' +
                    '<div style="height:100%;width:' + barW + '%;background:' + acc + ';border-radius:2px;"></div>' +
                    '</div>' +
                '</div>' +
                '<span style="font-size:' + (isTop ? '0.76rem' : '0.66rem') + ';font-weight:700;color:' + acc + ';flex-shrink:0;min-width:2rem;text-align:right;">' + pct + '%</span>' +
                '</div>';
        });
        datoHtmlVrelas += '</div>';
    }
    var btnsVrelas =
        '<button onclick="cambiarTabManual(\'votacion-relas\')" ' +
        'style="background:white;border:1px solid #e2e8f0;border-radius:7px;' +
        'padding:0.36rem 0.65rem;font-size:0.74rem;font-weight:600;color:#475569;cursor:pointer;" ' +
        'title="Herramienta de votaci\u00f3n VRELAS">\ud83d\uddf3\ufe0f Herramienta</button>' +
        '<button onclick="cambiarTabManual(\'relas\')" ' +
        'style="background:white;border:1px solid #e2e8f0;border-radius:7px;' +
        'padding:0.36rem 0.65rem;font-size:0.74rem;font-weight:600;color:#475569;cursor:pointer;" ' +
        'title="Herramienta RELAS: h\u00e1bitos, problemas, colectivos">\ud83d\uddc2\ufe0f RELAS</button>' +
        (tieneVrelas
            ? '<button onclick="priorizacion_borrarVrelas()" ' +
              'style="background:white;border:1px solid #fca5a5;border-radius:7px;' +
              'padding:0.36rem 0.55rem;font-size:0.72rem;color:#dc2626;cursor:pointer;" ' +
              'title="Borrar datos VRELAS en memoria">\ud83d\uddd1\ufe0f</button>'
            : '');
    html += _renderTarjetaPriorizacion({
        icon: '\ud83d\uddf3\ufe0f', iconBg: tieneVrelas ? '#f0fdf4' : '#f0f9ff',
        nombre: 'VRELAS',
        descripcion: '10 temas de salud \u00b7 H\u00e1bitos \u00b7 Colectivos',
        estado: tieneVrelas ? ('\ud83d\udfe2 ' + nVrelas + ' part.') : 'Sin datos',
        estadoBg: tieneVrelas ? '#dcfce7' : '#f1f5f9',
        estadoFg: tieneVrelas ? '#166534' : '#94a3b8',
        datoHtml: datoHtmlVrelas,
        monitorFn: 'priorizacion_abrirMonitor(\'vrelas\')',
        monitorLabel: '\ud83d\udcca Abrir monitor',
        accionesHtml: btnsVrelas,
        detalleHtml: 'VRELAS: votaci\u00f3n sobre los 10 temas de salud prioritarios (alimentaci\u00f3n, ' +
            'actividad f\u00edsica, bienestar emocional, pantallas, sue\u00f1o, t\u00f3xicos, sexualidad, ' +
            'violencia de g\u00e9nero, medioambiente, accidentes).<br>' +
            'RELAS: h\u00e1bitos, problemas y colectivos prioritarios.'
    });

    html += '</div>';
    el.innerHTML = html;
}

"""

print('\nBloque nuevo: %d chars' % len(NEW_BLOCK))

# Sustituir
content = content[:start_idx] + NEW_BLOCK + content[end_idx:]

# Guardar
after_len = len(content)
with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print('\nOK: %d -> %d chars (delta: %+d)' % (original_len, after_len, after_len - original_len))
print('Verifica: function _renderTarjetaPriorizacion:', 'OK' if '_renderTarjetaPriorizacion' in content else 'MISSING')
print('Verifica: function priorizacion_abrirMonitor:', 'OK' if 'priorizacion_abrirMonitor' in content else 'MISSING')
print('Verifica: function priorizacion_borrarCiudadana:', 'OK' if 'priorizacion_borrarCiudadana' in content else 'MISSING')
print('Verifica: function priorizacion_borrarVrelas:', 'OK' if 'priorizacion_borrarVrelas' in content else 'MISSING')
print('Verifica: function priorizacion_borrarTecnica:', 'OK' if 'priorizacion_borrarTecnica' in content else 'MISSING')
print('Verifica: function renderizarSeccionPriorizacion:', 'OK' if 'function renderizarSeccionPriorizacion' in content else 'MISSING')
print('Verifica: PRIORIZACIONES_CFG NO debe existir (config inline):', 'OK (inline)' if 'PRIORIZACIONES_CFG' not in content else 'WARN (encontrado)')

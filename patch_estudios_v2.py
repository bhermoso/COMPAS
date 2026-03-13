# Reestructuración TAB 2: estudios individuales (v2)
# Modifica abrirModalEscalasDiagnosticas() + renderizarSeccionEstudios()
import sys
path = r'C:\Users\blash\Desktop\COMPAS\index.html'
with open(path, 'rb') as f:
    raw = f.read()
content = raw.decode('utf-8')

START_MARKER = 'function abrirModalEscalasDiagnosticas(){'
END_MARKER   = '// Renderizar secci\u00f3n 04 \u2014 Visor unificado de priorizaci\u00f3n ciudadana'

idx_start = content.find(START_MARKER)
assert idx_start > 0, "START no encontrado: " + START_MARKER

idx_end = content.find(END_MARKER, idx_start)
assert idx_end > 0, "END no encontrado: " + END_MARKER

# Retroceder saltos de linea antes del marcador END
while idx_end > 0 and content[idx_end - 1] in ('\n', '\r'):
    idx_end -= 1
idx_end += 1  # conservar un separador

print("Bloque a reemplazar: chars %d..%d" % (idx_start, idx_end))

NEW_CODE = r"""function abrirModalEscalasDiagnosticas(escalaId) {
    var modal = document.getElementById('modal-escalas-diagnosticas');
    if (!modal) return;
    if (escalaId) {
        var mapaNombre = { sf12:'SF-12', duke:'Duke-UNC', cage:'CAGE', predimed:'PREDIMED' };
        var nombreEscala = mapaNombre[escalaId] || escalaId;
        var sel = document.getElementById('escala-nombre');
        if (sel) { sel.value = nombreEscala; autocompletarEscalaDiagnostica(); }
    }
    renderizarListadoEscalasDiagnosticas();
    modal.style.display = 'block';
}
function cerrarModalEscalasDiagnosticas(){
    var modal = document.getElementById('modal-escalas-diagnosticas');
    if (modal) modal.style.display='none';
}
function renderizarListadoEscalasDiagnosticas(){
    var el = document.getElementById('listado-escalas-diagnosticas');
    if (!el) return;
    var escalas = _compasEscalasGet();
    if (!escalas.length){
        el.innerHTML = '<div style="padding:0.75rem;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;color:#64748b;font-size:0.84rem;">Sin escalas registradas.</div>';
        return;
    }
    el.innerHTML = escalas.map(function(e, idx){
        return '<div style="padding:0.8rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:0.5rem;">' +
          '<div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;">' +
          '<div><div style="font-weight:700;color:#0f766e;">'+(e.nombre_escala||'Escala')+'</div>' +
          '<div style="font-size:0.8rem;color:#64748b;">'+(e.fuente_estudio||'Sin fuente') + (e.anio_estudio ? ' \u00b7 ' + e.anio_estudio : '') + (e.tamano_muestra ? ' \u00b7 n=' + e.tamano_muestra : '') + '</div>' +
          '<div style="font-size:0.84rem;color:#334155;margin-top:0.35rem;"><strong>Resultado:</strong> '+(e.resultado_principal||'')+'</div>' +
          '<div style="font-size:0.84rem;color:#334155;"><strong>Interpretaci\u00f3n:</strong> '+(e.interpretacion||'')+'</div></div>' +
          '<button onclick="eliminarEscalaDiagnostica('+idx+')" style="background:#fee2e2;border:none;color:#991b1b;padding:0.35rem 0.6rem;border-radius:6px;cursor:pointer;">\ud83d\uddd1\ufe0f</button>' +
          '</div></div>';
    }).join('');
}
function autocompletarEscalaDiagnostica(){
    var escala = document.getElementById('escala-nombre');
    if (!escala) return;
    var ejemplos = {
      'SF-12': ['Estudio local de salud percibida','2025','320','PCS medio 47 / MCS medio 51','Calidad de vida relacionada con la salud en rango intermedio, sin desviaciones extremas.','Resultados agregados de muestra comunitaria.'],
      'Duke-UNC': ['Encuesta de apoyo social','2025','280','Puntuaci\u00f3n media 41','Apoyo social funcional globalmente adecuado, con diferencias entre subgrupos.','Conviene desagregar por edad o sexo si existe informaci\u00f3n adicional.'],
      'CAGE': ['Cribado comunitario de alcohol','2025','190','6% con resultado compatible con cribado positivo','No se observan se\u00f1ales masivas, pero existe un subgrupo que merece atenci\u00f3n preventiva.','Instrumento de cribado, no diagn\u00f3stico cl\u00ednico.'],
      'PREDIMED': ['Estudio local de h\u00e1bitos alimentarios','2025','250','Puntuaci\u00f3n media 7 sobre 14','Adherencia intermedia a dieta mediterr\u00e1nea, con margen de mejora.','Interpretar junto a otros indicadores alimentarios.']
    };
    var ex = ejemplos[escala.value];
    if (!ex) return;
    ['escala-fuente','escala-anio','escala-n','escala-resultado','escala-interpretacion','escala-observaciones'].forEach(function(id,i){ var el=document.getElementById(id); if(el && !el.value) el.value=ex[i]; });
}
function guardarEscalaDiagnostica(){
    var nombre = document.getElementById('escala-nombre').value;
    if (!nombre) return;
    var entrada = {
      nombre_escala: nombre,
      fuente_estudio: document.getElementById('escala-fuente').value || '',
      anio_estudio: document.getElementById('escala-anio').value || '',
      tamano_muestra: document.getElementById('escala-n').value || '',
      resultado_principal: document.getElementById('escala-resultado').value || '',
      interpretacion: document.getElementById('escala-interpretacion').value || '',
      observaciones: document.getElementById('escala-observaciones').value || ''
    };
    var arr = _compasEscalasGet();
    var idx = arr.findIndex(function(e){ return e.nombre_escala === entrada.nombre_escala; });
    if (idx >= 0) arr[idx] = entrada; else arr.push(entrada);
    _compasEscalasSet(arr);
    _guardarEscalasFirebase();
    renderizarListadoEscalasDiagnosticas();
    renderizarSeccionEstudios();
}
function eliminarEscalaDiagnostica(idx){
    var arr = _compasEscalasGet();
    arr.splice(idx,1);
    _compasEscalasSet(arr);
    _guardarEscalasFirebase();
    renderizarListadoEscalasDiagnosticas();
    renderizarSeccionEstudios();
}
function generarResumenEscalasDiagnosticas(){
    var escalas = _compasEscalasGet();
    if (!escalas.length) return '';
    return escalas.map(function(e){ return '<li><strong>'+e.nombre_escala+':</strong> '+(e.interpretacion || e.resultado_principal || 'sin interpretaci\u00f3n registrada')+'</li>'; }).join('');
}

// ── Helper: tarjeta común para cualquier estudio complementario ──────────────
// cfg: { icon, iconBg, nombre, descripcion, estado, estadoBg, estadoFg,
//        datoHtml, monitorFn, monitorLabel, accionesHtml, detalleHtml }
function _renderTarjetaEstudio(cfg) {
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
                (cfg.iconBg||'#f0f9ff') + ';display:flex;align-items:center;' +
                'justify-content:center;font-size:1rem;flex-shrink:0;">' + (cfg.icon||'\ud83d\udcc4') + '</div>' +
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

// ── Visor de texto para estudios documentales ─────────────────────────────
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
                    '<span style="font-size:1.1rem;">\ud83d\udcc4</span>' +
                    '<strong style="font-size:0.95rem;">' + nombre + '</strong>' +
                '</div>' +
                '<button onclick="document.getElementById(\'modal-visor-estudio\').style.display=\'none\'" ' +
                'style="background:rgba(255,255,255,0.2);border:none;color:white;width:32px;height:32px;' +
                'border-radius:50%;cursor:pointer;font-size:1rem;">\u2715</button>' +
            '</div>' +
            '<div style="padding:1.5rem;max-height:65vh;overflow-y:auto;font-size:0.83rem;' +
            'color:#334155;line-height:1.7;white-space:pre-wrap;font-family:inherit;">' +
            (texto || '(Sin contenido)') + '</div>' +
        '</div>';
    m.style.display = 'flex';
}

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
        var ico = sc >= 70 ? '\ud83d\udfe2' : sc >= 50 ? '\ud83d\udfe1' : '\ud83d\udd34';
        var factBars = [{k:'vinculo',l:'V\u00ednculo'},{k:'situacion',l:'Situaci\u00f3n'},
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
            '<input type="file" accept=".csv" onchange="ibse_cargarCSV(this)" hidden>\ud83d\udcc1 Recargar CSV</label>' +
            '<button onclick="ibse_borrarDatos()" style="background:white;border:1px solid #fca5a5;' +
            'border-radius:7px;padding:0.36rem 0.55rem;font-size:0.72rem;color:#dc2626;cursor:pointer;" ' +
            'title="Borrar datos IBSE">\ud83d\uddd1\ufe0f</button>';
        html += _renderTarjetaEstudio({
            icon:'\ud83d\udcca', iconBg:'#ecfdf5',
            nombre:'IBSE \u2014 \u00cdndice de Bienestar Socioemocional',
            descripcion:'Cuestionario de 8 \u00edtems \u00b7 4 factores \u00b7 Escala 0\u2013100',
            estado: ico + ' ' + sc + '/100', estadoBg:bg, estadoFg:col,
            datoHtml: datoIBSE,
            monitorFn:'ibseMonitor_abrir()',
            accionesHtml: accionesIBSE,
            detalleHtml:'Factores: V\u00ednculo \u00b7 Situaci\u00f3n \u00b7 Control \u00b7 Persona.<br>' +
                'Umbral \u00f3ptimo: \u226570 \u00b7 Riesgo moderado: 50\u201369 \u00b7 Riesgo elevado: &lt;50.'
        });
    } else {
        html += _renderTarjetaEstudio({
            icon:'\ud83d\udcca', iconBg:'#f0f9ff',
            nombre:'IBSE \u2014 \u00cdndice de Bienestar Socioemocional',
            descripcion:'Cuestionario de 8 \u00edtems \u00b7 4 factores \u00b7 Escala 0\u2013100',
            estado:'Sin datos', estadoBg:'#f1f5f9', estadoFg:'#94a3b8',
            datoHtml:'',
            monitorFn:'ibseMonitor_abrir()',
            accionesHtml:'<label style="background:white;border:1px solid #e2e8f0;border-radius:7px;' +
                'padding:0.36rem 0.7rem;cursor:pointer;font-size:0.74rem;font-weight:600;color:#475569;">' +
                '<input type="file" accept=".csv" onchange="ibse_cargarCSV(this)" hidden>\ud83d\udcc1 Cargar CSV REDCap</label>',
            detalleHtml:'Factores: V\u00ednculo \u00b7 Situaci\u00f3n \u00b7 Control \u00b7 Persona.<br>' +
                'Umbral \u00f3ptimo: \u226570 \u00b7 Riesgo moderado: 50\u201369 \u00b7 Riesgo elevado: &lt;50.<br>' +
                'Carga un CSV exportado desde REDCap para activar este estudio.'
        });
    }

    // ══ TARJETAS ESCALAS DIAGNÓSTICAS — una por instrumento ══════════════
    var ESCALAS_CFG = [
        {
            id: 'sf12', nombre: 'SF-12',
            tipo: 'Calidad de vida relacionada con la salud',
            icon: '\ud83c\udfe5', iconBg: '#eff6ff',
            detalleHtml: 'Instrumento de 12 \u00edtems que mide componentes f\u00edsico (PCS) y mental (MCS) de la calidad de vida. Punto de corte poblacional: 50 (media normativa). &lt;45 indica deterioro relevante.'
        },
        {
            id: 'duke', nombre: 'Duke-UNC',
            tipo: 'Apoyo social funcional percibido',
            icon: '\ud83e\udd1d', iconBg: '#fefce8',
            detalleHtml: 'Escala de 11 \u00edtems que eval\u00faa apoyo confidencial y afectivo. Puntuaci\u00f3n total 11\u201355 pts. Punto de corte: &lt;32 indica bajo apoyo social percibido.'
        },
        {
            id: 'cage', nombre: 'CAGE',
            tipo: 'Cribado de consumo de riesgo de alcohol',
            icon: '\ud83c\udf77', iconBg: '#fff7ed',
            detalleHtml: 'Cuestionario de 4 \u00edtems de cribado. \u22652 respuestas positivas indican probable consumo de riesgo. Instrumento de orientaci\u00f3n, no de diagn\u00f3stico cl\u00ednico.'
        },
        {
            id: 'predimed', nombre: 'PREDIMED',
            tipo: 'Adherencia a dieta mediterr\u00e1nea',
            icon: '\ud83e\udd57', iconBg: '#f0fdf4',
            detalleHtml: 'Escala de 14 \u00edtems que eval\u00faa adherencia a dieta mediterr\u00e1nea. Puntuaci\u00f3n 0\u201314: &lt;9 baja adherencia, \u22659 alta adherencia. Validada en el estudio PREDIMED (Mart\u00ednez-Gonz\u00e1lez et al.).'
        }
    ];

    var escalasData = _compasEscalasGet();
    var escalasMap = {};
    escalasData.forEach(function(e) { escalasMap[e.nombre_escala] = e; });

    ESCALAS_CFG.forEach(function(cfg) {
        var datos = escalasMap[cfg.nombre];
        var tieneDatos = !!datos;
        var datoHtml = '';
        if (tieneDatos) {
            datoHtml =
                '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;' +
                'padding:0.55rem 0.7rem;font-size:0.77rem;color:#334155;line-height:1.6;">' +
                (datos.resultado_principal
                    ? '<div><strong>Resultado:</strong> ' + datos.resultado_principal + '</div>'
                    : '') +
                (datos.interpretacion
                    ? '<div style="margin-top:0.2rem;color:#475569;"><strong>Interpretaci\u00f3n:</strong> ' + datos.interpretacion + '</div>'
                    : '') +
                (datos.fuente_estudio
                    ? '<div style="margin-top:0.25rem;color:#94a3b8;font-size:0.7rem;">' +
                      datos.fuente_estudio +
                      (datos.anio_estudio ? ' \u00b7 ' + datos.anio_estudio : '') +
                      (datos.tamano_muestra ? ' \u00b7 n=' + datos.tamano_muestra : '') +
                      '</div>'
                    : '') +
                '</div>';
        }
        html += _renderTarjetaEstudio({
            icon: cfg.icon, iconBg: cfg.iconBg,
            nombre: cfg.nombre,
            descripcion: cfg.tipo,
            estado: tieneDatos ? '\u2713 Registrada' : 'Sin datos',
            estadoBg: tieneDatos ? '#f0fdf4' : '#f1f5f9',
            estadoFg: tieneDatos ? '#16a34a' : '#94a3b8',
            datoHtml: datoHtml,
            monitorFn: 'abrirModalEscalasDiagnosticas(\'' + cfg.id + '\')',
            monitorLabel: '\ud83d\udcca Abrir monitor',
            accionesHtml: '',
            detalleHtml: cfg.detalleHtml
        });
    });

    // ══ TARJETA(S) — ESTUDIOS DOCUMENTALES (PDF, Word, txt, CSV) ════════
    if (!window.estudiosComplementarios || !window.estudiosComplementarios.length) {
        html += _renderTarjetaEstudio({
            icon:'\ud83d\udcc1', iconBg:'#f0f9ff',
            nombre:'Estudios documentales',
            descripcion:'PDF, Word, CSV, txt \u2014 documentos del municipio',
            estado:'Sin cargar', estadoBg:'#f1f5f9', estadoFg:'#94a3b8',
            datoHtml:
                '<label style="display:block;background:#f0f9ff;border:1.5px dashed #7dd3fc;' +
                'border-radius:8px;padding:0.55rem 0.9rem;text-align:center;cursor:pointer;' +
                'font-size:0.8rem;font-weight:600;color:#0369a1;margin-bottom:0.4rem;">' +
                '<input type="file" accept=".pdf,.docx,.doc,.txt,.csv" multiple ' +
                'onchange="cargarEstudiosComplementarios(this)" hidden>' +
                '\ud83d\udcc1 Seleccionar archivos (Word, PDF, txt, CSV)</label>' +
                '<div style="font-size:0.73rem;color:#64748b;text-align:center;margin:0.3rem 0;">\u2014 o pega texto directamente \u2014</div>' +
                '<textarea id="texto-estudio-libre-sec03" placeholder="Pega aqu\u00ed el texto del estudio..." rows="3" ' +
                'style="width:100%;padding:0.4rem;border:1px solid #bae6fd;border-radius:6px;' +
                'font-size:0.77rem;resize:vertical;box-sizing:border-box;" ' +
                'onchange="cargarEstudioTextoLibreSec03(this)"></textarea>',
            monitorFn:'estudiosComplementarios_abrirVisor(\'Sin estudios cargados\',\'\')',
            monitorLabel:'\ud83d\udcca Abrir visor',
            accionesHtml:'',
            detalleHtml:'Puedes cargar informes epidemiol\u00f3gicos, estudios locales, memorias de ' +
                'servicios sociales u otros documentos relevantes para el diagn\u00f3stico comunitario.'
        });
    } else {
        window.estudiosComplementarios.forEach(function(e, idx) {
            var words  = Math.round(((e.texto||'').length) / 5);
            var resumen = (e.texto||'').slice(0, 280) + ((e.texto||'').length > 280 ? '\u2026' : '');
            html += _renderTarjetaEstudio({
                icon: '\ud83d\udcc4',
                iconBg: '#f0f9ff',
                nombre: e.nombre,
                descripcion: (e.tipo || 'Estudio documental') + (words > 0 ? ' \u00b7 ~' + words + ' palabras' : ''),
                estado:'\ud83d\udcc4 Cargado', estadoBg:'#f0fdf4', estadoFg:'#16a34a',
                datoHtml: resumen
                    ? '<p style="font-size:0.77rem;color:#475569;margin:0;line-height:1.55;' +
                      'max-height:64px;overflow:hidden;">' + resumen + '</p>'
                    : '',
                monitorFn:'_estudioComplementarioVisor(' + idx + ')',
                monitorLabel:'\ud83d\udcca Abrir visor',
                accionesHtml:'',
                detalleHtml:''
            });
        });
        html += '<label style="display:block;background:white;border:1.5px dashed #93c5fd;' +
            'border-radius:10px;padding:0.5rem 1rem;text-align:center;cursor:pointer;' +
            'font-size:0.77rem;font-weight:700;color:#0369a1;margin-bottom:0.75rem;">' +
            '<input type="file" accept=".pdf,.docx,.doc,.txt,.csv" multiple ' +
            'onchange="cargarEstudiosComplementarios(this)" hidden>' +
            '\u2795 A\u00f1adir m\u00e1s estudios</label>';
    }

    html += '</div>';
    el.innerHTML = html;
}"""

new_content = content[:idx_start] + NEW_CODE + content[idx_end:]

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(new_content)

print("OK: archivo guardado (%d -> %d chars)" % (len(content), len(new_content)))

checks = [
    'abrirModalEscalasDiagnosticas(escalaId)',
    '_renderTarjetaEstudio',
    'estudiosComplementarios_abrirVisor',
    '_estudioComplementarioVisor',
    'ESCALAS_CFG',
    'SF-12',
    'Duke-UNC',
    'CAGE',
    'PREDIMED',
    'ibseMonitor_abrir()',
    "abrirModalEscalasDiagnosticas('sf12')",
    "abrirModalEscalasDiagnosticas('duke')",
    "abrirModalEscalasDiagnosticas('cage')",
    "abrirModalEscalasDiagnosticas('predimed')",
    'renderizarSeccionEstudios',
    'generarResumenEscalasDiagnosticas',
]
with open(path, 'rb') as f:
    verify = f.read().decode('utf-8')
for c in checks:
    ok = c in verify
    print(("%s: %s" % ('OK' if ok else 'MISSING', c)))

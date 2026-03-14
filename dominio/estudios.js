window.estudiosComplementarios = [];



// Cargar estudios complementarios (IBSE u otros)

function cargarEstudiosComplementarios(input) {

    const files = Array.from(input.files);

    if (!files.length) return;



    const estadoEl = document.getElementById('estado-estudios');

    if (estadoEl) estadoEl.innerHTML = '<span style="color:#0369a1;">⏳ Procesando ' + files.length + ' archivo(s)...</span>';



    function _extraerTextoArchivo(file) {

        return new Promise(function(resolve) {

            const nombre = file.name;

            const esTxt  = file.type === 'text/plain' || nombre.endsWith('.txt');

            const esWord = nombre.endsWith('.docx') || nombre.endsWith('.doc');

            const esPDF  = nombre.toLowerCase().endsWith('.pdf');



            if (esTxt) {

                const r = new FileReader();

                r.onload = e => resolve({ nombre, texto: e.target.result });

                r.readAsText(file);



            } else if (esWord) {

                const r = new FileReader();

                r.onload = e => {

                    function _con_mammoth() {

                        mammoth.extractRawText({ arrayBuffer: e.target.result })

                            .then(res => resolve({ nombre, texto: res.value }))

                            .catch(() => resolve({ nombre, texto: '(error al leer Word)' }));

                    }

                    if (typeof mammoth !== 'undefined') {

                        _con_mammoth();

                    } else {

                        var s = document.createElement('script');

                        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';

                        s.onload = _con_mammoth;

                        s.onerror = () => resolve({ nombre, texto: '(mammoth.js no disponible)' });

                        document.head.appendChild(s);

                    }

                };

                r.readAsArrayBuffer(file);



            } else if (esPDF) {

                const r = new FileReader();

                r.onload = e => {

                    const buf = e.target.result;

                    function _con_pdfjs() {

                        pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise

                            .then(function(pdf) {

                                var texto = '';

                                var paginas = Array.from({ length: pdf.numPages }, (_, i) => i + 1);

                                return paginas.reduce(function(p, n) {

                                    return p.then(function() {

                                        return pdf.getPage(n).then(function(pag) {

                                            return pag.getTextContent().then(function(tc) {

                                                texto += tc.items.map(i => i.str).join(' ') + ' ';

                                            });

                                        });

                                    });

                                }, Promise.resolve()).then(function() {

                                    resolve({ nombre, texto: texto.trim() });

                                });

                            })

                            .catch(() => resolve({ nombre, texto: '(error al leer PDF)' }));

                    }

                    if (typeof pdfjsLib !== 'undefined') {

                        _con_pdfjs();

                    } else {

                        var s = document.createElement('script');

                        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';

                        s.onload = function() {

                            pdfjsLib.GlobalWorkerOptions.workerSrc =

                                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

                            _con_pdfjs();

                        };

                        s.onerror = () => resolve({ nombre, texto: '(pdf.js no disponible)' });

                        document.head.appendChild(s);

                    }

                };

                r.readAsArrayBuffer(file);



            } else {

                resolve({ nombre, texto: '(formato no soportado)' });

            }

        });

    }



    Promise.all(files.map(_extraerTextoArchivo)).then(function(resultados) {

        // Añadir a los ya existentes (no reemplazar)

        if (!window.estudiosComplementarios) window.estudiosComplementarios = [];

        resultados.forEach(function(nuevo) {

            var idx = window.estudiosComplementarios.findIndex(e => e.nombre === nuevo.nombre);

            if (idx >= 0) window.estudiosComplementarios[idx] = nuevo;

            else window.estudiosComplementarios.push(nuevo);

        });



        // Persistir en Firebase

        _guardarEstudiosFirebase();



        if (estadoEl) estadoEl.innerHTML = '<span style="color:#16a34a;">✅ ' +

            window.estudiosComplementarios.length + ' estudio(s): ' +

            window.estudiosComplementarios.map(e => e.nombre).join(', ') + '</span>';

        actualizarChecklistIA();

        _renderEstudiosDebounced();

    });

}



// Guarda estudios complementarios en Firebase (texto truncado a 20 000 chars por estudio)

function _guardarEstudiosFirebase() {

    var mun = getMunicipioActual();

    if (!mun || typeof db === 'undefined') return;

    var paraFirebase = (window.estudiosComplementarios || []).map(function(e) {

        return { nombre: e.nombre, texto: (e.texto || '').slice(0, 20000) };

    });

    db.ref('estrategias/' + estrategiaActual + '/municipios/' + mun + '/estudiosComplementarios')

      .set(paraFirebase)

      .then(function() { console.log('✅ Estudios complementarios guardados en Firebase'); })

      .catch(function(err) { console.warn('⚠️ No se pudieron guardar estudios en Firebase:', err.message); });

}



// Carga estudios complementarios desde Firebase al cambiar de municipio

function _cargarEstudiosFirebase(municipio) {

    if (!municipio || typeof db === 'undefined') return;

    db.ref('estrategias/' + estrategiaActual + '/municipios/' + municipio + '/estudiosComplementarios')

      .once('value', function(snap) {

          // [GUARDIA AM] Descartar si el municipio activo cambió durante la carga.

          if (getMunicipioActual() !== municipio) {

              console.warn('[COMPÁS AM] _cargarEstudiosFirebase: callback tardío para "' + municipio + '". Descartado.');

              return;

          }

          var datos = snap.val();

          if (datos && Array.isArray(datos) && datos.length) {

              window.estudiosComplementarios = datos;

              _cargarEscalasFirebase(municipio);

              actualizarChecklistIA();

              _renderEstudiosDebounced();

              var estadoEl = document.getElementById('estado-estudios');

              if (estadoEl) estadoEl.innerHTML = '<span style="color:#16a34a;">✅ ' +

                  datos.length + ' estudio(s) cargado(s) desde Firebase</span>';

          } else {

              window.estudiosComplementarios = [];

              _cargarEscalasFirebase(municipio);

          }

      });

}



// Actualizar el checklist de fuentes de la IA

function actualizarChecklistIA() {

    const datos = datosMunicipioActual || {};

    const chk = (id, ok) => {

        const el = document.getElementById(id);

        if (el) el.innerHTML = (ok ? '✅' : '⬜') + ' ' + el.innerHTML.slice(2);

    };

    const tieneInforme = datos.informe && datos.informe.htmlCompleto;

    const tieneEstudios = window.estudiosComplementarios && window.estudiosComplementarios.length > 0;

    const tienePopular = !!(window.datosParticipacionCiudadana);

    const tieneRelas   = !!(typeof relas_globalData !== 'undefined' && relas_globalData && relas_globalData._habFreq);

    const tieneDet = datos.determinantes && _contarDeterminantesValidos(datos.determinantes) > 0;

    const tieneInd = datos.indicadores && _contarIndicadoresValidos(datos.indicadores) > 0;



    const checks = {

        'ia-check-informe': tieneInforme,

        'ia-check-estudios': tieneEstudios,

        'ia-check-priorizacion': tienePopular,

        'ia-check-relas': tieneRelas,

        'ia-check-determinantes': tieneDet,

        'ia-check-indicadores': tieneInd,

    };

    const textosFijos = {

        'ia-check-informe': ' Informe de Situación de Salud',

        'ia-check-estudios': ' Estudios complementarios',

        'ia-check-priorizacion': ' Priorización ciudadana',

        'ia-check-relas': ' Priorización Mixta (hábitos, problemas y colectivos)',

        'ia-check-determinantes': ' Determinantes EAS',

        'ia-check-indicadores': ' Indicadores de salud',

    };

    Object.entries(checks).forEach(([id, ok]) => {

        const el = document.getElementById(id);

        if (!el) return;

        el.textContent = (ok ? '✅' : '⬜') + (textosFijos[id] || '');

        el.style.color = ok ? '#166534' : '#94a3b8';

    });

    // Activar/desactivar checkbox de selección según disponibilidad

    ['sel-fuente-tematica', 'sel-fuente-epvsa', 'sel-fuente-relas'].forEach(function(id) {

        var el = document.getElementById(id); if (!el) return;

        if (id === 'sel-fuente-tematica' || id === 'sel-fuente-epvsa') el.disabled = !tienePopular;

        if (id === 'sel-fuente-relas') el.disabled = !tieneRelas;

    });



    // Priorización popular badge

    const estPop = document.getElementById('estado-priorizacion-popular');

    if (estPop) {

        if (tienePopular) {

            const p = window.datosParticipacionCiudadana;

            const n = p.totalParticipantes || p.n || '?';

            estPop.innerHTML = '<span style="color:#166534;">✅ ' + n + ' participantes · datos disponibles</span>';

        } else {

            estPop.innerHTML = '<span style="color:#94a3b8;">⏳ Pendiente de realizar en Tab 3</span>';

        }

    }

}



// Renderizar sección 03 estudios

// Cargar estudio desde textarea de texto libre

function cargarEstudioTextoLibre(textarea) {

    const texto = textarea.value.trim();

    if (!texto) return;

    if (!window.estudiosComplementarios) window.estudiosComplementarios = [];

    const idx = window.estudiosComplementarios.findIndex(e => e.nombre === 'Texto pegado');

    const entrada = { nombre: 'Texto pegado', texto: texto };

    if (idx >= 0) window.estudiosComplementarios[idx] = entrada;

    else window.estudiosComplementarios.push(entrada);

    _guardarEstudiosFirebase();

    const el = document.getElementById('estado-estudios');

    if (el) el.innerHTML = '<span style="color:#0369a1;">✅ Texto cargado (' + texto.length + ' caracteres)</span>';

    actualizarChecklistIA();

    _renderEstudiosDebounced();

}



function cargarEstudioTextoLibreSec03(textarea) {

    const texto = textarea.value.trim();

    if (!texto) return;

    if (!window.estudiosComplementarios) window.estudiosComplementarios = [];

    const idx = window.estudiosComplementarios.findIndex(function(e){ return e.nombre === 'Texto IBSE (pegado)' || e.nombre === 'Texto pegado'; });

    const entrada = { nombre: 'Texto IBSE (pegado)', texto: texto };

    if (idx >= 0) window.estudiosComplementarios[idx] = entrada;

    else window.estudiosComplementarios.push(entrada);

    _guardarEstudiosFirebase();

    var estadoEl = document.getElementById('estado-estudios-sec03');

    if (estadoEl) estadoEl.innerHTML = '<span style="color:#0369a1;">✅ Texto cargado (' + texto.length + ' caracteres)</span>';

    var drawerTa = document.getElementById('texto-estudio-libre');

    if (drawerTa) drawerTa.value = texto;

    actualizarChecklistIA();

    _renderEstudiosDebounced();

}



function _compasEscalasGet(){ return Array.isArray(window.compasEscalasDiagnosticas) ? window.compasEscalasDiagnosticas : []; }

function _compasEscalasSet(arr){ window.compasEscalasDiagnosticas = Array.isArray(arr) ? arr : []; }

function _guardarEscalasFirebase(){

    var mun = getMunicipioActual();

    if (!mun || typeof db === 'undefined') return Promise.resolve();

    return db.ref('estrategias/' + estrategiaActual + '/municipios/' + mun + '/estudiosComplementariosEscalas')

      .set(_compasEscalasGet())

      .catch(function(err){ console.warn('⚠️ No se pudieron guardar las escalas diagnósticas:', err.message); });

}

function _cargarEscalasFirebase(municipio){

    if (!municipio || typeof db === 'undefined') return;

    db.ref('estrategias/' + estrategiaActual + '/municipios/' + municipio + '/estudiosComplementariosEscalas')

      .once('value', function(snap){

          var datos = snap.val();

          _compasEscalasSet(Array.isArray(datos) ? datos : []);

          if (typeof _renderEstudiosDebounced === 'function') _renderEstudiosDebounced();

      });

}

function abrirModalEscalasDiagnosticas(escalaId) {
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
    _renderEstudiosDebounced();
}
function eliminarEscalaDiagnostica(idx){
    var arr = _compasEscalasGet();
    arr.splice(idx,1);
    _compasEscalasSet(arr);
    _guardarEscalasFirebase();
    renderizarListadoEscalasDiagnosticas();
    _renderEstudiosDebounced();
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

function _renderEstudiosDebounced() {
    if (!window._renderEstudiosPendiente) {
        window._renderEstudiosPendiente = true;
        requestAnimationFrame(function() {
            _renderEstudiosDebounced();
            window._renderEstudiosPendiente = false;
        });
    }
}

function renderizarSeccionEstudios() {
    var el = document.getElementById('seccion-estudios-complementarios');
    if (!el) return;

    var html = '<div style="padding:0.75rem;">';

    // ══ ESCALAS DIAGNÓSTICAS — SF-12, Duke-UNC, CAGE, PREDIMED ══════════
    // IBSE tiene su propio panel operativo en #panel-ibse / renderizarPanelIBSE()
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
}


// Renderizar sección 04 — Visor unificado de priorización ciudadana (Estratégica · Temática · Mixta)

function renderizarSeccionPriorizacion() {

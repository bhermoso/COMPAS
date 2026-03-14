
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

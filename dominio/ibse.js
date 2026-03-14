
// =====================================================================

// MÓDULO IBSE — Índice de Bienestar Socioemocional [I6]

// Bericat (2014) · Encuesta Andaluza de Salud 2023 · 8 ítems · 4 factores

// =====================================================================



// ── Definición de ítems del cuestionario ─────────────────────────────

var IBSE_ITEMS_4 = [

    { id: 'ibse_deprimido', texto: '¿Te has sentido deprimido/a o con el ánimo bajo?',  invertir: true  },

    { id: 'ibse_feliz',     texto: '¿Te has sentido feliz o de buen humor?',             invertir: false },

    { id: 'ibse_solo',      texto: '¿Te has sentido solo/a o aislado/a?',                invertir: true  },

    { id: 'ibse_disfrutar', texto: '¿Has podido disfrutar de las cosas que te gustan?', invertir: false }

];

var IBSE_ITEMS_5 = [

    { id: 'ibse_energia',   texto: 'Me he sentido con energía y vitalidad.',     invertir: false },

    { id: 'ibse_tranquilo', texto: 'Me he sentido tranquilo/a y relajado/a.',    invertir: false },

    { id: 'ibse_optimista', texto: 'Soy optimista respecto a mi futuro.',        invertir: true  },

    { id: 'ibse_bienmismo', texto: 'En general me siento bien conmigo mismo/a.', invertir: true  }

];



// ── Fórmula IBSE (Bericat 2014) ──────────────────────────────────────

function calcularIBSE(d) {

    var dep  = parseInt(d.ibse_deprimido);

    var fel  = parseInt(d.ibse_feliz);

    var sol  = parseInt(d.ibse_solo);

    var dis  = parseInt(d.ibse_disfrutar);

    var ene  = parseInt(d.ibse_energia);

    var tra  = parseInt(d.ibse_tranquilo);

    var opt  = parseInt(d.ibse_optimista);

    var bie  = parseInt(d.ibse_bienmismo);

    // Factor VÍNCULO: deprimido (inv) + solo (inv) · escala 1-4 → 0-100

    var fVinculo   = (((5 - dep) + (5 - sol)) / 2 - 1) * 25;

    // Factor SITUACIÓN: feliz + disfrutar · escala 1-4 → 0-100

    var fSituacion = (((fel + 1) + (dis + 1)) / 2 - 1) * 25;

    // Factor CONTROL: energía + tranquilo · escala 1-4 → 0-100

    var fControl   = (((ene + 1) + (tra + 1)) / 2 - 1) * 25;

    // Factor PERSONA: optimista (inv) + bienmismo (inv) · escala 1-5 → 0-100

    var fPersona   = (((6 - opt) + (6 - bie)) / 2 - 1) * 25;

    var total      = (fVinculo + fSituacion + fControl + fPersona) / 4;

    return { factorVinculo: fVinculo, factorSituacion: fSituacion, factorControl: fControl, factorPersona: fPersona, total: total };

}



// ── Firebase: cargar agregado IBSE ───────────────────────────────────

function _cargarIBSEFirebase(municipio) {

    if (!municipio || typeof db === 'undefined') return;

    db.ref('estrategias/' + estrategiaActual + '/municipios/' + municipio + '/ibseDatos')

      .once('value', function(snap) {

          // [GUARDIA AM] Descartar si el municipio activo cambió durante la carga.

          if (getMunicipioActual() !== municipio) {

              console.warn('[COMPÁS AM] _cargarIBSEFirebase: callback tardío para "' + municipio + '". Descartado.');

              return;

          }

          var datos = snap.val();

          if (datos && datos.n > 0) {

              window.datosIBSE = datos;

              // Sincronizar a ruta del monitor si no estaba allí

              db.ref('ibse_monitor/' + municipio).once('value', function(snapMon) {

                  if (!snapMon.val()) db.ref('ibse_monitor/' + municipio).set(datos);

              });

          } else {

              window.datosIBSE = null;

          }

          renderizarPanelIBSE();

          if (typeof actualizarChecklistIA === 'function') actualizarChecklistIA();

      });

}



// ── Firebase: guardar agregado ────────────────────────────────────────

function ibse_guardarAgregado(municipio, agregado) {

    if (!municipio || typeof db === 'undefined') return;

    // Ruta interna COMPÁS

    db.ref('estrategias/' + estrategiaActual + '/municipios/' + municipio + '/ibseDatos').set(agregado);

    // Ruta del monitor IBSE (monitor_ibse.html lee de aquí)

    db.ref('ibse_monitor/' + municipio).set(agregado);

    // Forzar recarga del monitor en la próxima apertura (datos actualizados)

    var iframe = document.getElementById('iframe-monitor-ibse');

    if (iframe) iframe.dataset.munActual = '';

}



// ── Firebase: recalcular agregado desde respuestas individuales ───────

function ibse_recalcularAgregado(municipio) {

    if (!municipio || typeof db === 'undefined') return;

    db.ref('ibse_respuestas/' + municipio).once('value', function(snap) {

        var respuestas = [];

        snap.forEach(function(child) { respuestas.push(child.val()); });

        if (!respuestas.length) {

            // Sin respuestas: limpiar agregado en todas las rutas

            db.ref('estrategias/' + estrategiaActual + '/municipios/' + municipio + '/ibseDatos').remove();

            db.ref('ibse_monitor/' + municipio).remove();

            window.datosIBSE = null;

            renderizarPanelIBSE();

            if (typeof actualizarChecklistIA === 'function') actualizarChecklistIA();

            return;

        }

        var suma = { fV: 0, fS: 0, fC: 0, fP: 0, tot: 0 };

        respuestas.forEach(function(r) {

            suma.fV  += r.factorVinculo   || 0;

            suma.fS  += r.factorSituacion || 0;

            suma.fC  += r.factorControl   || 0;

            suma.fP  += r.factorPersona   || 0;

            suma.tot += r.total           || 0;

        });

        var n = respuestas.length;

        var agregado = {

            n: n,

            media: suma.tot / n,

            factorVinculo:   suma.fV  / n,

            factorSituacion: suma.fS  / n,

            factorControl:   suma.fC  / n,

            factorPersona:   suma.fP  / n,

            fuente: 'cuestionario_directo',

            timestamp: new Date().toISOString()

        };

        window.datosIBSE = agregado;

        ibse_guardarAgregado(municipio, agregado);

        renderizarPanelIBSE();

        if (typeof actualizarChecklistIA === 'function') actualizarChecklistIA();

    });

}



// ── Procesado de CSV REDCap ───────────────────────────────────────────

function ibse_cargarCSV(input) {

    var file = input.files[0];

    if (!file) return;

    if (typeof Papa === 'undefined') { alert('Error: PapaParse no disponible.'); return; }

    var municipio = (typeof getMunicipioActual === 'function') ? getMunicipioActual() : null;

    if (!municipio) { alert('Selecciona un municipio antes de cargar el IBSE.'); return; }

    Papa.parse(file, {

        header: true,

        skipEmptyLines: true,

        // MC2: normalizar cabeceras — REDCap puede exportar en mayúsculas o con espacios
        transformHeader: function(h) { return h.toLowerCase().trim(); },

        complete: function(results) {

            var campos = ['ibse_deprimido','ibse_feliz','ibse_solo','ibse_disfrutar','ibse_energia','ibse_tranquilo','ibse_optimista','ibse_bienmismo'];

            var validos = [];

            results.data.forEach(function(row) {

                var completo = campos.every(function(c) { return row[c] && !isNaN(parseInt(row[c])); });

                if (!completo) return;

                var calc = calcularIBSE(row);

                validos.push({

                    record_id:      row.record_id || (Date.now() + validos.length),

                    edad:           parseInt(row.edad)  || null,

                    sexo:           parseInt(row.sexo)  || null,

                    ibse_deprimido: parseInt(row.ibse_deprimido),

                    ibse_feliz:     parseInt(row.ibse_feliz),

                    ibse_solo:      parseInt(row.ibse_solo),

                    ibse_disfrutar: parseInt(row.ibse_disfrutar),

                    ibse_energia:   parseInt(row.ibse_energia),

                    ibse_tranquilo: parseInt(row.ibse_tranquilo),

                    ibse_optimista: parseInt(row.ibse_optimista),

                    ibse_bienmismo: parseInt(row.ibse_bienmismo),

                    factorVinculo:   calc.factorVinculo,

                    factorSituacion: calc.factorSituacion,

                    factorControl:   calc.factorControl,

                    factorPersona:   calc.factorPersona,

                    total:           calc.total,
                    ibse_total:      calc.total,  // MC3: alias para compatibilidad con monitor

                    fuente:    'csv_redcap',

                    timestamp: row.timestamp || new Date().toISOString()

                });

            });

            if (!validos.length) {

                alert('No se encontraron filas válidas con los 8 ítems IBSE en el CSV.\nVerifica que las columnas sean: ibse_deprimido, ibse_feliz, ibse_solo, ibse_disfrutar, ibse_energia, ibse_tranquilo, ibse_optimista, ibse_bienmismo');

                return;

            }

            // Guardar respuestas individuales

            var refResp = db.ref('ibse_respuestas/' + municipio);

            refResp.remove().then(function() {

                validos.forEach(function(v) { refResp.push(v); });

            });

            // Calcular agregado

            var n = validos.length;

            var s = { fV: 0, fS: 0, fC: 0, fP: 0, tot: 0 };

            validos.forEach(function(v) { s.fV += v.factorVinculo; s.fS += v.factorSituacion; s.fC += v.factorControl; s.fP += v.factorPersona; s.tot += v.total; });

            var agregado = {

                n: n,

                media:           s.tot / n,

                factorVinculo:   s.fV  / n,

                factorSituacion: s.fS  / n,

                factorControl:   s.fC  / n,

                factorPersona:   s.fP  / n,

                fuente:    'csv_redcap',

                timestamp: new Date().toISOString()

            };

            window.datosIBSE = agregado;

            ibse_guardarAgregado(municipio, agregado);

            renderizarPanelIBSE();

            if (typeof actualizarChecklistIA === 'function') actualizarChecklistIA();

            var estadoEl = document.getElementById('estado-estudios');

            if (estadoEl) estadoEl.innerHTML = '<span style="color:#16a34a;">✅ IBSE: ' + n + ' registros cargados desde CSV REDCap</span>';

        },

        error: function(err) { alert('Error al leer el CSV: ' + err.message); }

    });

}



// ── Renderizar panel IBSE en el acordeón ─────────────────────────────

function renderizarPanelIBSE() {

    var el = document.getElementById('panel-ibse');

    var badge = document.getElementById('ibse-badge-fuente');

    // Si el acordeón 03 está abierto, refrescarlo

    if (document.getElementById('sec03-ibse-bloque') && typeof renderizarSeccionEstudios === 'function') renderizarSeccionEstudios();

    if (!el) return;

    var d = window.datosIBSE;

    if (!d || !d.n) {

        el.innerHTML = '<span style="color:#94a3b8; font-size:0.82rem;">Sin datos IBSE. Carga un CSV REDCap o usa Gestionar fuentes.</span>';

        if (badge) badge.style.display = 'none';

        return;

    }

    var nivelColor = d.media >= 70 ? '#166534' : d.media >= 50 ? '#854d0e' : '#dc2626';

    var nivelBg    = d.media >= 70 ? '#dcfce7' : d.media >= 50 ? '#fef9c3' : '#fee2e2';

    var nivelLabel = d.media >= 70 ? 'Bienestar alto' : d.media >= 50 ? 'Bienestar moderado' : 'Bienestar bajo';

    var fuenteLabel = d.fuente === 'csv_redcap' ? 'CSV REDCap' : d.fuente === 'cuestionario_directo' ? 'Cuestionario directo' : 'REDCap API';

    if (badge) {

        badge.style.display = 'inline';

        badge.style.background = '#e0f2fe';

        badge.style.color = '#0369a1';

        badge.textContent = fuenteLabel;

    }

    el.innerHTML =

        '<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(80px,1fr)); gap:0.4rem; margin-bottom:0.4rem;">' +

            '<div style="text-align:center; background:' + nivelBg + '; border-radius:8px; padding:0.4rem;">' +

                '<div style="font-size:1.25rem; font-weight:900; color:' + nivelColor + ';">' + d.media.toFixed(1) + '</div>' +

                '<div style="font-size:0.65rem; color:#64748b; font-weight:600;">IBSE TOTAL</div>' +

            '</div>' +

            '<div style="text-align:center; background:#f0fdf4; border-radius:8px; padding:0.4rem;">' +

                '<div style="font-size:0.95rem; font-weight:700; color:#166534;">' + d.factorVinculo.toFixed(1) + '</div>' +

                '<div style="font-size:0.62rem; color:#64748b;">Vínculo</div>' +

            '</div>' +

            '<div style="text-align:center; background:#fefce8; border-radius:8px; padding:0.4rem;">' +

                '<div style="font-size:0.95rem; font-weight:700; color:#854d0e;">' + d.factorSituacion.toFixed(1) + '</div>' +

                '<div style="font-size:0.62rem; color:#64748b;">Situación</div>' +

            '</div>' +

            '<div style="text-align:center; background:#eff6ff; border-radius:8px; padding:0.4rem;">' +

                '<div style="font-size:0.95rem; font-weight:700; color:#1d4ed8;">' + d.factorControl.toFixed(1) + '</div>' +

                '<div style="font-size:0.62rem; color:#64748b;">Control</div>' +

            '</div>' +

            '<div style="text-align:center; background:#faf5ff; border-radius:8px; padding:0.4rem;">' +

                '<div style="font-size:0.95rem; font-weight:700; color:#7c3aed;">' + d.factorPersona.toFixed(1) + '</div>' +

                '<div style="font-size:0.62rem; color:#64748b;">Persona</div>' +

            '</div>' +

        '</div>' +

        '<div style="font-size:0.72rem; color:#64748b;">n=' + d.n + ' participantes · <strong style="color:' + nivelColor + ';">' + nivelLabel + '</strong></div>';

}



// ── Cuestionario ciudadano: abrir / cerrar ────────────────────────────

function ibse_abrirCuestionario() {

    var municipio = (typeof getMunicipioActual === 'function') ? getMunicipioActual() : null;

    if (!municipio) { alert('Selecciona un municipio antes de abrir el cuestionario.'); return; }

    var modal = document.getElementById('modal-ibse-cuestionario');

    if (!modal) return;

    var c4 = document.getElementById('ibse-items-4');

    var c5 = document.getElementById('ibse-items-5');

    if (c4 && !c4.children.length) {

        c4.innerHTML = IBSE_ITEMS_4.map(function(it) { return _ibse_renderItem(it, [1,2,3,4]); }).join('');

    }

    if (c5 && !c5.children.length) {

        c5.innerHTML = IBSE_ITEMS_5.map(function(it) { return _ibse_renderItem(it, [1,2,3,4,5]); }).join('');

    }

    var exito = document.getElementById('ibse-exito');

    if (exito) exito.style.display = 'none';

    var errEl = document.getElementById('ibse-form-error');

    if (errEl) errEl.style.display = 'none';

    modal.style.display = 'block';

}



function ibse_cerrarCuestionario() {

    var modal = document.getElementById('modal-ibse-cuestionario');

    if (modal) modal.style.display = 'none';

}



function _ibse_renderItem(item, opciones) {

    var labels4 = ['', 'Nunca', 'A veces', 'Frecuent.', 'Siempre'];

    var labels5 = ['', 'Muy en desac.', 'En desac.', 'Ni sí ni no', 'De acuerdo', 'Muy de ac.'];

    var labels  = opciones.length === 4 ? labels4 : labels5;

    var opts = opciones.map(function(v) {

        return '<label style="display:flex; flex-direction:column; align-items:center; gap:0.2rem; cursor:pointer;">' +

            '<input type="radio" name="' + item.id + '" value="' + v + '" style="accent-color:#667eea;">' +

            '<span style="font-size:0.67rem; color:#6b7280; text-align:center; max-width:58px;">' + labels[v] + '</span>' +

        '</label>';

    }).join('');

    return '<div style="background:#f9fafb; border:1.5px solid #e5e7eb; border-radius:8px; padding:0.7rem;">' +

        '<div style="font-size:0.84rem; font-weight:600; color:#1f2937; margin-bottom:0.55rem;">' + item.texto + '</div>' +

        '<div style="display:flex; gap:0.5rem; justify-content:space-around; flex-wrap:wrap;">' + opts + '</div>' +

    '</div>';

}



// ── Enviar respuesta del cuestionario ─────────────────────────────────

function ibse_enviarRespuesta() {

    var municipio = (typeof getMunicipioActual === 'function') ? getMunicipioActual() : null;

    if (!municipio) return;

    var errEl = document.getElementById('ibse-form-error');

    var todos = IBSE_ITEMS_4.concat(IBSE_ITEMS_5);

    var datos = {};

    var falta = [];

    todos.forEach(function(it) {

        var sel = document.querySelector('input[name="' + it.id + '"]:checked');

        if (sel) datos[it.id] = parseInt(sel.value);

        else falta.push(it.id);

    });

    if (falta.length) {

        if (errEl) { errEl.style.display = 'block'; errEl.textContent = 'Por favor responde todas las preguntas antes de enviar.'; }

        return;

    }

    if (errEl) errEl.style.display = 'none';

    datos.edad      = parseInt(document.getElementById('ibse-edad').value) || null;

    datos.sexo      = parseInt(document.getElementById('ibse-sexo').value) || null;

    datos.timestamp = new Date().toISOString();

    var calc = calcularIBSE(datos);

    Object.assign(datos, calc);

    if (typeof db !== 'undefined') {

        db.ref('ibse_respuestas/' + municipio).push(datos).then(function() {

            ibse_recalcularAgregado(municipio);

            var exito = document.getElementById('ibse-exito');

            if (exito) exito.style.display = 'block';

            document.querySelectorAll('#modal-ibse-cuestionario input[type="radio"]').forEach(function(r) { r.checked = false; });

            document.getElementById('ibse-edad').value = '';

            document.getElementById('ibse-sexo').value = '';

        });

    }

}



// ── Borrar datos IBSE del municipio ──────────────────────────────────

function ibse_borrarDatos() {

    var municipio = (typeof getMunicipioActual === 'function') ? getMunicipioActual() : null;

    if (!municipio) return;

    if (!confirm('¿Eliminar todos los datos IBSE de este municipio? Esta acción no se puede deshacer.')) return;

    if (typeof db !== 'undefined') {

        db.ref('estrategias/' + estrategiaActual + '/municipios/' + municipio + '/ibseDatos').remove();

        db.ref('ibse_respuestas/' + municipio).remove();

        db.ref('ibse_monitor/' + municipio).remove();

    }

    window.datosIBSE = null;

    // Forzar recarga del monitor en la próxima apertura

    var iframe = document.getElementById('iframe-monitor-ibse');

    if (iframe) iframe.dataset.munActual = '';

    renderizarPanelIBSE();

    if (typeof actualizarChecklistIA === 'function') actualizarChecklistIA();

}



// ── Monitor IBSE: abrir / cerrar (modal fullscreen con iframe) ───────

function ibse_abrirMonitor() {

    var modal = document.getElementById('modal-monitor-ibse');

    if (!modal) return;

    var key    = (typeof getMunicipioActual  === 'function') ? getMunicipioActual()      : 'atarfe';

    var nombre = (typeof getNombreMunicipio  === 'function') ? getNombreMunicipio(key)   : key;

    var iframe = document.getElementById('iframe-monitor-ibse');

    if (iframe) {

        var nuevaSrc = 'monitor_ibse.html?municipio=' + encodeURIComponent(key) + '&nombre=' + encodeURIComponent(nombre);

        if (iframe.dataset.munActual !== key) {

            iframe.src = nuevaSrc;

            iframe.dataset.munActual = key;

        }

    }

    var tit = document.getElementById('monitor-ibse-titulo');

    if (tit) tit.textContent = 'Monitor IBSE — ' + nombre;

    modal.style.display = 'flex';

}



function ibse_cerrarMonitor() {

    var modal = document.getElementById('modal-monitor-ibse');

    if (modal) modal.style.display = 'none';

}



// Cerrar modal-monitor-ibse con Escape

document.addEventListener('keydown', function(e) {

    if (e.key === 'Escape') {

        var modal = document.getElementById('modal-monitor-ibse');

        if (modal && modal.style.display !== 'none') ibse_cerrarMonitor();

    }

});



// ── Stub REDCap API (futuro) ──────────────────────────────────────────

function ibse_sincronizarREDCap() {

    alert('Conexión REDCap API\n\nEsta funcionalidad está pendiente de configuración.\n\nNecesitarás:\n• URL de tu instancia REDCap\n• Token API del proyecto IBSE\n\nPor ahora usa la opción "Cargar CSV REDCap".');

}



// ── Fin módulo IBSE ───────────────────────────────────────────────────


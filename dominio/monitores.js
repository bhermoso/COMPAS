function ibseMonitor_calcularIBSE(d) {

    var dep = parseInt(d.ibse_deprimido), fel = parseInt(d.ibse_feliz);

    var sol = parseInt(d.ibse_solo),     dis = parseInt(d.ibse_disfrutar);

    var ene = parseInt(d.ibse_energia),  tra = parseInt(d.ibse_tranquilo);

    var opt = parseInt(d.ibse_optimista),bm  = parseInt(d.ibse_bienmismo);

    if ([dep,fel,sol,dis,ene,tra,opt,bm].some(isNaN)) return null;

    var fV = (((5-dep)+(5-sol))/2-1)*25;

    var fS = (((fel+1)+(dis+1))/2-1)*25;

    var fC = (((ene+1)+(tra+1))/2-1)*25;

    var fP = (((6-opt)+(6-bm))/2-1)*25;

    return { factor_vinculo:fV, factor_situacion:fS, factor_control:fC, factor_persona:fP,

             ibse_total: (fV+fS+fC+fP)/4 };

}



function ibse_abrirMonitor() {

    document.getElementById('modal-ibse-monitor').style.display = 'block';

    var mun = getMunicipioActual();

    var nombre = getNombreMunicipio(mun) || 'municipio';



    // Mostrar labels

    var lbl = document.getElementById('ibseMon-mun-label');

    if (lbl) lbl.textContent = '📍 ' + nombre;



    if (!mun || typeof db === 'undefined') {

        ibseMonitor_sinDatos();

        return;

    }



    // Intentar ruta COMPAS primero (ibse_respuestas/{municipio}), luego legacy

    var refPrimaria   = db.ref('ibse_respuestas/' + mun);

    var refLegacy     = db.ref('ibse_monitor/' + mun);

    var pathLabel = document.getElementById('ibseMon-firebase-path');



    refPrimaria.once('value', function(snap) {

        var datos = snap.val();

        if (datos && typeof datos === 'object' && Object.keys(datos).length > 0) {

            if (pathLabel) pathLabel.textContent = 'ibse_respuestas/' + mun;

            var arr = Object.values(datos).map(function(d) {

                if (d.ibse_total !== undefined) return d;

                var calc = ibseMonitor_calcularIBSE(d);

                return calc ? Object.assign({}, d, calc) : null;

            }).filter(Boolean);

            ibseMonitor_respuestas = arr;

            ibseMonitor_renderizar();

        } else {

            // Fallback a ruta legacy

            refLegacy.once('value', function(snapL) {

                var datosL = snapL.val();

                if (datosL && typeof datosL === 'object' && Object.keys(datosL).length > 0) {

                    if (pathLabel) pathLabel.textContent = 'ibse_monitor/' + mun;

                    ibseMonitor_respuestas = Object.values(datosL).filter(function(d){ return d.ibse_total !== undefined; });

                    ibseMonitor_renderizar();

                } else {

                    ibseMonitor_sinDatos();

                }

            });

        }

    });

}



function ibseMonitor_cerrar() {

    document.getElementById('modal-ibse-monitor').style.display = 'none';

    ibseMonitor_respuestas = [];

}



function ibseMonitor_sinDatos() {

    document.getElementById('ibseMon-sin-datos').style.display = 'block';

    ['ibseMon-semaforo','ibseMon-sexo','ibseMon-analisis'].forEach(function(id){

        var el = document.getElementById(id);

        if (el) el.innerHTML = '';

    });

    ['ibseMon-n','ibseMon-media','ibseMon-vinculo','ibseMon-situacion','ibseMon-control','ibseMon-persona']

        .forEach(function(id){ var el=document.getElementById(id); if(el) el.textContent='—'; });

}



function ibseMonitor_renderizar() {

    var r = ibseMonitor_respuestas;

    var n = r.length;

    document.getElementById('ibseMon-sin-datos').style.display = n === 0 ? 'block' : 'none';

    if (n === 0) return;



    var media   = r.reduce(function(s,x){return s+x.ibse_total;},0)/n;

    var fV = r.reduce(function(s,x){return s+x.factor_vinculo;},0)/n;

    var fS = r.reduce(function(s,x){return s+x.factor_situacion;},0)/n;

    var fC = r.reduce(function(s,x){return s+x.factor_control;},0)/n;

    var fP = r.reduce(function(s,x){return s+x.factor_persona;},0)/n;



    document.getElementById('ibseMon-n').textContent = n;

    document.getElementById('ibseMon-media').textContent = media.toFixed(1);

    document.getElementById('ibseMon-vinculo').textContent = fV.toFixed(1);

    document.getElementById('ibseMon-situacion').textContent = fS.toFixed(1);

    document.getElementById('ibseMon-control').textContent = fC.toFixed(1);

    document.getElementById('ibseMon-persona').textContent = fP.toFixed(1);



    // Semáforo

    var nivel = media >= 76 ? {lbl:'ALTO',    col:'#10b981', bg:'#dcfce7', em:'😊'} :

                media >= 51 ? {lbl:'MODERADO',col:'#f59e0b', bg:'#fef9c3', em:'😐'} :

                media >= 26 ? {lbl:'BAJO',    col:'#f97316', bg:'#ffedd5', em:'😟'} :

                              {lbl:'MUY BAJO',col:'#ef4444', bg:'#fee2e2', em:'😢'};

    var bajo = r.filter(function(x){return x.ibse_total<50;}).length;

    document.getElementById('ibseMon-semaforo').innerHTML =

        '<div style="background:'+nivel.bg+';border:1px solid '+nivel.col+'40;border-radius:10px;padding:1rem 1.5rem;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;">' +

        '<div style="font-size:3rem;line-height:1;">'+nivel.em+'</div>' +

        '<div style="flex:1;">' +

          '<div style="font-size:1.4rem;font-weight:900;color:'+nivel.col+';">'+media.toFixed(1)+' — '+nivel.lbl+'</div>' +

          '<div style="font-size:.8rem;color:#64748b;margin-top:.2rem;">IBSE Global · Escala 0-100 · n='+n+' · IBSE<50: '+bajo+' casos ('+((bajo/n*100).toFixed(1))+'%)</div>' +

          '<div style="margin-top:.5rem;display:flex;gap:.3rem;">' +

          ['76-100','51-75','26-50','0-25'].map(function(rng,i){

              var cols=['#10b981','#f59e0b','#f97316','#ef4444'];

              var active = (i===0&&media>=76)||(i===1&&media>=51&&media<76)||(i===2&&media>=26&&media<51)||(i===3&&media<26);

              return '<span style="padding:.2rem .6rem;background:'+(active?cols[i]:'#e5e7eb')+';color:'+(active?'white':'#94a3b8')+';border-radius:20px;font-size:.68rem;font-weight:700;">'+rng+'</span>';

          }).join('') +

          '</div>' +

        '</div></div>';



    // Distribución por sexo

    var h = r.filter(function(x){return x.sexo===1;}), m = r.filter(function(x){return x.sexo===2;});

    var mH = h.length>0 ? h.reduce(function(s,x){return s+x.ibse_total;},0)/h.length : null;

    var mM = m.length>0 ? m.reduce(function(s,x){return s+x.ibse_total;},0)/m.length : null;

    if (mH !== null || mM !== null) {

        var sexoHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:0;">';

        [[mH,h.length,'👨','#5b8dd9','HOMBRES'],[mM,m.length,'👩','#e8789a','MUJERES']].forEach(function(s){

            if (s[0]===null) return;

            sexoHtml += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:.75rem;">' +

                '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem;">' +

                '<span style="font-size:1.4rem;">'+s[2]+'</span>' +

                '<div><div style="font-size:.72rem;font-weight:700;color:#64748b;">'+s[4]+'</div>' +

                '<div style="font-size:1.2rem;font-weight:900;color:'+s[3]+';">'+s[0].toFixed(1)+'</div></div>' +

                '<span style="margin-left:auto;font-size:.72rem;color:#94a3b8;">n='+s[1]+'</span></div>' +

                '<div style="width:100%;height:10px;background:#e5e7eb;border-radius:5px;overflow:hidden;">' +

                '<div style="width:'+s[0]+'%;height:100%;background:'+s[3]+';border-radius:5px;"></div></div></div>';

        });

        sexoHtml += '</div>';

        document.getElementById('ibseMon-sexo').innerHTML = sexoHtml;

    }



    // Análisis textual

    var factoresOrden = [{n:'Vínculo',v:fV},{n:'Situación',v:fS},{n:'Control',v:fC},{n:'Persona',v:fP}]

        .sort(function(a,b){return b.v-a.v;});

    var txt = '<strong>Análisis IBSE (n='+n+')</strong><br>';

    txt += 'IBSE Global: <strong>'+media.toFixed(2)+'</strong> · Nivel: <strong>'+nivel.lbl+'</strong><br>';

    txt += 'Factor más alto: <strong>'+factoresOrden[0].n+'</strong> ('+factoresOrden[0].v.toFixed(1)+') · ';

    txt += 'Factor a mejorar: <strong>'+factoresOrden[3].n+'</strong> ('+factoresOrden[3].v.toFixed(1)+')<br>';

    txt += 'Prevalencia IBSE<50 (bienestar bajo): <strong>'+((bajo/n*100).toFixed(1))+'%</strong> (n='+bajo+')';

    if (mH !== null && mM !== null) {

        var dif = Math.abs(mH-mM);

        txt += '<br>Brecha de género: <strong>'+dif.toFixed(1)+' pts</strong> ('+(mH>mM?'hombres':'mujeres')+' con mayor bienestar)';

        if (dif > 5) txt += ' · <span style="color:#f59e0b;">⚠️ Brecha relevante (&gt;5 pts)</span>';

    }

    document.getElementById('ibseMon-analisis').innerHTML = txt;

}

</script>



<!-- ══ MODALES RELAS — fuera de contenedor display:none ══ -->

<div id="relas-nuevo-evento-modal" style="display:none;position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.7);align-items:center;justify-content:center">

  <div style="background:#fff;border-radius:14px;padding:1.8rem;width:90%;max-width:460px;box-shadow:0 20px 60px rgba(0,0,0,.2);border:1px solid #e2e8f0">

    <h3 style="color:#1e293b;margin:0 0 1.2rem;font-size:1.1rem">✏️ Nuevo evento de priorización</h3>

    <div style="margin-bottom:1rem">

      <label style="color:#64748b;font-size:.78rem;font-weight:600;display:block;margin-bottom:.4rem">NOMBRE DEL EVENTO</label>

      <input id="relas-nuevo-evento-nombre" placeholder="Ej: Priorización Popular de Salud Zagra 2026"

        style="width:100%;padding:.7rem .9rem;background:#f8fafc;color:#1e293b;border:1px solid #e2e8f0;border-radius:8px;font-size:.9rem;box-sizing:border-box"

        onkeydown="if(event.key==='Enter')relas_crearEvento()">

    </div>

    <div style="margin-bottom:1rem">

      <label style="color:#64748b;font-size:.78rem;font-weight:600;display:block;margin-bottom:.4rem">SUBTÍTULO (opcional)</label>

      <input id="relas-nuevo-evento-subtitulo" placeholder="Ej: Sesión participativa · Junio 2026"

        style="width:100%;padding:.7rem .9rem;background:#f8fafc;color:#1e293b;border:1px solid #e2e8f0;border-radius:8px;font-size:.9rem;box-sizing:border-box">

    </div>

    <div style="display:flex;gap:.75rem;margin-top:1.4rem">

      <button onclick="document.getElementById('relas-nuevo-evento-modal').style.display='none'" style="flex:1;padding:.7rem;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;font-weight:600">Cancelar</button>

      <button onclick="relas_crearEvento()" style="flex:2;padding:.7rem;background:linear-gradient(135deg,#0074c8,#00acd9);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:.9rem">✅ Crear evento</button>

    </div>

  </div>

</div>

<div class="relas-triple-modal" id="relas-tripleModal">

  <div class="relas-triple-box">

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">

      <h3 style="margin:0;color:#2d6a4f">⚡ Priorización triple fusionada</h3>

      <button onclick="document.getElementById('relas-tripleModal').classList.remove('open')" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:#888">✕</button>

    </div>

    <p style="font-size:.78rem;color:#666;margin-bottom:.5rem">Algoritmo de fusión ponderada: <strong>55% epidemiológico</strong> + <strong>30% ciudadano</strong> + <strong>15% RELAS</strong></p>

    <div class="relas-triple-cols" id="relas-triple-cols-content"></div>

    <button class="relas-confirm-btn" onclick="relas_confirmarPriorizacionTriple()">✅ Confirmar y guardar como priorización oficial</button>

  </div>

</div>

<div class="relas-ficha-overlay" id="relas-fichaOverlay" onclick="relas_closeFicha(event)">

  <div class="relas-ficha-box" id="relas-fichaModal"></div>

</div>




<script src="dominio/ibse.js"></script>




<script>

// =====================================================================

// EVALUACIÓN (FASE 6) + SINCRONIZACIÓN PLAN → AGENDA

// =====================================================================



// ── Punto de entrada: llamado al entrar en Fase 6 ────────────────────


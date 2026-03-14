"""
patch_ui_conclusiones.py
Redisena la presentacion visible de conclusiones y recomendaciones.

Cambios:
  1. _adaptarAnalisisAFormatoUI — preserva campos ricos (extracto, topicos,
     fuente_tipo, especifica, conclusion_origen_id, area, categoria, lineaId)
  2. renderizarResultadoIA — 3 bloques reemplazados:
     - ia-conclusiones: tarjetas con titulo + interpretacion + base analitica + oportunidad
     - ia-recomendaciones: tarjetas con orientacion + activo + linea EPVSA municipal
     - ia-prioridades: lineas EPVSA como texto legible + colectivos +
       traduccion operativa; ICP relegado a <details>
"""
import sys, re

path = r'C:\Users\blash\Desktop\COMPAS\index.html'
with open(path, 'rb') as f:
    content = f.read().decode('utf-8')

original_len = len(content)
cambios = []

# ─────────────────────────────────────────────────────────────────────────────
# PASO 1: Reemplazar _adaptarAnalisisAFormatoUI
# ─────────────────────────────────────────────────────────────────────────────
ADAPT_OLD_ANCHOR = 'function _adaptarAnalisisAFormatoUI(analisis, fuentesUsadas) {'
ADAPT_END_ANCHOR = '// \u2500\u2500 _generarAnalisisLocal: conservada por compatibilidad'

idx_adapt_start = content.find(ADAPT_OLD_ANCHOR)
idx_adapt_end   = content.find(ADAPT_END_ANCHOR)

if idx_adapt_start == -1 or idx_adapt_end == -1:
    print('FATAL: _adaptarAnalisisAFormatoUI o su fin no encontrados')
    sys.exit(1)

NEW_ADAPT = """\
function _adaptarAnalisisAFormatoUI(analisis, fuentesUsadas) {
    var TITULOS_CONC = {
        marco_salutogenico:       'Marco salutog\u00e9nico',
        determinantes_sociales:   'Determinantes sociales de la salud',
        epvsa_alineamiento:       'Alineamiento con EPVSA 2024-2030',
        principios_transversales: 'Principios transversales',
        informe_situacion:        'Informe de Situaci\u00f3n de Salud',
        estudios_complementarios: 'Estudios complementarios',
        priorizacion_ciudadana:   'Priorizaci\u00f3n ciudadana',
        priorizacion_pendiente:   '\u26a0\ufe0f Priorizaci\u00f3n pendiente',
        fortalezas:               'Fortalezas identificadas (EAS)',
        oportunidades:            'Oportunidades de mejora (EAS)',
        tendencias:               'Tendencias de los indicadores'
    };
    var conclusiones = analisis.conclusiones.map(function(c) {
        return {
            id:          c.id,
            titulo:      TITULOS_CONC[c.id] || 'Conclusi\u00f3n',
            texto:       c.texto,
            prioridad:   c.prioridad   || 99,
            especifica:  c.especifica  || false,
            fuente_tipo: c.fuente_tipo || 'marco',
            extracto:    c.extracto    || '',
            topicos:     c.topicos     || []
        };
    });

    var TITULOS_REC = {
        mapeo_activos:            'Mapeo de activos para la salud',
        relas_gobernanza:         'RELAS como estructura de gobernanza',
        equidad_gradiente:        'Equidad y universalismo proporcional',
        evaluacion_participativa: 'Sistema de seguimiento y evaluaci\u00f3n',
        rec_devolucion:           'Devoluci\u00f3n a la ciudadan\u00eda',
        rec_estudios:             'Integraci\u00f3n de estudios complementarios'
    };
    var recomendaciones = analisis.recomendaciones.map(function(r) {
        var titulo = TITULOS_REC[r.id] || '';
        if (!titulo && r.id && r.id.startsWith('rec_popular_')) {
            var popIdx = parseInt(r.id.replace('rec_popular_',''));
            titulo = (popIdx === 0 ? '1\u00aa' : popIdx === 1 ? '2\u00aa' : '3\u00aa') + ' prioridad ciudadana';
        }
        if (!titulo && r.area) titulo = 'Intervenci\u00f3n en ' + r.area;
        if (!titulo) titulo = 'Recomendaci\u00f3n';
        return {
            id:                   r.id,
            titulo:               titulo,
            texto:                r.texto,
            categoria:            r.categoria            || '',
            area:                 r.area                 || '',
            especifica:           r.especifica           || false,
            conclusion_origen_id: r.conclusion_origen_id || ''
        };
    });

    var NOMBRES_LINEAS = {
        1:'1 \u2014 Estilos de vida saludable', 2:'2 \u2014 Entornos promotores de salud',
        3:'3 \u2014 Informaci\u00f3n y comunicaci\u00f3n', 4:'4 \u2014 Formaci\u00f3n e investigaci\u00f3n',
        5:'5 \u2014 Coordinaci\u00f3n y gobernanza'
    };
    var prioridades_epvsa = analisis.propuestaEPVSA.slice(0,5).map(function(p) {
        return {
            linea:           NOMBRES_LINEAS[p.lineaId] || ('L\u00ednea ' + p.lineaId),
            lineaId:         p.lineaId,
            objetivo:        p.justificacion,
            relevancia:      p.relevancia || 0,
            justificacion:   'Relevancia: ' + (p.relevancia || 0) + '%' +
                             (p.origenCiudadano ? ' \u00b7 \ud83d\uddfe\ufe0f Prioridad ciudadana' : ''),
            fuentes:         p.fuentes || (fuentesUsadas ? fuentesUsadas.join(' \u00b7 ') : 'An\u00e1lisis salutog\u00e9nico'),
            origenCiudadano: p.origenCiudadano || false
        };
    });

    return { conclusiones: conclusiones, recomendaciones: recomendaciones, prioridades_epvsa: prioridades_epvsa, _analisisCompleto: analisis };
}

"""

content = content[:idx_adapt_start] + NEW_ADAPT + content[idx_adapt_end:]
cambios.append('_adaptarAnalisisAFormatoUI reescrita con campos ricos')
print('OK: _adaptarAnalisisAFormatoUI reescrita')

# ─────────────────────────────────────────────────────────────────────────────
# PASO 2: Reemplazar el cuerpo de renderizarResultadoIA
# Ancla inicio: la linea de la funcion
# Ancla fin: el cierre de la funcion (ultima linea antes de // Actualizar checklist)
# ─────────────────────────────────────────────────────────────────────────────
RENDER_START = 'function renderizarResultadoIA(r) {'
RENDER_END   = '// Actualizar checklist cuando cambian datos globales'

idx_render_start = content.find(RENDER_START)
idx_render_end   = content.find(RENDER_END)

if idx_render_start == -1 or idx_render_end == -1:
    print('FATAL: renderizarResultadoIA o su fin no encontrados')
    sys.exit(1)

NEW_RENDER = """\
function renderizarResultadoIA(r) {
    document.getElementById('ia-progreso').style.display = 'none';
    document.getElementById('ia-resultado').style.display = 'block';
    document.getElementById('ia-fecha-generacion').textContent = 'Generado: ' + new Date().toLocaleString('es-ES');

    var analisis = r._analisisCompleto || window.analisisActual;

    // \u2500\u2500 ia-conclusiones: tarjetas interpretativas salutog\u00e9nicas \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    var elConc = document.getElementById('ia-conclusiones');
    var htmlConc = '';

    // Perfil SOC: cabecera compacta (si existe)
    if (analisis && analisis.perfilSOC && analisis.perfilSOC.global) {
        var soc = analisis.perfilSOC;
        var colSOC = soc.global.nivel==='alto'?'#166534':soc.global.nivel==='medio'?'#854d0e':'#991b1b';
        var bgSOC  = soc.global.nivel==='alto'?'#dcfce7':soc.global.nivel==='medio'?'#fef9c3':'#fee2e2';
        htmlConc += '<div style="margin-bottom:1rem;padding:.6rem 1rem;background:'+bgSOC+';border-radius:8px;border:1px solid '+colSOC+'30;display:flex;align-items:center;gap:.65rem;flex-wrap:wrap;">' +
            '<span style="font-size:.72rem;font-weight:700;color:'+colSOC+';text-transform:uppercase;letter-spacing:.05em;flex-shrink:0;">\ud83d\udcd0 Perfil SOC</span>' +
            ['comprensibilidad','manejabilidad','significatividad'].map(function(dim) {
                var d=soc[dim]; var lbl=dim==='comprensibilidad'?'Compresi\u00f3n':dim==='manejabilidad'?'Manejo':'Significado';
                var c=d.nivel==='alto'?'#166534':d.nivel==='medio'?'#854d0e':'#991b1b';
                var bg=d.nivel==='alto'?'#dcfce7':d.nivel==='medio'?'#fef9c3':'#fee2e2';
                return '<span style="background:'+bg+';border-radius:5px;padding:.15rem .5rem;font-size:.71rem;color:'+c+';font-weight:700;">'+lbl+': '+d.puntuacion+'</span>';
            }).join('') +
            '<span style="margin-left:auto;font-size:.77rem;font-weight:700;color:'+colSOC+';">Global: '+soc.global.puntuacion+'/100 \u2014 '+soc.global.interpretacion+'</span>' +
            '</div>';
    }

    // Alertas de inequidad: banda compacta (si existen)
    if (analisis && analisis.alertasInequidad && analisis.alertasInequidad.length) {
        htmlConc += '<div style="margin-bottom:1rem;padding:.55rem .9rem;background:#fff7ed;border:1px solid #fdba74;border-radius:8px;">' +
            '<div style="font-size:.72rem;font-weight:700;color:#c2410c;margin-bottom:.25rem;">\u26a0\ufe0f Alertas de inequidad detectadas</div>' +
            analisis.alertasInequidad.map(function(al){
                return '<span style="font-size:.78rem;color:#9a3412;margin-right:.75rem;">\u2022 <strong>'+al.mensaje+'</strong>: '+al.valor.toFixed(1)+'% (umbral: '+al.umbral+'%)</span>';
            }).join('') + '</div>';
    }

    // Definiciones de tipos visuales por fuente_tipo
    var CONC_TIPOS = {
        marco:        { bg:'#eff6ff', bd:'#3b82f6', ct:'#1d4ed8', label:'Marco te\u00f3rico' },
        informe:      { bg:'#faf5ff', bd:'#7c3aed', ct:'#6d28d9', label:'Informe de Situaci\u00f3n' },
        estudios:     { bg:'#f0fdfa', bd:'#14b8a6', ct:'#0f766e', label:'Estudios complementarios' },
        participacion:{ bg:'#fff7ed', bd:'#f59e0b', ct:'#92400e', label:'Priorizaci\u00f3n participativa' },
        determinantes:{ bg:'#fefce8', bd:'#eab308', ct:'#854d0e', label:'Determinantes EAS' },
        indicadores:  { bg:'#f8fafc', bd:'#64748b', ct:'#475569', label:'Indicadores municipales' }
    };
    var CONC_BASES = {
        marco:        'Marco te\u00f3rico salutog\u00e9nico (Antonovsky, 1979). La salud como proceso continuo orientado hacia los recursos generativos comunitarios.',
        informe:      'Informe de Situaci\u00f3n de Salud del municipio: datos epidemiol\u00f3gicos, demogr\u00e1ficos y de morbimortalidad local.',
        estudios:     'Estudios complementarios registrados en el diagn\u00f3stico: escalas diagn\u00f3sticas y estudios documentales triangulados.',
        participacion:'Proceso de priorizaci\u00f3n participativa: Diagn\u00f3stico Comunitario de Salud, VRELAS y consulta ciudadana.',
        determinantes:'Indicadores EAS 2023 del municipio: comparaci\u00f3n con referencias de Andaluc\u00eda (55 indicadores de determinantes sociales).',
        indicadores:  'Series de indicadores de salud del municipio: mortalidad, morbilidad, hospitalizaci\u00f3n y uso de servicios.'
    };
    var CONC_OPS = {
        marco_salutogenico:       'Orientar el Plan desde la identificaci\u00f3n y movilizaci\u00f3n de activos comunitarios, haciendo del mapeo de recursos un paso previo a la selecci\u00f3n de intervenciones.',
        determinantes_sociales:   'Incluir actuaciones sobre determinantes estructurales (vivienda, econom\u00eda, entorno) en colaboraci\u00f3n intersectorial con otras \u00e1reas municipales.',
        epvsa_alineamiento:       'Adoptar los indicadores EPVSA como sistema de seguimiento del Plan para garantizar la comparabilidad auton\u00f3mica.',
        principios_transversales: 'Garantizar la representaci\u00f3n efectiva de colectivos vulnerables en la RELAS y en todas las fases del Plan (diagn\u00f3stico, planificaci\u00f3n, evaluaci\u00f3n).',
        informe_situacion:        'Priorizar intervenciones sobre los problemas de salud identificados en el informe, especialmente en colectivos con mayor carga de enfermedad.',
        estudios_complementarios: 'Triangular la evidencia local de estudios complementarios con los datos EAS para validar prioridades y dise\u00f1ar intervenciones m\u00e1s precisas.',
        priorizacion_ciudadana:   'Incorporar las necesidades y prioridades expresadas por la ciudadan\u00eda como punto de partida para el dise\u00f1o participativo del Plan.',
        priorizacion_pendiente:   'Completar el proceso de priorizaci\u00f3n participativa (VRELAS o jornada comunitaria) antes de definir objetivos operativos del Plan.',
        fortalezas:               'Activar los recursos identificados como fortalezas como base del Plan de acci\u00f3n: potenciar lo que ya funciona antes de crear nuevas estructuras.',
        oportunidades:            'Dise\u00f1ar intervenciones espec\u00edficas sobre las \u00e1reas con mayor desviaci\u00f3n respecto a la media andaluza, comenzando por las m\u00e1s accionables localmente.',
        tendencias:               'Monitorizar los indicadores con peores tendencias para orientar actuaciones preventivas y establecer metas de mejora realistas en el Plan.'
    };

    var concList = r.conclusiones || [];
    if (!concList.length && analisis && analisis.conclusiones) {
        concList = analisis.conclusiones.map(function(c) {
            return { id:c.id, titulo:c.id, texto:c.texto, fuente_tipo:c.fuente_tipo||'marco', extracto:c.extracto||'', topicos:c.topicos||[] };
        });
    }

    htmlConc += concList.map(function(c, i) {
        var tipo = CONC_TIPOS[c.fuente_tipo] || CONC_TIPOS.marco;
        var base;
        if (c.extracto) {
            base = '\u201c' + c.extracto.slice(0,200) + (c.extracto.length>200 ? '\u2026' : '') + '\u201d' +
                   ' <span style="font-size:.7rem;color:#94a3b8;">[extracto del documento]</span>';
        } else if (c.topicos && c.topicos.length) {
            base = 'Temas detectados: <strong>' + c.topicos.join(', ') + '</strong>';
        } else {
            base = CONC_BASES[c.fuente_tipo] || CONC_BASES.marco;
        }
        var oportunidad = CONC_OPS[c.id] || 'Identificar la intervenci\u00f3n municipal m\u00e1s adecuada a partir de esta conclusi\u00f3n en la fase de planificaci\u00f3n del Plan.';
        return (
            '<div style="background:'+tipo.bg+';border:1px solid '+tipo.bd+'33;border-left:4px solid '+tipo.bd+';border-radius:0 10px 10px 0;margin-bottom:0.9rem;overflow:hidden;">' +
            '<div style="display:flex;align-items:center;gap:.6rem;padding:.6rem 1rem;border-bottom:1px solid '+tipo.bd+'22;">' +
                '<span style="background:'+tipo.bd+';color:white;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:700;flex-shrink:0;">'+String(i+1)+'</span>' +
                '<span style="font-weight:700;font-size:.86rem;color:'+tipo.ct+';flex:1;">'+c.titulo+'</span>' +
                '<span style="background:'+tipo.bd+'18;color:'+tipo.ct+';font-size:.63rem;font-weight:700;padding:.1rem .4rem;border-radius:7px;text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;">'+tipo.label+'</span>' +
            '</div>' +
            '<div style="padding:.7rem 1rem 0;">' +
                '<div style="font-size:.69rem;font-weight:700;color:'+tipo.ct+';text-transform:uppercase;letter-spacing:.04em;margin-bottom:.28rem;">\ud83d\udccb Interpretaci\u00f3n</div>' +
                '<p style="margin:0 0 .65rem;font-size:.85rem;color:#1e293b;line-height:1.55;">'+c.texto+'</p>' +
                '<div style="font-size:.69rem;font-weight:700;color:'+tipo.ct+';text-transform:uppercase;letter-spacing:.04em;margin-bottom:.28rem;">\ud83d\udd0d Base anal\u00edtica</div>' +
                '<p style="margin:0 0 .65rem;font-size:.79rem;color:#475569;line-height:1.5;font-style:italic;">'+base+'</p>' +
                '<div style="font-size:.69rem;font-weight:700;color:'+tipo.ct+';text-transform:uppercase;letter-spacing:.04em;margin-bottom:.28rem;">\ud83c\udfaf Oportunidad de acci\u00f3n local</div>' +
                '<p style="margin:0 0 .75rem;font-size:.79rem;color:#374151;line-height:1.5;background:white;padding:.45rem .7rem;border-radius:7px;border:1px solid '+tipo.bd+'22;">'+oportunidad+'</p>' +
            '</div>' +
            '</div>'
        );
    }).join('');

    if (!htmlConc) htmlConc = '<div style="color:#94a3b8;font-size:.85rem;padding:1rem;">No se han generado conclusiones.</div>';
    elConc.innerHTML = htmlConc;

    // \u2500\u2500 ia-recomendaciones: tarjetas salutog\u00e9nicas estructuradas \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    var elRec = document.getElementById('ia-recomendaciones');
    var REC_ICOS = { mapeo_activos:'\ud83d\uddfa\ufe0f', relas_gobernanza:'\ud83c\udfdb\ufe0f', equidad_gradiente:'\u2696\ufe0f', evaluacion_participativa:'\ud83d\udcca', rec_devolucion:'\ud83d\uddf3\ufe0f', rec_estudios:'\ud83d\udd2c' };
    var REC_ACTIVOS = {
        mapeo_activos:            'Redes asociativas, equipamientos comunitarios, espacios p\u00fablicos y profesionales de referencia en el territorio.',
        relas_gobernanza:         'Capital social comunitario y capacidad de coordinaci\u00f3n intersectorial del municipio.',
        equidad_gradiente:        'Sensibilidad institucional a la inequidad y programas con enfoque diferencial existentes en el municipio.',
        evaluacion_participativa: 'Capacidad t\u00e9cnica municipal, datos disponibles y compromiso ciudadano con el seguimiento del Plan.',
        rec_devolucion:           'Proceso participativo construido en el diagn\u00f3stico: ciudadan\u00eda informada y movilizada.',
        rec_estudios:             'Evidencia local acumulada: escalas diagn\u00f3sticas, estudios documentales y estimaciones EAS.'
    };
    var REC_LINEAS = {
        mapeo_activos:            { le:'LE5', nombre:'Coordinaci\u00f3n y gobernanza',    color:'#6d28d9' },
        relas_gobernanza:         { le:'LE5', nombre:'Coordinaci\u00f3n y gobernanza',    color:'#6d28d9' },
        equidad_gradiente:        { le:'LE1+LE2', nombre:'Estilos de vida \u00b7 Entornos', color:'#059669' },
        evaluacion_participativa: { le:'LE4', nombre:'Formaci\u00f3n e investigaci\u00f3n', color:'#0074c8' },
        rec_devolucion:           { le:'LE5', nombre:'Coordinaci\u00f3n y gobernanza',    color:'#6d28d9' },
        rec_estudios:             { le:'LE4', nombre:'Formaci\u00f3n e investigaci\u00f3n', color:'#0074c8' }
    };
    var REC_AREA_LE = {
        tabaco:'LE1', alcohol:'LE1', alimentaci:'LE1', actividad:'LE1', sue:'LE1',
        entorno:'LE2', barrio:'LE2', vivienda:'LE2', ruido:'LE2',
        bienestar:'LE1', emocional:'LE1', social:'LE5', apoyo:'LE5',
        econom:'LE2+LE5'
    };
    var LE_NOMBRES = { 'LE1':'Estilos de vida saludable','LE2':'Entornos promotores','LE4':'Formaci\u00f3n e investigaci\u00f3n','LE5':'Coordinaci\u00f3n y gobernanza','LE1+LE2':'Estilos de vida \u00b7 Entornos','LE2+LE5':'Entornos \u00b7 Gobernanza' };

    var htmlRec = '<div style="display:flex;flex-direction:column;gap:.9rem;">';
    (r.recomendaciones || []).forEach(function(rec) {
        var ico = REC_ICOS[rec.id] || (rec.id && rec.id.startsWith('rec_popular_') ? '\ud83d\uddf3\ufe0f' : '\ud83d\udca1');
        var activo = REC_ACTIVOS[rec.id] ||
            (rec.id && rec.id.startsWith('rec_popular_') ? 'Voz ciudadana y necesidades expresadas en el proceso de priorizaci\u00f3n participativa.' :
            (rec.area ? 'Indicadores EAS y recursos comunitarios del \u00e1rea de ' + rec.area + '.' : 'Recursos y capacidades comunitarias del municipio.'));
        var leaObj = REC_LINEAS[rec.id];
        var leStr = '', leColor = '#64748b';
        if (leaObj) { leStr = leaObj.le + ' \u2014 ' + leaObj.nombre; leColor = leaObj.color; }
        else if (rec.id && rec.id.startsWith('rec_popular_')) { leStr = 'LE1+LE5 \u2014 Estilos de vida \u00b7 Gobernanza (orientativo)'; leColor = '#059669'; }
        else if (rec.area) {
            var areaLow = rec.area.toLowerCase();
            var leCode = 'LE1';
            for (var kw in REC_AREA_LE) { if (areaLow.indexOf(kw) >= 0) { leCode = REC_AREA_LE[kw]; break; } }
            leStr = leCode + ' \u2014 ' + (LE_NOMBRES[leCode] || 'L\u00ednea EPVSA'); leColor = '#854d0e';
        } else { leStr = 'Por determinar en fase de planificaci\u00f3n'; leColor = '#94a3b8'; }
        var catLabel = rec.categoria ? rec.categoria.replace(/_/g,' ') : '';
        htmlRec += (
            '<div style="background:white;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.05);">' +
            '<div style="display:flex;align-items:center;gap:.6rem;padding:.6rem 1rem;background:#f8fafc;border-bottom:1px solid #e2e8f0;">' +
                '<span style="font-size:1.1rem;flex-shrink:0;">'+ico+'</span>' +
                '<span style="font-weight:700;font-size:.86rem;color:#1e293b;flex:1;">'+rec.titulo+'</span>' +
                (catLabel ? '<span style="background:#ede9fe;color:#6d28d9;font-size:.63rem;font-weight:700;padding:.1rem .4rem;border-radius:7px;text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;">'+catLabel+'</span>' : '') +
            '</div>' +
            '<div style="padding:.7rem 1rem;">' +
                '<div style="font-size:.69rem;font-weight:700;color:#0074c8;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.28rem;">\ud83e\udded Orientaci\u00f3n</div>' +
                '<p style="margin:0 0 .7rem;font-size:.84rem;color:#1e293b;line-height:1.55;">'+rec.texto+'</p>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.55rem;">' +
                    '<div style="background:#f0f9ff;border-radius:7px;padding:.45rem .65rem;">' +
                        '<div style="font-size:.67rem;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.2rem;">\ud83d\udcb8 Activo o capacidad movilizable</div>' +
                        '<div style="font-size:.77rem;color:#334155;line-height:1.4;">'+activo+'</div>' +
                    '</div>' +
                    '<div style="background:#f0fdf4;border-radius:7px;padding:.45rem .65rem;">' +
                        '<div style="font-size:.67rem;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.2rem;">\ud83c\udfe6 Posible l\u00ednea EPVSA municipal</div>' +
                        '<div style="font-size:.77rem;color:#374151;line-height:1.4;font-weight:700;color:'+leColor+';">'+leStr+'</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '</div>'
        );
    });
    if (!(r.recomendaciones || []).length) htmlRec += '<div style="color:#94a3b8;font-size:.85rem;padding:1rem;">No se han generado recomendaciones.</div>';
    htmlRec += '</div>';
    elRec.innerHTML = htmlRec;

    // \u2500\u2500 ia-prioridades: L\u00edneas EPVSA legibles + colectivos + traducci\u00f3n + ICP relegado \u2500\u2500
    var elPri = document.getElementById('ia-prioridades');
    var icp = _calcularICP(analisis);
    var LE_ICONOS_P = {1:'\ud83c\udf3f',2:'\ud83c\udfd8\ufe0f',3:'\ud83d\udce2',4:'\ud83c\udf93',5:'\ud83c\udfdb\ufe0f'};
    var LE_COLS_P = {
        1:{nc:'#059669',nb:'#f0fdf4',nbord:'#bbf7d0'},
        2:{nc:'#0369a1',nb:'#e0f2fe',nbord:'#7dd3fc'},
        3:{nc:'#dc2626',nb:'#fef2f2',nbord:'#fca5a5'},
        4:{nc:'#7c3aed',nb:'#faf5ff',nbord:'#c4b5fd'},
        5:{nc:'#92400e',nb:'#fffbeb',nbord:'#fde68a'}
    };

    function _bar3(v, col) {
        return '<div style="height:5px;background:#e2e8f0;border-radius:3px;overflow:hidden;margin-top:3px"><div style="height:100%;width:'+Math.round(v*100)+'%;background:'+col+';border-radius:3px;"></div></div>';
    }

    var priHTML = '';

    // \u2500 L\u00edneas EPVSA como tarjetas legibles (sin ICP num\u00e9rico visible) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    priHTML += '<div style="margin-bottom:1.5rem;">' +
        '<h4 style="margin:0 0 .75rem;color:#1e293b;font-size:.9rem;font-weight:700;">\ud83d\udccc Propuesta de l\u00edneas EPVSA para el Plan local de salud</h4>' +
        '<div style="display:flex;flex-direction:column;gap:.6rem;">';

    var epvsaList = r.prioridades_epvsa || [];
    epvsaList.forEach(function(p) {
        var lid = p.lineaId || 1;
        var col = LE_COLS_P[lid] || LE_COLS_P[1];
        var ico = LE_ICONOS_P[lid] || '\ud83d\udccb';
        priHTML += (
            '<div style="background:'+col.nb+';border:1px solid '+col.nbord+';border-left:4px solid '+col.nc+';border-radius:0 10px 10px 0;padding:.65rem 1rem;display:flex;align-items:flex-start;gap:.7rem;">' +
            '<span style="font-size:1.25rem;flex-shrink:0;">'+ico+'</span>' +
            '<div style="flex:1;min-width:0;">' +
                '<div style="font-weight:700;font-size:.85rem;color:'+col.nc+';margin-bottom:.18rem;">'+p.linea+'</div>' +
                '<div style="font-size:.79rem;color:#475569;line-height:1.5;margin-bottom:.28rem;">'+p.objetivo+'</div>' +
                '<div style="font-size:.71rem;color:#64748b;">'+p.justificacion + (p.origenCiudadano ? ' <span style="color:#c2410c;font-weight:600;">\ud83d\uddf3\ufe0f Prioridad ciudadana</span>' : '')+'</div>' +
                '<div style="font-size:.67rem;color:#94a3b8;margin-top:.18rem;">Fuentes: '+p.fuentes+'</div>' +
            '</div>' +
            '</div>'
        );
    });
    if (!epvsaList.length) priHTML += '<div style="color:#94a3b8;font-size:.82rem;padding:.5rem;">Sin propuesta EPVSA generada.</div>';
    priHTML += '</div></div>';

    // \u2500 Colectivos prioritarios \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    if (icp.colectivos && icp.colectivos.length) {
        var CHIP_C = [{bg:'#e0f2fe',ct:'#0369a1'},{bg:'#dcfce7',ct:'#166534'},{bg:'#fef9c3',ct:'#854d0e'},{bg:'#ede9fe',ct:'#6d28d9'},{bg:'#fff7ed',ct:'#c2410c'},{bg:'#fee2e2',ct:'#991b1b'}];
        priHTML += '<div style="margin-bottom:1.5rem;">' +
            '<h4 style="margin:0 0 .6rem;color:#1e293b;font-size:.9rem;font-weight:700;">\ud83d\udc65 Colectivos prioritarios identificados</h4>' +
            '<div style="display:flex;flex-wrap:wrap;gap:.4rem;">';
        icp.colectivos.forEach(function(col, i) {
            var c = CHIP_C[i % CHIP_C.length];
            priHTML += '<div style="background:'+c.bg+';color:'+c.ct+';border-radius:20px;padding:.28rem .8rem;font-size:.8rem;font-weight:600;">'+
                col.nombre + (col.pct ? ' <span style="font-size:.67rem;opacity:.75;">\u00b7 '+col.pct+'%</span>' : '') + '</div>';
        });
        priHTML += '</div></div>';
    }

    // \u2500 Traducci\u00f3n operativa \u2192 Plan de acci\u00f3n \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    priHTML += '<div style="margin-bottom:1.5rem;">' +
        '<h4 style="margin:0 0 .75rem;color:#1e293b;font-size:.9rem;font-weight:700;">\ud83d\udd17 Traducci\u00f3n operativa \u2014 puente hacia el Plan de acci\u00f3n</h4>' +
        '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.75rem;">' +
        '<thead><tr style="background:linear-gradient(135deg,#0074c8,#00acd9);color:white;">' +
        '<th style="padding:.5rem .75rem;text-align:left;font-weight:600;">L\u00ednea EPVSA</th>' +
        '<th style="padding:.5rem .75rem;text-align:left;font-weight:600;">Tipo de actuaci\u00f3n orientativa</th>' +
        '<th style="padding:.5rem .75rem;text-align:left;font-weight:600;">Colectivo</th>' +
        '</tr></thead><tbody>';
    icp.lineas.slice(0,5).forEach(function(le, i) {
        var rowBg = i%2===0 ? '#f8fafc' : 'white';
        var colN = (icp.colectivos[i] && icp.colectivos[i].nombre) || (icp.pNorm && icp.pNorm.colectivoPrioritario && icp.pNorm.colectivoPrioritario.texto) || 'Poblaci\u00f3n general';
        priHTML += '<tr style="background:'+rowBg+';border-bottom:1px solid #e2e8f0;">' +
            '<td style="padding:.45rem .75rem;"><strong style="color:'+le.nc+'">'+le.icono+' '+le.cod+'</strong><br><span style="color:#64748b;font-size:.7rem;">'+le.nombre+'</span></td>' +
            '<td style="padding:.45rem .75rem;color:#475569;">'+le.actuacion+'</td>' +
            '<td style="padding:.45rem .75rem;"><span style="background:'+le.nb+';color:'+le.nc+';padding:.1rem .4rem;border-radius:8px;font-size:.72rem;font-weight:600;">'+colN+'</span></td></tr>';
    });
    priHTML += '</tbody></table></div>' +
        '<p style="margin:.5rem 0 0;font-size:.72rem;color:#94a3b8;">Esta tabla orienta la selecci\u00f3n en el <strong>Plan de acci\u00f3n</strong>. No sustituye la selecci\u00f3n t\u00e9cnica detallada en la herramienta de priorizaci\u00f3n.</p>' +
        '</div>';

    // \u2500 ICP relegado dentro de <details> \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    priHTML += '<details style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:.7rem 1rem;">' +
        '<summary style="cursor:pointer;font-size:.78rem;font-weight:700;color:#64748b;user-select:none;list-style:none;">\ud83d\udd2c \u00cdndice Combinado de Priorizaci\u00f3n (ICP) \u2014 metodolog\u00eda y puntuaciones detalladas</summary>' +
        '<div style="margin-top:.85rem;">' +
        // Tarjetas ICP compactas (relegadas)
        '<div style="font-size:.78rem;font-weight:700;color:#334155;margin-bottom:.5rem;">Puntuaciones por l\u00ednea EPVSA</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.45rem;margin-bottom:1rem;">';
    icp.lineas.forEach(function(le) {
        var pct = Math.round(le.icp * 100);
        priHTML += '<div style="background:'+le.nb+';border:1px solid '+le.nbord+';border-radius:8px;padding:.55rem .65rem;">' +
            '<div style="font-size:.63rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.04em;">'+le.cod+'</div>' +
            '<div style="font-size:1.25rem;font-weight:900;color:'+le.nc+';line-height:1.1;">'+pct+'<span style="font-size:.58rem;">/100</span></div>' +
            '<div style="font-size:.63rem;color:'+le.nc+';font-weight:700;">'+le.nivel+'</div>' +
            _bar3(le.icp, le.nc) + '</div>';
    });
    priHTML += '</div>';
    // Matriz de convergencia
    priHTML += '<div style="font-size:.78rem;font-weight:700;color:#334155;margin-bottom:.5rem;">Matriz de convergencia entre fuentes</div>' +
        '<div style="overflow-x:auto;margin-bottom:.85rem;"><table style="width:100%;border-collapse:collapse;font-size:.71rem;">' +
        '<thead><tr style="background:#f1f5f9;border-bottom:2px solid #e2e8f0;">' +
        '<th style="text-align:left;padding:.4rem .6rem;color:#64748b;font-weight:600;">L\u00ednea</th>' +
        (icp.tienePT ? '<th style="text-align:center;padding:.4rem .4rem;color:#0074c8;font-weight:600;">\ud83d\uddf3\ufe0f Tem\u00e1tica ('+icp.wT+'%)</th>' : '') +
        (icp.tienePE ? '<th style="text-align:center;padding:.4rem .4rem;color:#7c3aed;font-weight:600;">\ud83c\udfaf EPVSA ('+icp.wE+'%)</th>' : '') +
        (icp.tienePR ? '<th style="text-align:center;padding:.4rem .4rem;color:#2d6a4f;font-weight:600;">\ud83d\udd0d RELAS ('+icp.wR+'%)</th>' : '') +
        '<th style="text-align:center;padding:.4rem .4rem;color:#1e293b;font-weight:700;border-left:1px solid #e2e8f0;">ICP</th>' +
        '</tr></thead><tbody>';
    icp.lineas.forEach(function(le, idx) {
        priHTML += '<tr style="background:'+(idx%2===0?'white':'#f8fafc')+';border-bottom:1px solid #f1f5f9;">' +
            '<td style="padding:.38rem .6rem;"><strong style="color:'+le.nc+'">'+le.icono+' '+le.cod+'</strong></td>';
        if (icp.tienePT) priHTML += '<td style="padding:.38rem .4rem;text-align:center;font-weight:700;color:#0074c8;">'+Math.round(le.pt*100)+'</td>';
        if (icp.tienePE) priHTML += '<td style="padding:.38rem .4rem;text-align:center;font-weight:700;color:#7c3aed;">'+Math.round(le.pe*100)+'</td>';
        if (icp.tienePR) priHTML += '<td style="padding:.38rem .4rem;text-align:center;font-weight:700;color:#2d6a4f;">'+Math.round(le.pr*100)+'</td>';
        priHTML += '<td style="padding:.38rem .4rem;text-align:center;border-left:1px solid #e2e8f0;font-weight:900;color:'+le.nc+';">'+Math.round(le.icp*100)+'</td></tr>';
    });
    priHTML += '</tbody></table></div>';
    // Formula + pesos
    priHTML += '<div style="background:#dbeafe;border-radius:6px;padding:.45rem .8rem;margin-bottom:.65rem;font-family:monospace;font-size:.76rem;color:#1e40af;">ICP = wT \u00b7 PT + wE \u00b7 PE + wR \u00b7 PR</div>' +
        '<div style="font-size:.74rem;color:#64748b;line-height:1.65;">' +
        (icp.tienePT ? '\u2705 <strong>PT</strong> Priorizaci\u00f3n tem\u00e1tica (ciudadan\u00eda): wT='+icp.wT+'%<br>' : '\u2b1c PT \u2014 Sin datos de priorizaci\u00f3n tem\u00e1tica<br>') +
        (icp.tienePE ? '\u2705 <strong>PE</strong> Motor salutog\u00e9nico EPVSA: wE='+icp.wE+'%<br>' : '\u2b1c PE \u2014 Sin propuesta EPVSA<br>') +
        (icp.tienePR ? '\u2705 <strong>PR</strong> Priorizaci\u00f3n mixta RELAS: wR='+icp.wR+'%<br>' : '\u2b1c PR \u2014 Sin datos RELAS<br>') +
        '<br><strong>Limitaci\u00f3n:</strong> El ICP resume convergencia entre fuentes, no causalidad. No sustituye el an\u00e1lisis t\u00e9cnico cualitativo del equipo local.</div>' +
        '</div></details>';

    elPri.innerHTML = priHTML;
}

"""

content = content[:idx_render_start] + NEW_RENDER + content[idx_render_end:]
cambios.append('renderizarResultadoIA reescrita (3 bloques)')
print('OK: renderizarResultadoIA reescrita')

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
print('  _adaptarAnalisisAFormatoUI:', 'OK' if 'function _adaptarAnalisisAFormatoUI' in content else 'MISSING')
print('  renderizarResultadoIA:',      'OK' if 'function renderizarResultadoIA' in content else 'MISSING')
print('  Base analitica:',             'OK' if 'Base anal\u00edtica' in content else 'MISSING')
print('  Oportunidad accion:',         'OK' if 'Oportunidad de acci\u00f3n local' in content else 'MISSING')
print('  Activo o capacidad:',         'OK' if 'Activo o capacidad movilizable' in content else 'MISSING')
print('  Linea EPVSA municipal:',      'OK' if 'Posible l\u00ednea EPVSA municipal' in content else 'MISSING')
print('  ICP en details:',             'OK' if '\u00cdndice Combinado de Priorizaci\u00f3n (ICP)' in content else 'MISSING')
print('  Propuesta lineas EPVSA:',     'OK' if 'Propuesta de l\u00edneas EPVSA' in content else 'MISSING')
print('  _generarAnalisisLocal intacta:', 'OK' if 'function _generarAnalisisLocal' in content else 'MISSING')
print('  generarAnalisisIA intacta:',  'OK' if 'function generarAnalisisIA' in content else 'MISSING')
print('  _calcularICP intacta:',       'OK' if 'function _calcularICP' in content else 'MISSING')

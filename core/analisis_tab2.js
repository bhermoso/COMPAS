function analizarDatosMunicipio() {

    var municipioId = getMunicipioActual();

    var nombre      = getNombreMunicipio(municipioId);

    var datos       = datosMunicipioActual || {};



    // [AUDIT] Contrato de window.analisisActual — producido por esta función (única definición).

    // CAMPOS ESTRUCTURALMENTE ESTABLES (siempre presentes tras ejecución normal):

    //   municipio, fortalezas, oportunidades, conclusiones, recomendaciones, priorizacion,

    //   propuestaEPVSA, datosAnalisis, alertasInequidad, narrativa, fuentes, trazabilidad.

    //   perfilSOC: objeto si tieneDet===true, null si no.

    //   patronesTransversales, informeTopicos: arrays, vacíos si faltan det/informe.

    // ENRIQUECIMIENTOS OPCIONALES (presentes solo si se ejecutó el expert system tras esta función):

    //   priorizacion_experta, motor_version, propuestaEPVSA[i].relevancia_sfa.

    // CAMPOS _v3_* (presentes solo si COMPAS_ejecutarMotorV3 corrió con analisisActual ya existente):

    //   _v3_prioridades, _v3_conclusiones, _v3_recomendaciones, _v3_propuestaEPVSA,

    //   _v3_divergencias, _v3_estudiosAn — uso interno/debug, ninguna UI principal los lee.

    //   alertasInequidad puede quedar sobreescrita por v3.

    //   propuestaEPVSA puede quedar reemplazada por v3 si contenía IDs fuera de [1–5].

    var analisis = {

        municipio:             nombre,

        fortalezas:            [],

        oportunidades:         [],

        conclusiones:          [],

        recomendaciones:       [],

        priorizacion:          [],

        propuestaEPVSA:        [],

        datosAnalisis:         {},

        perfilSOC:             null,

        alertasInequidad:      [],

        analisisPorCapas:      {},

        patronesTransversales: [],

        narrativa:             {},

        // Inventario de fuentes disponibles

        fuentes: {

            tieneInforme:   false,

            tieneEstudios:  false,

            tienePopular:   false,

            tieneDet:       false,

            tieneIndicadores: false

        }

    };



    // ── INVENTARIO DE FUENTES ─────────────────────────────────────────

    var tieneInforme   = !!(datos.informe && datos.informe.htmlCompleto);

    var tieneEstudios  = !!(window.estudiosComplementarios && window.estudiosComplementarios.length);

    var pop            = window.datosParticipacionCiudadana

                         || (datos.votacionRelas && datos.votacionRelas.temasFreq ? datos.votacionRelas : null);

    var tienePopular   = !!(pop && (pop.temasFreq || pop.rankingObjetivos));

    var detFirebase    = datos.determinantes || {};

    var indFirebase    = datos.indicadores   || {};

    var tieneDet       = Object.keys(detFirebase).length > 0;

    var tieneInd       = Object.keys(indFirebase).length > 0;



    analisis.fuentes = {

        tieneInforme, tieneEstudios, tienePopular,

        tieneDet, tieneIndicadores: tieneInd

    };



    // Sin ninguna fuente de núcleo: bloquear

    if (!tieneInforme && !tieneEstudios && !tienePopular && !tieneDet) {

        analisis.sinDatos = true;

        analisis.mensaje  = 'El municipio de ' + nombre + ' aún no tiene datos cargados. ' +

            'Carga al menos el Informe de Situación de Salud.';

        return analisis;

    }



    // ── HELPERS DE DETERMINANTES ──────────────────────────────────────

    function getValorDet(cod) {

        if (detFirebase[cod] !== undefined) {

            var d = detFirebase[cod];

            return typeof d === 'object' ? parseFloat(d.valor) : parseFloat(d);

        }

        return null;

    }

    function getRefAnd(cod) {

        var ref = (typeof referenciasEAS !== 'undefined' && referenciasEAS[cod]);

        return ref && ref.refAndalucia != null ? ref.refAndalucia : null;

    }

    function getPolaridad(cod) {

        if (typeof ESTRUCTURA_DETERMINANTES !== 'undefined') {

            for (var aK in ESTRUCTURA_DETERMINANTES) {

                var area = ESTRUCTURA_DETERMINANTES[aK];

                var inds = area.indicadores || [];

                if (area.grupos) area.grupos.forEach(function(g){ inds = inds.concat(g.indicadores||[]); });

                var found = inds.find(function(i){ return i.codigo === cod; });

                if (found) return found.polaridad || 1;

            }

        }

        return 1;

    }

    function getTextoDet(cod) {

        if (typeof ESTRUCTURA_DETERMINANTES !== 'undefined') {

            for (var aK in ESTRUCTURA_DETERMINANTES) {

                var area = ESTRUCTURA_DETERMINANTES[aK];

                var inds = area.indicadores || [];

                if (area.grupos) area.grupos.forEach(function(g){ inds = inds.concat(g.indicadores||[]); });

                var found = inds.find(function(i){ return i.codigo === cod; });

                if (found) return found.texto;

            }

        }

        return cod;

    }



    // ── 1. PRIORIZACIÓN POPULAR (eje principal cuando existe) ─────────

    var temasTop = [];

    var nPart    = 0;

    if (tienePopular) {

        nPart = pop.n || pop.totalParticipantes || 0;

        if (pop.temasFreq) {

            temasTop = Object.entries(pop.temasFreq)

                .map(function(e){ return { k: parseInt(e[0]), v: e[1] }; })

                .sort(function(a,b){ return b.v - a.v; });

        } else if (pop.rankingObjetivos) {

            temasTop = pop.rankingObjetivos.slice(0,10).map(function(o, i){

                return { k: i+1, v: o.votos || 0, label: o.texto };

            });

        }

    }



    // ── 2. ANÁLISIS DE DETERMINANTES EAS (apoyo cuantitativo) ─────────

    var umbral         = 0.05;

    var analisisPorArea = {};



    if (tieneDet && typeof MAPEO_TEMATICO_SAL !== 'undefined') {

        Object.entries(MAPEO_TEMATICO_SAL).forEach(function(entry) {

            var areaKey = entry[0], area = entry[1];

            analisisPorArea[areaKey] = { nombre: area.nombre, fortalezas: [], oportunidades: [], neutros: [] };



            area.determinantes.forEach(function(cod) {

                var valor     = getValorDet(cod);

                var refAnd    = getRefAnd(cod);

                var polaridad = getPolaridad(cod);

                var texto     = getTextoDet(cod);

                if (valor === null || refAnd === null || isNaN(valor) || isNaN(refAnd) || refAnd === 0) return;



                var dif    = (valor - refAnd) / refAnd;

                var esMejor = (polaridad === 1 && dif > umbral)  || (polaridad === -1 && dif < -umbral);

                var esPeor  = (polaridad === 1 && dif < -umbral) || (polaridad === -1 && dif > umbral);

                var dato    = { codigo: cod, texto, valor, refAndalucia: refAnd, diferenciaPct: (dif*100).toFixed(1) };



                if (esMejor) {

                    analisisPorArea[areaKey].fortalezas.push(dato);

                    analisis.fortalezas.push(Object.assign({ area: area.nombre,

                        mensaje: texto + ': ' + valor + '% (Andalucía: ' + refAnd + '%)' }, dato));

                } else if (esPeor) {

                    analisisPorArea[areaKey].oportunidades.push(dato);

                    analisis.oportunidades.push(Object.assign({ area: area.nombre,

                        mensaje: texto + ': ' + valor + '% presenta margen de mejora respecto a Andalucía (' + refAnd + '%)' }, dato));

                } else {

                    analisisPorArea[areaKey].neutros.push(dato);

                }

            });

        });

    }



    // ── 3. ANÁLISIS DE INDICADORES ────────────────────────────────────

    var indicadoresFavorables = [], indicadoresAMejorar = [];

    if (tieneInd) {

        Object.entries(indFirebase).forEach(function(entry) {

            var ind  = entry[1];

            if (!ind || typeof ind !== 'object') return;

            var tObs = ind.tendenciaObservada || ind.tObs || '';

            var tDes = ind.tendenciaDeseada   || ind.tDes || '';

            var nom  = ind.nombre || ind.indicador || entry[0];

            if (!tObs || !tDes) return;

            var favorable = (tObs === tDes) ||

                (tObs === '▲' && tDes === '▲') || (tObs === '▼' && tDes === '▼') ||

                (tObs === '↑' && tDes === '↑') || (tObs === '↓' && tDes === '↓');

            var amejorar  = (tObs === '▲' && tDes === '▼') || (tObs === '▼' && tDes === '▲') ||

                (tObs === '↑' && tDes === '↓') || (tObs === '↓' && tDes === '↑');

            if (favorable) indicadoresFavorables.push({ nombre: nom, tendencia: 'favorable' });

            else if (amejorar) indicadoresAMejorar.push({ nombre: nom, tendencia: 'a mejorar' });

        });

    }

    analisis.datosAnalisis = {

        determinantes: analisisPorArea,

        indicadoresFavorables, indicadoresAMejorar,

        totalDeterminantes: Object.keys(detFirebase).length,

        totalIndicadores:   Object.keys(indFirebase).length

    };



    // ── 4. CONCLUSIONES — orden de jerarquía ──────────────────────────

    // 4a. Marco teórico (siempre)

    analisis.conclusiones = CONCLUSIONES_SAL_FIJAS.slice();

    // Añadir fuente_tipo explícito a conclusiones del marco teórico

    analisis.conclusiones.forEach(function(c) { if (!c.fuente_tipo) c.fuente_tipo = 'marco'; });



    // 4b. Informe de situación de salud (fuente primaria)

    // — Extracción real de contenido: keywords + extracto significativo

    analisis.informeTopicos = []; // temas detectados en el informe (para sección 7)

    if (tieneInforme) {

        var textoInforme = (datos.informe.htmlCompleto || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();



        // Extracto: primera frase/párrafo significativo (≥40 chars), máx 350 chars

        var extracto = '';

        var _frases = textoInforme.split(/[.!?]\s+/);

        for (var _fi = 0; _fi < _frases.length && extracto.length < 80; _fi++) {

            var _f = _frases[_fi].trim();

            if (_f.length >= 40) extracto = _f;

        }

        if (!extracto) extracto = textoInforme.slice(0, 250);

        if (extracto.length > 350) extracto = extracto.slice(0, 350) + '…';



        // Detección de temas de salud presentes en el texto

        var _KEYWORDS_INFORME = [

            { topico: 'alimentación',         patron: /alimentaci[oó]n|nutri|obesidad|sobrepeso|dieta|alimento/i,         linea: 1, obj: 0, progs: [1] },

            { topico: 'actividad física',      patron: /actividad f[ií]sica|sedentarismo|ejercicio|deporte|caminar|caminar/i, linea: 1, obj: 1, progs: [1] },

            { topico: 'salud mental',          patron: /salud mental|ansiedad|depresi[oó]n|bienestar emocional|ps[ií]qui/i,  linea: 1, obj: 3, progs: [5] },

            { topico: 'tabaco',                patron: /tabaco|tabaquismo|fumar|fumador|cigarro/i,                           linea: 1, obj: 5, progs: [3] },

            { topico: 'alcohol',               patron: /alcohol|bebida|consumo de riesgo|intoxicaci[oó]n/i,                  linea: 1, obj: 5, progs: [3] },

            { topico: 'sueño',                 patron: /sue[ñn]o|insomnio|descanso|dormir/i,                                linea: 1, obj: 2, progs: [2] },

            { topico: 'pantallas',             patron: /pantalla|redes sociales|internet|tecnolog[ií]a/i,                    linea: 1, obj: 3, progs: [4] },

            { topico: 'violencia de género',   patron: /violencia de g[eé]nero|violencia dom[eé]stica|maltrato/i,            linea: 1, obj: 3, progs: [7] },

            { topico: 'medioambiente',         patron: /medioambiente|contaminaci[oó]n|aire|agua|ruido|entorno/i,            linea: 2, obj: 0, progs: [1] },

            { topico: 'envejecimiento',        patron: /envejecimiento|mayor|anciano|persona mayor|longevidad/i,             linea: 1, obj: 0, progs: [0] },

            { topico: 'infancia y juventud',   patron: /infancia|ni[ñn]o|joven|juventud|adolescente|escolar/i,              linea: 1, obj: 0, progs: [0] },

            { topico: 'desigualdad',           patron: /desigualdad|inequidad|vulnerab|exclusi[oó]n|pobreza|marginal/i,     linea: 2, obj: 0, progs: [0] },

            { topico: 'enfermedades crónicas', patron: /cr[oó]nica|cardiovascular|diabetes|c[aá]ncer|hipertensi[oó]n/i,     linea: 1, obj: 0, progs: [1] },

            { topico: 'salud sexual',          patron: /salud sexual|ETS|ITS|anticoncepti|embarazo/i,                        linea: 1, obj: 4, progs: [4] }

        ];

        var _topicosMencionados = [];

        _KEYWORDS_INFORME.forEach(function(kw) {

            if (kw.patron.test(textoInforme)) {

                _topicosMencionados.push(kw.topico);

                analisis.informeTopicos.push(kw);

            }

        });



        var textoTopicos = _topicosMencionados.length

            ? ' El documento menciona específicamente: ' + _topicosMencionados.slice(0, 6).join(', ') + '.'

            : '';



        analisis.conclusiones.push({

            id: 'informe_situacion', prioridad: 5, especifica: true,

            fuente_tipo: 'informe',

            extracto: extracto,

            topicos: _topicosMencionados,

            texto: 'El Informe de Situación de Salud de ' + nombre +

                ' aporta la base epidemiológica del Plan Local de Salud.' +

                (extracto ? ' Según el documento: «' + extracto + '».' : '') +

                textoTopicos +

                ' Este informe fundamenta directamente la selección de líneas estratégicas y actuaciones del Plan.'

        });

    }



    // 4c. Estudios complementarios

    if (tieneEstudios) {

        var nomEstudios = window.estudiosComplementarios.map(function(e){ return e.nombre; }).join(', ');

        analisis.conclusiones.push({

            id: 'estudios_complementarios', prioridad: 6, especifica: true,

            fuente_tipo: 'estudios',

            texto: 'Se dispone de ' + window.estudiosComplementarios.length +

                ' estudio' + (window.estudiosComplementarios.length > 1 ? 's' : '') +

                ' complementario' + (window.estudiosComplementarios.length > 1 ? 's' : '') +

                ' (' + nomEstudios + ') que aportan evidencia adicional sobre aspectos específicos de la salud ' +

                'de la población de ' + nombre + ', reforzando la solidez del diagnóstico.'

        });

    }



    // 4d. Priorización popular (eje ciudadano — peso máximo)

    if (tienePopular && temasTop.length) {

        var nombresTemas = typeof VRELAS_TEMAS !== 'undefined' ? VRELAS_TEMAS : {};

        var top3nom = temasTop.slice(0,3).map(function(t){

            return t.label || nombresTemas[t.k] || ('Tema ' + t.k);

        }).join(', ');

        analisis.conclusiones.push({

            id: 'priorizacion_ciudadana', prioridad: 3, especifica: true,

            fuente_tipo: 'participacion',

            texto: 'La ciudadanía de ' + nombre +

                (nPart ? ' (' + nPart + ' participantes)' : '') +

                ' ha identificado como temas de salud más relevantes: ' + top3nom + '. ' +

                'Estas prioridades expresan la perspectiva y experiencia de la población y ' +

                'constituyen el eje central del Plan Local de Salud, integrando la voz ciudadana ' +

                'con la evidencia epidemiológica disponible.'

        });

    } else if (!tienePopular) {

        analisis.conclusiones.push({

            id: 'priorizacion_pendiente', prioridad: 3, especifica: true,

            fuente_tipo: 'participacion',

            texto: 'El proceso de priorización ciudadana está pendiente de realizarse. ' +

                'Se recomienda completar la votación popular (Tab 3 → Priorización EPVSA) antes de ' +

                'aprobar el Plan Local de Salud, para garantizar la participación efectiva de la ciudadanía.'

        });

    }



    // 4e. Determinantes EAS (fuente de apoyo — solo si hay datos)

    if (tieneDet) {

        if (analisis.fortalezas.length > 0) {

            var areasF = [...new Set(analisis.fortalezas.map(function(f){ return f.area; }))];

            analisis.conclusiones.push({

                id: 'fortalezas', prioridad: 7, especifica: true,

                fuente_tipo: 'determinantes',

                texto: nombre + ' presenta valores favorables en los indicadores de ' +

                    areasF.slice(0,3).join(', ') +

                    (areasF.length > 3 ? ' y otras áreas' : '') +

                    ' según la Encuesta Andaluza de Salud (datos estimados). ' +

                    'Estos activos de salud deben identificarse y consolidarse en el Plan Local de Salud.'

            });

        }

        if (analisis.oportunidades.length > 0) {

            var areasO = [...new Set(analisis.oportunidades.map(function(o){ return o.area; }))];

            analisis.conclusiones.push({

                id: 'oportunidades', prioridad: 8, especifica: true,

                fuente_tipo: 'determinantes',

                texto: 'Los indicadores estimados de la Encuesta Andaluza de Salud señalan ' +

                    'margen de mejora en ' + areasO.slice(0,3).join(', ') +

                    '. Estas áreas son coherentes con las prioridades ciudadanas y apoyan ' +

                    'la orientación de las intervenciones del Plan.'

            });

        }

    }



    // 4f. Indicadores de seguimiento (contexto, no diagnóstico)

    if (tieneInd && (indicadoresFavorables.length + indicadoresAMejorar.length) > 0) {

        var total = indicadoresFavorables.length + indicadoresAMejorar.length;

        var textoInd = indicadoresFavorables.length > indicadoresAMejorar.length

            ? 'La mayoría de los indicadores de seguimiento del Cuadro de Mandos muestran tendencias favorables (' +

              indicadoresFavorables.length + ' de ' + total + '), ' +

              'reflejando una evolución positiva que el Plan puede consolidar y acelerar.'

            : 'Los indicadores de seguimiento del Cuadro de Mandos muestran que ' +

              indicadoresAMejorar.length + ' de ' + total +

              ' requieren actuaciones de mejora. El Plan debe incorporar estos indicadores como metas de resultado.';

        analisis.conclusiones.push({

            id: 'tendencias', prioridad: 9, especifica: true,

            fuente_tipo: 'indicadores',

            texto: textoInd

        });

    }



    // Ordenar conclusiones por prioridad

    analisis.conclusiones.sort(function(a, b){ return (a.prioridad||99) - (b.prioridad||99); });



    // ── 5. RECOMENDACIONES ────────────────────────────────────────────

    analisis.recomendaciones = RECOMENDACIONES_SAL_FIJAS.slice();

    // Añadir conclusion_origen_id a recomendaciones del marco teórico

    analisis.recomendaciones.forEach(function(r) { if (!r.conclusion_origen_id) r.conclusion_origen_id = 'marco'; });



    // 5a. Recomendaciones derivadas de la priorización popular

    if (tienePopular && temasTop.length) {

        var nombresTemas2 = typeof VRELAS_TEMAS !== 'undefined' ? VRELAS_TEMAS : {};

        var iconosTemas   = typeof VRELAS_ICONOS_TEMAS !== 'undefined' ? VRELAS_ICONOS_TEMAS : {};

        temasTop.slice(0,3).forEach(function(t, idx) {

            var tLabel = t.label || nombresTemas2[t.k] || ('Tema ' + t.k);

            var tIco   = iconosTemas[t.k] || '🎯';

            var pct    = nPart ? Math.round(t.v / nPart * 100) : null;

            var mapa   = (typeof _TEMA_A_EPVSA !== 'undefined') ? _TEMA_A_EPVSA[t.k] : null;

            analisis.recomendaciones.push({

                id:        'rec_popular_' + idx,

                prioridad: 5 + idx,

                especifica: true,

                conclusion_origen_id: 'priorizacion_ciudadana',

                texto: tIco + ' ' + tLabel +

                    (pct ? ' (' + pct + '% de votos ciudadanos)' : '') +

                    ': desarrollar actuaciones específicas y medibles en el primer año del Plan, ' +

                    'articuladas desde la RELAS con el Ayuntamiento, el Centro de Salud y entidades locales.' +

                    (mapa ? ' Línea EPVSA: ' + mapa.linea + '.' : '')

            });

        });

    }



    // 5b. Recomendaciones derivadas de estudios complementarios

    if (tieneEstudios) {

        analisis.recomendaciones.push({

            id: 'rec_estudios', prioridad: 8, especifica: true,

            conclusion_origen_id: 'estudios_complementarios',

            texto: 'Integrar los hallazgos de los estudios complementarios disponibles (' +

                window.estudiosComplementarios.map(function(e){ return e.nombre; }).join(', ') +

                ') en el diseño de las intervenciones, garantizando que las actuaciones estén ' +

                'respaldadas por la mejor evidencia local disponible.'

        });

    }



    // 5c. Recomendaciones por áreas con oportunidades (determinantes EAS)

    if (tieneDet) {

        var areasConOp = {};

        analisis.oportunidades.forEach(function(o) {

            if (!areasConOp[o.area]) areasConOp[o.area] = [];

            areasConOp[o.area].push(o);

        });

        var recPorArea = {

            'bienestar emocional':                      'Situar el bienestar emocional como eje del Plan, con programas de apoyo social y dinamización de activos comunitarios.',

            'vida activa':                              'Promover la vida activa aprovechando espacios verdes, rutas peatonales y equipamientos deportivos como activos comunitarios.',

            'alimentación saludable':                   'Impulsar la alimentación saludable mediante el acceso a productos frescos, educación nutricional y mejora de la oferta en entornos públicos.',

            'sueño saludable':                          'Incorporar el sueño saludable como componente del bienestar integral, sensibilizando sobre su importancia y mejorando entornos.',

            'vida sin humo':                            'Consolidar la tendencia hacia una vida sin humo mediante espacios libres de tabaco y apoyo a la deshabituación.',

            'consumo responsable de Alcohol':           'Promover el consumo responsable de alcohol mediante alternativas de ocio, regulación y sensibilización sobre riesgos.',

            'Percepción de entornos promotores de salud': 'Mejorar los entornos promotores de salud reduciendo exposiciones nocivas y potenciando espacios públicos saludables.',

            'redes de apoyo social':                    'Fortalecer las redes de apoyo social para prevenir la soledad no deseada, especialmente en personas mayores y colectivos vulnerables.',

            'Equidad y determinantes sociales':         'Priorizar intervenciones con perspectiva de equidad en colectivos con mayores dificultades, aplicando el universalismo proporcional.'

        };

        Object.entries(areasConOp).forEach(function(entry, idx) {

            var area  = entry[0];

            var texto = recPorArea[area] || ('Desarrollar actuaciones en ' + area + ' para facilitar opciones saludables.');

            analisis.recomendaciones.push({

                id: 'rec_det_' + idx, prioridad: 10 + idx, especifica: true, area: area,

                conclusion_origen_id: 'oportunidades',

                texto: texto + ' (Dato de apoyo: Encuesta Andaluza de Salud — estimación.)'

            });

        });

    }



    // 5d. Devolución a la ciudadanía si hubo participación

    if (tienePopular && nPart) {

        analisis.recomendaciones.push({

            id: 'rec_devolucion', prioridad: 12, especifica: true,

            conclusion_origen_id: 'priorizacion_ciudadana',

            texto: 'Realizar una sesión de devolución a los ' + nPart + ' participantes del proceso de ' +

                'priorización ciudadana, comunicando los resultados de la votación y las actuaciones ' +

                'que se pondrán en marcha. La transparencia refuerza la legitimidad del Plan y la ' +

                'participación futura en el seguimiento y evaluación.'

        });

    }



    // ── 6. PRIORIZACIÓN DE ÁREAS ──────────────────────────────────────

    // Base: determinantes EAS (si hay)

    if (tieneDet && typeof MAPEO_TEMATICO_SAL !== 'undefined') {

        Object.entries(MAPEO_TEMATICO_SAL).forEach(function(entry) {

            var areaKey = entry[0], area = entry[1];

            var dA = analisisPorArea[areaKey];

            if (!dA) return;

            var nF = dA.fortalezas.length, nO = dA.oportunidades.length;

            var total = nF + nO + dA.neutros.length;

            if (total === 0) return;

            var puntuacion = nO * 3 + nF;

            var just = '';

            if (nF > 0 && nO > 0)  just = 'Área con ' + nF + ' fortaleza(s) a consolidar y ' + nO + ' oportunidad(es) de mejora.';

            else if (nO > 0)        just = 'Área prioritaria con ' + nO + ' oportunidad(es) de mejora identificada(s).';

            else                    just = 'Área de fortaleza con ' + nF + ' indicador(es) favorable(s) a consolidar.';

            if (dA.oportunidades[0]) just += ' Mejorable: ' + dA.oportunidades[0].texto + ' (' + dA.oportunidades[0].valor + '% vs ' + dA.oportunidades[0].refAndalucia + '% Andalucía).';

            analisis.priorizacion.push({

                area: area.nombre, areaKey, puntuacion, numFortalezas: nF, numOportunidades: nO,

                justificacion: just, lineaEPVSA: area.lineaEPVSA,

                objetivoEPVSA: area.objetivoEPVSA, programas: area.programas,

                origenCiudadano: false

            });

        });

        analisis.priorizacion.sort(function(a,b){ return b.puntuacion - a.puntuacion; });

    }



    // Sobreponderar áreas que coincidan con temas votados por la ciudadanía

    if (tienePopular && temasTop.length && typeof _TEMA_A_EPVSA !== 'undefined') {

        temasTop.forEach(function(t, rank) {

            var mapa = _TEMA_A_EPVSA[t.k];

            if (!mapa) return;

            var lineaStr = mapa.linea.split('—')[0].trim(); // '1 ', '2 ', etc.

            var lineaNum = parseInt(lineaStr);

            analisis.priorizacion.forEach(function(p) {

                if (p.lineaEPVSA === lineaNum) {

                    var bonus = Math.max(0, 5 - rank) * 4; // top1 +20, top2 +16, top3 +12…

                    p.puntuacion     += bonus;

                    p.origenCiudadano = true;

                    p.justificacion  += ' | 🗳️ Prioridad ciudadana (posición ' + (rank+1) + ').';

                }

            });

        });

        // Re-ordenar con bonus ciudadano aplicado

        analisis.priorizacion.sort(function(a,b){ return b.puntuacion - a.puntuacion; });

    }



    // Si no hay determinantes pero sí participación: construir priorización solo desde votos

    if (!tieneDet && tienePopular && temasTop.length) {

        var nombresTemas3 = typeof VRELAS_TEMAS !== 'undefined' ? VRELAS_TEMAS : {};

        temasTop.forEach(function(t, rank) {

            var mapa   = (typeof _TEMA_A_EPVSA !== 'undefined') ? _TEMA_A_EPVSA[t.k] : null;

            var tLabel = t.label || nombresTemas3[t.k] || ('Tema ' + t.k);

            var pct    = nPart ? Math.round(t.v / nPart * 100) : null;

            analisis.priorizacion.push({

                area:             tLabel,

                areaKey:          'tema_' + t.k,

                puntuacion:       Math.max(1, 10 - rank),

                numFortalezas:    0,

                numOportunidades: 0,

                justificacion:    '🗳️ Prioridad ciudadana' + (pct ? ' (' + pct + '%)' : '') + '.',

                lineaEPVSA:       mapa ? parseInt(mapa.linea) : 1,

                objetivoEPVSA:    0,

                programas:        [0],

                origenCiudadano:  true

            });

        });

    }



    // ── 7. PROPUESTA EPVSA ────────────────────────────────────────────

    var lineasMap = new Map();

    analisis.priorizacion.forEach(function(prio) {

        var lid = prio.lineaEPVSA;

        if (!lineasMap.has(lid)) {

            lineasMap.set(lid, {

                lineaId: lid, relevancia: 0,

                objetivos: new Set(), programas: new Set(),

                justificaciones: [], origenCiudadano: false, origenInforme: false,

                topicosMencionados: []

            });

        }

        var l = lineasMap.get(lid);

        l.relevancia += prio.puntuacion;

        l.objetivos.add(prio.objetivoEPVSA);

        (prio.programas || []).forEach(function(p){ l.programas.add(p); });

        l.justificaciones.push(prio.area);

        if (prio.origenCiudadano) l.origenCiudadano = true;

    });



    // Bonus del informe: las líneas que aparecen en el texto del informe reciben +15 pts

    if (tieneInforme && analisis.informeTopicos.length) {

        analisis.informeTopicos.forEach(function(kw) {

            var lid = kw.linea;

            if (!lineasMap.has(lid)) {

                lineasMap.set(lid, {

                    lineaId: lid, relevancia: 0,

                    objetivos: new Set(), programas: new Set(),

                    justificaciones: [], origenCiudadano: false, origenInforme: true,

                    topicosMencionados: []

                });

            }

            var l = lineasMap.get(lid);

            l.relevancia += 15;

            l.origenInforme = true;

            l.objetivos.add(kw.obj);

            kw.progs.forEach(function(p){ l.programas.add(p); });

            if (l.topicosMencionados.indexOf(kw.topico) === -1) l.topicosMencionados.push(kw.topico);

            if (l.justificaciones.indexOf('Informe: ' + kw.topico) === -1) l.justificaciones.push('Informe: ' + kw.topico);

        });

    }



    var maxRel = Math.max.apply(null, [...lineasMap.values()].map(function(l){ return l.relevancia; })) || 1;

    analisis.propuestaEPVSA = [...lineasMap.values()].map(function(l) {

        var fuentesLabel = [];

        if (l.origenCiudadano) fuentesLabel.push('🗳️ Prioridad ciudadana');

        if (l.origenInforme)   fuentesLabel.push('📄 Informe de situación');

        if (tieneDet)          fuentesLabel.push('Determinantes EAS');

        if (tieneInforme && !l.origenInforme) fuentesLabel.push('Informe de situación');

        // conclusion_ids: enlace explícito a las conclusiones que fundamentan esta línea

        var cIds = [];

        if (l.origenCiudadano) cIds.push('priorizacion_ciudadana');

        if (l.origenInforme)   cIds.push('informe_situacion');

        if (tieneDet && l.justificaciones.some(function(j){ return j.indexOf('Informe:') === -1; })) {

            if (analisis.oportunidades.length) cIds.push('oportunidades');

            if (analisis.fortalezas.length)    cIds.push('fortalezas');

        }

        if (!cIds.length) cIds.push('marco_salutogenico');

        return {

            lineaId:         l.lineaId,

            relevancia:      Math.round((l.relevancia / maxRel) * 100),

            objetivos:       [...l.objetivos],

            programas:       [...l.programas],

            justificacion:   'Áreas relacionadas: ' + l.justificaciones.join(', '),

            origenCiudadano: l.origenCiudadano,

            fuentes:         fuentesLabel.join(' · ') || 'Análisis salutogénico',

            conclusion_ids:  cIds   // trazabilidad: conclusiones que fundamentan esta línea

        };

    }).sort(function(a,b){ return b.relevancia - a.relevancia; });



    // LE3 (comunicación) y LE4 (formación): se incluyen si el análisis las justifica o

    // si hay datos suficientes (≥2 fuentes núcleo) que hacen necesaria la difusión.

    // Su relevancia es proporcional a la riqueza de datos disponibles, no fija.

    var _fuentesNucleo = [tieneInforme, tieneEstudios, tienePopular].filter(Boolean).length;

    if (!analisis.propuestaEPVSA.find(function(p){ return p.lineaId === 3; })) {

        // LE3 solo si hay al menos 1 fuente núcleo (hay algo que comunicar)

        if (_fuentesNucleo >= 1) {

            var _relLE3 = Math.min(70, 40 + _fuentesNucleo * 10 + (tienePopular ? 10 : 0));

            analisis.propuestaEPVSA.push({ lineaId: 3, relevancia: _relLE3, objetivos: [0], programas: [0],

                justificacion: 'Difusión de resultados del diagnóstico y prioridades ciudadanas' +

                    (tienePopular ? ' (' + (nPart || '?') + ' participantes a informar)' : ''),

                origenCiudadano: false,

                fuentes: 'EPVSA 2024-2030' + (tienePopular ? ' · Compromiso de devolución ciudadana' : '') });

        }

    }

    if (!analisis.propuestaEPVSA.find(function(p){ return p.lineaId === 4; })) {

        // LE4 solo si hay evidencia que requiera capacitación o investigación específica

        if (_fuentesNucleo >= 2 || analisis.alertasInequidad.length > 0) {

            var _relLE4 = Math.min(65, 35 + _fuentesNucleo * 8 + analisis.alertasInequidad.length * 5);

            analisis.propuestaEPVSA.push({ lineaId: 4, relevancia: _relLE4, objetivos: [0], programas: [0],

                justificacion: 'Formación de profesionales y agentes comunitarios en las áreas prioritarias identificadas' +

                    (analisis.alertasInequidad.length ? ' (alertas de inequidad detectadas)' : ''),

                origenCiudadano: false,

                fuentes: 'EPVSA 2024-2030' });

        }

    }



    // ── 8. PERFIL SOC (Antonovsky) ────────────────────────────────────

    function evalSOC(indicadoresCods) {

        var pun = 50, n = 0;

        indicadoresCods.forEach(function(cod) {

            var v = getValorDet(cod), r = getRefAnd(cod);

            if (v === null || r === null || isNaN(v) || isNaN(r) || r === 0) return;

            var d = ((v - r) / r) * 100;

            if (d > 10) pun += 15; else if (d > 5) pun += 10; else if (d > 0) pun += 5;

            else if (d < -10) pun -= 15; else if (d < -5) pun -= 10; else pun -= 5;

            n++;

        });

        pun = Math.max(0, Math.min(100, Math.round(pun)));

        var nivel  = pun >= 70 ? 'alto' : (pun >= 40 ? 'medio' : 'bajo');

        var interp = pun >= 70 ? 'Fortaleza comunitaria consolidada'

                   : (pun >= 40 ? 'Nivel adecuado con margen de mejora' : 'Área prioritaria de intervención');

        return { puntuacion: pun, nivel, interpretacion: interp, indicadoresEvaluados: n };

    }

    if (tieneDet) {

        analisis.perfilSOC = {

            comprensibilidad: evalSOC(['P7','P7b','P8a','P8b']),

            manejabilidad:    evalSOC(['DUKE_bajo','P71_dificultad','P4d_frio']),

            significatividad: evalSOC(['P12a','P12b','P12c','P57b1'])

        };

        var socG = Math.round((

            analisis.perfilSOC.comprensibilidad.puntuacion +

            analisis.perfilSOC.manejabilidad.puntuacion +

            analisis.perfilSOC.significatividad.puntuacion

        ) / 3);

        analisis.perfilSOC.global = {

            puntuacion: socG,

            nivel: socG >= 70 ? 'alto' : (socG >= 40 ? 'medio' : 'bajo'),

            interpretacion: socG >= 70 ? 'La comunidad presenta un perfil salutogénico favorable'

                          : (socG >= 40 ? 'La comunidad tiene capacidades de afrontamiento moderadas'

                                       : 'Se requiere fortalecer los recursos generadores de salud')

        };

    }



    // ── 9. ALERTAS DE INEQUIDAD ───────────────────────────────────────

    if (tieneDet && typeof UMBRALES_INEQUIDAD !== 'undefined') {

        UMBRALES_INEQUIDAD.forEach(function(al) {

            var v = getValorDet(al.codigo);

            if (v !== null && !isNaN(v) && v > al.umbral) {

                analisis.alertasInequidad.push({

                    codigo: al.codigo, valor: v, umbral: al.umbral,

                    mensaje: al.mensaje, tipo: al.tipo,

                    severidad: v > al.umbral * 1.5 ? 'alta' : 'moderada',

                    recomendacion: 'Priorizar intervenciones con perspectiva de equidad en ' + al.mensaje.toLowerCase()

                });

            }

        });

    }



    // ── 10. PATRONES TRANSVERSALES ────────────────────────────────────

    if (tieneDet && typeof PATRONES_SAL !== 'undefined' && typeof PLANTILLAS_SAL !== 'undefined') {

        var areasF_keys = [...new Set(analisis.fortalezas.map(function(f){ return f.area.toLowerCase(); }))];

        var areasO_keys = [...new Set(analisis.oportunidades.map(function(o){ return o.area.toLowerCase(); }))];

        var nom2key = {};

        Object.entries(PLANTILLAS_SAL).forEach(function(e){ nom2key[e[1].nombre.toLowerCase()] = e[0]; });



        Object.entries(PATRONES_SAL).forEach(function(entry) {

            var patronKey = entry[0], patron = entry[1];

            var nDatos = 0, tieneF = false, tieneO = false;

            patron.areas.forEach(function(aKey) {

                var pl = PLANTILLAS_SAL[aKey];

                if (!pl) return;

                var nom = pl.nombre.toLowerCase();

                if (areasF_keys.includes(nom)){ nDatos++; tieneF = true; }

                if (areasO_keys.includes(nom)){ nDatos++; tieneO = true; }

            });

            if (nDatos >= patron.umbralMinimo) {

                var tipo      = (tieneF && !tieneO) ? 'fortaleza' : (!tieneF && tieneO) ? 'oportunidad' : 'mixto';

                var narrativa = tipo === 'fortaleza' ? patron.narrativaFortaleza

                              : (tipo === 'oportunidad' ? patron.narrativaOportunidad : patron.narrativaMixta);

                analisis.patronesTransversales.push({

                    key: patronKey, nombre: patron.nombre, tipo, narrativa,

                    areasRelacionadas: patron.areas.map(function(k){

                        return PLANTILLAS_SAL[k] && PLANTILLAS_SAL[k].nombre || k;

                    })

                });

            }

        });

    }



    // ── 11. NARRATIVA SALUTOGÉNICA ────────────────────────────────────

    var totalDet = analisis.datosAnalisis.totalDeterminantes || 0;

    var totalInd = analisis.datosAnalisis.totalIndicadores   || 0;

    var areasConF = [...new Set(analisis.fortalezas.map(function(f){ return f.area; }))];

    var areasConO = [...new Set(analisis.oportunidades.map(function(o){ return o.area; }))];

    var nom2key2  = {};

    if (typeof PLANTILLAS_SAL !== 'undefined') {

        Object.entries(PLANTILLAS_SAL).forEach(function(e){ nom2key2[e[1].nombre.toLowerCase()] = e[0]; });

    }



    // Contexto: mencionar todas las fuentes disponibles

    var fuentesUsadasNar = [];

    if (tieneInforme)  fuentesUsadasNar.push('el Informe de Situación de Salud');

    if (tieneEstudios) fuentesUsadasNar.push(window.estudiosComplementarios.length + ' estudio(s) complementario(s)');

    if (tienePopular)  fuentesUsadasNar.push('la priorización ciudadana' + (nPart ? ' (' + nPart + ' participantes)' : ''));

    if (tieneDet)      fuentesUsadasNar.push(totalDet + ' indicadores de la Encuesta Andaluza de Salud');

    if (tieneInd)      fuentesUsadasNar.push(totalInd + ' indicadores del Cuadro de Mandos');



    var contextoNar = 'El presente análisis del perfil de salud de ' + nombre +

        ' integra ' + fuentesUsadasNar.join(', ') + '. ' +

        'El enfoque salutogénico —coherente con la EPVSA 2024-2030— orienta la mirada ' +

        'hacia los recursos y capacidades que generan salud en la comunidad, sin ignorar ' +

        'los ámbitos que requieren intervención.';



    var narrativaActivos = tieneDet && analisis.fortalezas.length

        ? nombre + ' presenta fortalezas en: ' + areasConF.slice(0,3).map(function(a) {

            var k = nom2key2[a.toLowerCase()];

            return (typeof PLANTILLAS_SAL !== 'undefined' && k && PLANTILLAS_SAL[k]) ? PLANTILLAS_SAL[k].nombre : a;

          }).join(', ') + ' (datos EAS, estimados).'

        : tieneDet

            ? 'El análisis no identifica áreas con valores significativamente superiores a la media andaluza. Esto no implica ausencia de activos, sino que los indicadores se sitúan en rangos similares a los de referencia.'

            : 'Los activos de salud del municipio se identificarán a partir del Informe de Situación de Salud y del proceso de priorización ciudadana.';



    var narrativaOp = tieneDet && analisis.oportunidades.length

        ? 'Los datos de la EAS señalan margen de mejora en: ' + areasConO.slice(0,3).join(', ') +

          '. Estas áreas son coherentes con las prioridades ciudadanas y orientan las intervenciones del Plan.'

        : tieneDet

            ? 'No se identifican áreas con valores significativamente inferiores a la media andaluza. El Plan puede orientarse a consolidar fortalezas y actuar desde la prevención.'

            : 'Las oportunidades de mejora se determinarán integrando el Informe de Situación de Salud con las prioridades ciudadanas.';



    var balance = analisis.fortalezas.length >= analisis.oportunidades.length ? 'favorable' : 'con margen de mejora';

    analisis.narrativa = {

        contexto:     contextoNar,

        activos:      narrativaActivos,

        oportunidades: narrativaOp,

        patrones: analisis.patronesTransversales.length

            ? analisis.patronesTransversales.map(function(p){ return p.nombre + ': ' + p.narrativa; }).join('\n\n')

            : 'Los datos analizados no muestran patrones transversales marcados entre las diferentes áreas.',

        sintesis: 'En síntesis, ' + nombre + ' presenta un perfil de salud ' + balance + '. ' +

            (tienePopular ? 'La voz ciudadana ' + (nPart ? '(' + nPart + ' participantes)' : '') +

                ' es el eje del Plan, apoyada por la evidencia epidemiológica disponible. ' : '') +

            'Desde el enfoque salutogénico, la pregunta clave es "¿qué recursos tenemos para ' +

            'generar salud?" Las recomendaciones que siguen traducen este análisis en líneas ' +

            'de actuación concretas, alineadas con la EPVSA 2024-2030 y adaptadas a la realidad local.'

    };



    // ── TRAZABILIDAD GLOBAL ───────────────────────────────────────────

    // Mapa de cadena: datos → conclusiones → recomendaciones → plan

    // Permite auditar cualquier resultado del análisis hasta su fuente original.

    analisis.trazabilidad = (function() {

        // Fuentes activas en este análisis

        var fuentes_activas = [];

        if (analisis.fuentes.tieneInforme)     fuentes_activas.push('informe');

        if (analisis.fuentes.tieneEstudios)    fuentes_activas.push('estudios');

        if (analisis.fuentes.tienePopular)     fuentes_activas.push('participacion');

        if (analisis.fuentes.tieneDet)         fuentes_activas.push('determinantes');

        if (analisis.fuentes.tieneIndicadores) fuentes_activas.push('indicadores');

        fuentes_activas.push('marco'); // siempre presente



        // Conclusiones agrupadas por fuente_tipo

        var conclusiones_por_fuente = {};

        analisis.conclusiones.forEach(function(c) {

            var ft = c.fuente_tipo || 'marco';

            if (!conclusiones_por_fuente[ft]) conclusiones_por_fuente[ft] = [];

            conclusiones_por_fuente[ft].push(c.id);

        });



        // Recomendaciones agrupadas por conclusion_origen_id

        var recomendaciones_por_conclusion = {};

        analisis.recomendaciones.forEach(function(r) {

            var co = r.conclusion_origen_id || 'marco';

            if (!recomendaciones_por_conclusion[co]) recomendaciones_por_conclusion[co] = [];

            recomendaciones_por_conclusion[co].push(r.id);

        });



        // Líneas EPVSA propuestas por línea, con sus conclusiones de origen

        var propuesta_por_linea = {};

        analisis.propuestaEPVSA.forEach(function(p) {

            propuesta_por_linea['LE' + p.lineaId] = {

                relevancia:    p.relevancia,

                fuentes:       p.fuentes,

                conclusion_ids: p.conclusion_ids || []

            };

        });



        // Cadena completa: cada conclusión con sus recomendaciones y líneas EPVSA derivadas

        var cadena_completa = analisis.conclusiones.map(function(c) {

            return {

                conclusion_id:    c.id,

                fuente_tipo:      c.fuente_tipo || 'marco',

                recomendaciones:  recomendaciones_por_conclusion[c.id] || [],

                lineas_epvsa:     analisis.propuestaEPVSA

                    .filter(function(p){ return (p.conclusion_ids || []).indexOf(c.id) !== -1; })

                    .map(function(p){ return 'LE' + p.lineaId; })

            };

        });



        return {

            version:                       'COMPAS_trazabilidad_v1',

            fecha:                         new Date().toISOString(),

            fuentes_activas:               fuentes_activas,

            conclusiones_por_fuente:       conclusiones_por_fuente,

            recomendaciones_por_conclusion: recomendaciones_por_conclusion,

            propuesta_por_linea:           propuesta_por_linea,

            cadena_completa:               cadena_completa

        };

    })();



    return analisis;

}



// ── [UTILIDAD PURA] _adaptarAnalisisAFormatoUI ──────────────────────────────

// Sin DOM · Sin Firebase · Sin mutación de estado global. Recibe analisis, devuelve objeto UI.

// ── ADAPTADOR al formato UI (sin cambios estructurales) ───────────────

function _adaptarAnalisisAFormatoUI(analisis, fuentesUsadas) {

    var conclusiones = analisis.conclusiones.map(function(c) {

        var titulos = {

            marco_salutogenico:       'Marco salutogénico',

            determinantes_sociales:   'Determinantes sociales de la salud',

            epvsa_alineamiento:       'Alineamiento con EPVSA 2024-2030',

            principios_transversales: 'Principios transversales',

            informe_situacion:        'Informe de Situación de Salud',

            estudios_complementarios: 'Estudios complementarios',

            priorizacion_ciudadana:   'Priorización ciudadana',

            priorizacion_pendiente:   '⚠️ Priorización pendiente',

            fortalezas:               'Fortalezas identificadas (EAS)',

            oportunidades:            'Oportunidades de mejora (EAS)',

            tendencias:               'Tendencias de los indicadores'

        };

        return { titulo: titulos[c.id] || 'Conclusión', texto: c.texto };

    });



    var recomendaciones = analisis.recomendaciones.map(function(r) {

        var titulos = {

            mapeo_activos:        'Mapeo de activos para la salud',

            relas_gobernanza:     'RELAS como estructura de gobernanza',

            equidad_gradiente:    'Equidad y universalismo proporcional',

            evaluacion_participativa: 'Sistema de seguimiento y evaluación',

            rec_devolucion:       'Devolución a la ciudadanía',

            rec_estudios:         'Integración de estudios complementarios'

        };

        if (titulos[r.id]) return { titulo: titulos[r.id], texto: r.texto };

        if (r.id && r.id.startsWith('rec_popular_')) {

            var idx = parseInt(r.id.replace('rec_popular_',''));

            return { titulo: (idx === 0 ? '1ª' : idx === 1 ? '2ª' : '3ª') + ' prioridad ciudadana', texto: r.texto };

        }

        if (r.area) return { titulo: 'Intervención en ' + r.area, texto: r.texto };

        return { titulo: 'Recomendación', texto: r.texto };

    });



    var NOMBRES_LINEAS = {

        1:'1 — Estilos de vida saludable', 2:'2 — Entornos promotores de salud',

        3:'3 — Información y comunicación', 4:'4 — Formación e investigación',

        5:'5 — Coordinación y gobernanza'

    };

    var prioridades_epvsa = analisis.propuestaEPVSA.slice(0,5).map(function(p) {

        return {

            linea:        NOMBRES_LINEAS[p.lineaId] || ('Línea ' + p.lineaId),

            objetivo:     p.justificacion,

            justificacion:'Relevancia: ' + p.relevancia + '%' +

                          (p.origenCiudadano ? ' · 🗳️ Prioridad ciudadana' : ''),

            fuentes:      p.fuentes || (fuentesUsadas ? fuentesUsadas.join(' · ') : 'Análisis salutogénico')

        };

    });



    return {

        conclusiones, recomendaciones, prioridades_epvsa,

        _analisisCompleto: analisis

    };

}



// ── _generarAnalisisLocal: conservada por compatibilidad, redirige al motor v2 ──

function _generarAnalisisLocal(municipio, datos, pop, fuentesUsadas) {

    // Delegar completamente en el motor principal

    var analisis  = analizarDatosMunicipio();

    var resultado = _adaptarAnalisisAFormatoUI(analisis, fuentesUsadas);

    return resultado;

}







function generarAnalisisIA() {

    actualizarChecklistIA();

    renderizarSeccionPriorizacion();



    const datos = datosMunicipioActual || {};

    const municipio = getNombreMunicipio(getMunicipioActual()) || 'el municipio';



    // Construir contexto

    let contexto = 'MUNICIPIO: ' + municipio + '\n\n';

    let fuentesUsadas = [];



    if (datos.informe && datos.informe.htmlCompleto) {

        const texto = datos.informe.htmlCompleto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 8000);

        contexto += '=== INFORME DE SITUACIÓN DE SALUD ===\n' + texto + '\n\n';

        fuentesUsadas.push('Informe de Situación');

    }



    if (window.estudiosComplementarios && window.estudiosComplementarios.length) {

        window.estudiosComplementarios.forEach(e => {

            contexto += '=== ESTUDIO: ' + e.nombre + ' ===\n' + (e.texto || '').slice(0, 3000) + '\n\n';

        });

        fuentesUsadas.push('Estudios complementarios');

    }



    // Leer selección de fuentes de priorización (panel de checkboxes)

    var _selTematica = !document.getElementById('sel-fuente-tematica') || document.getElementById('sel-fuente-tematica').checked;

    var _selEpvsa    = !document.getElementById('sel-fuente-epvsa')    || document.getElementById('sel-fuente-epvsa').checked;

    var _selRelas    = !document.getElementById('sel-fuente-relas')    || document.getElementById('sel-fuente-relas').checked;



    // Priorización ciudadana: VRELAS (10 temas) o EPVSA (formato antiguo)

    // Nota: temática y EPVSA comparten la variable datosParticipacionCiudadana;

    // si ambas están desmarcadas, se excluye el bloque completo.

    var pop = (_selTematica || _selEpvsa) ? window.datosParticipacionCiudadana : null;

    if (pop) {

        var nPart = pop.totalParticipantes || pop.n || '?';

        var popTexto = 'Participantes en la priorización popular: ' + nPart + '\n\n';



        // ── Formato VRELAS (nueva votación 10 temas) — fuente principal ──

        var esVrelas = pop.fuente === 'votacion_relas' || !!pop.temasFreq;

        if (esVrelas && pop.temasFreq) {

            var sorted = Object.entries(pop.temasFreq)

                .map(function(e){ return { k: parseInt(e[0]), v: e[1] }; })

                .sort(function(a,b){ return b.v - a.v; });

            popTexto += 'TEMAS DE SALUD priorizados por la ciudadanía (votación popular VRELAS):\n';

            sorted.forEach(function(item, i) {

                var lbl = (typeof VRELAS_TEMAS !== 'undefined' && VRELAS_TEMAS[item.k]) || ('Tema ' + item.k);

                var pct = nPart !== '?' ? Math.round(item.v / nPart * 100) : '?';

                popTexto += '  ' + (i+1) + '. ' + lbl + ' — ' + item.v + ' votos (' + pct + '%)\n';

            });

            popTexto += '\nNOTA: Estos son los temas priorizados por la ciudadanía mediante votación. Deben ser el eje central de las conclusiones y prioridades.\n\n';

        } else {

        // ── Formato EPVSA legacy (solo si no hay VRELAS) ──

        if (pop.habFreq && Object.keys(pop.habFreq).length) {

            var topH = Object.entries(pop.habFreq).sort(function(a,b){return b[1]-a[1];}).slice(0,8);

            popTexto += 'HÁBITOS DE VIDA más señalados por la ciudadanía:\n' + topH.map(function(e){ return '  - ' + e[0] + ' (' + e[1] + ' menciones)'; }).join('\n') + '\n\n';

        }

        if (pop.probFreq && Object.keys(pop.probFreq).length) {

            var topP = Object.entries(pop.probFreq).sort(function(a,b){return b[1]-a[1];}).slice(0,8);

            popTexto += 'PROBLEMAS DE SALUD más señalados por la ciudadanía:\n' + topP.map(function(e){ return '  - ' + e[0] + ' (' + e[1] + ' menciones)'; }).join('\n') + '\n\n';

        }

        if (pop.colFreq && Object.keys(pop.colFreq).length) {

            var topC = Object.entries(pop.colFreq).sort(function(a,b){return b[1]-a[1];}).slice(0,5);

            popTexto += 'COLECTIVOS prioritarios según la ciudadanía:\n' + topC.map(function(e){ return '  - ' + e[0] + ' (' + e[1] + ' menciones)'; }).join('\n') + '\n\n';

        }

        } // fin else legacy



        contexto += '=== PRIORIZACIÓN POPULAR (ciudadanía) ===\n' + popTexto;

        fuentesUsadas.push('Priorización popular (' + nPart + ' participantes)');

    }



    // ── RELAS: Hábitos, Problemas y Colectivos ──────────────────────────

    if (_selRelas && typeof relas_globalData !== 'undefined' && relas_globalData && relas_globalData._habFreq) {

        var _rn = relas_globalData._n || '?';

        var _rTexto = 'Participantes en el diagnóstico RELAS: ' + _rn + '\n\n';

        // Top hábitos

        var _topHab = Object.entries(relas_globalData._habFreq).sort(function(a,b){return b[1]-a[1];}).slice(0,4);

        if (_topHab.length) {

            _rTexto += 'HÁBITOS DE VIDA prioritarios (diagnóstico RELAS):\n';

            _topHab.forEach(function(e, i) {

                var lbl = (typeof RELAS_HABITOS !== 'undefined' && RELAS_HABITOS[e[0]]) || ('Hábito ' + e[0]);

                var pct = _rn !== '?' ? Math.round(e[1] / _rn * 100) : '?';

                _rTexto += '  ' + (i+1) + '. ' + lbl + ' — ' + e[1] + ' menciones (' + pct + '%)\n';

            });

            _rTexto += '\n';

        }

        // Top problemas

        var _topProb = Object.entries(relas_globalData._probFreq).sort(function(a,b){return b[1]-a[1];}).slice(0,4);

        if (_topProb.length) {

            _rTexto += 'PROBLEMAS DE SALUD prioritarios (diagnóstico RELAS):\n';

            _topProb.forEach(function(e, i) {

                var lbl = (typeof RELAS_PROBLEMAS !== 'undefined' && RELAS_PROBLEMAS[e[0]]) || ('Problema ' + e[0]);

                var pct = _rn !== '?' ? Math.round(e[1] / _rn * 100) : '?';

                _rTexto += '  ' + (i+1) + '. ' + lbl + ' — ' + e[1] + ' menciones (' + pct + '%)\n';

            });

            _rTexto += '\n';

        }

        // Top colectivos

        var _topCol = Object.entries(relas_globalData._colFreq).sort(function(a,b){return b[1]-a[1];}).slice(0,3);

        if (_topCol.length) {

            _rTexto += 'COLECTIVOS PRIORITARIOS (diagnóstico RELAS):\n';

            _topCol.forEach(function(e, i) {

                var lbl = (typeof RELAS_COLECTIVOS !== 'undefined' && RELAS_COLECTIVOS[e[0]]) || ('Colectivo ' + e[0]);

                _rTexto += '  ' + (i+1) + '. ' + lbl + ' — ' + e[1] + ' menciones\n';

            });

            _rTexto += '\n';

        }

        contexto += '=== DIAGNÓSTICO RELAS (hábitos, problemas y colectivos) ===\n' + _rTexto;

        fuentesUsadas.push('Priorización Mixta (' + _rn + ' participantes)');

    }



    // Determinantes EAS

    if (_contarDeterminantesValidos(datos.determinantes) > 0) {

        var detTexto = 'DETERMINANTES DE SALUD (Encuesta Andaluza de Salud):\n';

        Object.entries(_filtrarDeterminantesValidos(datos.determinantes)).forEach(function(e) {

            var codigo = e[0], data = e[1];

            var valor = typeof data === 'object' ? data.valor : data;

            if (valor !== null && valor !== undefined && valor !== '') {

                detTexto += '  ' + codigo + ': ' + valor + '\n';

            }

        });

        contexto += '=== DETERMINANTES EAS ===\n' + detTexto + '\n';

        fuentesUsadas.push('Determinantes EAS');

    }



    // Indicadores del cuadro de mandos

    if (_contarIndicadoresValidos(datos.indicadores) > 0) {

        var indTexto = 'INDICADORES DE SALUD (Cuadro de Mandos):\n';

        Object.entries(_filtrarIndicadoresValidos(datos.indicadores)).forEach(function(e) {

            var num = e[0], data = e[1];

            var valor = (data && (data.dato || data.valor)) || '';

            if (valor !== '') {

                indTexto += '  Indicador ' + num + ': ' + valor + '\n';

            }

        });

        contexto += '=== INDICADORES DE SALUD ===\n' + indTexto + '\n';

        fuentesUsadas.push('Indicadores de salud');

    }



    if (!fuentesUsadas.length) {

        alert('⚠️ No hay ninguna fuente cargada. Carga al menos el Informe de Situación de Salud.');

        return;

    }



    // UI: mostrar progreso

    document.getElementById('ia-estado-inicial').style.display = 'none';

    document.getElementById('ia-resultado').style.display = 'none';

    document.getElementById('ia-progreso').style.display = 'block';

    document.getElementById('ia-progreso-texto').textContent = 'Analizando ' + fuentesUsadas.join(', ') + '...';



    // Motor salutogénico — sin API

    setTimeout(async function() {

        try {

            // Motor modular con fallback al motor heredado si falla o aún no está disponible.

            // Ver: ACTIVACION_MOTOR_SINTESIS.md

            var analisis = window.__COMPAS_ejecutarMotorSintesis

                ? await window.__COMPAS_ejecutarMotorSintesis()

                : (function() {

                    var a = analizarDatosMunicipio();

                    if (typeof ejecutarMotorExpertoCOMPAS === 'function') a = ejecutarMotorExpertoCOMPAS(a);

                    if (a && !a.sinDatos) window.analisisActual = a;

                    return a;

                  })();



            // Adaptar al formato UI

            var resultado = _adaptarAnalisisAFormatoUI(analisis, fuentesUsadas);



            // Guardar en Firebase

            // [AUDIT] Este guardado ocurre dentro del setTimeout(400ms) de generarAnalisisIA,

            // ANTES de que el hook del motor v3 se ejecute (900ms después).

            // Por tanto, analisis.propuestaEPVSA puede persistirse en /analisisIA con lineaId fuera de

            // rango (6, 7, 8, 9) si _TEMA_A_EPVSA los generó y el v3 no ha corrido aún.

            // Tener en cuenta antes de refactorizar la capa de persistencia.

            const municipioId = getMunicipioActual();

            if (municipioId && typeof db !== 'undefined') {

                // Guardar versión simplificada (sin _analisisCompleto para evitar referencias circulares)

                var paraFirebase = {

                    conclusiones: resultado.conclusiones,

                    recomendaciones: resultado.recomendaciones,

                    prioridades_epvsa: resultado.prioridades_epvsa,

                    fechaGeneracion: new Date().toISOString(),

                    fuentes: fuentesUsadas,

                    // Datos clave del análisis salutogénico

                    fortalezas: analisis.fortalezas.slice(0,10),

                    oportunidades: analisis.oportunidades.slice(0,10),

                    alertasInequidad: analisis.alertasInequidad,

                    perfilSOC: analisis.perfilSOC,

                    patronesTransversales: analisis.patronesTransversales,

                    propuestaEPVSA: analisis.propuestaEPVSA,

                    priorizacion: analisis.priorizacion,

                    narrativa: analisis.narrativa

                };

                db.ref('estrategias/' + estrategiaActual + '/municipios/' + municipioId + '/analisisIA').set(paraFirebase);

            }



            renderizarResultadoIA(resultado);



        } catch(err) {

            document.getElementById('ia-progreso').style.display = 'none';

            document.getElementById('ia-estado-inicial').style.display = 'block';

            console.error('Error generarAnalisisIA:', err);

            alert('❌ Error al generar el análisis:\n' + err.message);

        }

    }, 400);

}



function regenerarAnalisisIA() {

    document.getElementById('ia-resultado').style.display = 'none';

    document.getElementById('ia-estado-inicial').style.display = 'block';

    actualizarChecklistIA();

}



// ═════════════════════════════════════════════════════════════════════

// ── [UTILIDAD CASI PURA] _calcularICP ───────────────────────────────────────

// Sin DOM · Sin Firebase · Lee globals: window.datosParticipacionCiudadana, relas_globalData

// No muta estado global. Devuelve objeto ICP por línea EPVSA.

// ÍNDICE COMBINADO DE PRIORIZACIÓN (ICP)

// ICP = wT·PT + wE·PE + wR·PR   (pesos auto-redistribuidos si faltan fuentes)

// ═════════════════════════════════════════════════════════════════════

function _calcularICP(analisis) {

    var tienePE = !!(analisis && analisis.propuestaEPVSA && analisis.propuestaEPVSA.length);

    var tienePT = !!(window.datosParticipacionCiudadana);

    var tienePR = !!(typeof relas_globalData !== 'undefined' && relas_globalData && relas_globalData._habFreq);



    // Pesos base: wT=0.4 wE=0.4 wR=0.2 — redistribuidos si falta alguna fuente

    var _wE = tienePE ? 0.4 : 0, _wT = tienePT ? 0.4 : 0, _wR = tienePR ? 0.2 : 0;

    var _tot = _wE + _wT + _wR || 1;

    var wE = _wE / _tot, wT = _wT / _tot, wR = _wR / _tot;



    // PE por línea EPVSA (motor salutogénico — relevancia 0-100 → 0-1)

    var peMap = {1:0,2:0,3:0,4:0};

    if (tienePE) {

        var maxRel = Math.max.apply(null, analisis.propuestaEPVSA.map(function(p){ return p.relevancia||0; })) || 1;

        analisis.propuestaEPVSA.forEach(function(p) { peMap[p.lineaId] = (p.relevancia||0) / maxRel; });

    }



    // PT por línea EPVSA (priorización temática VRELAS → mapeo aproximado)

    var ptMap = {1:0,2:0,3:0,4:0};

    var pNorm = null;

    if (tienePT && typeof normalizarParticipacion === 'function') {

        pNorm = normalizarParticipacion(window.datosParticipacionCiudadana);

        // Mapeo VRELAS temas (1-10) → líneas EPVSA

        var V2LE = {1:[1],2:[1],3:[1,2],4:[1],5:[3],6:[1],7:[1],8:[2],9:[1],10:[1]};

        var ptRaw = {1:0,2:0,3:0,4:0};

        (pNorm.rankingObjetivos || []).forEach(function(item) {

            var ls = V2LE[item.id] || [1];

            ls.forEach(function(l) { ptRaw[l] += (item.votos||0) / ls.length; });

        });

        var maxPt = Math.max.apply(null, Object.values(ptRaw)) || 1;

        Object.keys(ptRaw).forEach(function(l) { ptMap[+l] = ptRaw[l] / maxPt; });

    }



    // PR por línea EPVSA (diagnóstico RELAS hábitos + problemas → mapeo aproximado)

    var prMap = {1:0,2:0,3:0,4:0};

    if (tienePR) {

        var H2LE = {1:[1],2:[1],3:[2],4:[1],5:[3],6:[1]};

        var P2LE = {1:[1],2:[1],3:[2],4:[1],5:[2],6:[1],7:[2],8:[1]};

        var prRaw = {1:0,2:0,3:0,4:0};

        Object.entries(relas_globalData._habFreq||{}).forEach(function(e){ var ls=H2LE[e[0]]||[1]; ls.forEach(function(l){ prRaw[l]+=(+e[1]||0)/ls.length; }); });

        Object.entries(relas_globalData._probFreq||{}).forEach(function(e){ var ls=P2LE[e[0]]||[1]; ls.forEach(function(l){ prRaw[l]+=(+e[1]||0)/ls.length; }); });

        var maxPr = Math.max.apply(null, Object.values(prRaw)) || 1;

        Object.keys(prRaw).forEach(function(l) { prMap[+l] = prRaw[l] / maxPr; });

    }



    var NOMS = {1:'Estilos de vida saludable',2:'Entornos promotores de salud',3:'Información y comunicación',4:'Formación e investigación'};

    var ICOS = {1:'🌿',2:'🏘️',3:'📡',4:'🎓'};

    var CODS = {1:'LE1',2:'LE2',3:'LE3',4:'LE4'};

    var ACTS = {1:'Programas de promoción de hábitos saludables',2:'Intervenciones en entornos y movilidad',3:'Campañas de comunicación y educación para la salud',4:'Formación de profesionales y comunidad'};



    var lineas = [1,2,3,4].map(function(lid) {

        var pe=peMap[lid]||0, pt=ptMap[lid]||0, pr=prMap[lid]||0;

        var icp = Math.min(1, Math.max(0, wE*pe + wT*pt + wR*pr));

        var nivel,nc,nb,nbord;

        if      (icp>=0.8){ nivel='Muy alta'; nc='#166534'; nb='#dcfce7'; nbord='#86efac'; }

        else if (icp>=0.6){ nivel='Alta';     nc='#1d4ed8'; nb='#dbeafe'; nbord='#93c5fd'; }

        else if (icp>=0.4){ nivel='Media';    nc='#854d0e'; nb='#fef9c3'; nbord='#fde68a'; }

        else              { nivel='Baja';     nc='#64748b'; nb='#f8fafc'; nbord='#e2e8f0'; }

        return { lineaId:lid, nombre:NOMS[lid], icono:ICOS[lid], cod:CODS[lid], actuacion:ACTS[lid],

                 icp:icp, pe:pe, pt:pt, pr:pr, nivel:nivel, nc:nc, nb:nb, nbord:nbord };

    }).sort(function(a,b){ return b.icp-a.icp; });



    // Colectivos: RELAS (preferente) > EPVSA legacy

    var RCOL = {1:'Madres/Padres',2:'Jóvenes',3:'Mayores +65',4:'Personas cuidadoras',5:'Colectivos ciudadanos',6:'Otros'};

    var colectivos = [];

    if (tienePR && relas_globalData._colFreq) {

        var nR = relas_globalData._n || 1;

        colectivos = Object.entries(relas_globalData._colFreq).filter(function(e){ return +e[1]>0; })

            .sort(function(a,b){ return b[1]-a[1]; }).slice(0,6)

            .map(function(e){ return {nombre:RCOL[e[0]]||('Col.'+e[0]), pct:Math.round(+e[1]/nR*100), fuente:'RELAS'}; });

    } else if (pNorm && pNorm.colectivoPrioritario) {

        colectivos = [{nombre:pNorm.colectivoPrioritario.texto, pct:pNorm.colectivoPrioritario.porcentaje||null, fuente:'Temática'}];

    }



    return { lineas:lineas, colectivos:colectivos, pNorm:pNorm,

             tienePE:tienePE, tienePT:tienePT, tienePR:tienePR,

             wE:Math.round(wE*100), wT:Math.round(wT*100), wR:Math.round(wR*100) };

}



// ═════════════════════════════════════════════════════════════════════

// RENDERIZADO VISUAL DEL RESULTADO IA

// ═════════════════════════════════════════════════════════════════════

function renderizarResultadoIA(r) {

    document.getElementById('ia-progreso').style.display = 'none';

    document.getElementById('ia-resultado').style.display = 'block';

    document.getElementById('ia-fecha-generacion').textContent = 'Generado: ' + new Date().toLocaleString('es-ES');



    var analisis = r._analisisCompleto || window.analisisActual;



    // ── ia-conclusiones: Perfil SOC + Narrativa salutogénica (sin cambios) ──

    var elConc = document.getElementById('ia-conclusiones');

    if (analisis && analisis.narrativa && analisis.narrativa.contexto) {

        var n = analisis.narrativa;

        var htmlNar = '';

        if (analisis.perfilSOC && analisis.perfilSOC.global) {

            var soc = analisis.perfilSOC;

            var colSOC = soc.global.nivel==='alto'?'#166534':soc.global.nivel==='medio'?'#854d0e':'#991b1b';

            var bgSOC  = soc.global.nivel==='alto'?'#dcfce7':soc.global.nivel==='medio'?'#fef9c3':'#fee2e2';

            htmlNar += '<div style="margin-bottom:1rem;padding:1rem;background:'+bgSOC+';border-radius:10px;border:1px solid '+colSOC+'40">' +

                '<div style="font-size:0.75rem;font-weight:700;color:'+colSOC+';text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem">📐 Perfil de Sentido de Coherencia (Antonovsky)</div>' +

                '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-bottom:.5rem">' +

                ['comprensibilidad','manejabilidad','significatividad'].map(function(dim) {

                    var d=soc[dim], lbl=dim==='comprensibilidad'?'Comprensibilidad':dim==='manejabilidad'?'Manejabilidad':'Significatividad';

                    var c=d.nivel==='alto'?'#166534':d.nivel==='medio'?'#854d0e':'#991b1b';

                    var bg=d.nivel==='alto'?'#dcfce7':d.nivel==='medio'?'#fef9c3':'#fee2e2';

                    return '<div style="text-align:center;padding:.4rem;background:'+bg+';border-radius:6px"><div style="font-size:1.4rem;font-weight:900;color:'+c+'">'+d.puntuacion+'</div><div style="font-size:0.62rem;color:'+c+';font-weight:600">'+lbl+'</div><div style="font-size:0.58rem;color:#64748b">'+d.interpretacion+'</div></div>';

                }).join('')+'</div>'+

                '<div style="font-size:0.8rem;color:'+colSOC+';font-weight:600">Global: '+soc.global.puntuacion+'/100 — '+soc.global.interpretacion+'</div></div>';

        }

        if (analisis.alertasInequidad && analisis.alertasInequidad.length) {

            htmlNar += '<div style="margin-bottom:1rem;padding:.8rem 1rem;background:#fff7ed;border:1px solid #fdba74;border-radius:8px"><div style="font-size:0.75rem;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.4rem">⚠️ Alertas de inequidad detectadas</div>'+

                analisis.alertasInequidad.map(function(al){ return '<div style="font-size:0.82rem;color:#9a3412;margin-bottom:.2rem">• <strong>'+al.mensaje+'</strong>: '+al.valor.toFixed(1)+'% (umbral: '+al.umbral+'%) — Severidad: '+al.severidad+'</div>'; }).join('')+'</div>';

        }

        htmlNar += '<div style="padding:.9rem 1rem;background:#eff6ff;border-left:3px solid #3b82f6;border-radius:0 8px 8px 0;margin-bottom:.5rem"><strong style="font-size:0.82rem;color:#1d4ed8">📖 Contexto del análisis</strong><p style="margin:.3rem 0 0;font-size:0.87rem;color:#1e293b;line-height:1.55">'+n.contexto+'</p></div>';

        if (analisis.fortalezas && analisis.fortalezas.length) {

            htmlNar += '<div style="padding:.9rem 1rem;background:#f0fdf4;border-left:3px solid #22c55e;border-radius:0 8px 8px 0;margin-bottom:.5rem"><strong style="font-size:0.82rem;color:#166534">💪 Activos y fortalezas</strong><p style="margin:.3rem 0 0;font-size:0.87rem;color:#1e293b;line-height:1.55">'+n.activos+'</p><div style="margin-top:.5rem;display:flex;flex-wrap:wrap;gap:.3rem">'+analisis.fortalezas.slice(0,6).map(function(f){ return '<span style="background:#dcfce7;color:#166534;padding:.15rem .5rem;border-radius:10px;font-size:0.7rem">'+f.area+': '+f.texto.slice(0,35)+'…</span>'; }).join('')+'</div></div>';

        }

        if (analisis.oportunidades && analisis.oportunidades.length) {

            htmlNar += '<div style="padding:.9rem 1rem;background:#fef9c3;border-left:3px solid #eab308;border-radius:0 8px 8px 0;margin-bottom:.5rem"><strong style="font-size:0.82rem;color:#854d0e">🎯 Oportunidades de mejora</strong><p style="margin:.3rem 0 0;font-size:0.87rem;color:#1e293b;line-height:1.55">'+n.oportunidades+'</p><div style="margin-top:.5rem;display:flex;flex-wrap:wrap;gap:.3rem">'+analisis.oportunidades.slice(0,6).map(function(o){ return '<span style="background:#fef08a;color:#854d0e;padding:.15rem .5rem;border-radius:10px;font-size:0.7rem">'+o.area+': '+o.texto.slice(0,35)+'…</span>'; }).join('')+'</div></div>';

        }

        if (analisis.patronesTransversales && analisis.patronesTransversales.length) {

            htmlNar += '<div style="padding:.9rem 1rem;background:#f5f3ff;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;margin-bottom:.5rem"><strong style="font-size:0.82rem;color:#6d28d9">🔗 Patrones transversales detectados</strong>'+analisis.patronesTransversales.map(function(p){ var col=p.tipo==='fortaleza'?'#166534':p.tipo==='oportunidad'?'#854d0e':'#6d28d9'; return '<div style="margin:.4rem 0"><span style="font-size:0.75rem;font-weight:700;color:'+col+'">'+p.nombre+'</span> <span style="font-size:0.78rem;color:#1e293b">— '+p.narrativa+'</span></div>'; }).join('')+'</div>';

        }

        htmlNar += '<div style="padding:.9rem 1rem;background:#f8fafc;border-left:3px solid #0074c8;border-radius:0 8px 8px 0;margin-bottom:.5rem"><strong style="font-size:0.82rem;color:#0074c8">📋 Síntesis salutogénica</strong><p style="margin:.3rem 0 0;font-size:0.87rem;color:#1e293b;line-height:1.55">'+n.sintesis+'</p></div>';

        elConc.innerHTML = htmlNar;

    } else {

        elConc.innerHTML = '<div class="conclusion-grid">' + (r.conclusiones||[]).map(function(c,i){
        var num = String(i+1).padStart(2,'0');
        var titulo = c.titulo || c.texto || '';
        var interp = c.interpretacion || '';
        var base = c.base_analitica || '';
        var opor = c.oportunidad_accion || '';
        var textoLegacy = (!interp && !base && !opor) ? (c.texto || '') : '';
        return '<div class="conclusion-card">' +
            '<h4>'+num+'</h4><div class="tipo">Conclusión</div>' +
            (titulo ? '<p style="font-weight:600;color:#1e293b;margin:.4rem 0 0;">'+titulo+'</p>' : '') +
            (interp ? '<div class="concl-sal-field"><div class="concl-sal-field-label">📖 Interpretación</div><p class="concl-sal-field-text">'+interp+'</p></div>' : '') +
            (base   ? '<div class="concl-sal-field"><div class="concl-sal-field-label">📐 Base analítica</div><p class="concl-sal-field-text">'+base+'</p></div>' : '') +
            (opor   ? '<div class="concl-sal-field"><div class="concl-sal-field-label">🎯 Oportunidad de acción local</div><p class="concl-sal-field-text">'+opor+'</p></div>' : '') +
            (textoLegacy && !titulo ? '<p>'+textoLegacy+'</p>' : '') +
            '</div>';
    }).join('') + '</div>';

    }



    // ── ia-recomendaciones: BLOQUE 4 — Recomendaciones estratégicas en tarjetas ──

    var elRec = document.getElementById('ia-recomendaciones');

    var REC_ICOS = { mapeo_activos:'🗺️', relas_gobernanza:'🏛️', equidad_gradiente:'⚖️', evaluacion_participativa:'📊', rec_devolucion:'🗳️', rec_estudios:'🔬' };

    var REC_C = [{bg:'#eff6ff',bd:'#0074c8',ct:'#1e40af'},{bg:'#f0fdf4',bd:'#22c55e',ct:'#166534'},{bg:'#fff7ed',bd:'#f59e0b',ct:'#92400e'},{bg:'#faf5ff',bd:'#7c3aed',ct:'#6d28d9'},{bg:'#fef9ee',bd:'#ffb61b',ct:'#b45309'},{bg:'#fff1f2',bd:'#f43f5e',ct:'#be123c'}];

        elRec.innerHTML = '<div class="recom-sal-grid">' +
        (r.recomendaciones||[]).map(function(rec,i){
            var c=REC_C[i%REC_C.length], ico=REC_ICOS[rec.id]||'💡';
            var orientacion = rec.orientacion || rec.titulo || '';
            var activo = rec.activo || rec.activo_capacidad || '';
            var lineaAccion = rec.linea_accion_municipal || rec.linea_accion || '';
            var textoLegacy = (!activo && !lineaAccion && rec.texto) ? rec.texto : '';
            return '<div class="recom-sal-card" style="border-top-color:'+c.bd+'">' +
                '<div style="display:flex;align-items:flex-start;gap:0.5rem;margin-bottom:0.5rem;">' +
                  '<span style="font-size:1.1rem;flex-shrink:0;">'+ico+'</span>' +
                  '<p class="recom-sal-orientacion" style="color:'+c.ct+'">'+orientacion+'</p>' +
                '</div>' +
                (activo ? '<div class="recom-sal-field"><div class="recom-sal-field-label">💪 Activo o capacidad relacionada</div><p class="recom-sal-field-text">'+activo+'</p></div>' : '') +
                (lineaAccion ? '<div class="recom-sal-field"><div class="recom-sal-field-label">🏛️ Posible línea de acción municipal</div><p class="recom-sal-field-text">'+lineaAccion+'</p></div>' : '') +
                (textoLegacy ? '<p style="margin:.4rem 0 0;font-size:0.78rem;color:#475569;line-height:1.5;">'+textoLegacy.slice(0,280)+(textoLegacy.length>280?'…':'')+'</p>' : '') +
                '</div>';
        }).join('') + '</div>';



    // ── ia-prioridades: BLOQUES 1–5 + ICP + METODOLOGÍA ──────────────

    var elPri = document.getElementById('ia-prioridades');

    var icp = _calcularICP(analisis);



    function _bar(v, col) {

        return '<div style="height:5px;background:#e2e8f0;border-radius:3px;overflow:hidden;margin-top:3px"><div style="height:100%;width:'+Math.round(v*100)+'%;background:'+col+';border-radius:3px;"></div></div>';

    }



    var priHTML = '';



    // ── METODOLOGÍA (desplegable, justo antes de Bloque 1) ─────────────

    priHTML += '<details style="margin-bottom:1.25rem;background:#f0f9ff;border:1px solid #bfdbfe;border-radius:10px;padding:0.7rem 1rem;">' +

        '<summary style="cursor:pointer;font-size:0.82rem;font-weight:700;color:#1d4ed8;user-select:none;list-style:none;">ℹ️ Metodología del Índice Combinado de Priorización (ICP)</summary>' +

        '<div style="margin-top:0.85rem;font-size:0.78rem;color:#334155;line-height:1.6;">' +

        '<div style="font-family:monospace;background:#dbeafe;border-radius:6px;padding:0.5rem 0.85rem;margin-bottom:0.75rem;font-size:0.8rem;color:#1e40af;letter-spacing:.02em;">ICP = wT · PT + wE · PE + wR · PR</div>' +

        '<strong style="color:#1e293b;">Fuentes integradas en este análisis:</strong><br>' +

        (icp.tienePT ? '✅ <strong>PT — Priorización temática</strong> (ciudadanía): peso wT = '+icp.wT+'%' : '⬜ PT — Sin datos de priorización temática') + '<br>' +

        (icp.tienePE ? '✅ <strong>PE — Motor salutogénico EPVSA</strong>: peso wE = '+icp.wE+'%' : '⬜ PE — Sin propuesta EPVSA') + '<br>' +

        (icp.tienePR ? '✅ <strong>PR — Priorización Mixta</strong> (hábitos y problemas): peso wR = '+icp.wR+'%' : '⬜ PR — Sin datos RELAS') + '<br><br>' +

        '<strong>Normalización:</strong> Cada fuente se normaliza a [0,1] antes de ponderar. Si falta una fuente, sus pesos se redistribuyen proporcionalmente entre las disponibles (suma siempre = 1).<br><br>' +

        '<strong>Mapeos entre espacios de datos:</strong> Los temas VRELAS y los factores RELAS se asignan a líneas EPVSA mediante un mapeo semántico aproximado (temático → LE1, entornos → LE2, TRICs → LE3). Esta asignación es orientativa.<br><br>' +

        '<strong>Escala de interpretación:</strong><br>' +

        '<span style="color:#166534;">🟢 0.80–1.00</span> Muy alta · ' +

        '<span style="color:#1d4ed8;">🔵 0.60–0.80</span> Alta · ' +

        '<span style="color:#854d0e;">🟡 0.40–0.60</span> Media · ' +

        '<span style="color:#64748b;">⚪ &lt;0.40</span> Baja<br><br>' +

        '<strong>Limitaciones metodológicas:</strong> El ICP resume la convergencia entre fuentes, no la establece causalmente. Los pesos son orientativos. No sustituye el análisis cualitativo del equipo técnico.' +

        '</div></details>';



    // ── BLOQUE 1: PANORAMA DE PRIORIDADES (relegado — detalle ICP) ─────
    priHTML += '<details style="margin-bottom:1.25rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:0.7rem 1rem;">' +
        '<summary style="cursor:pointer;font-size:0.82rem;font-weight:700;color:#64748b;user-select:none;list-style:none;">📊 Ver puntuaciones ICP por línea (detalle metodológico)</summary>' +
        '<div style="margin-top:0.85rem;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.55rem;">';
    icp.lineas.forEach(function(le) {
        var pct = Math.round(le.icp * 100);
        priHTML += '<div style="background:'+le.nb+';border:1px solid '+le.nbord+'80;border-radius:8px;padding:0.65rem 0.8rem;">' +
            '<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.3rem;">' +
              '<span style="font-size:0.9rem;">'+le.icono+'</span>' +
              '<strong style="font-size:0.7rem;color:'+le.nc+';text-transform:uppercase;">'+le.cod+'</strong>' +
              '<span style="margin-left:auto;background:'+le.nc+';color:white;font-size:0.55rem;font-weight:700;padding:.1rem .3rem;border-radius:4px;">'+le.nivel.toUpperCase()+'</span>' +
            '</div>' +
            '<div style="font-size:0.7rem;color:#1e293b;line-height:1.3;margin-bottom:0.3rem;">'+le.nombre+'</div>' +
            '<div style="font-size:0.78rem;font-weight:700;color:'+le.nc+';">ICP: '+pct+'/100</div>' +
            _bar(le.icp, le.nc) +
            '</div>';
    });
    priHTML += '</div></div></details>';

        // ── BLOQUE 2: MATRIZ DE CONVERGENCIA (colapsada por defecto) ──────
    priHTML += '<details style="margin-bottom:1.5rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:0.7rem 1rem;">' +
        '<summary style="cursor:pointer;font-size:0.82rem;font-weight:700;color:#64748b;user-select:none;list-style:none;">📋 Ver matriz de convergencia entre fuentes</summary>' +
        '<div style="margin-top:0.85rem;"><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:0.76rem;">' +

        '<thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">' +

        '<th style="text-align:left;padding:.5rem .75rem;color:#64748b;font-weight:600;min-width:120px;">Línea EPVSA</th>' +

        (icp.tienePT ? '<th style="text-align:center;padding:.5rem .5rem;color:#0074c8;font-weight:600;">🗳️ Temática<br><span style="font-size:.62rem;font-weight:400;color:#94a3b8;">wT='+icp.wT+'%</span></th>' : '') +

        (icp.tienePE ? '<th style="text-align:center;padding:.5rem .5rem;color:#7c3aed;font-weight:600;">🎯 EPVSA<br><span style="font-size:.62rem;font-weight:400;color:#94a3b8;">wE='+icp.wE+'%</span></th>' : '') +

        (icp.tienePR ? '<th style="text-align:center;padding:.5rem .5rem;color:#2d6a4f;font-weight:600;">🔍 RELAS<br><span style="font-size:.62rem;font-weight:400;color:#94a3b8;">wR='+icp.wR+'%</span></th>' : '') +

        '<th style="text-align:center;padding:.5rem .5rem;color:#1e293b;font-weight:700;border-left:2px solid #e2e8f0;">ICP</th>' +

        '</tr></thead><tbody>';

    icp.lineas.forEach(function(le, idx) {

        var rowBg = idx % 2 === 0 ? 'white' : '#f8fafc';

        priHTML += '<tr style="background:'+rowBg+';border-bottom:1px solid #f1f5f9;">' +

            '<td style="padding:.45rem .75rem;"><strong style="color:'+le.nc+'">'+le.icono+' '+le.cod+'</strong><br><span style="color:#64748b;font-size:0.7rem;">'+le.nombre+'</span></td>';

        if (icp.tienePT) priHTML += '<td style="padding:.45rem .5rem;text-align:center;"><div style="font-weight:700;color:#0074c8;">'+Math.round(le.pt*100)+'</div>'+_bar(le.pt,'#0074c8')+'</td>';

        if (icp.tienePE) priHTML += '<td style="padding:.45rem .5rem;text-align:center;"><div style="font-weight:700;color:#7c3aed;">'+Math.round(le.pe*100)+'</div>'+_bar(le.pe,'#7c3aed')+'</td>';

        if (icp.tienePR) priHTML += '<td style="padding:.45rem .5rem;text-align:center;"><div style="font-weight:700;color:#2d6a4f;">'+Math.round(le.pr*100)+'</div>'+_bar(le.pr,'#2d6a4f')+'</td>';

        priHTML += '<td style="padding:.45rem .5rem;text-align:center;border-left:2px solid #e2e8f0;"><div style="font-weight:900;color:'+le.nc+';font-size:1rem;">'+Math.round(le.icp*100)+'</div><div style="font-size:0.58rem;font-weight:700;color:'+le.nc+';">'+le.nivel+'</div></td></tr>';

    });

    priHTML += '</tbody></table></div></div></details>';



    // ── BLOQUE 3: COLECTIVOS PRIORITARIOS ──────────────────────────────

    if (icp.colectivos && icp.colectivos.length) {

        var CHIP_C = [{bg:'#e0f2fe',ct:'#0369a1'},{bg:'#dcfce7',ct:'#166534'},{bg:'#fef9c3',ct:'#854d0e'},{bg:'#ede9fe',ct:'#6d28d9'},{bg:'#fff7ed',ct:'#c2410c'},{bg:'#fee2e2',ct:'#991b1b'}];

        priHTML += '<div style="margin-bottom:1.5rem;">' +

            '<h4 style="margin:0 0 0.75rem;color:#1e293b;font-size:0.9rem;font-weight:700;">👥 Colectivos prioritarios identificados</h4>' +

            '<div style="display:flex;flex-wrap:wrap;gap:0.5rem;">';

        icp.colectivos.forEach(function(col, i) {

            var c = CHIP_C[i % CHIP_C.length];

            priHTML += '<div style="background:'+c.bg+';color:'+c.ct+';border-radius:20px;padding:.35rem .9rem;font-size:0.8rem;font-weight:600;display:flex;align-items:center;gap:.35rem;">'+

                col.nombre +

                (col.pct ? '<span style="font-size:.68rem;opacity:.8;">· '+col.pct+'%</span>' : '') +

                '<span style="font-size:.6rem;opacity:.6;">['+col.fuente+']</span></div>';

        });

        priHTML += '</div></div>';

    }



    // ── BLOQUE 5: TRADUCCIÓN OPERATIVA → Plan de acción ────────────────

    priHTML += '<div>' +

        '<h4 style="margin:0 0 0.75rem;color:#1e293b;font-size:0.9rem;font-weight:700;">🔗 Traducción operativa — puente hacia el Plan de acción</h4>' +

        '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:0.75rem;">' +

        '<thead><tr style="background:linear-gradient(135deg,#0074c8,#00acd9);color:white;">' +

        '<th style="padding:.5rem .75rem;text-align:left;font-weight:600;">ICP</th>' +

        '<th style="padding:.5rem .75rem;text-align:left;font-weight:600;">Prioridad</th>' +

        '<th style="padding:.5rem .75rem;text-align:left;font-weight:600;">Tipo de actuación orientativa</th>' +

        '<th style="padding:.5rem .75rem;text-align:left;font-weight:600;">Colectivo</th>' +

        '</tr></thead><tbody>';

    icp.lineas.slice(0,4).forEach(function(le, i) {

        var rowBg = i%2===0 ? '#f8fafc' : 'white';

        var colN = (icp.colectivos[i] && icp.colectivos[i].nombre) || (icp.pNorm && icp.pNorm.colectivoPrioritario && icp.pNorm.colectivoPrioritario.texto) || 'Población general';

        priHTML += '<tr style="background:'+rowBg+';border-bottom:1px solid #e2e8f0;">' +

            '<td style="padding:.45rem .75rem;"><strong style="color:'+le.nc+';font-size:1rem;">'+Math.round(le.icp*100)+'</strong></td>' +

            '<td style="padding:.45rem .75rem;"><strong style="color:'+le.nc+'">'+le.icono+' '+le.cod+'</strong><br><span style="color:#64748b;font-size:0.7rem;">'+le.nombre+'</span></td>' +

            '<td style="padding:.45rem .75rem;color:#475569;">'+le.actuacion+'</td>' +

            '<td style="padding:.45rem .75rem;"><span style="background:'+le.nb+';color:'+le.nc+';padding:.1rem .4rem;border-radius:8px;font-size:0.72rem;font-weight:600;">'+colN+'</span></td></tr>';

    });

    priHTML += '</tbody></table></div>' +

        '<p style="margin:.6rem 0 0;font-size:0.73rem;color:#94a3b8;">Esta tabla orienta la selección en el <strong>Plan de acción (Fase 3)</strong>. No sustituye la selección técnica detallada en la herramienta de priorización.</p>' +

        '</div>';



    elPri.innerHTML = priHTML;

}



// Actualizar checklist cuando cambian datos globales (hook sobre actualizarMunicipio)

const _actualizarMunicipioOriginal = typeof actualizarMunicipio === 'function' ? actualizarMunicipio : null;

function actualizarChecklistSiTab2() {

    if (document.getElementById('ia-check-informe')) actualizarChecklistIA();

}

document.addEventListener('DOMContentLoaded', function() {

    setTimeout(actualizarChecklistSiTab2, 500);

});

</script>



<script>

// ============================================================

// POBLAR PERFIL NUEVO - secciones individuales Tab 2

// ============================================================



function limpiarSeccionesPerfil() {

    const vacioPH = '<div style="padding:1.5rem; text-align:center; color:#94a3b8;"><p>Selecciona un municipio para ver los datos</p></div>';

    ['seccion-marco-estrategico','seccion-informe-situacion','seccion-estudios-complementarios',

     'seccion-priorizacion-popular','seccion-determinantes','seccion-indicadores'].forEach(id => {

        const el = document.getElementById(id);

        if (el) el.innerHTML = vacioPH;

    });

    // Resetear IA

    const iaInicial = document.getElementById('ia-estado-inicial');

    const iaResultado = document.getElementById('ia-resultado');

    const iaProgreso = document.getElementById('ia-progreso');

    if (iaInicial) iaInicial.style.display = 'block';

    if (iaResultado) iaResultado.style.display = 'none';

    if (iaProgreso) iaProgreso.style.display = 'none';

}



function poblarPerfilNuevo(datos, nombre) {

    datos = datos || {};



    // ── 01 MARCO ESTRATÉGICO ──────────────────────────────────

    const elMarco = document.getElementById('seccion-marco-estrategico');

    if (elMarco) {

        const config = {

            municipio: nombre,

            distrito: datos.distrito || 'Distrito sanitario Granada-Metropolitano',

            anioInforme: datos.anioInforme || new Date().getFullYear(),

            anioEncuesta: datos.anioEncuesta || (new Date().getFullYear() - 1),

            mesPriorizacion: datos.mesPriorizacion || 'febrero',

            anioPriorizacion: datos.anioPriorizacion || new Date().getFullYear(),

            lineasEstrategia: datos.lineasEstrategia || '1, 3 y 4'

        };

        elMarco.innerHTML = generarMarcoEstrategico(config);

    }



    // ── 02 INFORME DE SITUACIÓN ───────────────────────────────

    const elInforme = document.getElementById('seccion-informe-situacion');

    if (elInforme) {

        if (datos.informe && datos.informe.htmlCompleto) {

            elInforme.innerHTML =

                '<div style="padding:0.75rem 1rem; background:#dcfce7; border-radius:6px; font-size:0.8rem; color:#166534; margin-bottom:0.75rem;">' +

                '✅ Cargado: <strong>' + (datos.informe.nombreArchivo || 'informe.docx') + '</strong>' +

                (datos.informe.fechaCarga ? ' · ' + new Date(datos.informe.fechaCarga).toLocaleDateString('es-ES') : '') +

                '</div>' +

                '<div style="max-height:500px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:8px; padding:1.25rem; font-size:0.9rem; line-height:1.6;">' +

                datos.informe.htmlCompleto +

                '</div>';

            // Actualizar estado en panel de carga

            const estInforme = document.getElementById('estado-informe');

            if (estInforme) estInforme.innerHTML = '<span style="color:#16a34a;">✅ ' + (datos.informe.nombreArchivo || 'Cargado') + '</span>';

        } else {

            elInforme.innerHTML =

                '<div style="padding:1.5rem; text-align:center; color:#94a3b8;">' +

                '<p>📄 Carga el Informe de Situación de Salud en <strong>⚙️ Gestionar fuentes</strong></p></div>';

        }

    }



    // ── 03 ESTUDIOS COMPLEMENTARIOS ──────────────────────────

    _renderEstudiosDebounced();



    // ── 04 PRIORIZACIÓN POPULAR ───────────────────────────────

    renderizarSeccionPriorizacion();



    // ── 05 DETERMINANTES ─────────────────────────────────────

    const elDet = document.getElementById('seccion-determinantes');

    if (elDet) {

        // Extraer el interior del acordeón de determinantes

        const _tmpDet = document.createElement('div');

        _tmpDet.innerHTML = generarSeccionDeterminantes();

        const _innerDet = _tmpDet.querySelector('.acordeon-contenido');

        elDet.innerHTML = _innerDet ? _innerDet.innerHTML : _tmpDet.innerHTML;

        // Poblar inputs si hay datos

        if (datos.determinantes) {

            setTimeout(() => {

                Object.entries(_filtrarDeterminantesValidos(datos.determinantes)).forEach(([codigo, data]) => {

                    const input = document.getElementById('det-' + codigo);

                    if (input) {

                        const valor = typeof data === 'object' ? data.valor : data;

                        if (valor !== null && valor !== undefined) {

                            input.value = valor;

                            actualizarColorDeterminante(input);

                        }

                    }

                });

                actualizarCeldasReferencia();

            }, 150);

        } else {

            setTimeout(actualizarCeldasReferencia, 300);

        }

        // Estado en panel de carga

        const estDet = document.getElementById('estado-determinantes');

        if (estDet) {

            const nDet = _contarDeterminantesValidos(datos.determinantes);

            estDet.innerHTML = nDet > 0

                ? '<span style="color:#d97706;">✅ ' + nDet + ' determinantes cargados</span>'

                : '<span style="color:#94a3b8;">⏳ Sin cargar</span>';

        }

    }



    // ── 06 INDICADORES ────────────────────────────────────────

    const elInd = document.getElementById('seccion-indicadores');

    if (elInd) {

        setTimeout(() => {

            const cuadroHTML = generarCuadroMandosIntegral(datos.indicadores || null);

            elInd.innerHTML = cuadroHTML;

            // También actualizar el contenedor original para compatibilidad

            const cuadroContainer = document.getElementById('cuadro-mandos-contenido');

            if (cuadroContainer) cuadroContainer.innerHTML = cuadroHTML;

        }, 500);

        // Estado en panel de carga

        const estInd = document.getElementById('estado-indicadores');

        if (estInd) {

            const nInd = _contarIndicadoresValidos(datos.indicadores);

            estInd.innerHTML = nInd > 0

                ? '<span style="color:#dc2626;">✅ ' + nInd + ' indicadores cargados</span>'

                : '<span style="color:#94a3b8;">⏳ Sin cargar</span>';

        }

    }



    // ── IA: actualizar checklist ───────────────────────────────

    setTimeout(actualizarChecklistIA, 300);



    // ── Cargar análisis IA guardado en Firebase ───────────────

    if (datos.analisisIA) {

        const iaInicial = document.getElementById('ia-estado-inicial');

        if (iaInicial) iaInicial.style.display = 'none';

        renderizarResultadoIA(datos.analisisIA);

        // Actualizar badge del compilador ahora que analisisIA está disponible en datosMunicipioActual

        if (typeof actualizarEstadoCompilador === 'function') actualizarEstadoCompilador();

    }



    // M10: restaurar selección EPVSA guardada en Firebase

    if (datos.seleccionEPVSA && datos.seleccionEPVSA.seleccion) {

        try {

            if (window.COMPAS && window.COMPAS.state) {

                window.COMPAS.state.seleccionEPVSA = datos.seleccionEPVSA.seleccion;

            }

            // Si el selector ya está renderizado, aplicar checkboxes inmediatamente

            if (document.querySelector('#plan-accion-container input[type="checkbox"]')) {

                if (typeof renderPlanAccion === 'function') renderPlanAccion();

            }

            console.log('M10: seleccionEPVSA restaurada desde Firebase (' + datos.seleccionEPVSA.seleccion.length + ' líneas)');

        } catch(e) { console.warn('M10: error restaurando seleccionEPVSA:', e); }

    }



    // M11: si existe planAccion en Firebase, guardar referencia y mostrar banner

    if (datos.planAccion && datos.planAccion.seleccionEPVSA && datos.planAccion.seleccionEPVSA.length > 0) {

        try {

            if (window.COMPAS && window.COMPAS.state) {

                window.COMPAS.state.planAccionFirebase = datos.planAccion;

            }

            // Mostrar banner de oferta de carga

            var _banner = document.getElementById('plan-guardado-banner');

            var _fechaEl = document.getElementById('plan-guardado-fecha');

            if (_banner) {

                var _fleg = datos.planAccion.fechaISO

                    ? 'Guardado el ' + new Date(datos.planAccion.fechaISO).toLocaleString('es-ES')

                    : 'Fecha desconocida';

                if (_fechaEl) _fechaEl.textContent = _fleg + ' · ' + datos.planAccion.seleccionEPVSA.length + ' líneas';

                _banner.style.display = 'block';

            }

            console.log('M11: planAccion encontrado en Firebase (' + datos.planAccion.fechaISO + ')');

        } catch(e) { console.warn('M11: error procesando planAccion de Firebase:', e); }

    }

}

</script>



<script>

// ============================================================

// MODO AUTOMÁTICO: PROPUESTA EPVSA CON IA

// ============================================================



function regenerarPropuestaIA() {

    document.getElementById('propuesta-automatica-container').style.display = 'none';

    document.getElementById('auto-ia-estado-inicial').style.display = 'block';

    document.getElementById('auto-ia-progreso').style.display = 'none';

}



// ════════════════════════════════════════════════════════════════════════════

// GENERADOR LOCAL DE PLAN DE ACCIÓN — sin API, determinista

// Sustituye a la llamada a Claude API. Produce exactamente el mismo JSON

// que espera renderizarPropuestaIA().

//

// Lógica:

//   1. Lee los datos disponibles: participación ciudadana (VRELAS o EPVSA),

//      análisis epidemiológico (analisisActual) e informe de situación.

//   2. Ordena los temas/objetivos por votos/relevancia.

//   3. Mapea cada tema a objetivo LE1 y selecciona programas+actuaciones

//      concretos de ESTRUCTURA_EPVSA.

//   4. Genera justificaciones textuales basadas en los datos reales.

//   5. Siempre incluye P01 (RELAS) como programa núcleo de LE1.

// ════════════════════════════════════════════════════════════════════════════



// ── [CANÓNICO PARCIAL — DEUDA TÉCNICA RESIDUAL] Granularidad VRELAS→objetivos/programas ──

// [AUDIT] _VRELAS_A_LE1 — definido pero no consumido directamente en runtime actual.

// _generarPropuestaLocal delega en analisis.propuestaEPVSA del motor v2, no itera esta constante por nombre.

// Contiene granularidad útil (objetivo EPVSA, programas clave, actuaciones-tipo) ausente en otros mapeos.

// No eliminar por aparente redundancia con COMPAS_VRELAS_A_LE; son niveles de detalle distintos.

// Mapeo tema VRELAS (1-10) → { objetivoId, programasClave, actuacionesClave, descripcion }

var _VRELAS_A_LE1 = {

    1:  { obj: '1.1', progs: ['P01','P02'], acts: ['P01-A12','P01-A13','P01-A14','P01-A05','P02-A09'], desc: 'alimentación saludable' },

    2:  { obj: '1.2', progs: ['P01','P02'], acts: ['P01-A15','P01-A17','P01-A18','P02-A05','P02-A06','P02-A07'], desc: 'actividad física' },

    3:  { obj: '1.4', progs: ['P01','P06'], acts: ['P01-A09','P01-A26','P06-A01','P06-A02','P06-A03'], desc: 'bienestar emocional y salud mental' },

    4:  { obj: '1.6', progs: ['P01','P05'], acts: ['P01-A21','P01-A23','P01-A24','P01-A25'], desc: 'uso saludable de pantallas y redes sociales' },

    5:  { obj: '1.3', progs: ['P01','P03'], acts: ['P01-A07','P03-A01','P03-A04'], desc: 'sueño y descanso' },

    6:  { obj: '1.2', progs: ['P04','P01'], acts: ['P04-A01','P04-A02','P04-A03','P01-A24'], desc: 'tabaco, alcohol y otras drogas' },

    7:  { obj: '1.5', progs: ['P05','P01'], acts: ['P05-A01','P05-A02','P05-A03','P01-A22'], desc: 'sexualidad y salud' },

    8:  { obj: '1.4', progs: ['P08','P01'], acts: ['P08-A01','P08-A02','P01-A26'], desc: 'violencia de género' },

    9:  { obj: '1.7', progs: ['P02','P01'], acts: ['P02-A01','P02-A02','P02-A03','P02-A04','P01-A06'], desc: 'medioambiente y municipio saludable' },

    10: { obj: '1.2', progs: ['P02','P01'], acts: ['P02-A04','P02-A06','P01-A06'], desc: 'prevención de accidentes' }

};



// ── Puente: adapta SalidaMotor modular al formato que espera renderizarPropuestaIA ──

// Reconstruye {justificacion_global, fortalezas, oportunidades, propuestaEPVSA, _seleccion}

// desde la salida normalizada de motorPlanAccion.

function adaptarSalidaMotorPlanAFormatoUI(salidaMotor, municipio, fuentesUsadas, pop) {

    var d = salidaMotor.datos;

    var analisisBase = d.analisisBase || window.analisisActual || {};

    var fp = analisisBase.fuentes || {};



    // Fortalezas — reconstruidas desde el análisis base

    var fortalezas = [];

    if (fp.tienePopular && pop) fortalezas.push({

        area: 'Participación ciudadana',

        texto: 'Se dispone de datos de priorización popular con ' + pop.n + ' participantes, lo que otorga legitimidad democrática al plan.'

    });

    if (fp.tieneInforme) fortalezas.push({

        area: 'Diagnóstico epidemiológico',

        texto: 'El municipio cuenta con Informe de Situación de Salud que fundamenta las decisiones con evidencia local objetiva.'

    });

    if (fp.tieneEstudios) fortalezas.push({

        area: 'Estudios complementarios',

        texto: 'Se dispone de estudios complementarios que enriquecen el diagnóstico local.'

    });

    if (analisisBase.fortalezas && analisisBase.fortalezas.length) {

        var areasF = [];

        analisisBase.fortalezas.forEach(function(f) { if (f.area && areasF.indexOf(f.area) < 0) areasF.push(f.area); });

        fortalezas.push({ area: 'Activos de salud (EAS)', texto: 'Indicadores favorables en: ' + areasF.slice(0, 3).join(', ') + ' (estimación EAS).' });

    }

    if (!fortalezas.length) fortalezas.push({

        area: 'Proceso de planificación',

        texto: 'El municipio ha iniciado un proceso estructurado de planificación local de salud.'

    });



    // Oportunidades

    var oportunidades = [];

    if (analisisBase.alertasInequidad && analisisBase.alertasInequidad.length) oportunidades.push({

        area: 'Equidad',

        texto: analisisBase.alertasInequidad.length + ' alerta(s) de inequidad detectada(s). Intervención prioritaria con perspectiva de equidad y universalismo proporcional.'

    });

    oportunidades.push({ area: 'RELAS', texto: 'La Red Local de Acción en Salud (RELAS) es el instrumento central para vehicular las actuaciones comunitarias de forma intersectorial.' });

    oportunidades.push({ area: 'EPVSA 2024-2030', texto: 'El marco estratégico autonómico proporciona programas y actuaciones-tipo ya diseñadas que facilitan la implementación local.' });



    return {

        justificacion_global: d.justificacionGlobal || '',

        fortalezas:           fortalezas,

        oportunidades:        oportunidades,

        propuestaEPVSA:       d.lineasPropuestas    || [],

        _seleccion:           d.seleccionNormalizada || [],

        _origenCalculo:       'motor_modular',

        _gradoConfianza:      salidaMotor.gradoConfianza,

        _trazabilidadId:      salidaMotor.trazabilidadId,

        _motorId:             salidaMotor.motorId,

    };

}



function generarPropuestaIA() {

    const municipio = getNombreMunicipio(getMunicipioActual()) || 'el municipio';

    const datos = datosMunicipioActual || {};



    // ── 1. Fuentes disponibles ───────────────────────────────────────────────

    var fuentesUsadas = [];

    if (datos.informe && datos.informe.htmlCompleto)   fuentesUsadas.push('Informe de Situación');

    if (window.estudiosComplementarios && window.estudiosComplementarios.length) fuentesUsadas.push('Estudios complementarios');

    var pop = normalizarParticipacion(window.datosParticipacionCiudadana);

    if (pop) fuentesUsadas.push('Priorización ciudadana (' + pop.n + ' participantes)');

    var analisis = window.analisisActual;

    // Si no hay análisis previo del 07, ejecutar el motor salutogénico ahora

    if (!analisis || !analisis.priorizacion) {

        try { analisis = analizarDatosMunicipio(); window.analisisActual = analisis; } catch(e) { analisis = null; }

    }

    if (analisis && analisis.priorizacion && analisis.priorizacion.length) fuentesUsadas.push('Análisis salutogénico');



    if (!fuentesUsadas.length) {

        alert('⚠️ No hay ninguna fuente cargada. Carga al menos el Informe de Situación de Salud.');

        return;

    }



    // UI: simular progreso

    document.getElementById('auto-ia-estado-inicial').style.display = 'none';

    document.getElementById('auto-ia-progreso').style.display = 'block';

    document.getElementById('propuesta-automatica-container').style.display = 'none';



    // ── 2. Motor modular (import dinámico) con fallback al heredado ───────────

    setTimeout(function() {

        Promise.all([

            import('./ia/motores/motorPlanAccion.js'),

            import('./ia/contextoIA.js'),

        ]).then(function(modulos) {

            var motorMod = modulos[0];

            var ctxMod   = modulos[1];



            var ctx = ctxMod.contextoDesdeGlobalesHeredados();

            if (!ctx) throw new Error('Sin contexto territorial activo para el motor modular.');



            return motorMod.motorPlanAccion.ejecutar(ctx).then(function(salidaMotor) {

                if (salidaMotor.sinDatos || !salidaMotor.datos ||

                        !(salidaMotor.datos.lineasPropuestas || []).length) {

                    throw new Error('Motor modular sin datos: ' + (salidaMotor.error || 'propuesta vacía'));

                }



                var resultado = adaptarSalidaMotorPlanAFormatoUI(salidaMotor, municipio, fuentesUsadas, pop);



                // Asignar propuestaActual explícitamente antes de renderizar.

                // resultado._seleccion tiene formato [{lineaId, objetivos:[{objetivoIdx,...}],

                // programas:[{programaIdx,...}]}] — exactamente lo que espera aceptarPropuesta().

                // propuestaActual debe ser un array plano; los metadatos van en variable auxiliar.

                propuestaActual = resultado._seleccion && resultado._seleccion.length

                    ? resultado._seleccion

                    : (resultado.propuestaEPVSA || []);

                window.propuestaActual = propuestaActual;



                // Metadatos del motor accesibles para depuración y trazabilidad

                window.__ultimaPropuestaPlanMotor = {

                    motorId:           salidaMotor.motorId,

                    motorVersion:      salidaMotor.motorVersion,

                    trazabilidadId:    salidaMotor.trazabilidadId,

                    gradoConfianza:    salidaMotor.gradoConfianza,

                    gradoConfianzaLabel: salidaMotor.gradoConfianzaLabel,

                    origenCalculo:     'motor_modular',

                    estadoRevision:    salidaMotor.estadoRevisionHumana,

                    nLineas:           (salidaMotor.datos.lineasPropuestas || []).length,

                    fechaGeneracion:   new Date().toISOString(),

                };



                console.group('[COMPÁS] 🤖 motorPlanAccion — propuesta modular activa');

                console.log('  Motor:', salidaMotor.motorId, 'v' + (salidaMotor.motorVersion || '?'));

                console.log('  Confianza:', salidaMotor.gradoConfianza, '(' + salidaMotor.gradoConfianzaLabel + ')');

                console.log('  TrazabilidadId:', salidaMotor.trazabilidadId);

                console.log('  Estado revisión:', salidaMotor.estadoRevisionHumana);

                console.log('  Líneas propuestas:', (salidaMotor.datos.lineasPropuestas || []).length);

                console.log('  propuestaActual.length:', propuestaActual.length);

                console.log('  Origen: motor_modular');

                console.groupEnd();



                var municipioId = getMunicipioActual();

                if (municipioId && typeof db !== 'undefined') {

                    db.ref('estrategias/' + estrategiaActual + '/municipios/' + municipioId + '/propuestaIA').set(

                        Object.assign({}, resultado, {

                            fechaGeneracion:  new Date().toISOString(),

                            fuentes:          fuentesUsadas,

                            _origenCalculo:   'motor_modular',

                            _trazabilidadId:  salidaMotor.trazabilidadId,

                            _gradoConfianza:  salidaMotor.gradoConfianza,

                        })

                    );

                }



                renderizarPropuestaIA(resultado, municipio, fuentesUsadas);

            });



        }).catch(function(err) {

            // Fallback: motor heredado (_generarPropuestaLocal directo)

            console.warn('[COMPÁS] motorPlanAccion fallo — usando motor heredado. Causa:', err.message);

            try {

                var resultado = _generarPropuestaLocal(municipio, datos, pop, analisis);

                var municipioId = getMunicipioActual();

                if (municipioId && typeof db !== 'undefined') {

                    db.ref('estrategias/' + estrategiaActual + '/municipios/' + municipioId + '/propuestaIA').set(

                        Object.assign({}, resultado, { fechaGeneracion: new Date().toISOString(), fuentes: fuentesUsadas })

                    );

                }

                renderizarPropuestaIA(resultado, municipio, fuentesUsadas);

            } catch(fallbackErr) {

                document.getElementById('auto-ia-progreso').style.display = 'none';

                document.getElementById('auto-ia-estado-inicial').style.display = 'block';

                alert('❌ Error al generar propuesta: ' + fallbackErr.message);

                console.error(fallbackErr);

            }

        });

    }, 400);

}



// ── Núcleo del generador local — delega en motor v2 ─────────────────────────

// _generarPropuestaLocal unifica el camino "IA" con el motor salutogénico v2.

// Produce el mismo objeto {justificacion_global, fortalezas, oportunidades, propuestaEPVSA}

// que antes, pero ahora propuestaEPVSA también lleva el campo _seleccion normalizado

// (formato {lineaId, objetivos:[{objetivoIdx,indicadores:[]}], programas:[{programaIdx,actuaciones:[]}]})

// para que convertirPropuestaASeleccion y aplicarPropuestaACheckboxes funcionen

// tanto con este camino como con el camino generarPropuestaAutomatica.

function _generarPropuestaLocal(municipio, datos, pop, analisis) {

    // 1. Usar siempre el resultado del motor v2 (puede venir ya calculado o calcularse aquí)

    if (!analisis || !analisis.propuestaEPVSA) {

        try { analisis = analizarDatosMunicipio(); } catch(e) { analisis = null; }

    }



    var estructura = getEstructuraActual();



    // 2. Construir propuestaEPVSA enriquecida para renderizarPropuestaIA

    var propuestaEPVSA = [];

    var seleccionNormalizada = []; // formato compatible con convertirPropuestaASeleccion



    var fuentesPropuesta = analisis ? analisis.fuentes : {};

    var tienePopular = fuentesPropuesta.tienePopular || !!(pop && (pop.temasFreq || pop.rankingObjetivos));



    // Temas ciudadanos top3 para etiquetas visuales

    var nombresTemas = typeof VRELAS_TEMAS !== 'undefined' ? VRELAS_TEMAS : {};

    var iconosTemas  = typeof VRELAS_ICONOS_TEMAS !== 'undefined' ? VRELAS_ICONOS_TEMAS : {};

    var temasTop3 = [];

    if (pop && pop.rankingObjetivos) {

        temasTop3 = pop.top5Temas ? pop.top5Temas.slice(0,3) : pop.rankingObjetivos.slice(0,3);

    } else if (analisis && analisis.priorizacion) {

        // Sin participación: usar las 3 áreas más prioritarias del análisis

        analisis.priorizacion.slice(0,3).forEach(function(p, i){

            temasTop3.push({ texto: p.area, icono: '🎯', porcentaje: null });

        });

    }



    var propFromMotor = (analisis && analisis.propuestaEPVSA) ? analisis.propuestaEPVSA : [];



    var _descartadasLP = []; // lineaIds sin correspondencia en ESTRUCTURA_EPVSA

    propFromMotor.forEach(function(prop) {

        var lineaData = estructura.find(function(l){ return l.id === prop.lineaId; });

        // [AUDIT] Si lineaId no existe en ESTRUCTURA_EPVSA, la entrada se descarta.

        // Tras correcciones _TEMA_A_EPVSA y LE5-v3 (2026-03-10), solo debería activarse

        // si analisisActual fue generado antes de esas correcciones (datos de sesión obsoleta).

        // Descarte controlado: el lineaId se acumula en _descartadasLP para log interno.

        if (!lineaData) { _descartadasLP.push(prop.lineaId); return; }



        // ── Convertir objetivos (pueden ser índices numéricos o códigos string) ──

        var objetivosIdx = [];

        var objetivosCodigos = [];

        (prop.objetivos || []).forEach(function(o) {

            if (typeof o === 'number') {

                objetivosIdx.push(o);

                var obj = lineaData.objetivos[o];

                if (obj) objetivosCodigos.push(obj.id || obj.codigo || String(o));

            } else if (typeof o === 'object' && o !== null) {

                var idx = typeof o.objetivoIdx === 'number' ? o.objetivoIdx : o;

                objetivosIdx.push(idx);

                var obj = lineaData.objetivos[idx];

                if (obj) objetivosCodigos.push(obj.id || obj.codigo || String(idx));

            }

        });

        if (!objetivosIdx.length && lineaData.objetivos && lineaData.objetivos.length) {

            objetivosIdx = [0];

            var obj = lineaData.objetivos[0];

            if (obj) objetivosCodigos = [obj.id || obj.codigo || '0'];

        }



        // ── Convertir programas (pueden ser índices o códigos) ──

        var programasIdx = [];

        var programasSugeridos = [];

        (prop.programas || []).forEach(function(p) {

            if (typeof p === 'number') {

                programasIdx.push(p);

                var pr = lineaData.programas && lineaData.programas[p];

                if (pr) programasSugeridos.push({

                    codigo: pr.codigo, nombre: pr.nombre, ambito: pr.ambito,

                    justificacion_programa: '',

                    actuaciones_tipo: (pr.actuaciones || []).slice(0, 5).map(function(a){ return a.codigo; })

                });

            } else if (typeof p === 'object' && p !== null && typeof p.programaIdx === 'number') {

                programasIdx.push(p.programaIdx);

                var pr = lineaData.programas && lineaData.programas[p.programaIdx];

                if (pr) programasSugeridos.push({

                    codigo: pr.codigo, nombre: pr.nombre, ambito: pr.ambito,

                    justificacion_programa: '',

                    actuaciones_tipo: (pr.actuaciones || []).slice(0, 5).map(function(a){ return a.codigo; })

                });

            }

        });

        if (!programasIdx.length && lineaData.programas && lineaData.programas.length) {

            programasIdx = [0];

            var pr = lineaData.programas[0];

            if (pr) programasSugeridos = [{

                codigo: pr.codigo, nombre: pr.nombre, ambito: pr.ambito,

                justificacion_programa: 'Programa principal de la línea estratégica.',

                actuaciones_tipo: (pr.actuaciones || []).slice(0, 5).map(function(a){ return a.codigo; })

            }];

        }



        // Temas ciudadanos relevantes para esta línea

        var temasCiudadanosLinea = [];

        if (tienePopular) {

            temasTop3.forEach(function(t) {

                var mapa = (typeof _VRELAS_A_LE1 !== 'undefined') ? _VRELAS_A_LE1[t.id || t.k] : null;

                if (mapa && parseInt(mapa.obj) === prop.lineaId) {

                    temasCiudadanosLinea.push((t.icono || '🎯') + ' ' + (t.texto || ''));

                }

            });

            if (!temasCiudadanosLinea.length && prop.lineaId === 1 && temasTop3.length) {

                temasCiudadanosLinea = temasTop3.slice(0,3).map(function(t){

                    return (t.icono || '🎯') + ' ' + (t.texto || '');

                });

            }

        }



        // Objeto para renderizarPropuestaIA

        propuestaEPVSA.push({

            lineaId:           prop.lineaId,

            lineaCodigo:       'LE' + prop.lineaId,

            titulo:            (lineaData.nombreCorto || lineaData.nombre),

            temasCiudadanos:   temasCiudadanosLinea,

            relevancia:        prop.relevancia || 70,

            justificacion:     prop.justificacion || '',

            objetivos:         objetivosCodigos,

            programas_sugeridos: programasSugeridos,

            // Reserva interna: índices para convertirPropuestaASeleccion

            _objetivosIdx:     objetivosIdx,

            _programasIdx:     programasIdx

        });



        // Objeto para convertirPropuestaASeleccion / aplicarPropuestaACheckboxes

        seleccionNormalizada.push({

            lineaId:    prop.lineaId,

            relevancia: prop.relevancia || 70,

            justificacion: prop.justificacion || '',

            objetivos: objetivosIdx.map(function(idx) {

                var obj = lineaData.objetivos[idx];

                return {

                    objetivoIdx: idx,

                    indicadores: obj && obj.indicadores

                        ? obj.indicadores.map(function(_, i){ return i; }).slice(0, 3)

                        : []

                };

            }),

            programas: programasIdx.map(function(idx) {

                var pr = lineaData.programas && lineaData.programas[idx];

                return {

                    programaIdx: idx,

                    actuaciones: pr && pr.actuaciones

                        ? pr.actuaciones.map(function(_, i){ return i; }).slice(0, 5)

                        : []

                };

            })

        });

    });



    if (_descartadasLP.length > 0) {

        console.warn('[COMPÁS _generarPropuestaLocal] ' + _descartadasLP.length + ' entrada(s) descartada(s) — lineaId sin correspondencia en ESTRUCTURA_EPVSA:', _descartadasLP);

    }



    // Garantizar LE3 si no está

    if (!propuestaEPVSA.find(function(p){ return p.lineaId === 3; })) {

        var le3 = estructura.find(function(l){ return l.id === 3; });

        if (le3) {

            propuestaEPVSA.push({

                lineaId: 3, lineaCodigo: 'LE3',

                titulo: le3.nombreCorto || le3.nombre,

                temasCiudadanos: [], relevancia: 65,

                justificacion: 'Difusión de información veraz sobre hábitos saludables.',

                objetivos: le3.objetivos && le3.objetivos[0] ? [le3.objetivos[0].id] : ['3.1'],

                programas_sugeridos: le3.programas && le3.programas[0] ? [{

                    codigo: le3.programas[0].codigo, nombre: le3.programas[0].nombre,

                    ambito: le3.programas[0].ambito, justificacion_programa: '',

                    actuaciones_tipo: (le3.programas[0].actuaciones||[]).slice(0,4).map(function(a){ return a.codigo; })

                }] : [],

                _objetivosIdx: [0], _programasIdx: [0]

            });

            seleccionNormalizada.push({

                lineaId: 3, relevancia: 65,

                justificacion: 'Difusión de información veraz sobre hábitos saludables.',

                objetivos: [{ objetivoIdx: 0, indicadores: [] }],

                programas:  [{ programaIdx: 0, actuaciones: le3.programas && le3.programas[0] && le3.programas[0].actuaciones

                    ? le3.programas[0].actuaciones.map(function(_, i){ return i; }).slice(0,4) : [] }]

            });

        }

    }



    // 3. Fortalezas y oportunidades desde el análisis v2

    var fortalezas = [];

    var oportunidades = [];



    if (analisis) {

        if (tienePopular && pop) fortalezas.push({

            area: 'Participación ciudadana',

            texto: 'Se dispone de datos de priorización popular con ' + pop.n + ' participantes, ' +

                'lo que otorga legitimidad democrática al plan.'

        });

        if (fuentesPropuesta.tieneInforme) fortalezas.push({

            area: 'Diagnóstico epidemiológico',

            texto: 'El municipio cuenta con Informe de Situación de Salud que fundamenta las ' +

                'decisiones con evidencia local objetiva.'

        });

        if (fuentesPropuesta.tieneEstudios) fortalezas.push({

            area: 'Estudios complementarios',

            texto: 'Se dispone de ' + (window.estudiosComplementarios||[]).length +

                ' estudio(s) complementario(s) que enriquecen el diagnóstico local.'

        });

        if (analisis.fortalezas && analisis.fortalezas.length) {

            var areasF = [...new Set(analisis.fortalezas.map(function(f){ return f.area; }))];

            fortalezas.push({

                area: 'Activos de salud (EAS)',

                texto: 'Indicadores favorables en: ' + areasF.slice(0,3).join(', ') + ' (estimación EAS).'

            });

        }

        if (analisis.alertasInequidad && analisis.alertasInequidad.length) {

            oportunidades.push({

                area: 'Equidad',

                texto: analisis.alertasInequidad.length + ' alerta(s) de inequidad detectada(s). ' +

                    'Intervención prioritaria con perspectiva de equidad y universalismo proporcional.'

            });

        }

    }



    oportunidades.push({

        area: 'RELAS',

        texto: 'La Red Local de Acción en Salud (RELAS) es el instrumento central para ' +

            'vehicular las actuaciones comunitarias de forma intersectorial.'

    });

    oportunidades.push({

        area: 'EPVSA 2024-2030',

        texto: 'El marco estratégico autonómico proporciona programas y actuaciones-tipo ya ' +

            'diseñadas que facilitan la implementación local.'

    });



    if (!fortalezas.length) fortalezas.push({

        area: 'Proceso de planificación',

        texto: 'El municipio ha iniciado un proceso estructurado de planificación local de salud.'

    });



    // 4. Justificación global

    var temasTexto = temasTop3.map(function(t){

        return (t.icono || '🎯') + ' ' + (t.texto || '') + (t.porcentaje ? ' (' + t.porcentaje + '%)' : '');

    }).join(', ');



    var fuentesLabel = [];

    if (analisis && analisis.fuentes) {

        if (analisis.fuentes.tieneInforme)   fuentesLabel.push('Informe de Situación de Salud');

        if (analisis.fuentes.tieneEstudios)  fuentesLabel.push('Estudios complementarios');

        if (analisis.fuentes.tienePopular)   fuentesLabel.push('Priorización ciudadana');

        if (analisis.fuentes.tieneDet)       fuentesLabel.push('Determinantes EAS');

    }



    var justGlobal = 'El Plan Local de Salud de ' + municipio +

        (fuentesLabel.length ? ' se fundamenta en: ' + fuentesLabel.join(', ') + '. ' : '. ') +

        (temasTexto ? 'Temas priorizados por la ciudadanía: ' + temasTexto + '. ' : '') +

        'El plan se articula en líneas estratégicas de la EPVSA 2024-2030 con RELAS como eje comunitario.';



    // 5. Guardar la selección normalizada en propuestaActual para que

    //    aceptarPropuesta → convertirPropuestaASeleccion funcione correctamente

    propuestaActual = seleccionNormalizada;



    return {

        justificacion_global: justGlobal,

        fortalezas:    fortalezas,

        oportunidades: oportunidades,

        propuestaEPVSA: propuestaEPVSA,

        _seleccion:     seleccionNormalizada   // accesible desde renderizarPropuestaIA si se necesita

    };

}





function renderizarPropuestaIA(r, municipio, fuentes) {

    document.getElementById('auto-ia-progreso').style.display = 'none';



    // ── Cabecera + fortalezas + oportunidades ─────────────────────────────────

    let resumenHTML = '<h3 style="color:#059669;margin:0 0 0.75rem;">📊 Propuesta para ' + municipio + '</h3>';

    resumenHTML += '<p style="background:#ecfdf5;padding:0.75rem 1rem;border-radius:8px;border-left:3px solid #10b981;color:#064e3b;margin-bottom:1rem;font-size:0.9rem;">' + (r.justificacion_global || '') + '</p>';

    resumenHTML += '<p style="font-size:0.75rem;color:#94a3b8;margin-bottom:1rem;">Fuentes: ' + fuentes.join(' · ') + '</p>';



    if (r.fortalezas && r.fortalezas.length) {

        resumenHTML += '<details style="margin-bottom:0.75rem;"><summary style="cursor:pointer;font-weight:600;color:#059669;font-size:0.85rem;padding:0.4rem 0;">✅ Fortalezas (' + r.fortalezas.length + ')</summary><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.4rem;margin-top:0.5rem;">';

        r.fortalezas.forEach(f => {

            resumenHTML += '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:0.6rem;"><strong style="font-size:0.8rem;color:#166534;">' + f.area + '</strong><p style="margin:0.2rem 0 0;font-size:0.78rem;color:#374151;">' + f.texto + '</p></div>';

        });

        resumenHTML += '</div></details>';

    }

    if (r.oportunidades && r.oportunidades.length) {

        resumenHTML += '<details style="margin-bottom:0.75rem;"><summary style="cursor:pointer;font-weight:600;color:#d97706;font-size:0.85rem;padding:0.4rem 0;">🎯 Oportunidades (' + r.oportunidades.length + ')</summary><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.4rem;margin-top:0.5rem;">';

        r.oportunidades.forEach(o => {

            resumenHTML += '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:0.6rem;"><strong style="font-size:0.8rem;color:#92400e;">' + o.area + '</strong><p style="margin:0.2rem 0 0;font-size:0.78rem;color:#374151;">' + o.texto + '</p></div>';

        });

        resumenHTML += '</div></details>';

    }

    document.getElementById('propuesta-resumen').innerHTML = resumenHTML;



    // ── Líneas EPVSA con programas y actuaciones checkboxeadas ───────────────

    const estructura = getEstructuraActual();

    const ambitoToEntorno = {

        'Comunitario':'comunitario','Sanitario':'sanitario','Educativo':'educativo',

        'Laboral':'laboral','Servicios sociales':'comunitario','Empresarial':'laboral',

        'Información y comunicación':'comunitario','Formación e investigación':'sanitario'

    };



    let detalleHTML = '<div style="margin-bottom:0.75rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">';

    detalleHTML += '<h4 style="color:#1e293b;margin:0;">📋 Líneas EPVSA propuestas con actuaciones-tipo</h4>';

    detalleHTML += '<div style="display:flex;gap:0.5rem;">';

    detalleHTML += '<button onclick="propuestaIA_seleccionarTodo(true)" style="padding:0.3rem 0.7rem;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:5px;font-size:0.75rem;cursor:pointer;">☑ Seleccionar todo</button>';

    detalleHTML += '<button onclick="propuestaIA_seleccionarTodo(false)" style="padding:0.3rem 0.7rem;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:5px;font-size:0.75rem;cursor:pointer;">☐ Deseleccionar todo</button>';

    detalleHTML += '</div></div>';



    (r.propuestaEPVSA || []).forEach((prop, li) => {

        const lineaData = estructura.find(l => l.id === prop.lineaId || l.codigo === prop.lineaCodigo);

        const colorLinea = (lineaData && lineaData.color) || '#0074c8';



        detalleHTML += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:1rem;overflow:hidden;border-left:4px solid ' + colorLinea + ';">';



        // Cabecera línea

        detalleHTML += '<div style="padding:0.9rem 1rem;background:linear-gradient(135deg,' + colorLinea + '15 0%,transparent 100%);">';

        detalleHTML += '<div style="display:flex;align-items:flex-start;gap:0.75rem;flex-wrap:wrap;">';

        detalleHTML += '<span style="background:' + colorLinea + ';color:white;padding:0.2rem 0.6rem;border-radius:5px;font-size:0.75rem;font-weight:700;flex-shrink:0;">LE' + prop.lineaId + '</span>';

        detalleHTML += '<div style="flex:1;min-width:0;"><strong style="font-size:0.9rem;color:#1e293b;">' + (prop.titulo || '') + '</strong>';

        if (prop.temasCiudadanos && prop.temasCiudadanos.length)

            detalleHTML += '<div style="margin-top:0.2rem;font-size:0.75rem;color:#6d28d9;">🗳️ ' + prop.temasCiudadanos.join(' · ') + '</div>';

        detalleHTML += '</div>';

        detalleHTML += '<span style="background:#d1fae5;color:#065f46;padding:0.15rem 0.5rem;border-radius:10px;font-size:0.72rem;font-weight:700;flex-shrink:0;">' + (prop.relevancia||'?') + '/10</span>';

        detalleHTML += '</div>';

        detalleHTML += '<p style="font-size:0.82rem;color:#475569;margin:0.5rem 0 0;">' + (prop.justificacion || '') + '</p>';

        detalleHTML += '</div>';



        // Objetivos

        if (prop.objetivos && prop.objetivos.length && lineaData) {

            detalleHTML += '<div style="padding:0.4rem 1rem;background:#f0f0f0;font-size:0.75rem;color:#64748b;border-top:1px solid #e2e8f0;">';

            detalleHTML += '<strong>Objetivos:</strong> ';

            detalleHTML += prop.objetivos.map(function(oid) {

                var obj = (lineaData.objetivos||[]).find(function(o){ return o.id === oid || o.id === String(oid); });

                return obj ? ('<span style="background:white;border:1px solid #e2e8f0;border-radius:3px;padding:0.1rem 0.35rem;margin:0.1rem;display:inline-block;">' + obj.id + ': ' + obj.nombre + '</span>') : oid;

            }).join(' ');

            detalleHTML += '</div>';

        }



        // Programas con actuaciones checkboxeadas

        const programasSugeridos = prop.programas_sugeridos || [];

        if (programasSugeridos.length) {

            detalleHTML += '<div style="padding:0.75rem 1rem;">';

            programasSugeridos.forEach(function(prog) {

                // Buscar programa en la estructura real para obtener nombre completo si falta

                var progData = null;

                if (lineaData) {

                    progData = (lineaData.programas||[]).find(function(p){ return p.codigo === prog.codigo; });

                }

                var progNombre = prog.nombre || (progData && progData.nombre) || prog.codigo;

                var progAmbito = prog.ambito || (progData && progData.ambito) || '';

                var entorno = ambitoToEntorno[progAmbito] || 'comunitario';

                var entornoIco = {sanitario:'🏥',comunitario:'🏘️',educativo:'🎓',laboral:'🏢'}[entorno] || '📌';



                detalleHTML += '<div style="background:white;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:0.6rem;overflow:hidden;">';

                detalleHTML += '<div style="background:linear-gradient(135deg,#fef3c715,#fff9e6);padding:0.6rem 0.9rem;display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">';

                detalleHTML += '<span style="background:#f59e0b;color:white;padding:0.1rem 0.4rem;border-radius:4px;font-size:0.7rem;font-weight:700;">' + prog.codigo + '</span>';

                detalleHTML += '<strong style="font-size:0.82rem;color:#1e293b;flex:1;">' + progNombre + '</strong>';

                detalleHTML += '<span style="font-size:0.7rem;color:#f59e0b;">' + entornoIco + ' ' + progAmbito + '</span>';

                detalleHTML += '</div>';



                if (prog.justificacion_programa)

                    detalleHTML += '<div style="padding:0.3rem 0.9rem;font-size:0.78rem;color:#64748b;border-bottom:1px solid #f1f5f9;font-style:italic;">' + prog.justificacion_programa + '</div>';



                // Actuaciones-tipo checkboxeadas

                var actuaciones = prog.actuaciones_tipo || [];

                if (actuaciones.length) {

                    detalleHTML += '<div style="padding:0.5rem 0.9rem 0.6rem;">';

                    actuaciones.forEach(function(actCod) {

                        // Buscar nombre en la estructura real

                        var actData = null;

                        if (progData) {

                            actData = (progData.actuaciones||[]).find(function(a){ return a.codigo === actCod; });

                        } else if (lineaData) {

                            (lineaData.programas||[]).forEach(function(p){

                                var found = (p.actuaciones||[]).find(function(a){ return a.codigo === actCod; });

                                if (found) actData = found;

                            });

                        }

                        var actNombre = actData ? actData.nombre : actCod;

                        var chkId = 'propIA-act-' + actCod.replace(/[^A-Za-z0-9]/g,'_');



                        detalleHTML += '<label style="display:flex;align-items:flex-start;gap:0.5rem;padding:0.3rem 0.4rem;border-radius:5px;cursor:pointer;transition:background 0.15s;" ' +

                            'onmouseover="this.style.background=\'#f0f9ff\'" onmouseout="this.style.background=\'transparent\'">' +

                            '<input type="checkbox" id="' + chkId + '" checked ' +

                                'data-cod="' + actCod + '" ' +

                                'data-nombre="' + actNombre.replace(/"/g,'&quot;') + '" ' +

                                'data-programa="' + progNombre.replace(/"/g,'&quot;') + '" ' +

                                'data-prog-cod="' + prog.codigo + '" ' +

                                'data-linea="' + (prop.lineaId||'') + '" ' +

                                'data-linea-cod="' + (prop.lineaCodigo||'LE'+prop.lineaId) + '" ' +

                                'data-entorno="' + entorno + '" ' +

                                'class="propIA-actuacion-chk" ' +

                                'style="flex-shrink:0;margin-top:0.15rem;cursor:pointer;">' +

                            '<span style="font-size:0.8rem;color:#1e293b;line-height:1.4;">' +

                                '<span style="background:#0074c820;color:#0074c8;padding:0.05rem 0.3rem;border-radius:3px;font-size:0.65rem;font-weight:600;font-family:monospace;margin-right:0.3rem;">' + actCod + '</span>' +

                                actNombre +

                            '</span></label>';

                    });

                    detalleHTML += '</div>';

                } else {

                    detalleHTML += '<div style="padding:0.5rem 0.9rem;font-size:0.78rem;color:#94a3b8;font-style:italic;">Sin actuaciones específicas sugeridas</div>';

                }

                detalleHTML += '</div>'; // fin programa

            });

            detalleHTML += '</div>'; // fin padding programas

        }



        detalleHTML += '</div>'; // fin línea

    });



    // ── Contador y botón generar agenda ──────────────────────────────────────

    detalleHTML += '<div id="propIA-barra-generar" style="background:linear-gradient(135deg,#1e3a5f,#0f4c8a);border-radius:12px;padding:1.25rem 1.5rem;margin-top:0.5rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">';

    detalleHTML += '<div style="flex:1;min-width:200px;">';

    detalleHTML += '<div style="color:white;font-weight:700;font-size:0.95rem;margin-bottom:0.2rem;">📅 Generar en Agenda Anual 2026</div>';

    detalleHTML += '<div id="propIA-contador" style="color:#93c5fd;font-size:0.82rem;">Selecciona las actuaciones que quieres incorporar al plan local</div>';

    detalleHTML += '</div>';

    detalleHTML += '<button onclick="propuestaIA_generarEnAgenda()" style="background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;padding:0.75rem 1.5rem;border-radius:8px;font-weight:700;font-size:0.9rem;cursor:pointer;box-shadow:0 4px 15px rgba(16,185,129,0.4);white-space:nowrap;">📅 Añadir seleccionadas a Agenda 2026</button>';

    detalleHTML += '</div>';



    document.getElementById('propuesta-detalle').innerHTML = detalleHTML;

    // Usar la selección normalizada si está disponible (producida por _generarPropuestaLocal)

    // para que aceptarPropuesta → convertirPropuestaASeleccion funcione correctamente.

    // r._seleccion tiene formato [{lineaId, objetivos:[{objetivoIdx,...}], programas:[{programaIdx,...}]}]

    window.propuestaActual = r._seleccion || r.propuestaEPVSA || [];



    // Actualizar contador cuando cambian checkboxes

    document.querySelectorAll('.propIA-actuacion-chk').forEach(function(chk) {

        chk.addEventListener('change', propuestaIA_actualizarContador);

    });

    propuestaIA_actualizarContador();



    document.getElementById('propuesta-automatica-container').style.display = 'block';

    document.getElementById('propuesta-automatica-container').scrollIntoView({ behavior:'smooth', block:'start' });

}



function propuestaIA_seleccionarTodo(estado) {

    document.querySelectorAll('.propIA-actuacion-chk').forEach(function(chk){ chk.checked = estado; });

    propuestaIA_actualizarContador();

}



function propuestaIA_actualizarContador() {

    var total = document.querySelectorAll('.propIA-actuacion-chk').length;

    var sel   = document.querySelectorAll('.propIA-actuacion-chk:checked').length;

    var el    = document.getElementById('propIA-contador');

    if (el) el.textContent = sel + ' de ' + total + ' actuaciones seleccionadas';

}



function propuestaIA_generarEnAgenda() {

    var checks = document.querySelectorAll('.propIA-actuacion-chk:checked');

    if (!checks.length) {

        alert('Selecciona al menos una actuación-tipo para añadir a la agenda.');

        return;

    }



    var municipio = getNombreMunicipio(getMunicipioActual()) || 'el municipio';

    var añadidas = 0;



    checks.forEach(function(chk) {

        var cod     = chk.getAttribute('data-cod') || '';

        var nombre  = chk.getAttribute('data-nombre') || cod;

        var prog    = chk.getAttribute('data-programa') || '';

        var progCod = chk.getAttribute('data-prog-cod') || '';

        var lineaId = chk.getAttribute('data-linea') || '';

        var lineaCod= chk.getAttribute('data-linea-cod') || '';

        var entorno = chk.getAttribute('data-entorno') || 'comunitario';



        // Buscar objetivo de la línea en la estructura

        var objNombre = '';

        try {

            var linData = getEstructuraActual().find(function(l){ return l.id == lineaId || l.codigo === lineaCod; });

            if (linData && linData.objetivos && linData.objetivos.length)

                objNombre = linData.objetivos[0].id + ': ' + linData.objetivos[0].nombre;

        } catch(e) {}



        var accion = {

            id: accionIdCounter++,

            nombre: nombre,

            codigoEPVSA: cod,

            programa: prog,

            entorno: entorno,

            anio: '2026',

            trimestre: 'T1',

            descripcion: 'Actuación-tipo EPVSA incorporada desde propuesta IA · ' + municipio,

            lineaEpvsa: lineaCod || ('LE' + lineaId),

            objetivoEPVSA: objNombre,

            poblacion: 'Población general',

            etapaVida: '',

            responsable: '',

            organizacion: '',

            profesionales: '',

            indicador: '',

            meta: '',

            frecuencia: 'Anual',

            prioridad: 'alta',

            recursos: '',

            evidencia: 'EPVSA 2024-2030 · ' + cod,

            orden: Date.now() + añadidas

        };



        accionesAgenda.push(accion);

        añadidas++;

    });



    guardarAgendasFirebase();

    renderAgendas();



    // Feedback visual

    var barra = document.getElementById('propIA-barra-generar');

    if (barra) {

        barra.innerHTML = '<div style="flex:1;text-align:center;">' +

            '<div style="font-size:1.8rem;margin-bottom:0.3rem;">✅</div>' +

            '<div style="color:white;font-weight:700;font-size:1rem;">' + añadidas + ' actuaciones añadidas a la Agenda 2026</div>' +

            '<div style="color:#93c5fd;font-size:0.82rem;margin-top:0.2rem;">Ve a la pestaña Agenda para revisarlas y completar los detalles</div>' +

            '</div>';

    }



    // Cambiar a la vista de agenda automáticamente tras 1.5s

    setTimeout(function() {

        var btnAgenda = document.querySelector('[onclick*="tab-agenda"]') || document.querySelector('[onclick*="agenda"]');

        // Navegar al tab de agenda si existe

        var tabs = document.querySelectorAll('.tab-btn, .nav-tab, [data-tab]');

        tabs.forEach(function(t){ if ((t.textContent||'').toLowerCase().includes('agenda')) t.click(); });

        cambiarTipoAgenda && cambiarTipoAgenda('municipio');

    }, 1500);

}

</script>



<!-- MOTOR ANALÍTICO COMPÁS v3 — Multicriterio, trazable, científicamente riguroso -->

<script>

(function(){

'use strict';



// ─── A. PARÁMETROS CENTRALIZADOS ─────────────────────────────────────────────

window.COMPAS_PESOS_TIPO_DATO = {

    escala_validada:1.00, autorreporte_situacion:0.85,

    autorreporte_conducta:0.75, autorreporte_percepcion:0.60

};

window.COMPAS_PESOS_SFA = {

    // Pesos normativos justificados (MCDA: Marsh et al. 2016)

    // Suma = 1.00 | Ajustables por equipo técnico local

    epi:         0.28,  // Evidencia epidemiológica — máxima validez externa

    ciudadano:   0.22,  // Participación ciudadana — legitimidad democrática

    inequidad:   0.20,  // Equidad — mandato ético ODS 3.8 y EPVSA

    evidencia:   0.15,  // Evidencia local (IBSE, estudios) — especificidad municipal

    impacto:     0.10,  // Impacto potencial de intervención — efectividad

    convergencia:0.05   // Convergencia multi-fuente — robustez de la señal

    // factibilidad eliminada: varianza <0.01 en SFA, no discriminante

};

// ── [CANÓNICO ACTUAL — MOTOR v3] Mapeos área→LE y VRELAS→LE (multicriterio) ───────────

// FIX CRÍTICO 1: en v2 todo mapeaba a lineaEPVSA:1 (solo LE1)

// FIX CRÍTICO 2: VRELAS temas 4,6,7,8,9 generaban IDs 6-9 inexistentes en ESTRUCTURA_EPVSA

// FIX CRÍTICO 3 (2026-03-10): COMPAS_MAPEO_AREA_LE y COMPAS_VRELAS_A_LE contenían le:5

//   inexistente en ESTRUCTURA_EPVSA (rango válido: 1–4). Se elimina únicamente el valor 5

//   de los arrays multivalor; el resto de la estructura se mantiene intacto.

//   Entradas afectadas — MAPEO_AREA_LE: entornoSaludable [2,5]→[2], apoyoSocial [1,2,5]→[1,2],

//   situacionEconomica [2,5]→[2]. VRELAS_A_LE: tema 7 [1,5]→[1], tema 8 [2,5]→[2], tema 9 [2,5]→[2].

window.COMPAS_MAPEO_AREA_LE = {

    bienestarEmocional:    {le:[1],   obj:[3,4],   desc:'Bienestar emocional'},

    vidaActiva:            {le:[1,2], obj:[1,2],   desc:'Vida activa'},

    alimentacionSaludable: {le:[1,2], obj:[0,1],   desc:'Alimentación saludable'},

    suenoSaludable:        {le:[1],   obj:[2,3],   desc:'Sueño y descanso'},

    vidaSinHumo:           {le:[1,2], obj:[5],     desc:'Vida sin humo'},

    consumoResponsable:    {le:[1,2], obj:[5],     desc:'Consumo responsable de alcohol'},

    entornoSaludable:      {le:[2],   obj:[0,1],   desc:'Entornos promotores de salud'},

    apoyoSocial:           {le:[1,2], obj:[3,4,6], desc:'Redes de apoyo social'},

    situacionEconomica:    {le:[2],   obj:[0],     desc:'Equidad y determinantes sociales'}

};

window.COMPAS_VRELAS_A_LE = {

    1:{le:[1]}, 2:{le:[1,2]}, 3:{le:[1]}, 4:{le:[1,3]}, 5:{le:[1]},

    6:{le:[1,2]}, 7:{le:[1]}, 8:{le:[2]}, 9:{le:[2]}, 10:{le:[2,1]}

};

window.COMPAS_CAL_ESTUDIO = {

    ibse:0.90, epidemiologico:0.85, encuesta_local:0.75,

    informe_tecnico:0.70, informe_situacion:0.95, texto_libre:0.50

};

window.COMPAS_KW_TIPO = {

    ibse:/\bIBSE\b|bienestar.+salud.+escolar|salud.+escolar/i,

    epidemiologico:/estudio\s+epidemiol|mortalidad|morbilidad|prevalencia\s+de/i,

    encuesta_local:/encuesta\s+local|encuesta\s+municipal/i,

    informe_tecnico:/informe\s+de\s+situaci|diagn[oó]stico\s+de\s+salud/i

};

window.COMPAS_KW_AREA = {

    bienestarEmocional:   [/salud mental/i,/ansiedad/i,/depresi[oó]n/i,/bienestar emocional/i,/estr[eé]s/i],

    vidaActiva:           [/actividad f[ií]sica/i,/sedentarismo/i,/ejercicio/i,/deporte/i,/obesidad/i],

    alimentacionSaludable:[/alimentaci[oó]n/i,/nutri/i,/obesidad/i,/sobrepeso/i,/ultraprocesado/i],

    suenoSaludable:       [/sue[\xf1n]o/i,/insomnio/i,/descanso/i,/fatiga/i],

    vidaSinHumo:          [/tabaco/i,/tabaquismo/i,/fumar/i,/fumador/i],

    consumoResponsable:   [/alcohol/i,/consumo de riesgo/i,/botell[oó]n/i],

    entornoSaludable:     [/medioambiente/i,/contaminaci[oó]n/i,/entorno/i,/espacio verde/i],

    apoyoSocial:          [/apoyo social/i,/soledad/i,/aislamiento/i,/cohesi[oó]n/i],

    situacionEconomica:   [/desigualdad/i,/pobreza/i,/exclusi[oó]n/i,/vulnerab/i,/renta/i]

};



// ─── B. FUNCIÓN DE MAGNITUD GRADIENTE (reemplaza umbral binario 5%) ───────────

window.COMPAS_fMagnitud = function(d){

    var a=Math.abs(d);

    if(a<0.03)return 0; if(a<0.08)return 0.30;

    if(a<0.15)return 0.60; if(a<0.25)return 0.85; return 1.00;

};



// ─── C. ANÁLISIS REAL DE TEXTO (informe + IBSE + estudios) ───────────────────

window.COMPAS_analizarTextoEstudio = function(texto, nombre){

    if(!texto||texto.length<50)return null;

    var tipo='texto_libre';

    for(var t in window.COMPAS_KW_TIPO){

        if(window.COMPAS_KW_TIPO[t].test(nombre)||window.COMPAS_KW_TIPO[t].test(texto.slice(0,2000))){tipo=t;break;}

    }

    var colectivos=[];

    var COLS={infancia:[/infancia/i,/ni[\xf1n]o/i,/menor/i],

              adolescencia:[/adolescen/i,/joven/i,/escolar/i],

              mayores:[/mayor/i,/anciano/i],mujeres:[/mujer/i,/g[eé]nero/i]};

    for(var c in COLS){if(COLS[c].some(function(k){return k.test(texto);}))colectivos.push(c);}

    var areas=[];

    for(var ak in window.COMPAS_KW_AREA){

        var kws=window.COMPAS_KW_AREA[ak];

        var hits=kws.filter(function(k){return k.test(texto);}).length;

        if(!hits)continue;

        var conf=Math.min(1,0.3+(hits/kws.length)*0.7);

        var extr='';

        var hitIndex=-1;

        for(var ki=0;ki<kws.length;ki++){

            var m=texto.match(kws[ki]);

            if(m&&m.index!==undefined){

                hitIndex=m.index;

                extr=texto.slice(Math.max(0,m.index-100),Math.min(texto.length,m.index+250)).replace(/\s+/g,' ').trim();

                break;

            }

        }



        // Detección de negaciones: si la keyword aparece precedida de una negación,

        // el hallazgo es una fortaleza (ausencia del problema) o neutral, no oportunidad

        var esNegado=false;

        if(hitIndex>=0){

            var contextoAntes=texto.slice(Math.max(0,hitIndex-60),hitIndex);

            var PATRON_NEG=/no\s+(se\s+)?(observa|detecta|aprecia|present|hay|exist|report)|ausencia\s+de|sin\s+evidencia|descarta|no\s+(existen?|hay\s+|presenta)/i;

            if(PATRON_NEG.test(contextoAntes)) esNegado=true;

        }



        var dir='neutral';

        if(!esNegado){

            if(/elevad[ao]|alto[as]?|problem[ao]|escas[ao]|deficient|preocupan|excesiv/i.test(extr)) dir='oportunidad';

            else if(/favorable|adecuad[ao]|buen[ao]|positiv[ao]|mejorad[ao]|fortaleza/i.test(extr))  dir='fortaleza';

        } else {

            // Negación detectada: el área mencionada como ausente es un activo

            dir='fortaleza';

            conf*=0.6; // Reducir confianza: la negación complica la interpretación

        }



        var mag='media';

        if(/muy alto|muy elevado|grave|alarmante|cr[íi]tico|\b[7-9]\d\s*%|\b100\s*%/i.test(extr)) mag='alta';

        else if(/leve|reducido|peque[ñn]o|bajo|escaso|\b[1-2]\d\s*%/i.test(extr))                   mag='baja';



        // Extraer prevalencia numérica si existe (ej: "el 45% de los escolares")

        var prevalenciaDetectada=null;

        var mPrev=/\b(\d{1,3}(?:[,.]\d)?)[\s]*%/i.exec(extr);

        if(mPrev) prevalenciaDetectada=parseFloat(mPrev[1].replace(',','.'));



        areas.push({area:ak,hits:hits,confianza:parseFloat(conf.toFixed(2)),

                    direccion:dir,magnitud:mag,extracto:extr.slice(0,300),

                    prevalencia:prevalenciaDetectada,negado:esNegado});

    }

    areas.sort(function(a,b){return b.confianza-a.confianza;});

    var hallEq=[];

    var rEq=/desigualdad|brecha|inequidad|gradiente/gi;

    var mEq;

    while((mEq=rEq.exec(texto))!==null&&hallEq.length<3)

        hallEq.push(texto.slice(Math.max(0,mEq.index-80),Math.min(texto.length,mEq.index+180)).replace(/\s+/g,' ').trim());

    return{nombre:nombre,tipoEstudio:tipo,calidad:window.COMPAS_CAL_ESTUDIO[tipo]||0.50,

           colectivosDetectados:colectivos,areasDetectadas:areas,

           hallazgosEquidad:hallEq,longitudTexto:texto.length,_analizado:true};

};



window.COMPAS_analizarTextoInforme = function(html){

    if(!html)return null;

    var txt=html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();

    var r=window.COMPAS_analizarTextoEstudio(txt,'Informe de Situación de Salud');

    if(r){r.tipoEstudio='informe_situacion';r.calidad=0.95;}

    return r;

};



// ─── D. SCORES INDIVIDUALES ──────────────────────────────────────────────────

// COMPAS_scoreEpi v3.1

// - Media PONDERADA por calidad de dato (elimina sesgo por número de indicadores)

// - Parámetro opcional _detalle: array donde se acumulan los indicadores desviados

//   para trazabilidad completa en explicarPrioridad()

// - Devuelve score raw (no normalizado entre áreas); la normalización min-max

//   cross-area la realiza COMPAS_analizarV3 en dos pasadas

window.COMPAS_scoreEpi = function(aK, detFB, refL, estrD, _detalle){

    var mt=(typeof MAPEO_TEMATICO_SAL!=='undefined')?MAPEO_TEMATICO_SAL[aK]:null;

    if(!mt)return 0;

    var dets=mt.determinantes||[]; if(!dets.length)return 0;



    var sumaW=0;          // Σ (contribución × peso_tipo)

    var pesoTotal=0;      // Σ peso_tipo  →  denominador de la media ponderada

    var nValidos=0;



    dets.forEach(function(cod){

        var dV=detFB[cod]; if(dV===undefined||dV===null||dV==='')return;

        var val=typeof dV==='object'?parseFloat(dV.valor):parseFloat(dV); if(isNaN(val))return;

        var rO=refL[cod]; if(!rO||rO.refAndalucia==null)return;

        var ref=parseFloat(rO.refAndalucia); if(ref===0||isNaN(ref))return;



        // Buscar polaridad y tipoDato en ESTRUCTURA_DETERMINANTES

        var pol=1, tipo='autorreporte_conducta', textoInd=cod;

        if(typeof estrD!=='undefined'){

            for(var aKe in estrD){

                var ae=estrD[aKe]; if(!ae||!ae.indicadores)continue;

                var inds=ae.indicadores;

                if(ae.grupos)ae.grupos.forEach(function(g){inds=inds.concat(g.indicadores||[]);});

                var fnd=inds.find?inds.find(function(i){return i.codigo===cod;}):null;

                if(fnd){pol=fnd.polaridad||1;tipo=fnd.tipoDato||'autorreporte_conducta';textoInd=fnd.texto||cod;break;}

            }

        }



        var difR   = (val-ref)/ref;

        var esPeor = (pol===1&&difR<0)||(pol===-1&&difR>0);

        var mag    = window.COMPAS_fMagnitud(difR);

        var peso   = window.COMPAS_PESOS_TIPO_DATO[tipo]||0.65;



        // Contribución: positiva si el indicador es peor que referencia

        // (indica necesidad de intervención), negativa si es mejor (activo)

        var contrib = esPeor ? mag : -mag * 0.4;



        sumaW     += contrib * peso;

        pesoTotal += peso;

        nValidos++;



        // Trazabilidad: guardar indicadores con desviación significativa

        if(_detalle && Math.abs(difR) >= 0.03){

            _detalle.push({

                codigo:      cod,

                texto:       textoInd,

                valor:       parseFloat(val.toFixed(1)),

                refAndalucia: parseFloat(ref.toFixed(1)),

                difPct:      parseFloat((difR*100).toFixed(1)),

                tipoDato:    tipo,

                peso:        parseFloat(peso.toFixed(2)),

                magnitud:    mag >= 0.85 ? 'severa' : mag >= 0.60 ? 'notable' : mag >= 0.30 ? 'moderada' : 'leve',

                direccion:   esPeor ? 'oportunidad' : 'fortaleza'

            });

        }

    });



    if(!pesoTotal)return 0;



    // Media ponderada en [-1, 1] aprox → mapear a [0, 1]

    // El rango teórico de sumaW/pesoTotal es [-0.4, 1.0]

    // Fórmula: (media + 0.4) / 1.4  →  [0, 1]

    var media = sumaW / pesoTotal;

    return parseFloat(Math.max(0, Math.min(1, (media + 0.4) / 1.4)).toFixed(4));

};



window.COMPAS_scoreCiudadano = function(aK,pop,sEpi){

    if(!pop)return 0;

    var mLE=window.COMPAS_MAPEO_AREA_LE[aK]; if(!mLE)return 0;

    var lA=mLE.le;

    var nT=pop.totalParticipantes||pop.n||0; if(!nT)return 0;

    var votos=0;

    var VL=window.COMPAS_VRELAS_A_LE;

    for(var t in VL){

        if(VL[t].le.some(function(le){return lA.indexOf(le)>=0;}))

            votos+=(pop.temasFreq?(pop.temasFreq[parseInt(t)]||0):0);

    }

    if(!pop.temasFreq&&pop.rankingObjetivos)

        votos=pop.rankingObjetivos.slice(0,5).reduce(function(a,o){return a+(o.votos||0)*0.3;},0);

    var prop=Math.min(1,votos/nT);

    var score=Math.min(1,prop*(prop>0.3?1.1:1.0));

    if(sEpi>0.75&&score<0.15)score=0.15;

    return parseFloat(score.toFixed(3));

};



window.COMPAS_scoreInequidad = function(aK,detFB,estAn){

    var score=0,n=0;

    var AI={situacionEconomica:['P71_dificultad','P71_mucha_dif'],

            entornoSaludable:['P4d_frio','P4d_calor'],apoyoSocial:['DUKE_bajo']};

    var UMBS=(typeof UMBRALES_INEQUIDAD!=='undefined')?UMBRALES_INEQUIDAD:[];

    var cA=AI[aK]||[];

    UMBS.forEach(function(um){

        if(cA.indexOf(um.codigo)===-1)return;

        var dV=detFB[um.codigo]; if(!dV)return;

        var v=typeof dV==='object'?parseFloat(dV.valor):parseFloat(dV);

        if(isNaN(v)||v<=um.umbral)return;

        score+=Math.min(1,(v/um.umbral-1)*0.5)*(v>um.umbral*1.5?1.0:0.6); n++;

    });

    if(estAn)estAn.forEach(function(e){

        if(!e||!e.areasDetectadas)return;

        var ae=e.areasDetectadas.find(function(a){return a.area===aK;});

        if(ae&&e.hallazgosEquidad.length){score+=e.calidad*0.25*e.hallazgosEquidad.length;n++;}

    });

    return n>0?Math.min(1,score/n):0;

};



window.COMPAS_scoreEvidencia = function(aK,estAn,infAn){

    var cs=[];

    var ap=function(est,esInf){

        if(!est||!est.areasDetectadas)return;

        var ae=est.areasDetectadas.find(function(a){return a.area===aK;}); if(!ae)return;

        var c=ae.confianza*(esInf?0.95:est.calidad);

        c*=(ae.direccion==='oportunidad'?1.0:ae.direccion==='fortaleza'?0.3:0.6);

        c*=({alta:1.3,media:1.0,baja:0.7}[ae.magnitud]||1.0);

        cs.push(Math.min(1,c));

    };

    if(infAn)ap(infAn,true);

    if(estAn)estAn.forEach(function(e){ap(e,false);});

    if(!cs.length)return 0;

    return parseFloat((cs.reduce(function(a,b){return a+b;},0)/cs.length).toFixed(3));

};



// COMPAS_scoreConvergencia v3.1

// Umbrales diferenciados por dimensión (justificación metodológica):

//   epi:     0.30 — desviación moderada respecto a referencia andaluza

//   ciudadano: 0.22 — 22% de votos sobre la línea EPVSA del área

//   inequidad: 0.20 — señal de inequidad aunque sea moderada

//   evidencia: 0.25 — hallazgo en estudio complementario con confianza ≥ 25%

window.COMPAS_scoreConvergencia = function(aK,sE,sC,sI,sV){

    var fP=[],divs=[];

    if(sE>0.30) fP.push('epidemiológica');

    if(sC>0.22) fP.push('ciudadana');

    if(sI>0.20) fP.push('inequidad');

    if(sV>0.25) fP.push('evidencia complementaria');



    // Divergencias (señales contradictorias entre fuentes — informativas, no errores)

    if(sE>0.55&&sC<0.15)

        divs.push('Problema epidemiológico significativo (epi=' + Math.round(sE*100) + '/100) con baja demanda ciudadana (' + Math.round(sC*100) + '/100). La ciudadanía puede no percibir o no priorizar este problema. Considerar acción de sensibilización antes de la intervención.');

    if(sC>0.55&&sE<0.20)

        divs.push('Alta demanda ciudadana (' + Math.round(sC*100) + '/100) sin señal epidemiológica fuerte (' + Math.round(sE*100) + '/100). Puede reflejar necesidades subjetivas no capturadas por los determinantes EAS o una percepción de riesgo elevada. Valorar complementar con datos cualitativos.');

    if(sV>0.60&&sE<0.20)

        divs.push('Los estudios complementarios señalan esta área (' + Math.round(sV*100) + '/100) pero los determinantes EAS no la detectan (' + Math.round(sE*100) + '/100). Posible infra-cobertura de los indicadores EAS para este fenómeno o población específica. El IBSE puede ser más sensible para colectivos concretos.');

    if(sI>0.60&&sC<0.20)

        divs.push('Inequidad significativa detectada (' + Math.round(sI*100) + '/100) sin correspondencia en la demanda ciudadana (' + Math.round(sC*100) + '/100). Los colectivos más desfavorecidos pueden tener menor capacidad de expresión en los procesos de priorización. Salvaguarda de equidad activa.');



    var n=fP.length;

    // Etiqueta de robustez: considera que con solo 3 fuentes disponibles (sin det)

    // ya 2 constituyen convergencia confirmada

    var etiqueta = n>=3 ? 'prioridad_robusta' : n>=2 ? 'prioridad_confirmada' : n===1 ? 'prioridad_debil' : 'sin_señal';



    return{

        score:      parseFloat((n>=4?1.0:n/4).toFixed(3)),

        fuentes:    fP,

        divergencias: divs,

        etiqueta:   etiqueta,

        nFuentes:   n

    };

};



window.COMPAS_scoreFactibilidad = function(aK,estAn){

    var base=0.50;

    var mLE=window.COMPAS_MAPEO_AREA_LE[aK];

    var pl=(typeof PLANTILLAS_SAL!=='undefined')?PLANTILLAS_SAL[aK]:null;

    var mt=(typeof MAPEO_TEMATICO_SAL!=='undefined')?MAPEO_TEMATICO_SAL[aK]:null;

    if(pl&&pl.activos&&pl.activos.length>0)base+=0.20;

    if(mt&&mt.programas&&mt.programas.length>=2)base+=0.15;

    if(mLE&&mLE.le.indexOf(5)>=0)base-=0.10;

    if(estAn&&estAn.some(function(e){return e&&e.areasDetectadas&&e.areasDetectadas.some(function(a){return a.area===aK;});}))base+=0.15;

    return parseFloat(Math.max(0.10,Math.min(0.95,base)).toFixed(3));

};



// ─── E. MOTOR PRINCIPAL v3 ───────────────────────────────────────────────────

window.COMPAS_analizarV3 = function(){

    var mId=(typeof getMunicipioActual!=='undefined')?getMunicipioActual():'';

    var nom=(typeof getNombreMunicipio!=='undefined')?getNombreMunicipio(mId):mId;

    var datos=window.datosMunicipioActual||{};

    var detFB=datos.determinantes||{};

    var refL=(typeof referenciasEAS!=='undefined')?referenciasEAS:{};

    var estrD=(typeof ESTRUCTURA_DETERMINANTES!=='undefined')?ESTRUCTURA_DETERMINANTES:{};

    var pop=(typeof normalizarParticipacion!=='undefined')?normalizarParticipacion(window.datosParticipacionCiudadana):null;

    var estudios=window.estudiosComplementarios||[];

    var P=window.COMPAS_PESOS_SFA;



    var av3={version:'v3',municipio:nom,fecha:new Date().toISOString(),

        fuentes:{tieneInforme:!!(datos.informe&&datos.informe.htmlCompleto),

                 tieneEstudios:estudios.length>0,

                 tienePopular:!!(pop&&(pop.temasFreq||pop.rankingObjetivos)),

                 tieneDet:Object.keys(detFB).length>0,

                 nEstudios:estudios.length,

                 nParticipantes:pop?(pop.totalParticipantes||pop.n||0):0},

        estudiosAnalizados:[],informeAnalizado:null,areaScores:{},prioridades:[],

        areasConDivergencia:[],propuestaEPVSA:[],conclusiones_v3:[],recomendaciones_v3:[],

        inequidades:[],sinDatos:false};



    if(!av3.fuentes.tieneInforme&&!av3.fuentes.tieneEstudios&&!av3.fuentes.tienePopular&&!av3.fuentes.tieneDet)

        {av3.sinDatos=true;av3.mensaje='Sin datos para análisis multicriterio.';return av3;}



    if(av3.fuentes.tieneInforme)

        av3.informeAnalizado=window.COMPAS_analizarTextoInforme(datos.informe.htmlCompleto);

    estudios.forEach(function(e){

        if(e&&e.texto){var a=window.COMPAS_analizarTextoEstudio(e.texto,e.nombre||'Estudio');if(a)av3.estudiosAnalizados.push(a);}

    });



    var AREAS=Object.keys(window.COMPAS_MAPEO_AREA_LE);

    var sfas=[];



    // ── Normalización score_impacto: calcular máximos reales antes del loop ──

    var _maxProgs=1, _maxActivos=1;

    AREAS.forEach(function(aK){

        var mt_=(typeof MAPEO_TEMATICO_SAL!=='undefined')?MAPEO_TEMATICO_SAL[aK]:null;

        var pl_=(typeof PLANTILLAS_SAL!=='undefined')?PLANTILLAS_SAL[aK]:null;

        if(mt_&&mt_.programas&&mt_.programas.length>_maxProgs) _maxProgs=mt_.programas.length;

        if(pl_&&pl_.activos&&pl_.activos.length>_maxActivos) _maxActivos=pl_.activos.length;

    });



    // ── PASADA 1: calcular scoreEpi raw para todas las áreas (para normalizar) ──

    var rawEpiMap={};

    if(av3.fuentes.tieneDet){

        AREAS.forEach(function(aK){

            rawEpiMap[aK]=window.COMPAS_scoreEpi(aK,detFB,refL,estrD);

        });

        // Normalización min-max entre áreas (hace los scores comparables entre sí)

        var epiVals=Object.values(rawEpiMap);

        var epiMin=Math.min.apply(null,epiVals);

        var epiMax=Math.max.apply(null,epiVals);

        var epiRng=epiMax-epiMin;

        // Solo normalizar si el rango es significativo (>0.08); si no, preservar valores

        if(epiRng>0.08){

            AREAS.forEach(function(aK){

                rawEpiMap[aK]=parseFloat(((rawEpiMap[aK]-epiMin)/epiRng).toFixed(4));

            });

        }

    }



    // ── PASADA 2: calcular todos los scores y construir SFA ──

    AREAS.forEach(function(aK){

        var _detalleEpi=[];

        var sE=av3.fuentes.tieneDet

            ? (window.COMPAS_scoreEpi(aK,detFB,refL,estrD,_detalleEpi), rawEpiMap[aK]||0)

            : 0;

        // (La segunda llamada popula _detalleEpi; rawEpiMap ya tiene el score normalizado)



        var sC=av3.fuentes.tienePopular?window.COMPAS_scoreCiudadano(aK,pop,sE):0;

        var sI=window.COMPAS_scoreInequidad(aK,detFB,av3.estudiosAnalizados);

        var sV=window.COMPAS_scoreEvidencia(aK,av3.estudiosAnalizados,av3.informeAnalizado);

        var conv=window.COMPAS_scoreConvergencia(aK,sE,sC,sI,sV);



        // Score impacto normalizado dinámicamente (sin hardcoding de máximos)

        var mt_imp=(typeof MAPEO_TEMATICO_SAL!=='undefined')?MAPEO_TEMATICO_SAL[aK]:null;

        var nProgs=mt_imp&&mt_imp.programas?mt_imp.programas.length:0;

        var pl_imp=(typeof PLANTILLAS_SAL!=='undefined')?PLANTILLAS_SAL[aK]:null;

        var nActivos=pl_imp&&pl_imp.activos?pl_imp.activos.length:0;

        var sImp=parseFloat(((nProgs/_maxProgs)*0.60+(nActivos/_maxActivos)*0.40).toFixed(3));



        // ── Fórmula SFA ──────────────────────────────────────────────────────

        var sfa=(P.epi||0.28)*sE

               +(P.ciudadano||0.22)*sC

               +(P.inequidad||0.20)*sI

               +(P.evidencia||0.15)*sV

               +(P.impacto||0.10)*sImp

               +(P.convergencia||0.05)*conv.score;



        // ── Salvaguardas (orden: más restrictiva primero) ─────────────────────

        var salvaguardasActivadas=[];



        // S1 — Inequidad crítica

        if(sI>0.80){

            sfa=Math.max(sfa,0.70);

            salvaguardasActivadas.push('S1: Inequidad crítica — SFA mínimo 0.70');

        }

        // S2 — Convergencia total (≥3 fuentes)

        if(conv.score>=0.75){

            sfa=Math.max(sfa,0.75);

            salvaguardasActivadas.push('S2: Convergencia total — SFA mínimo 0.75');

        }

        // S3 — Problema epidemiológico grave ignorado ciudadanamente

        if(sE>0.75&&sC<0.15){

            sfa=Math.max(sfa,0.65);

            salvaguardasActivadas.push('S3: Problema grave sin demanda ciudadana — SFA mínimo 0.65');

        }

        // S4 — IBSE señala alta magnitud en el área (nueva)

        var ibseAltaMag=av3.estudiosAnalizados.some(function(e){

            return e.tipoEstudio==='ibse'&&e.areasDetectadas.some(function(a){

                return a.area===aK&&a.magnitud==='alta'&&a.direccion==='oportunidad';

            });

        });

        if(ibseAltaMag&&sV>0.60){

            sfa=Math.max(sfa,0.70);

            salvaguardasActivadas.push('S4: IBSE señala alta magnitud — SFA mínimo 0.70');

        }



        sfa=parseFloat(Math.min(0.95,sfa).toFixed(3));



        // Ordenar _detalleEpi: primero oportunidades por magnitud (más relevantes arriba)

        _detalleEpi.sort(function(a,b){

            if(a.direccion!==b.direccion) return a.direccion==='oportunidad'?-1:1;

            return Math.abs(b.difPct)-Math.abs(a.difPct);

        });



        var entry={

            area:aK,

            nombre:window.COMPAS_MAPEO_AREA_LE[aK].desc,

            sfa:sfa,

            nivelPrioridad:sfa>=0.70?'alta':sfa>=0.45?'media':'baja',

            scores:{

                epi:        parseFloat(sE.toFixed(3)),

                ciudadano:  parseFloat(sC.toFixed(3)),

                inequidad:  parseFloat(sI.toFixed(3)),

                evidencia:  parseFloat(sV.toFixed(3)),

                impacto:    parseFloat(sImp.toFixed(3)),

                convergencia:parseFloat(conv.score.toFixed(3))

            },

            convergencia:         conv,

            lineasEPVSA:          window.COMPAS_MAPEO_AREA_LE[aK].le,

            detalleEpi:           _detalleEpi,          // indicadores EAS con valores reales

            salvaguardasActivadas:salvaguardasActivadas  // qué salvaguardas se aplicaron

        };

        av3.areaScores[aK]=entry; sfas.push(entry);

        conv.divergencias.forEach(function(d){

            av3.areasConDivergencia.push({area:aK,nombre:entry.nombre,divergencia:d});});

    });

    sfas.sort(function(a,b){return b.sfa-a.sfa;});

    av3.prioridades=sfas;



    // Inequidades

    var UMBS=(typeof UMBRALES_INEQUIDAD!=='undefined')?UMBRALES_INEQUIDAD:[];

    UMBS.forEach(function(um){

        var dV=detFB[um.codigo]; if(!dV)return;

        var v=typeof dV==='object'?parseFloat(dV.valor):parseFloat(dV);

        if(isNaN(v)||v<=um.umbral)return;

        av3.inequidades.push({codigo:um.codigo,mensaje:um.mensaje,valor:v,umbral:um.umbral,

            tipo:um.tipo,severidad:v>um.umbral*1.5?'alta':'moderada',

            exceso:parseFloat(((v/um.umbral-1)*100).toFixed(1))});

    });



    // Propuesta EPVSA v3 (IDs 1-5 únicamente)

    var leMap={};

    sfas.forEach(function(e){

        if(e.sfa<0.20)return;

        e.lineasEPVSA.forEach(function(leId){

            if(!leMap[leId])leMap[leId]={lineaId:leId,rels:0,areas:[],

                objs:new Set(),progs:new Set(),fuentes:new Set(),oC:false,oI:false,oE:false};

            var l=leMap[leId]; l.rels+=e.sfa/e.lineasEPVSA.length;

            l.areas.push({area:e.area,nombre:e.nombre,sfa:e.sfa});

            var mt2=(typeof MAPEO_TEMATICO_SAL!=='undefined')?MAPEO_TEMATICO_SAL[e.area]:null;

            if(mt2){if(mt2.objetivoEPVSA!==undefined)l.objs.add(mt2.objetivoEPVSA);

                    (mt2.programas||[]).forEach(function(p){l.progs.add(p);});}

            var mLE2=window.COMPAS_MAPEO_AREA_LE[e.area];

            if(mLE2&&mLE2.obj)mLE2.obj.forEach(function(o){l.objs.add(o);});

            if(e.scores.ciudadano>0.25){l.oC=true;l.fuentes.add('🗳️ Prioridad ciudadana');}

            if(e.scores.evidencia>0.25){

                if(av3.informeAnalizado){l.oI=true;l.fuentes.add('📄 Informe de situación');}

                if(av3.estudiosAnalizados.length){l.oE=true;l.fuentes.add('🔬 Estudios complementarios');}

            }

            if(e.scores.epi>0.25)l.fuentes.add('📊 Determinantes EAS');

        });

    });

    var maxR=Math.max.apply(null,Object.values(leMap).map(function(l){return l.rels;}))||1;

    av3.propuestaEPVSA=Object.values(leMap).map(function(l){

        var top3=l.areas.sort(function(a,b){return b.sfa-a.sfa;}).slice(0,3).map(function(a){return a.nombre;});

        return{lineaId:l.lineaId,relevancia:Math.round(l.rels/maxR*100),

               objetivos:Array.from(l.objs),programas:Array.from(l.progs),

               justificacion:'Áreas: '+top3.join(', '),

               origenCiudadano:l.oC,origenInforme:l.oI,origenEstudios:l.oE,

               fuentes:Array.from(l.fuentes).join(' · ')||'Motor multicriterio v3'};

    }).sort(function(a,b){return b.relevancia-a.relevancia;});



    var nFN=[av3.fuentes.tieneInforme,av3.fuentes.tieneEstudios,av3.fuentes.tienePopular].filter(Boolean).length;

    var iqC=av3.inequidades.filter(function(i){return i.severidad==='alta';}).length;

    if(!av3.propuestaEPVSA.find(function(p){return p.lineaId===3;})&&nFN>=1)

        av3.propuestaEPVSA.push({lineaId:3,relevancia:Math.min(70,40+nFN*10+(av3.fuentes.tienePopular?10:0)),

            objetivos:[0],programas:[0],justificacion:'Comunicación del diagnóstico y prioridades',

            origenCiudadano:false,fuentes:'EPVSA 2024-2030'});

    if(!av3.propuestaEPVSA.find(function(p){return p.lineaId===4;})&&(nFN>=2||iqC>0))

        av3.propuestaEPVSA.push({lineaId:4,relevancia:Math.min(65,35+nFN*8+iqC*5),

            objetivos:[0],programas:[0],justificacion:'Formación en áreas prioritarias'+(iqC?' (inequidades críticas)':''),

            origenCiudadano:false,fuentes:'EPVSA 2024-2030'});

    av3.propuestaEPVSA.sort(function(a,b){return b.relevancia-a.relevancia;});



    // Conclusiones v3

    var fU=[];

    if(av3.fuentes.tieneInforme)fU.push('Informe de Situación de Salud');

    if(av3.fuentes.nEstudios>0)fU.push(av3.fuentes.nEstudios+' estudio(s) complementario(s)');

    if(av3.fuentes.tienePopular)fU.push('priorización ciudadana ('+av3.fuentes.nParticipantes+' participantes)');

    if(av3.fuentes.tieneDet)fU.push('determinantes EAS');

    av3.conclusiones_v3.push({id:'contexto',tipo:'contexto',prioridad:1,fuerzaEvidencia:'alta',fuentes:fU,

        titulo:'Diagnóstico multicriterio',

        texto:'El análisis de '+nom+' integra '+fU.join(', ')+'. Pesos diferenciados: epidemiológico 30%, ciudadano 25%, inequidad 20%, evidencia complementaria 15%, convergencia 5%, factibilidad 5%.',

        implicacion:'Cada prioridad tiene distinto grado de robustez según cuántas fuentes independientes la señalan.'});

    var pA=av3.prioridades.filter(function(p){return p.nivelPrioridad==='alta';});

    if(pA.length)av3.conclusiones_v3.push({id:'prioridades_altas',tipo:'problema_prioritario',prioridad:2,fuerzaEvidencia:'alta',

        fuentes:['Motor multicriterio v3'],titulo:'Áreas de alta prioridad (SFA≥0.70)',

        texto:pA.length+' área(s): '+pA.map(function(p){return p.nombre+' ('+Math.round(p.sfa*100)+'/100)';}).join(', ')+'.',

        implicacion:'Asignación prioritaria de recursos en el Plan.'});

    var pR=av3.prioridades.filter(function(p){return p.convergencia.etiqueta==='prioridad_robusta';});

    if(pR.length)av3.conclusiones_v3.push({id:'convergencia',tipo:'hallazgo_reforzado',prioridad:3,fuerzaEvidencia:'muy_alta',

        fuentes:['Multi-fuente'],titulo:'Convergencia multi-fuente',

        texto:pR.length+' área(s) con señal en ≥3 fuentes: '+pR.map(function(p){return p.nombre;}).join(', ')+'.',

        implicacion:'Mayor validez y robustez de la priorización.'});

    av3.estudiosAnalizados.forEach(function(est){

        var oOp=est.areasDetectadas.filter(function(a){return a.direccion==='oportunidad';}).slice(0,3);

        var oAlt=est.areasDetectadas.filter(function(a){return a.magnitud==='alta'&&a.direccion==='oportunidad';});

        var esIBSE=est.tipoEstudio==='ibse';

        if(!oOp.length)return;



        // Construir texto rico con datos concretos

        var areasTexto=oOp.map(function(a){

            var nomArea=(window.COMPAS_MAPEO_AREA_LE[a.area]||{desc:a.area}).desc;

            var prevStr=a.prevalencia!==null&&a.prevalencia!==undefined?' ('+a.prevalencia+'%)':'';

            var magStr=a.magnitud==='alta'?'⚠️ magnitud alta':'magnitud '+a.magnitud;

            return nomArea+prevStr+' ['+magStr+']';

        }).join('; ');



        var extractosTexto='';

        oOp.filter(function(a){return a.extracto;}).slice(0,2).forEach(function(a){

            var nomArea=(window.COMPAS_MAPEO_AREA_LE[a.area]||{desc:a.area}).desc;

            extractosTexto+=' Sobre '+nomArea+': «'+a.extracto.slice(0,150)+'».';

        });



        var colectivosTexto=est.colectivosDetectados.length?' El estudio identifica especialmente a: '+est.colectivosDetectados.join(', ')+'.':'';

        var equidadTexto=est.hallazgosEquidad.length?' Desigualdades detectadas: '+est.hallazgosEquidad.slice(0,1).join(' '):'';

        var altaMagTexto=oAlt.length?' '+oAlt.length+' área(s) con hallazgo de magnitud ALTA.':'';



        var fuerza=esIBSE?'alta':'media';

        var prioridad=esIBSE?(oAlt.length?2:3):4; // IBSE con alta magnitud sube a prioridad 2



        av3.conclusiones_v3.push({

            id:              'estudio_'+est.nombre.replace(/\s+/g,'_').slice(0,30),

            tipo:            esIBSE?'hallazgo_ibse':'hallazgo_complementario',

            prioridad:       prioridad,

            fuerzaEvidencia: fuerza,

            fuentes:         [est.nombre+' ('+est.tipoEstudio+', calidad='+est.calidad+')'],

            titulo:          (esIBSE?'🔬 IBSE — ':'📄 ')+est.nombre,

            texto:           est.nombre+' analiza '+est.longitudTexto.toLocaleString()+' caracteres de texto y señala:'

                            +' '+areasTexto+'.'+altaMagTexto+colectivosTexto+equidadTexto+extractosTexto,

            implicacion:     (esIBSE&&oAlt.length

                             ?'Hallazgo de IBSE con alta magnitud: intervención prioritaria en los colectivos y entornos identificados.'

                             :'Integrar los hallazgos en el diseño de actuaciones, adaptándolas a los colectivos detectados.')

        });

    });

    if(av3.inequidades.length){

        var iA=av3.inequidades.filter(function(i){return i.severidad==='alta';});

        av3.conclusiones_v3.push({id:'inequidades',tipo:'desigualdad',prioridad:2,fuerzaEvidencia:'alta',

            fuentes:['EAS','UMBRALES_INEQUIDAD'],titulo:'Alertas de inequidad',

            texto:av3.inequidades.length+' indicador(es) sobre umbral'+(iA.length?'. Alta severidad: '+iA.map(function(i){return i.mensaje+' ('+i.valor.toFixed(1)+'%, exceso '+i.exceso+'%)';}).join(', '):'')+'.', implicacion:'Universalismo proporcional en todas las actuaciones.'});

    }

    if(av3.areasConDivergencia.length)av3.conclusiones_v3.push({id:'divergencias',tipo:'discrepancia',prioridad:5,fuerzaEvidencia:'media',

        fuentes:['Análisis de convergencia'],titulo:'Discrepancias entre fuentes',

        texto:av3.areasConDivergencia.length+' divergencia(s): '+av3.areasConDivergencia.slice(0,2).map(function(d){return d.nombre+': '+d.divergencia;}).join(' | '),

        implicacion:'Requiere deliberación del Grupo Motor. No son errores sino complejidad real.'});

    av3.conclusiones_v3.sort(function(a,b){return a.prioridad-b.prioridad;});



    // Recomendaciones v3

    // Entornos de intervención según colectivos identificados por IBSE

    var _IBSE_ENTORNOS={

        infancia:     ['centros de Educación Infantil y Primaria (CEIP)','AMPA','comedores escolares','espacios de juego'],

        adolescencia: ['Institutos de Educación Secundaria (IES)','espacios juveniles','centros cívicos','entornos digitales'],

        mayores:      ['centros de mayores','consultas de Atención Primaria','servicios sociales comunitarios','hogares del pensionista'],

        mujeres:      ['servicios de atención a la mujer','centros de salud','asociaciones de mujeres','entornos laborales'],

        discapacidad: ['servicios de integración social','centros de día','entornos comunitarios accesibles']

    };



    av3.prioridades.filter(function(p){return p.sfa>0.40;}).slice(0,6).forEach(function(e,idx){

        var pl=(typeof PLANTILLAS_SAL!=='undefined')?PLANTILLAS_SAL[e.area]:null;

        var mLE3=window.COMPAS_MAPEO_AREA_LE[e.area];

        var activos=pl?(pl.activos||[]).slice(0,3):[];

        var texOp=pl?(e.scores.epi>0.50?pl.oportunidad:pl.fortaleza)||'':'';

        var tipo=e.scores.inequidad>0.50?'orientada_equidad':e.convergencia.etiqueta==='prioridad_robusta'?'intersectorial':e.scores.ciudadano>0.50?'participativa':'estructural';

        var urg=e.sfa>=0.75||e.scores.inequidad>0.70?'alta':e.sfa>=0.55?'media':'baja';



        var fR=[];

        if(e.scores.epi>0.30)     fR.push('Determinantes EAS');

        if(e.scores.ciudadano>0.20)fR.push('Participación ciudadana');

        if(e.scores.evidencia>0.20)fR.push('Estudios complementarios');

        if(e.scores.inequidad>0.20)fR.push('Indicadores de inequidad');



        // Enriquecer con hallazgos IBSE específicos del área

        var _ibseArea=av3.estudiosAnalizados.filter(function(est){

            return est.areasDetectadas&&est.areasDetectadas.some(function(a){return a.area===e.area;});

        });

        var ibseColectivos=[]; var ibseEntornos=[]; var ibseExtractos=[]; var ibsePrev=[];

        _ibseArea.forEach(function(est){

            var aEst=est.areasDetectadas.find(function(a){return a.area===e.area;});

            if(!aEst)return;

            est.colectivosDetectados.forEach(function(c){if(ibseColectivos.indexOf(c)<0)ibseColectivos.push(c);});

            if(aEst.extracto)ibseExtractos.push(est.nombre+': «'+aEst.extracto.slice(0,120)+'»');

            if(aEst.prevalencia!==null&&aEst.prevalencia!==undefined)ibsePrev.push(est.nombre+': '+aEst.prevalencia+'%');

        });

        ibseColectivos.forEach(function(c){

            (_IBSE_ENTORNOS[c]||[]).forEach(function(env){if(ibseEntornos.indexOf(env)<0)ibseEntornos.push(env);});

        });



        // Construir texto operativo enriquecido

        var textoBase=texOp||'Desarrollar actuaciones en '+e.nombre+'.';

        var textoIBSE='';

        if(ibseColectivos.length)

            textoIBSE+=' El IBSE identifica especialmente: '+ibseColectivos.join(', ')+'.';

        if(ibseEntornos.length)

            textoIBSE+=' Entornos prioritarios de intervención: '+ibseEntornos.slice(0,3).join(', ')+'.';

        if(ibsePrev.length)

            textoIBSE+=' Prevalencias detectadas en estudios: '+ibsePrev.join('; ')+'.';

        var textoActivos=activos.length?' Activos comunitarios disponibles: '+activos.join(', ')+'.':'';

        var textoLineas=' Líneas EPVSA: LE'+(mLE3?mLE3.le.join(', LE'):'—')+'.';



        // Indicadores de seguimiento específicos del área

        var mt_rec=(typeof MAPEO_TEMATICO_SAL!=='undefined')?MAPEO_TEMATICO_SAL[e.area]:null;

        var indSeguimiento=mt_rec?(mt_rec.determinantes||[]).slice(0,3).map(function(c){return 'EAS '+c;}):[];



        av3.recomendaciones_v3.push({

            id:                  'rec_'+e.area,

            area:                e.area,

            problema:            e.nombre,

            sfa:                 e.sfa,

            prioridad:           idx+1,

            urgencia:            urg,

            tipoActuacion:       tipo,

            lineasEPVSA:         'LE'+(mLE3?mLE3.le.join(', LE'):'—'),

            fuentes:             fR,

            convergencia:        e.convergencia.etiqueta,

            activos:             activos,

            ibseColectivos:      ibseColectivos,

            ibseEntornos:        ibseEntornos,

            ibseExtractos:       ibseExtractos,

            ibsePrev:            ibsePrev,

            indicadoresSeguimiento: indSeguimiento,

            horizonteTemporal:   urg==='alta'?'corto plazo (0-12 meses)':'medio plazo (12-36 meses)',

            contribucionEquidad: e.scores.inequidad>0.30,

            salvaguardasActivadas: e.salvaguardasActivadas||[],

            textoOperativo:      textoBase+textoIBSE+textoActivos+textoLineas,

            justificacion:       'SFA='+Math.round(e.sfa*100)+'/100 (Epi:'+Math.round(e.scores.epi*100)+

                                 ', Ciu:'+Math.round(e.scores.ciudadano*100)+

                                 ', Ineq:'+Math.round(e.scores.inequidad*100)+

                                 ', Evid:'+Math.round(e.scores.evidencia*100)+

                                 ', Impacto:'+Math.round(e.scores.impacto*100)+

                                 '). '+e.convergencia.etiqueta+'.'

        });

    });

    if(av3.inequidades.length)av3.recomendaciones_v3.push({id:'rec_equidad',area:'transversal',problema:'Equidad en salud',prioridad:0,urgencia:'alta',

        tipoActuacion:'orientada_equidad',lineasEPVSA:'LE2',fuentes:['EAS'],contribucionEquidad:true,

        horizonteTemporal:'corto plazo (0-12 meses)',

        textoOperativo:'Universalismo proporcional. Indicadores desagregados por sexo, edad, nivel socioeconómico. Alertas activas: '+av3.inequidades.map(function(i){return i.mensaje;}).join(', ')+'.',

        justificacion:av3.inequidades.length+' alertas de inequidad activas.'});

    av3.recomendaciones_v3.push({id:'rec_relas',area:'gobernanza',problema:'Gobernanza participativa',prioridad:av3.recomendaciones_v3.length+1,

        urgencia:'media',tipoActuacion:'participativa',lineasEPVSA:'',fuentes:['EPVSA 2024-2030'],contribucionEquidad:false,

        horizonteTemporal:'corto plazo',

        textoOperativo:'Consolidar RELAS como estructura intersectorial de implementación y evaluación participativa.',

        justificacion:'Mandato EPVSA 2024-2030.'});

    av3.recomendaciones_v3.sort(function(a,b){return a.prioridad-b.prioridad;});



    return av3;

};



// ─── F. EXPLICABILIDAD ───────────────────────────────────────────────────────

// COMPAS_explicarPrioridad v3.1 — datos EAS reales + salvaguardas + divergencias descriptivas

window.COMPAS_explicarPrioridad = function(areaKey){

    var av3=window.analisisActualV3;

    if(!av3||!av3.areaScores[areaKey])return '<p style="color:#94a3b8;font-size:.85rem;">Sin análisis v3 disponible. Genera el análisis primero.</p>';

    var e=av3.areaScores[areaKey]; var s=e.scores; var P=window.COMPAS_PESOS_SFA;



    var html='<div style="font-size:.84rem;line-height:1.55;max-height:480px;overflow-y:auto;">';

    var colSFA=e.sfa>=0.70?'#dc2626':e.sfa>=0.45?'#d97706':'#059669';



    // ── Encabezado ────────────────────────────────────────────────────────────

    html+='<div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.9rem;">'

        +'<div style="font-weight:800;font-size:.95rem;color:#1e293b;flex:1">'+e.nombre+'</div>'

        +'<div style="background:'+colSFA+'15;border:1.5px solid '+colSFA+';border-radius:8px;padding:.3rem .75rem;font-size:.82rem;font-weight:700;color:'+colSFA+';">'

        +Math.round(e.sfa*100)+'/100 — '+e.nivelPrioridad.toUpperCase()+'</div></div>';



    // ── Barras de scores con contribución real al SFA ─────────────────────────

    html+='<div style="margin-bottom:.85rem;">';

    [{k:'epi',l:'Epidemiológico',w:P.epi||0.28,col:'#0074c8'},

     {k:'ciudadano',l:'Ciudadano',w:P.ciudadano||0.22,col:'#7c3aed'},

     {k:'inequidad',l:'Inequidad',w:P.inequidad||0.20,col:'#dc2626'},

     {k:'evidencia',l:'Evidencia complementaria',w:P.evidencia||0.15,col:'#059669'},

     {k:'impacto',l:'Impacto potencial',w:P.impacto||0.10,col:'#10b981'},

     {k:'convergencia',l:'Convergencia',w:P.convergencia||0.05,col:'#d97706'}

    ].forEach(function(d){

        var v=s[d.k]||0; var pc=Math.round(v*100); var contrib=Math.round(d.w*v*100);

        html+='<div style="margin-bottom:.3rem">'

            +'<div style="display:flex;justify-content:space-between;font-size:.72rem;color:#64748b;">'

            +'<span>'+d.l+' (w='+Math.round(d.w*100)+'%)</span>'

            +'<span style="font-weight:600;color:#1e293b;">'+pc+'/100 &rarr; <span style="color:'+d.col+'">'+contrib+' pts</span></span></div>'

            +'<div style="height:6px;background:#f1f5f9;border-radius:3px;">'

            +'<div style="height:100%;width:'+Math.min(100,pc)+'%;background:'+d.col+';border-radius:3px;"></div></div></div>';

    });

    html+='</div>';



    // ── Datos EAS reales (detalleEpi) ─────────────────────────────────────────

    if(e.detalleEpi&&e.detalleEpi.length){

        html+='<div style="margin-bottom:.75rem;">'

            +'<div style="font-size:.72rem;font-weight:700;color:#0074c8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.4rem;">📊 Indicadores EAS que sustentan el score epidemiológico</div>';

        e.detalleEpi.filter(function(d){return d.direccion==='oportunidad';}).slice(0,4).forEach(function(ind){

            var colMag=ind.magnitud==='severa'?'#dc2626':ind.magnitud==='notable'?'#d97706':'#94a3b8';

            html+='<div style="display:flex;align-items:center;gap:.4rem;padding:.3rem .5rem;background:#fef2f2;border-radius:5px;margin-bottom:.2rem;">'

                +'<span style="font-size:.63rem;font-weight:700;color:'+colMag+';min-width:48px;text-align:center;background:'+colMag+'20;padding:.1rem .3rem;border-radius:3px;">'+ind.magnitud.toUpperCase()+'</span>'

                +'<span style="flex:1;font-size:.74rem;color:#1e293b;">'+ind.texto+'</span>'

                +'<span style="font-size:.71rem;color:'+colMag+';font-weight:700;white-space:nowrap;">'+ind.valor+'% vs '+ind.refAndalucia+'% Andc ('+ind.difPct+'%)</span>'

                +'</div>';

        });

        e.detalleEpi.filter(function(d){return d.direccion==='fortaleza';}).slice(0,2).forEach(function(ind){

            html+='<div style="display:flex;align-items:center;gap:.4rem;padding:.25rem .5rem;background:#f0fdf4;border-radius:5px;margin-bottom:.2rem;">'

                +'<span style="font-size:.63rem;font-weight:700;color:#059669;min-width:48px;text-align:center;background:#dcfce7;padding:.1rem .3rem;border-radius:3px;">ACTIVO</span>'

                +'<span style="flex:1;font-size:.74rem;color:#1e293b;">'+ind.texto+'</span>'

                +'<span style="font-size:.71rem;color:#059669;font-weight:700;white-space:nowrap;">'+ind.valor+'% vs '+ind.refAndalucia+'% Andc</span>'

                +'</div>';

        });

        html+='</div>';

    } else if(s.epi>0){

        html+='<div style="font-size:.75rem;color:#94a3b8;margin-bottom:.6rem;">ℹ️ Score epidemiológico calculado (referencias EAS no disponibles para desglose individual).</div>';

    }



    // ── Convergencia ──────────────────────────────────────────────────────────

    if(e.convergencia.fuentes&&e.convergencia.fuentes.length){

        html+='<div style="padding:.4rem .65rem;background:#eff6ff;border-left:3px solid #3b82f6;border-radius:0 6px 6px 0;font-size:.76rem;margin-bottom:.3rem;">'

            +'✅ <b>Convergencia ('+e.convergencia.nFuentes+' fuentes):</b> '+e.convergencia.fuentes.join(', ')

            +' — <i>'+e.convergencia.etiqueta+'</i></div>';

    }



    // ── Divergencias (descriptivas) ───────────────────────────────────────────

    if(e.convergencia.divergencias&&e.convergencia.divergencias.length){

        e.convergencia.divergencias.forEach(function(d){

            html+='<div style="padding:.4rem .65rem;background:#fff7ed;border-left:3px solid #f97316;border-radius:0 6px 6px 0;font-size:.75rem;margin-bottom:.3rem;line-height:1.45;">⚠️ '+d+'</div>';

        });

    }



    // ── Salvaguardas activadas ────────────────────────────────────────────────

    if(e.salvaguardasActivadas&&e.salvaguardasActivadas.length){

        html+='<div style="padding:.4rem .65rem;background:#fdf4ff;border-left:3px solid #a855f7;border-radius:0 6px 6px 0;font-size:.75rem;margin-bottom:.3rem;">'

            +'🛡️ <b>Salvaguardas activadas:</b> '+e.salvaguardasActivadas.join(' | ')+'</div>';

    }



    html+='</div>';

    return html;

};



// ─── G. INTEGRACIÓN SIN ROMPER EL SISTEMA EXISTENTE ─────────────────────────

// [AUDIT] COMPAS_ejecutarMotorV3:

//   - Los campos _v3_prioridades, _v3_conclusiones, _v3_recomendaciones, _v3_propuestaEPVSA,

//     _v3_divergencias y _v3_estudiosAn son de uso interno/debug: ninguna UI principal los lee.

//   - alertasInequidad se sobreescribe con la versión v3 (puede diferir de la v2).

//   - Si propuestaEPVSA contiene lineaId fuera de [1,2,3,4,5], se reemplaza por av3.propuestaEPVSA.

//     Tras ese reemplazo, trazabilidad.propuesta_por_linea y cadena_completa[].lineas_epvsa

//     se resincronizan con la propuesta v3 (ver bloque resync inline).

//     Los campos fuentes_activas, conclusiones_por_fuente y recomendaciones_por_conclusion

//     no dependen de propuestaEPVSA y no se tocan.

window.COMPAS_ejecutarMotorV3 = function(){

    try{

        var av3=window.COMPAS_analizarV3();

        window.analisisActualV3=av3;

        // [MUTACIÓN PARCIAL — window.analisisActual] Enriquece el objeto existente con campos v3.

        // Campos añadidos: _v3_prioridades, _v3_conclusiones, _v3_recomendaciones,

        //   _v3_propuestaEPVSA, _v3_divergencias, _v3_estudiosAn (debug/interno).

        // Campos sobreescritos: alertasInequidad (reemplaza versión v2).

        // Escritura condicional: propuestaEPVSA (solo si contiene IDs fuera de [1-5]).

        // LECTURAS posteriores afectadas: eval_actualizarResultados, getSeñalLinea,

        //   generarSeccionPriorizacion, PDF generation.

        if(!av3.sinDatos&&window.analisisActual){

            window.analisisActual._v3_prioridades    =av3.prioridades;

            window.analisisActual._v3_conclusiones   =av3.conclusiones_v3;

            window.analisisActual._v3_recomendaciones=av3.recomendaciones_v3;

            window.analisisActual._v3_propuestaEPVSA =av3.propuestaEPVSA;

            window.analisisActual._v3_divergencias   =av3.areasConDivergencia;

            window.analisisActual._v3_estudiosAn     =av3.estudiosAnalizados;

            window.analisisActual.alertasInequidad   =av3.inequidades;

            // Reparar IDs inválidos (>5) en propuesta EPVSA del motor v2

            var leV=[1,2,3,4,5];

            if(window.analisisActual.propuestaEPVSA&&

               window.analisisActual.propuestaEPVSA.some(function(p){return leV.indexOf(p.lineaId)===-1;})){

                window.analisisActual.propuestaEPVSA=av3.propuestaEPVSA;

                console.warn('COMPÁS v3: IDs inválidos en propuesta v2 — reemplazada por v3.');

                // ── Resincronización mínima de trazabilidad ───────────────────────────

                // Solo se actualizan los subcampos derivados de propuestaEPVSA.

                // fuentes_activas, conclusiones_por_fuente y recomendaciones_por_conclusion

                // no dependen de propuestaEPVSA y permanecen sin cambio.

                if(window.analisisActual.trazabilidad){

                    var _traza=window.analisisActual.trazabilidad;

                    var _propV3=av3.propuestaEPVSA;

                    // Reconstruir propuesta_por_linea desde la propuesta v3

                    var _ppl={};

                    _propV3.forEach(function(p){

                        _ppl['LE'+p.lineaId]={

                            relevancia:    p.relevancia,

                            fuentes:       p.fuentes||'',

                            conclusion_ids:[] // v3 no genera enlaces conclusión→línea

                        };

                    });

                    _traza.propuesta_por_linea=_ppl;

                    // Reconstruir lineas_epvsa en cadena_completa

                    // v3 no vincula conclusiones a líneas EPVSA (sin conclusion_ids),

                    // por lo que lineas_epvsa queda [] para todas: es el estado honesto.

                    if(Array.isArray(_traza.cadena_completa)){

                        _traza.cadena_completa.forEach(function(entrada){

                            entrada.lineas_epvsa=_propV3

                                .filter(function(p){return(p.conclusion_ids||[]).indexOf(entrada.conclusion_id)!==-1;})

                                .map(function(p){return 'LE'+p.lineaId;});

                        });

                    }

                    // Marca de origen y timestamp de resincronización

                    _traza.origen_propuesta_actual='v3';

                    _traza.fecha_resincronizacion=new Date().toISOString();

                }

                // ─────────────────────────────────────────────────────────────────────

            }

        }

        var nPA=av3.prioridades.filter(function(p){return p.nivelPrioridad==='alta';}).length;

        console.log('✅ Motor v3: '+av3.municipio+' | prioAltas:'+nPA+' | divg:'+av3.areasConDivergencia.length+' | estudiosAn:'+av3.estudiosAnalizados.length+' | concl:'+av3.conclusiones_v3.length);

        return av3;

    }catch(e){console.error('Motor v3 error:',e);return null;}

};



// Hook: ejecutar v3 después de generarAnalisisIA

window.addEventListener('load',function(){

    if(typeof generarAnalisisIA==='function'&&!window._COMPAS_v3_hooked){

        var _orig=generarAnalisisIA;

        window.generarAnalisisIA=function(){_orig.apply(this,arguments);setTimeout(window.COMPAS_ejecutarMotorV3,900);};

        window._COMPAS_v3_hooked=true;

        console.log('✅ COMPÁS v3 hook activado sobre generarAnalisisIA.');

    }

});



// Exponer en namespace COMPAS para debugging desde consola

if(window.COMPAS){window.COMPAS.v3={

    analizar:window.COMPAS_analizarV3,

    ejecutar:window.COMPAS_ejecutarMotorV3,

    explicar:window.COMPAS_explicarPrioridad,

    analizarEstudio:window.COMPAS_analizarTextoEstudio,

    analizarInforme:window.COMPAS_analizarTextoInforme,

    pesos:{sfa:window.COMPAS_PESOS_SFA,tipoDato:window.COMPAS_PESOS_TIPO_DATO},

    mapeos:{areaLE:window.COMPAS_MAPEO_AREA_LE,vrelasLE:window.COMPAS_VRELAS_A_LE}

};}



})(); // fin IIFE

</script>





<!-- ═══════════════════════════════════════════════════════════════════

     MODO ENCUESTA (CIUDADANOS) — se muestra cuando la URL lleva ?v=xxx

     Requiere: initEncuestaMode() en DOMContentLoaded

     ═══════════════════════════════════════════════════════════════════ -->

<div id="encuesta-mode" style="display:none;min-height:100vh;background:linear-gradient(135deg,#0074c815,#00acd915);font-family:system-ui,sans-serif;">



  <!-- Cabecera de la encuesta -->

  <div class="header" style="background:linear-gradient(135deg,#0074c8,#00acd9);padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1rem;box-shadow:0 2px 8px rgba(0,116,200,.3);">

    <div style="width:40px;height:40px;background:rgba(255,255,255,.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🗳️</div>

    <div>

      <h1 style="margin:0;color:white;font-size:1.25rem;font-weight:800;">⚖️ Votación popular</h1>

      <p style="margin:0;color:rgba(255,255,255,.8);font-size:.8rem;" id="encuesta-municipio-label">Plan local de salud</p>

    </div>

    <div style="margin-left:auto;background:rgba(255,255,255,.15);padding:.3rem .75rem;border-radius:20px;color:white;font-size:.75rem;font-weight:600;">🔒 Voto anónimo</div>

  </div>



  <!-- Barra de progreso -->

  <div style="background:rgba(0,0,0,.08);height:6px;width:100%;">

    <div id="encuesta-progress-bar" style="height:100%;background:linear-gradient(90deg,#94d40b,#00acd9);width:0%;transition:width .4s ease;border-radius:0 3px 3px 0;"></div>

  </div>



  <!-- Contenido principal -->

  <div style="max-width:680px;margin:0 auto;padding:2rem 1.25rem;">



    <!-- Intro card -->

    <div style="background:white;border-radius:14px;padding:1.5rem;margin-bottom:1.5rem;box-shadow:0 2px 12px rgba(0,0,0,.08);border:1px solid #e2e8f0;">

      <div style="font-size:1.5rem;margin-bottom:.75rem;">🏘️</div>

      <h2 style="margin:0 0 .5rem;color:#1e293b;font-size:1.1rem;font-weight:700;">¿Sobre qué temas de salud debería actuar tu Ayuntamiento?</h2>

      <p style="margin:0;color:#64748b;font-size:.9rem;line-height:1.55;">Tu opinión es importante para diseñar el <strong>Plan local de salud</strong>. Esta votación es anónima y tarda menos de 2 minutos.</p>

    </div>



    <!-- Área de preguntas (dinámica) -->

    <div id="encuesta-contenido" style="background:white;border-radius:14px;padding:1.5rem;box-shadow:0 2px 12px rgba(0,0,0,.08);border:1px solid #e2e8f0;min-height:200px;">

      <!-- Renderizado por renderizarEncuesta() -->

      <div style="text-align:center;color:#94a3b8;padding:2rem;">

        <div style="font-size:2rem;margin-bottom:.5rem;">⏳</div>

        <p>Cargando formulario...</p>

      </div>

    </div>



  </div><!-- /max-width -->



</div><!-- /#encuesta-mode -->









<!-- ══════════════════════════════════════════════════════════════

     MONITOR IBSE — Modal embebido en COMPÁS

     Fuente: algoritmo Bericat (2014) / Encuesta Andaluza de Salud

     Firebase: ibse_respuestas/{municipio}/{pushId}  (COMPAS path)

             | ibse_monitor/{municipio}/{pushId}      (legacy path)

     ══════════════════════════════════════════════════════════════ -->

<div id="modal-ibse-monitor" style="display:none;position:fixed;inset:0;z-index:100010;background:rgba(15,23,42,.75);backdrop-filter:blur(4px);overflow-y:auto;padding:1rem;">

  <div style="max-width:860px;margin:0 auto;background:white;border-radius:14px;box-shadow:0 24px 80px rgba(0,0,0,.3);overflow:hidden;">



    <!-- Cabecera -->

    <div style="background:linear-gradient(135deg,#0074c8,#00acd9);padding:1.25rem 1.5rem;display:flex;justify-content:space-between;align-items:center;">

      <div>

        <h2 style="margin:0;color:white;font-size:1.15rem;font-weight:800;">🔬 Monitor IBSE — Índice de Bienestar Socioemocional</h2>

        <p style="margin:.2rem 0 0;color:rgba(255,255,255,.8);font-size:.78rem;">Algoritmo Bericat (2014) · Encuesta Andaluza de Salud 2023 · 4 factores</p>

      </div>

      <button onclick="ibseMonitor_cerrar()" style="background:rgba(255,255,255,.2);border:none;color:white;width:34px;height:34px;border-radius:50%;font-size:1rem;cursor:pointer;">✕</button>

    </div>



    <!-- Indicador municipio -->

    <div style="background:#f0f9ff;border-bottom:1px solid #e2e8f0;padding:.6rem 1.5rem;font-size:.82rem;color:#0369a1;">

      <span id="ibseMon-mun-label">Cargando datos...</span>

      <span id="ibseMon-firebase-path" style="float:right;color:#94a3b8;font-size:.72rem;"></span>

    </div>



    <!-- Contenido principal -->

    <div style="padding:1.25rem 1.5rem;">



      <!-- Tarjetas KPI -->

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.75rem;margin-bottom:1.25rem;">

        <div style="background:#f0f9ff;border-radius:10px;padding:.9rem;text-align:center;border:1px solid #bae6fd;">

          <div style="font-size:.7rem;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:.04em;">N</div>

          <div id="ibseMon-n" style="font-size:1.8rem;font-weight:900;color:#0074c8;">—</div>

        </div>

        <div style="background:#ede9fe;border-radius:10px;padding:.9rem;text-align:center;border:1px solid #c4b5fd;">

          <div style="font-size:.7rem;font-weight:700;color:#6d28d9;text-transform:uppercase;letter-spacing:.04em;">IBSE Global</div>

          <div id="ibseMon-media" style="font-size:1.8rem;font-weight:900;color:#7c3aed;">—</div>

        </div>

        <div style="background:#f0fdf4;border-radius:10px;padding:.9rem;text-align:center;border:1px solid #86efac;">

          <div style="font-size:.7rem;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.04em;">Vínculo</div>

          <div id="ibseMon-vinculo" style="font-size:1.8rem;font-weight:900;color:#16a34a;">—</div>

        </div>

        <div style="background:#fffbeb;border-radius:10px;padding:.9rem;text-align:center;border:1px solid #fcd34d;">

          <div style="font-size:.7rem;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.04em;">Situación</div>

          <div id="ibseMon-situacion" style="font-size:1.8rem;font-weight:900;color:#d97706;">—</div>

        </div>

        <div style="background:#fff7ed;border-radius:10px;padding:.9rem;text-align:center;border:1px solid #fdba74;">

          <div style="font-size:.7rem;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:.04em;">Control</div>

          <div id="ibseMon-control" style="font-size:1.8rem;font-weight:900;color:#ea580c;">—</div>

        </div>

        <div style="background:#fdf4ff;border-radius:10px;padding:.9rem;text-align:center;border:1px solid #e9d5ff;">

          <div style="font-size:.7rem;font-weight:700;color:#7e22ce;text-transform:uppercase;letter-spacing:.04em;">Persona</div>

          <div id="ibseMon-persona" style="font-size:1.8rem;font-weight:900;color:#9333ea;">—</div>

        </div>

      </div>



      <!-- Semáforo + barra -->

      <div id="ibseMon-semaforo" style="margin-bottom:1.25rem;"></div>



      <!-- Distribución por sexo -->

      <div id="ibseMon-sexo" style="margin-bottom:1.25rem;"></div>



      <!-- Interpretación textual -->

      <div id="ibseMon-analisis" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:1rem;margin-bottom:1.25rem;font-size:.85rem;line-height:1.65;color:#334155;"></div>



      <!-- Aviso sin datos -->

      <div id="ibseMon-sin-datos" style="display:none;text-align:center;padding:2.5rem 1rem;color:#94a3b8;">

        <div style="font-size:3rem;margin-bottom:.75rem;">🔬</div>

        <p style="font-weight:600;color:#475569;margin:0 0 .4rem;">Sin datos IBSE para este municipio</p>

        <p style="font-size:.82rem;margin:0;">Los datos se cargan automáticamente desde Firebase cuando están disponibles.<br>

        También puedes cargar un archivo CSV en <strong>⚙️ Gestionar fuentes → Estudios complementarios</strong>.</p>

      </div>



    </div><!-- /contenido -->



    <!-- Footer -->

    <div style="padding:.85rem 1.5rem;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;background:#f8fafc;flex-wrap:wrap;gap:.5rem;">

      <span style="font-size:.72rem;color:#94a3b8;">IBSE: P.57b (deprimido, feliz, solo, disfrutar, energía, tranquilo) + P.57c (optimista, bien consigo mismo) · EAS 2023</span>

      <button onclick="ibseMonitor_cerrar()" style="padding:.5rem 1.25rem;background:linear-gradient(135deg,#0074c8,#00acd9);color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:.85rem;">Cerrar</button>

    </div>



  </div>

</div>



<script>

// ══════════════════════════════════════════════════════════════

// MONITOR IBSE — funciones JS embebidas en COMPÁS

// ══════════════════════════════════════════════════════════════

// [ESTADO DE SESIÓN / MONITOR — IBSE] Estado del monitor IBSE en tiempo real.

// ibseMonitor_listener es un handle Firebase; limpiar al cerrar modal o cambiar municipio.

var ibseMonitor_respuestas = [];

var ibseMonitor_listener   = null;




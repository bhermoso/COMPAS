/**
 * COMPÁS — Generador de narrativa salutogénica
 * core/narrativa/generarNarrativaSalutogenica.js
 *
 * Extraído de COMPAS.html el 2026-03-14 — E1 PLAN_TRANSICION_MONOLITO.md
 *
 *   generarNarrativaSalutogenica() — COMPAS.html L.19012–L.19386
 *   PLANTILLAS_SALUTOGENICAS       — COMPAS.html L.19436–L.19584
 *   PATRONES_SALUTOGENICOS         — COMPAS.html L.19590–L.19656
 *
 * NOTA: En COMPAS.html estas constantes están definidas DESPUÉS de la función
 * (L.19436 y L.19590). Aquí se definen antes para que el módulo sea autocontenido.
 * El comportamiento en runtime es idéntico.
 *
 * MÓDULO PURO: Sin DOM. Sin Firebase. Sin efectos secundarios.
 */

// ── Plantillas salutogénicas por área ────────────────────────────────────────

const PLANTILLAS_SALUTOGENICAS = {

    bienestarEmocional: {

        nombre: 'Bienestar emocional',

        contexto: 'El bienestar emocional constituye un activo fundamental para la salud comunitaria. Más allá de la ausencia de malestar, implica la capacidad de las personas para desarrollar su potencial, afrontar las tensiones de la vida y contribuir a su comunidad.',

        fortaleza: 'La población presenta indicadores favorables de bienestar emocional, lo que sugiere la existencia de recursos comunitarios protectores que conviene identificar y potenciar.',

        oportunidad: 'Se identifica margen para fortalecer el bienestar emocional mediante la dinamización de activos comunitarios: espacios de encuentro, redes de apoyo mutuo y actividades que generen sentido de pertenencia.',

        activos: ['espacios de encuentro vecinal', 'asociaciones culturales y recreativas', 'programas de envejecimiento activo', 'grupos de apoyo mutuo', 'servicios de atención comunitaria'],

        conexiones: ['apoyoSocial', 'suenoSaludable', 'vidaActiva']

    },

    vidaActiva: {

        nombre: 'Vida activa',

        contexto: 'La actividad física regular es uno de los determinantes modificables con mayor impacto en la salud. El enfoque salutogénico prioriza facilitar entornos que inviten al movimiento cotidiano sobre la prescripción individual de ejercicio.',

        fortaleza: 'Los datos reflejan niveles favorables de actividad física, indicando que el municipio cuenta con condiciones que facilitan una vida activa.',

        oportunidad: 'Existe potencial para incrementar la actividad física cotidiana aprovechando y mejorando los activos existentes: espacios públicos, rutas peatonales y equipamientos deportivos accesibles.',

        activos: ['parques y zonas verdes', 'carriles bici y rutas peatonales', 'instalaciones deportivas municipales', 'programas de actividad física comunitaria', 'entorno natural cercano'],

        conexiones: ['alimentacionSaludable', 'bienestarEmocional', 'entornoSaludable']

    },

    alimentacionSaludable: {

        nombre: 'Alimentación saludable',

        contexto: 'La alimentación saludable depende tanto de las elecciones individuales como del entorno alimentario. Un enfoque salutogénico busca que la opción saludable sea la opción fácil, accesible y asequible.',

        fortaleza: 'Los patrones alimentarios de la población muestran aspectos positivos que reflejan la cultura alimentaria local y el acceso a productos de calidad.',

        oportunidad: 'Se detecta margen para mejorar hábitos alimentarios mediante el fortalecimiento del sistema alimentario local: mercados, comercio de proximidad y educación alimentaria.',

        activos: ['mercados locales y de proximidad', 'huertos urbanos y comunitarios', 'tradición gastronómica mediterránea', 'comercio local de alimentación', 'programas de comedores escolares saludables'],

        conexiones: ['vidaActiva', 'situacionEconomica']

    },

    suenoSaludable: {

        nombre: 'Sueño saludable',

        contexto: 'El descanso adecuado es un pilar frecuentemente invisibilizado de la salud. La calidad del sueño está influida por factores ambientales, laborales y de estilo de vida que pueden abordarse desde la acción comunitaria.',

        fortaleza: 'La población presenta patrones de descanso favorables, lo que constituye un recurso protector para la salud física y mental.',

        oportunidad: 'Se identifica la oportunidad de promover entornos y hábitos que favorezcan el descanso, especialmente la reducción de exposición a pantallas y la mejora de condiciones ambientales.',

        activos: ['espacios libres de contaminación acústica', 'programas de higiene del sueño', 'regulación de iluminación nocturna', 'actividades de relajación comunitarias'],

        conexiones: ['bienestarEmocional', 'entornoSaludable']

    },

    vidaSinHumo: {

        nombre: 'Vida sin humo',

        contexto: 'El tabaquismo sigue siendo la primera causa de mortalidad evitable. El enfoque salutogénico complementa la prevención del consumo con la creación de entornos libres de humo que desnormalicen el tabaco.',

        fortaleza: 'Los datos muestran una prevalencia de tabaquismo inferior a la media, reflejando el impacto positivo de las políticas de espacios sin humo y la concienciación ciudadana.',

        oportunidad: 'Existe margen para consolidar la tendencia hacia una vida sin humo, especialmente en la prevención del inicio del consumo en jóvenes y el apoyo a quienes desean dejar de fumar.',

        activos: ['espacios públicos libres de humo', 'consultas de deshabituación tabáquica', 'centros educativos promotores de salud', 'normativa local de protección'],

        conexiones: ['consumoResponsable', 'entornoSaludable']

    },

    consumoResponsable: {

        nombre: 'Consumo responsable de alcohol',

        contexto: 'El consumo de alcohol está normalizado culturalmente, lo que dificulta su abordaje. Un enfoque salutogénico busca ofrecer alternativas de ocio saludable y reducir la presión social hacia el consumo.',

        fortaleza: 'Los indicadores de consumo de riesgo se sitúan por debajo de la media regional, sugiriendo la existencia de factores protectores en la comunidad.',

        oportunidad: 'Se detecta potencial para promover el consumo responsable mediante alternativas de ocio, regulación de la disponibilidad y sensibilización sobre riesgos.',

        activos: ['oferta de ocio alternativo', 'asociaciones juveniles', 'programas de prevención en centros educativos', 'normativa local sobre venta y consumo'],

        conexiones: ['bienestarEmocional', 'vidaSinHumo']

    },

    entornoSaludable: {

        nombre: 'Percepción de entornos promotores de salud',

        contexto: 'La percepción ciudadana del entorno físico refleja la experiencia vivida de las condiciones ambientales. Estos datos de autorreporte (EAS) complementan, pero no sustituyen, mediciones objetivas de calidad ambiental.',

        fortaleza: 'La población percibe condiciones ambientales favorables en su entorno, lo que puede indicar tanto calidad objetiva como adaptación o satisfacción subjetiva.',

        oportunidad: 'Se identifican percepciones negativas del entorno físico que, requiriendo verificación con datos objetivos, señalan áreas de potencial intervención.',

        activos: ['zonas verdes y espacios naturales', 'calidad del aire', 'infraestructura peatonal segura', 'vivienda adecuada', 'reducción de contaminación acústica'],

        conexiones: ['vidaActiva', 'suenoSaludable', 'bienestarEmocional'],

        nota: 'IMPORTANTE: Estos datos reflejan percepciones ciudadanas, no mediciones objetivas. Para intervenciones ambientales, contrastar con datos de calidad del aire, mapas de ruido u otras fuentes técnicas.'

    },

    apoyoSocial: {

        nombre: 'Redes de apoyo social',

        contexto: 'El apoyo social es uno de los determinantes más potentes de la salud. Las redes de relaciones protegen frente a la enfermedad, facilitan la recuperación y generan sentido de pertenencia.',

        fortaleza: 'La población presenta niveles adecuados de apoyo social percibido, indicando la existencia de redes relacionales que actúan como recurso protector.',

        oportunidad: 'Se detecta la necesidad de fortalecer las redes de apoyo, especialmente para prevenir la soledad no deseada en personas mayores y otros colectivos vulnerables.',

        activos: ['tejido asociativo', 'centros de mayores', 'redes vecinales', 'voluntariado organizado', 'espacios de encuentro intergeneracional'],

        conexiones: ['bienestarEmocional', 'situacionEconomica']

    },

    situacionEconomica: {

        nombre: 'Equidad y determinantes sociales',

        contexto: 'Las condiciones socioeconómicas son el determinante más estructural de la salud. Aunque escapan al ámbito estrictamente sanitario, el Plan local puede contribuir a reducir su impacto en las desigualdades en salud.',

        fortaleza: 'Los indicadores socioeconómicos del municipio se sitúan en niveles que facilitan el acceso a recursos para la salud.',

        oportunidad: 'Se identifica la necesidad de incorporar la perspectiva de equidad en todas las actuaciones, priorizando intervenciones en zonas o colectivos con mayores dificultades.',

        activos: ['servicios sociales municipales', 'programas de inclusión', 'recursos de empleo y formación', 'ayudas municipales', 'bancos de alimentos y recursos comunitarios'],

        conexiones: ['apoyoSocial', 'alimentacionSaludable']

    }

};

// ── Patrones salutogénicos (clusters narrativos) ─────────────────────────────

const PATRONES_SALUTOGENICOS = {

    bienestarIntegral: {

        nombre: 'Bienestar integral',

        areas: ['bienestarEmocional', 'suenoSaludable', 'apoyoSocial'],

        umbralMinimo: 2,

        narrativaFortaleza: 'Se observa un patrón coherente de bienestar integral: la calidad del descanso, el apoyo social percibido y la salud emocional se refuerzan mutuamente, constituyendo un círculo virtuoso que el Plan puede consolidar.',

        narrativaOportunidad: 'Los datos sugieren una interconexión entre descanso, apoyo social y bienestar emocional que requiere un abordaje integrado. Las intervenciones en cualquiera de estas áreas pueden tener efectos positivos en las demás.',

        narrativaMixta: 'El municipio presenta un perfil mixto en el eje de bienestar integral: mientras algunas dimensiones muestran fortalezas, otras ofrecen margen de mejora. Este patrón sugiere priorizar intervenciones que refuercen las conexiones entre áreas.'

    },

    estilosVidaActivos: {

        nombre: 'Estilos de vida activos',

        areas: ['vidaActiva', 'alimentacionSaludable', 'entornoSaludable'],

        umbralMinimo: 2,

        narrativaFortaleza: 'El municipio cuenta con condiciones favorables para estilos de vida activos: entorno físico adecuado, niveles de actividad física y patrones alimentarios que se refuerzan mutuamente.',

        narrativaOportunidad: 'Existe potencial para desarrollar un ecosistema de vida activa que conecte alimentación, movimiento y entorno. Las mejoras en infraestructura, acceso a alimentación saludable y promoción de actividad física pueden potenciarse mutuamente.',

        narrativaMixta: 'El perfil de estilos de vida muestra aspectos positivos junto con oportunidades de mejora. Un enfoque integrado que conecte entorno, alimentación y actividad física maximizará el impacto de las intervenciones.'

    },

    prevencionConsumos: {

        nombre: 'Prevención de consumos de riesgo',

        areas: ['vidaSinHumo', 'consumoResponsable'],

        umbralMinimo: 2,

        narrativaFortaleza: 'Los indicadores de consumo de tabaco y alcohol se sitúan en niveles favorables, reflejando el impacto de las políticas preventivas y la existencia de alternativas de ocio saludable.',

        narrativaOportunidad: 'La prevención de consumos de riesgo requiere un abordaje coordinado que combine regulación, alternativas de ocio saludable y apoyo a quienes desean modificar sus hábitos.',

        narrativaMixta: 'El perfil de consumos muestra resultados dispares entre tabaco y alcohol, sugiriendo la necesidad de estrategias diferenciadas pero coordinadas.'

    },

    cohesionComunitaria: {

        nombre: 'Cohesión comunitaria',

        areas: ['apoyoSocial', 'situacionEconomica', 'bienestarEmocional'],

        umbralMinimo: 2,

        narrativaFortaleza: 'El municipio presenta indicadores de cohesión comunitaria que actúan como factor protector: redes de apoyo, inclusión social y bienestar emocional configuran una comunidad resiliente.',

        narrativaOportunidad: 'El fortalecimiento de la cohesión comunitaria es una estrategia transversal que puede mejorar múltiples indicadores de salud. Invertir en redes de apoyo, reducir desigualdades y promover la participación genera retornos en todas las áreas.',

        narrativaMixta: 'Los indicadores de cohesión comunitaria muestran un perfil heterogéneo. Fortalecer los vínculos entre apoyo social, inclusión y bienestar emocional potenciará la capacidad de la comunidad para generar salud.'

    }

};

// ── Export público ────────────────────────────────────────────────────────────

export function generarNarrativaSalutogenica(analisis) {

    const municipio = analisis.municipio || 'El municipio';

    const narrativa = {

        contexto: '',

        activos: '',

        oportunidades: '',

        patrones: '',

        sintesis: ''

    };



    // Datos del análisis

    const fortalezas = analisis.fortalezas || [];

    const oportunidades = analisis.oportunidades || [];

    const datosAnalisis = analisis.datosAnalisis || {};



    // Agrupar por área

    const areasConFortaleza = [...new Set(fortalezas.map(f => f.area))];

    const areasConOportunidad = [...new Set(oportunidades.map(o => o.area))];



    // Mapear nombres de área a claves de plantilla

    const nombreAKey = {};

    Object.entries(PLANTILLAS_SALUTOGENICAS).forEach(([key, val]) => {

        nombreAKey[val.nombre.toLowerCase()] = key;

    });



    // =========================================

    // 1. CONTEXTO INTRODUCTORIO

    // =========================================

    const totalDeterminantes = datosAnalisis.totalDeterminantes || 0;

    const totalIndicadores = datosAnalisis.totalIndicadores || 0;



    narrativa.contexto = `El presente análisis examina el perfil de salud de ${municipio} desde un enfoque salutogénico, ` +

        `priorizando la identificación de recursos y activos que generan salud en la comunidad. ` +

        `Se han analizado ${totalDeterminantes} determinantes de la Encuesta Andaluza de Salud ` +

        `y ${totalIndicadores} indicadores del cuadro de mandos integral, comparando los valores locales ` +

        `con las referencias provinciales y autonómicas.\n\n` +

        `Este enfoque, coherente con la Estrategia de promoción de una vida saludable en Andalucía (EPVSA 2024-2030), ` +

        `busca responder a la pregunta "¿qué genera salud aquí?" antes que centrarse únicamente en los problemas. ` +

        `El objetivo es construir sobre las fortalezas existentes mientras se abordan las áreas de mejora.`;



    // =========================================

    // 2. ACTIVOS Y FORTALEZAS

    // =========================================

    if (fortalezas.length > 0) {

        let textoActivos = `${municipio} presenta fortalezas significativas que constituyen activos para la salud comunitaria:\n\n`;



        areasConFortaleza.forEach(areaNombre => {

            const areaKey = nombreAKey[areaNombre.toLowerCase()];

            const plantilla = areaKey ? PLANTILLAS_SALUTOGENICAS[areaKey] : null;

            const fortalezasArea = fortalezas.filter(f => f.area === areaNombre);



            if (plantilla) {

                textoActivos += `**${plantilla.nombre}**: ${plantilla.fortaleza} `;



                // Añadir datos concretos

                if (fortalezasArea.length > 0) {

                    const ejemplos = fortalezasArea.slice(0, 2).map(f =>

                        `${f.texto} (${f.valor}% frente a ${f.refAndalucia}% de media andaluza)`

                    );

                    textoActivos += `En concreto: ${ejemplos.join('; ')}. `;

                }



                // Mencionar activos potenciales

                if (plantilla.activos && plantilla.activos.length > 0) {

                    textoActivos += `Entre los activos a dinamizar: ${plantilla.activos.slice(0, 3).join(', ')}.\n\n`;

                } else {

                    textoActivos += '\n\n';

                }

            }

        });



        narrativa.activos = textoActivos;

    } else {

        narrativa.activos = `El análisis no ha identificado áreas con valores significativamente superiores a la media andaluza. ` +

            `Esto no implica ausencia de activos para la salud, sino que los indicadores cuantitativos se sitúan en rangos similares ` +

            `a los valores de referencia. El mapeo cualitativo de activos comunitarios complementará este análisis.`;

    }



    // =========================================

    // 3. OPORTUNIDADES DE MEJORA

    // =========================================

    if (oportunidades.length > 0) {

        let textoOportunidades = `Se identifican áreas donde la acción comunitaria puede facilitar mejoras en salud:\n\n`;



        areasConOportunidad.forEach(areaNombre => {

            const areaKey = nombreAKey[areaNombre.toLowerCase()];

            const plantilla = areaKey ? PLANTILLAS_SALUTOGENICAS[areaKey] : null;

            const oportunidadesArea = oportunidades.filter(o => o.area === areaNombre);



            if (plantilla) {

                textoOportunidades += `**${plantilla.nombre}**: ${plantilla.oportunidad} `;



                // Añadir datos concretos

                if (oportunidadesArea.length > 0) {

                    const ejemplos = oportunidadesArea.slice(0, 2).map(o =>

                        `${o.texto} (${o.valor}% frente a ${o.refAndalucia}% andaluz)`

                    );

                    textoOportunidades += `Los datos muestran: ${ejemplos.join('; ')}.\n\n`;

                } else {

                    textoOportunidades += '\n\n';

                }

            }

        });



        narrativa.oportunidades = textoOportunidades;

    } else {

        narrativa.oportunidades = `No se han identificado áreas con valores significativamente inferiores a la media andaluza. ` +

            `El municipio presenta un perfil favorable en los indicadores analizados, lo que permite orientar el Plan ` +

            `hacia la consolidación de las fortalezas existentes y la prevención.`;

    }



    // =========================================

    // 4. DETECCIÓN DE PATRONES

    // =========================================

    let textoPatrones = '';

    const patronesDetectados = [];



    Object.entries(PATRONES_SALUTOGENICOS).forEach(([patronKey, patron]) => {

        // Contar cuántas áreas del patrón tienen datos

        let areasConDatos = 0;

        let tieneFortaleza = false;

        let tieneOportunidad = false;



        patron.areas.forEach(areaKey => {

            const plantilla = PLANTILLAS_SALUTOGENICAS[areaKey];

            if (plantilla) {

                const nombreArea = plantilla.nombre.toLowerCase();

                if (areasConFortaleza.map(a => a.toLowerCase()).includes(nombreArea)) {

                    areasConDatos++;

                    tieneFortaleza = true;

                }

                if (areasConOportunidad.map(a => a.toLowerCase()).includes(nombreArea)) {

                    areasConDatos++;

                    tieneOportunidad = true;

                }

            }

        });



        // Si alcanza el umbral, añadir narrativa del patrón

        if (areasConDatos >= patron.umbralMinimo) {

            let narrativaPatron = '';

            if (tieneFortaleza && !tieneOportunidad) {

                narrativaPatron = patron.narrativaFortaleza;

            } else if (!tieneFortaleza && tieneOportunidad) {

                narrativaPatron = patron.narrativaOportunidad;

            } else {

                narrativaPatron = patron.narrativaMixta;

            }



            patronesDetectados.push({

                nombre: patron.nombre,

                narrativa: narrativaPatron

            });

        }

    });



    if (patronesDetectados.length > 0) {

        textoPatrones = `El análisis identifica patrones transversales que conectan diferentes áreas:\n\n`;

        patronesDetectados.forEach(p => {

            textoPatrones += `**${p.nombre}**: ${p.narrativa}\n\n`;

        });

    } else {

        textoPatrones = `Los datos analizados no muestran patrones transversales marcados entre las diferentes áreas. ` +

            `Esto sugiere que cada dimensión puede abordarse de forma relativamente independiente, ` +

            `aunque siempre manteniendo la visión integral de la salud comunitaria.`;

    }



    narrativa.patrones = textoPatrones;



    // =========================================

    // 5. SÍNTESIS Y ORIENTACIÓN

    // =========================================

    const balanceGeneral = fortalezas.length >= oportunidades.length ? 'favorable' : 'con margen de mejora';

    const enfoquePrioritario = fortalezas.length >= oportunidades.length ?

        'consolidar las fortalezas existentes y prevenir su deterioro' :

        'abordar las oportunidades de mejora apoyándose en los activos disponibles';



    narrativa.sintesis = `En síntesis, ${municipio} presenta un perfil de salud ${balanceGeneral}. ` +

        `El Plan local de salud debería ${enfoquePrioritario}.\n\n` +

        `Desde el enfoque salutogénico, la pregunta clave no es solo "¿qué problemas debemos resolver?" ` +

        `sino "¿qué recursos tenemos para generar salud?". Los activos identificados —formales e informales, ` +

        `institucionales y comunitarios— constituyen la base sobre la que construir intervenciones sostenibles ` +

        `y culturalmente apropiadas.\n\n` +

        `Las recomendaciones que siguen traducen este análisis en líneas de actuación concretas, ` +

        `acompasadas con la EPVSA 2024-2030 y adaptadas a la realidad local.`;



    return narrativa;

}

/**
 * COMPÁS — Catálogo de determinantes EAS
 * dominio/determinantes/EstructuraDeterminantes.js
 *
 * Extraído de COMPAS.html (L.9481–L.9861) el 2026-03-14.
 * Fuente original: Encuesta Andaluza de Salud (EAS) 2023.
 *
 * PRERREQUISITO PARA: matching código→texto en ia/motores/motorPriorizacion.js
 *
 * MÓDULO PURO: Sin DOM. Sin Firebase. Sin efectos secundarios.
 */

export const ESTRUCTURA_DETERMINANTES = {

    // ============================================================================

    // NOTA METODOLÓGICA GENERAL

    // ============================================================================

    // Todos los datos proceden de la Encuesta Andaluza de Salud (EAS) 2023.

    // Son datos de AUTORREPORTE obtenidos mediante entrevista poblacional.

    //

    // CLASIFICACIÓN DE INDICADORES POR TIPO DE DATO:

    // - "autorreporte_conducta": Conductas autodeclaradas (fumar, beber, ejercicio)

    // - "autorreporte_percepcion": Percepciones subjetivas (salud percibida, calidad entorno)

    // - "escala_validada": Instrumentos psicométricos validados (SF-12, DUKE-UNC, CAGE, PREDIMED)

    // - "autorreporte_situacion": Situación objetivable declarada (vivienda, economía)

    //

    // LIMITACIONES:

    // - Sesgo de deseabilidad social en conductas

    // - Variabilidad en interpretación de escalas subjetivas

    // - Los datos de percepción ambiental NO sustituyen mediciones objetivas

    // ============================================================================



    _metadatos: {

        fuente: "Encuesta Andaluza de Salud (EAS) 2023",

        metodologia: "Encuesta poblacional por muestreo aleatorio estratificado",

        tecnicaRecogida: "Entrevista personal asistida por ordenador (CAPI)",

        procesamientoLocal: "Estimaciones municipales mediante reponderación Bettersurveys",

        limitaciones: [

            "Todos los datos son de autorreporte, sujetos a sesgos de memoria y deseabilidad social",

            "Las estimaciones municipales tienen mayor error muestral que las provinciales/autonómicas",

            "Los indicadores de percepción ambiental reflejan experiencia subjetiva, no mediciones objetivas",

            "Las conductas autodeclaradas pueden infraestimar comportamientos socialmente censurados"

        ],

        referencias: [

            "IECA. Encuesta Andaluza de Salud 2023. Metodología.",

            "Ware JE et al. SF-12: How to Score the SF-12 Physical and Mental Health Summary Scales.",

            "Broadhead WE et al. The Duke-UNC Functional Social Support Questionnaire.",

            "Ewing JA. Detecting alcoholism: The CAGE questionnaire.",

            "Martínez-González MA et al. PREDIMED Study."

        ]

    },



    area1: {

        nombre: "Salud percibida y calidad de vida relacionada con la salud",

        icono: "🩺",

        descripcion: "Indicadores de salud autopercibida. Reflejan la valoración subjetiva del estado de salud, validada como predictor de morbimortalidad.",

        tipoDatoArea: "autorreporte_percepcion",

        notaMetodologica: "La salud percibida es un constructo subjetivo validado epidemiológicamente como predictor independiente de mortalidad y uso de servicios sanitarios.",

        escalas: [

            {

                nombre: "SF-12 (Short Form-12 Health Survey)",

                items: 12,

                mide: "Calidad de vida relacionada con la salud (componente físico y mental)",

                validacion: "Instrumento validado internacionalmente con propiedades psicométricas establecidas",

                referencia: "Ware JE et al. Med Care. 1996;34(3):220-33"

            }

        ],

        indicadores: [

            { codigo: "P7", texto: "Declara salud percibida buena o muy buena", unidad: "%", polaridad: 1, tipoDato: "autorreporte_percepcion" },

            { codigo: "P7b", texto: "Declara salud mental percibida buena o muy buena", unidad: "%", polaridad: 1, tipoDato: "autorreporte_percepcion" },

            { codigo: "P8a", texto: "Declara limitación para esfuerzos moderados", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

            { codigo: "P8b", texto: "Declara limitación para subir escaleras", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

            { codigo: "P9a", texto: "Declara haber hecho menos de lo deseado por salud física", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

            { codigo: "P9b", texto: "Declara haber dejado tareas por salud física", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

            { codigo: "P10a", texto: "Declara haber hecho menos por problema emocional", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

            { codigo: "P10b", texto: "Declara menor cuidado por problema emocional", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

            { codigo: "P11", texto: "Declara que el dolor dificulta trabajo (bastante/mucho)", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

            { codigo: "P12a", texto: "Declara sentirse calmado y tranquilo frecuentemente", unidad: "%", polaridad: 1, tipoDato: "autorreporte_percepcion" },

            { codigo: "P12b", texto: "Declara tener mucha energía frecuentemente", unidad: "%", polaridad: 1, tipoDato: "autorreporte_percepcion" },

            { codigo: "P12c", texto: "Declara sentirse desanimado y triste frecuentemente", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

            { codigo: "P13", texto: "Declara que problemas de salud dificultaron vida social", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" }

        ]

    },

    area2: {

        nombre: "Estilos de vida y conductas de salud (autodeclaradas)",

        icono: "🏃",

        descripcion: "Conductas relacionadas con la salud según declaración de la persona entrevistada. Sujetas a sesgo de deseabilidad social.",

        tipoDatoArea: "autorreporte_conducta",

        notaMetodologica: "Las conductas autodeclaradas tienden a infraestimar comportamientos socialmente censurados (tabaco, alcohol) y sobreestimar conductas deseables (ejercicio, dieta).",

        grupos: [

            {

                nombre: "Consumo de tabaco (autodeclarado)",

                notaGrupo: "Posible infraestimación por deseabilidad social",

                indicadores: [

                    { codigo: "P23", texto: "Declara ser fumador diario", unidad: "%", polaridad: -1, tipoDato: "autorreporte_conducta" },

                    { codigo: "P23_ex", texto: "Declara ser exfumador", unidad: "%", polaridad: 1, tipoDato: "autorreporte_conducta" },

                    { codigo: "P25d", texto: "Declara usar cigarrillo electrónico", unidad: "%", polaridad: -1, tipoDato: "autorreporte_conducta" }

                ]

            },

            {

                nombre: "Consumo de alcohol (autodeclarado)",

                notaGrupo: "Posible infraestimación por deseabilidad social. CAGE es escala de cribado, no diagnóstica.",

                indicadores: [

                    { codigo: "P29", texto: "Presenta consumo de riesgo de alcohol (autodeclarado)", unidad: "%", polaridad: -1, tipoDato: "autorreporte_conducta" },

                    { codigo: "P32_CAGE", texto: "CAGE positivo (≥2 respuestas afirmativas)", unidad: "%", polaridad: -1, tipoDato: "escala_validada", escala: "CAGE", referencia: "Ewing JA. JAMA. 1984;252(14):1905-7" }

                ]

            },

            {

                nombre: "Sueño y descanso (autodeclarado)",

                indicadores: [

                    { codigo: "P33", texto: "Horas de sueño declaradas (media entre semana)", unidad: "h", polaridad: 0, tipoDato: "autorreporte_conducta" },

                    { codigo: "P33_fin", texto: "Horas de sueño declaradas (media fin de semana)", unidad: "h", polaridad: 0, tipoDato: "autorreporte_conducta" },

                    { codigo: "P33a", texto: "Declara descanso suficiente", unidad: "%", polaridad: 1, tipoDato: "autorreporte_percepcion" },

                    { codigo: "P33b_insomnio", texto: "Declara problemas de sueño frecuentes", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" }

                ]

            },

            {

                nombre: "Actividad física (autodeclarada)",

                notaGrupo: "Posible sobreestimación por deseabilidad social",

                indicadores: [

                    { codigo: "P34", texto: "Declara trabajo sedentario (sentado la mayor parte)", unidad: "%", polaridad: -1, tipoDato: "autorreporte_conducta" },

                    { codigo: "P34a_intenso", texto: "Declara ejercicio intenso en tiempo libre", unidad: "%", polaridad: 1, tipoDato: "autorreporte_conducta" },

                    { codigo: "P34a_moderado", texto: "Declara ejercicio moderado en tiempo libre", unidad: "%", polaridad: 1, tipoDato: "autorreporte_conducta" },

                    { codigo: "P34a_nada", texto: "Declara no realizar ejercicio en tiempo libre", unidad: "%", polaridad: -1, tipoDato: "autorreporte_conducta" }

                ]

            },

            {

                nombre: "Alimentación - Cuestionario PREDIMED (autodeclarada)",

                notaGrupo: "PREDIMED es escala validada de adherencia a dieta mediterránea",

                indicadores: [

                    { codigo: "P36b1", texto: "Declara aceite de oliva como grasa principal", unidad: "%", polaridad: 1, tipoDato: "autorreporte_conducta" },

                    { codigo: "P36b_aceite", texto: "Cucharadas aceite oliva/día declaradas (media)", unidad: "ud", polaridad: 1, tipoDato: "autorreporte_conducta" },

                    { codigo: "P36b_verdura", texto: "Raciones verdura/día declaradas (media)", unidad: "ud", polaridad: 1, tipoDato: "autorreporte_conducta" },

                    { codigo: "P36b_fruta", texto: "Piezas fruta/día declaradas (media)", unidad: "ud", polaridad: 1, tipoDato: "autorreporte_conducta" },

                    { codigo: "P36b_carne", texto: "Raciones carnes rojas/día declaradas (media)", unidad: "ud", polaridad: -1, tipoDato: "autorreporte_conducta" },

                    { codigo: "P36b_azucar", texto: "Bebidas azucaradas/día declaradas (media)", unidad: "ud", polaridad: -1, tipoDato: "autorreporte_conducta" },

                    { codigo: "P36b_legumbres", texto: "Raciones legumbres/semana declaradas (media)", unidad: "ud", polaridad: 1, tipoDato: "autorreporte_conducta" },

                    { codigo: "P36b_pescado", texto: "Raciones pescado/semana declaradas (media)", unidad: "ud", polaridad: 1, tipoDato: "autorreporte_conducta" },

                    { codigo: "PREDIMED", texto: "Alta adherencia a dieta mediterránea (escala PREDIMED)", unidad: "%", polaridad: 1, tipoDato: "escala_validada", escala: "PREDIMED", referencia: "Martínez-González MA et al. J Nutr. 2012;142(9):1672-8" }

                ]

            }

        ]

    },

    area3: {

        nombre: "Entorno, determinantes sociales y apoyo (datos declarados)",

        icono: "🏠",

        descripcion: "Indicadores sobre condiciones de vida, entorno y apoyo social según declaración de la persona entrevistada.",

        tipoDatoArea: "mixto",

        notaMetodologica: "Esta área combina indicadores de situación objetivable (vivienda, economía), percepciones subjetivas (entorno) y escalas validadas (Duke-UNC).",

        grupos: [

            {

                nombre: "Condiciones de vivienda (situación declarada)",

                notaGrupo: "Indicadores de privación material declarada, objetivables",

                indicadores: [

                    { codigo: "P4d_frio", texto: "Declara no poder mantener vivienda cálida en invierno", unidad: "%", polaridad: -1, tipoDato: "autorreporte_situacion" },

                    { codigo: "P4d_calor", texto: "Declara no poder mantener vivienda fresca en verano", unidad: "%", polaridad: -1, tipoDato: "autorreporte_situacion" }

                ]

            },

            {

                nombre: "Percepción del medio ambiente del barrio",

                notaGrupo: "⚠️ DATOS DE PERCEPCIÓN SUBJETIVA. No sustituyen mediciones objetivas de calidad ambiental (redes de vigilancia atmosférica, mapas de ruido, etc.)",

                tipoDatoGrupo: "autorreporte_percepcion",

                indicadores: [

                    { codigo: "P5_ruido", texto: "Percibe ruido exterior molesto en su barrio", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

                    { codigo: "P5_olores", texto: "Percibe malos olores del exterior en su barrio", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

                    { codigo: "P5_contaminacion", texto: "Percibe contaminación del aire elevada en su barrio", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

                    { codigo: "P5_industria", texto: "Percibe industria contaminante cerca de su vivienda", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

                    { codigo: "P5_zonas_verdes", texto: "Percibe escasez de zonas verdes en su barrio", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

                    { codigo: "P5_delincuencia", texto: "Percibe delincuencia o inseguridad en su barrio", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

                    { codigo: "P5_trafico", texto: "Percibe tráfico intenso en su barrio", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

                    { codigo: "P5b", texto: "Valora calidad del medio ambiente de su barrio como buena/muy buena", unidad: "%", polaridad: 1, tipoDato: "autorreporte_percepcion" }

                ]

            },

            {

                nombre: "Apoyo social funcional - Escala Duke-UNC",

                notaGrupo: "Escala validada de apoyo social percibido. Punto de corte <32 indica bajo apoyo.",

                indicadores: [

                    { codigo: "DUKE_bajo", texto: "Presenta apoyo social bajo según Duke-UNC (<32 puntos)", unidad: "%", polaridad: -1, tipoDato: "escala_validada", escala: "Duke-UNC", referencia: "Broadhead WE et al. Med Care. 1988;26(7):709-23" },

                    { codigo: "DUKE_media", texto: "Puntuación media en escala Duke-UNC", unidad: "pts", polaridad: 1, tipoDato: "escala_validada", escala: "Duke-UNC" }

                ]

            },

            {

                nombre: "Bienestar emocional (autopercibido)",

                notaGrupo: "Indicadores de bienestar subjetivo, no sustituyen evaluación clínica de salud mental",

                indicadores: [

                    { codigo: "P57b1", texto: "Declara sentirse deprimido frecuentemente", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

                    { codigo: "P57b2", texto: "Declara sentirse feliz frecuentemente", unidad: "%", polaridad: 1, tipoDato: "autorreporte_percepcion" },

                    { codigo: "P57b3", texto: "Declara sentirse solo frecuentemente", unidad: "%", polaridad: -1, tipoDato: "autorreporte_percepcion" },

                    { codigo: "P57b4", texto: "Declara disfrutar de la vida frecuentemente", unidad: "%", polaridad: 1, tipoDato: "autorreporte_percepcion" },

                    { codigo: "P57b5", texto: "Declara sentirse con energía frecuentemente", unidad: "%", polaridad: 1, tipoDato: "autorreporte_percepcion" },

                    { codigo: "P57b6", texto: "Declara sentirse tranquilo frecuentemente", unidad: "%", polaridad: 1, tipoDato: "autorreporte_percepcion" }

                ]

            },

            {

                nombre: "Situación económica (declarada)",

                notaGrupo: "Indicador de privación económica subjetiva, complementario a indicadores objetivos de renta",

                indicadores: [

                    { codigo: "P71_dificultad", texto: "Declara llegar a fin de mes con dificultad", unidad: "%", polaridad: -1, tipoDato: "autorreporte_situacion" },

                    { codigo: "P71_mucha_dif", texto: "Declara llegar a fin de mes con mucha dificultad", unidad: "%", polaridad: -1, tipoDato: "autorreporte_situacion" }

                ]

            }

        ]

    }

};

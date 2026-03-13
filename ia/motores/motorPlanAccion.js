/**
 * COMPÁS — Motor: Generador de Plan de Acción
 * ia/motores/motorPlanAccion.js
 *
 * ITERACIÓN 8 — Encapsulación del motor generador de propuesta local.
 *
 * MOTORES HEREDADOS QUE ENCAPSULA:
 *   1. `_generarPropuestaLocal(municipio, datos, pop, analisis)` (HTML l.26092)
 *      Núcleo del generador. Convierte el resultado de analizarDatosMunicipio()
 *      en una propuesta de líneas EPVSA con programas y objetivos sugeridos.
 *      Produce dos representaciones:
 *        - propuestaEPVSA[]:     para renderizarPropuestaIA() (UI con checkboxes)
 *        - seleccionNormalizada[]: para convertirPropuestaASeleccion() / plan de acción
 *
 *   2. `generarPropuestaIA()` (HTML l.26034)
 *      Orquestador. Llama a _generarPropuestaLocal() y luego a renderizarPropuestaIA()
 *      (que modifica el DOM). El módulo modular llama SOLO a _generarPropuestaLocal
 *      para obtener los datos sin efectos DOM.
 *
 * ESTRATEGIA DE ENCAPSULACIÓN:
 *   - Llama a `_generarPropuestaLocal()` directamente (vía window), saltando
 *     la parte de renderizado DOM de `generarPropuestaIA()`
 *   - Requiere que el análisis previo exista (contextoIA.analisisPrevio)
 *   - Normaliza la salida al contrato SalidaMotor
 *   - NO modifica el DOM
 *   - Mantiene compatibilidad con propuestaActual y window.analisisActual
 *
 * REGLA: La IA propone líneas EPVSA, pero el técnico decide qué aceptar.
 *        estadoRevisionHumana siempre comienza como 'pendiente'.
 *
 * ⚠️ NO REESCRIBE la lógica del motor. Encapsula sin mover.
 */

import { crearMotor, ESTADOS_REVISION } from '../motorBase.js';
import { validarContextoPropuesta } from '../validacionIA.js';

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZACIÓN DE SALIDA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normaliza la salida de _generarPropuestaLocal() al formato modular.
 *
 * @param {{ propuestaEPVSA: [], seleccionNormalizada: [] }} resultado
 * @param {object} contextoIA
 * @param {string[]} fuentesUsadas
 * @returns {object}
 */
function _normalizarPropuesta(resultado, contextoIA, fuentesUsadas) {
    if (!resultado) return { sinDatos: true, mensaje: 'El motor no produjo propuesta.' };

    const propuestaEPVSA       = resultado.propuestaEPVSA        || [];
    const seleccionNormalizada = resultado.seleccionNormalizada  || [];

    if (!propuestaEPVSA.length) {
        return { sinDatos: true, mensaje: 'La propuesta está vacía. Puede que falten datos o la estructura EPVSA no esté disponible.' };
    }

    // ── Resumen de la propuesta ────────────────────────────────────────────
    const lineasActivas = propuestaEPVSA.map(p => ({
        lineaId:    p.lineaId,
        lineaCodigo: p.lineaCodigo || ('LE' + p.lineaId),
        titulo:     p.titulo,
        relevancia: p.relevancia || 0,
        justificacion: p.justificacion || '',
        nProgramas: (p.programas_sugeridos || []).length,
        nObjetivos: (p.objetivos || []).length,
        temasCiudadanos: p.temasCiudadanos || [],
    }));

    // ── Justificación global ───────────────────────────────────────────────
    const priorizacion = contextoIA.analisisPrevio && contextoIA.analisisPrevio.priorizacion;
    const top3Areas = priorizacion
        ? priorizacion.slice(0, 3).map(p => p.area || p.label || '').filter(Boolean)
        : [];

    const justificacionGlobal = _construirJustificacion(
        lineasActivas, fuentesUsadas, top3Areas,
        contextoIA.ambitoNombre || contextoIA.ambitoId
    );

    // ── Acciones de agenda sugeridas (primer nivel) ────────────────────────
    //    Extraídas de los programas sugeridos en cada línea
    const accionesSugeridas = _extraerAccionesSugeridas(propuestaEPVSA);

    return {
        // Propuesta completa (para renderización y selección)
        lineasPropuestas:    propuestaEPVSA,

        // Selección en formato compatible con convertirPropuestaASeleccion()
        seleccionNormalizada,

        // Resumen compacto para UI
        lineasActivas,
        nLineas:             lineasActivas.length,

        // Justificación para documento
        justificacionGlobal,
        fuentesUsadas,

        // Acciones sugeridas de primer nivel (actuaciones-tipo EPVSA)
        accionesSugeridas,
        nAccionesSugeridas:  accionesSugeridas.length,

        // Datos del análisis subyacente (bridge)
        analisisBase: contextoIA.analisisPrevio || null,
    };
}

/**
 * Construye una justificación textual de la propuesta.
 * @private
 */
function _construirJustificacion(lineas, fuentes, top3Areas, municipio) {
    const nLineas  = lineas.length;
    const lineaStr = lineas.map(l => `${l.lineaCodigo} (${l.titulo})`).join(', ');
    const areasStr = top3Areas.length ? top3Areas.slice(0, 3).join(', ') : 'las principales áreas de salud identificadas';
    const fuenteStr = fuentes.length
        ? `basada en ${fuentes.join(', ')}`
        : 'con los datos disponibles';

    return `Para el municipio de ${municipio}, la propuesta sugiere activar ${nLineas} ` +
        `${nLineas === 1 ? 'línea estratégica' : 'líneas estratégicas'} EPVSA: ${lineaStr}. ` +
        `La propuesta está ${fuenteStr}, con especial atención a: ${areasStr}. ` +
        `Este resultado es una propuesta técnica que requiere revisión y validación por el equipo de planificación ` +
        `antes de incorporarse al Plan Local de Salud.`;
}

/**
 * Extrae las actuaciones-tipo sugeridas de los programas en la propuesta.
 * @private
 */
function _extraerAccionesSugeridas(propuestaEPVSA) {
    const acciones = [];
    propuestaEPVSA.forEach(linea => {
        (linea.programas_sugeridos || []).forEach(prog => {
            (prog.actuaciones_tipo || []).forEach(codActuacion => {
                acciones.push({
                    lineaId:     linea.lineaId,
                    lineaCodigo: linea.lineaCodigo,
                    programa:    prog.codigo,
                    actuacion:   codActuacion,
                    ambito:      prog.ambito || 'comunitario',
                    origen:      'selector_epvsa',  // vendrá del catálogo tipo
                });
            });
        });
    });
    return acciones;
}

// ─────────────────────────────────────────────────────────────────────────────
// BRIDGE HACIA FUNCIONES HEREDADAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Llama a _generarPropuestaLocal() directamente (la lógica pura)
 * sin invocar renderizarPropuestaIA() (que modifica el DOM).
 *
 * @param {object} contextoIA
 * @returns {{ propuestaEPVSA, seleccionNormalizada }|null}
 */
function _llamarGeneradorLocal(contextoIA) {
    // _generarPropuestaLocal necesita: municipio, datos, pop, analisis
    const municipio = contextoIA.ambitoNombre || contextoIA.ambitoId;
    const datos     = contextoIA.datosMunicipio || {};
    const pop       = contextoIA.participacion || null;
    const analisis  = contextoIA.analisisPrevio
                   || (typeof window !== 'undefined' ? window.analisisActual : null);

    if (typeof _generarPropuestaLocal === 'function') {
        // Llamada directa al núcleo puro, sin DOM
        return _generarPropuestaLocal(municipio, datos, pop, analisis);
    }

    // Fallback: si el núcleo puro no está disponible pero sí el resultado del
    // motor v2, intentar construir la propuesta desde analisis.propuestaEPVSA
    if (analisis && analisis.propuestaEPVSA && analisis.propuestaEPVSA.length) {
        console.warn('[motorPlanAccion] _generarPropuestaLocal no disponible. Usando propuestaEPVSA de analisis.');
        return {
            propuestaEPVSA:       analisis.propuestaEPVSA,
            seleccionNormalizada: analisis.propuestaEPVSA.map(p => ({
                lineaId:    p.lineaId,
                relevancia: p.relevancia || 70,
                justificacion: p.justificacion || '',
                objetivos: (p._objetivosIdx || []).map(idx => ({ objetivoIdx: idx, indicadores: [] })),
                programas: (p._programasIdx || []).map(idx => ({ programaIdx: idx, actuaciones: [] })),
            })),
        };
    }

    return null;
}

/**
 * Calcula el grado de confianza del motor de propuesta.
 * La propuesta hereda la confianza del análisis base + factor de completitud.
 */
function _calcularConfianza(resultado, contextoIA) {
    if (!resultado || resultado.sinDatos) return 0;

    const f = contextoIA.fuentes || {};
    const nFuentes = [f.tieneInforme, f.tieneEstudios, f.tienePopular, f.tieneDet].filter(Boolean).length;
    let base = Math.min(0.80, nFuentes * 0.16);

    // Bonus si hay participación ciudadana (propuesta más representativa)
    if (f.tienePopular) base = Math.min(0.88, base + 0.08);

    // Factor: cuántas líneas tiene la propuesta (más líneas = más completa)
    const nLineas = (resultado.lineasPropuestas || []).length;
    if (nLineas >= 4) base = Math.min(0.90, base + 0.05);

    return parseFloat(base.toFixed(2));
}

// ─────────────────────────────────────────────────────────────────────────────
// FUENTES PARA TRAZABILIDAD
// ─────────────────────────────────────────────────────────────────────────────

function _extraerFuentes(contextoIA) {
    const f = contextoIA.fuentes || {};
    const fuentes = [];
    if (f.tieneInforme)    fuentes.push('Informe de situación de salud');
    if (f.tieneEstudios)   fuentes.push(`Estudios complementarios (${f.nEstudios || '?'})`);
    if (f.tienePopular)    fuentes.push(`Priorización ciudadana (${f.nParticipantes || '?'} participantes)`);
    if (f.tieneDet)        fuentes.push('Determinantes EAS');
    if (f.tieneIndicadores) fuentes.push('Indicadores CMI');
    fuentes.push('Motor salutogénico v2 (análisis previo)');
    return fuentes;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFINICIÓN DEL MOTOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Motor Generador de Plan de Acción.
 *
 * Encapsula:
 *   - _generarPropuestaLocal()  → núcleo puro del generador (sin DOM)
 *
 * Entrada:  ContextoIA con analisisPrevio (resultado del motorSintesisPerfil)
 * Salida:   SalidaMotor con:
 *             - lineasPropuestas[]:     líneas EPVSA sugeridas con relevancia y programas
 *             - seleccionNormalizada[]: formato para aplicarPropuestaACheckboxes()
 *             - justificacionGlobal:    texto para el documento del plan
 *             - accionesSugeridas[]:    actuaciones-tipo EPVSA sugeridas
 * Revisión: PENDIENTE — el técnico selecciona qué aceptar antes de generar el plan
 *
 * NOTA SOBRE LA SEPARACIÓN PLAN/AGENDA:
 *   Este motor produce la selección ESTRATÉGICA (qué líneas/programas activar).
 *   Las acciones concretas de la agenda (quién, cuándo, cómo) se programan
 *   en la AgendaAnual, cuyo origen será 'selector_epvsa' o 'generador_automatico'.
 */
export const motorPlanAccion = crearMotor({
    id:          'motor_plan_accion',
    version:     '1.0',
    descripcion: 'Genera la propuesta de plan de acción EPVSA basándose en el análisis ' +
                 'salutogénico previo. Sugiere líneas estratégicas, programas y objetivos ' +
                 'con relevancia calculada. Requiere revisión técnica antes de aplicarse.',

    validarFn: validarContextoPropuesta,

    ejecutarFn(contextoIA) {
        const fuentesUsadas = _extraerFuentes(contextoIA);

        // 1. Llamar al generador heredado (lógica pura, sin DOM)
        const resultado = _llamarGeneradorLocal(contextoIA);

        if (!resultado) {
            return {
                sinDatos: true,
                mensaje: 'No se pudo generar la propuesta. ' +
                    'Verifique que el análisis salutogénico se ha ejecutado previamente.',
            };
        }

        // 2. Normalizar al formato modular
        return _normalizarPropuesta(resultado, contextoIA, fuentesUsadas);
    },

    calcularConfianzaFn: _calcularConfianza,
});

// ─────────────────────────────────────────────────────────────────────────────
// BRIDGE DE COMPATIBILIDAD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea una SalidaMotor desde window.analisisActual.propuestaEPVSA ya existente.
 * Útil cuando el monolito ya generó y aplicó una propuesta y se quiere integrarla
 * en el sistema modular sin re-ejecutar el motor.
 *
 * @param {string} ambitoId
 * @returns {Promise<Readonly<object>|null>}
 */
export async function salidaDesdePropuestaHeredada(ambitoId) {
    const analisis = window.analisisActual;
    if (!analisis || !analisis.propuestaEPVSA || !ambitoId) return null;

    const { crearContextoIA } = await import('../contextoIA.js');
    const { crearRegistroTrazabilidad, registrarEjecucion } = await import('../trazabilidadIA.js');
    const { normalizarSalidaMotor } = await import('../motorBase.js');

    const ctx = crearContextoIA({
        ambitoId,
        fuentes: analisis.fuentes || {},
        analisisPrevio: analisis,
    });

    const resultado = _normalizarPropuesta(
        {
            propuestaEPVSA:       analisis.propuestaEPVSA,
            seleccionNormalizada: (window.propuestaActual) || [],
        },
        ctx,
        _extraerFuentes(ctx)
    );

    const confianza = _calcularConfianza(resultado, ctx);

    const traza = crearRegistroTrazabilidad({
        motorId:       'motor_plan_accion',
        motorVersion:  '1.0',
        ambitoId,
        fuentesUsadas: _extraerFuentes(ctx),
        gradoConfianza: confianza,
        duracionMs:    0,
        heredado:      true,
        resumenEntrada: { ambitoId, fuentes: analisis.fuentes },
        resumenSalida:  {
            nLineas:    (resultado.lineasPropuestas || []).length,
            nAcciones:  (resultado.accionesSugeridas || []).length,
        },
    });
    registrarEjecucion(traza);

    return Object.freeze({
        ...normalizarSalidaMotor({ datos: resultado }, traza),
        estadoRevisionHumana: ESTADOS_REVISION.REVISADO,
    });
}

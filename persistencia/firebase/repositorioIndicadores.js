/**
 * COMPÁS — Repositorio de Indicadores y Diagnóstico
 * persistencia/firebase/repositorioIndicadores.js
 *
 * ITERACIÓN 5 — Encapsula el acceso Firebase relacionado con diagnóstico.
 *
 * RUTAS QUE ENCAPSULA:
 *   estrategias/{est}/municipios/{mun}/indicadores        (CMI 50 indicadores)
 *   estrategias/{est}/municipios/{mun}/determinantes      (55 determinantes EAS)
 *   estrategias/{est}/municipios/{mun}/informe            (informe de situación)
 *   estrategias/{est}/municipios/{mun}/conclusiones
 *   estrategias/{est}/municipios/{mun}/recomendaciones
 *   estrategias/{est}/municipios/{mun}/priorizacion
 *   estrategias/{est}/municipios/{mun}/programas
 *   estrategias/{est}/municipios/{mun}/participacionCiudadana
 *   estrategias/{est}/municipios/{mun}/decisionPriorizacion
 *   estrategias/{est}/municipios/{mun}/estudiosComplementarios
 *   estrategias/{est}/municipios/{mun}/estudiosComplementariosEscalas
 *   estrategias/{est}/municipios/{mun}/ibseDatos
 *   ibse_respuestas/{mun}                                 (cuestionario IBSE individual)
 *   ibse_monitor/{mun}                                    (agregado IBSE legacy)
 *   referencias                                           (valores ref Andalucía/Granada)
 *
 * FUNCIONES DEL MONOLITO QUE USAN ESTAS RUTAS (sin modificar):
 *   cargarDatosMunicipioFirebase()    → todo el nodo municipio
 *   cargarDeterminantes()             → /determinantes
 *   guardarDeterminantes()            → /determinantes
 *   cargarIndicadoresCSV()            → /indicadores
 *   cargarReferenciasEAS()            → /referencias
 *   guardarReferenciasEAS()           → /referencias
 *   _cargarIBSEFirebase()             → ibse_respuestas/ + ibse_monitor/
 *   ibse_guardarAgregado()            → ibse_monitor/ + /ibseDatos
 *   _cargarEstudiosFirebase()         → /estudiosComplementarios
 *   cargarParticipacionCiudadana()    → /participacionCiudadana + /votacionRelas
 *   cargarDecisionPriorizacion()      → /decisionPriorizacion
 *   confirmarPriorizacion()           → /decisionPriorizacion
 *
 * ESTADO: Preparado para migración. Las funciones heredadas NO se han tocado.
 */

import { fb, FIREBASE_PATHS, getEstrategiaActual } from './firebaseClient.js';

// ─────────────────────────────────────────────────────────────────────────────
// INDICADORES (CMI — Cuadro de Mandos Integral)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene los 50 indicadores del Cuadro de Mandos Integral de un ámbito.
 * Ruta: estrategias/{est}/municipios/{mun}/indicadores
 *
 * @param {string} ambitoId
 * @param {string} [estrategia]
 * @returns {Promise<object|null>} Mapa de indicadores con sus valores
 */
export async function obtenerIndicadores(ambitoId, estrategia) {
    const est = estrategia || getEstrategiaActual();
    return fb.get(FIREBASE_PATHS.indicadores(est, ambitoId));
}

/**
 * Guarda los indicadores del CMI.
 * Ruta: estrategias/{est}/municipios/{mun}/indicadores
 *
 * @param {string} ambitoId
 * @param {object} indicadores
 * @param {string} [estrategia]
 * @returns {Promise<void>}
 */
export async function guardarIndicadores(ambitoId, indicadores, estrategia) {
    const est = estrategia || getEstrategiaActual();
    return fb.set(FIREBASE_PATHS.indicadores(est, ambitoId), indicadores);
}

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINANTES EAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene los valores de determinantes EAS de un ámbito.
 * Ruta: estrategias/{est}/municipios/{mun}/determinantes
 *
 * Equivalente modular de cargarDeterminantes().
 *
 * @param {string} ambitoId
 * @param {string} [estrategia]
 * @returns {Promise<object|null>} Mapa codigo → {valor} o valor directo
 */
export async function obtenerDeterminantes(ambitoId, estrategia) {
    const est = estrategia || getEstrategiaActual();
    return fb.get(FIREBASE_PATHS.determinantes(est, ambitoId));
}

/**
 * Guarda los valores de determinantes EAS.
 * Ruta: estrategias/{est}/municipios/{mun}/determinantes
 *
 * Equivalente modular de guardarDeterminantes().
 *
 * @param {string} ambitoId
 * @param {object} determinantes  - Mapa codigo → {valor, fechaActualizacion}
 * @param {string} [estrategia]
 * @returns {Promise<void>}
 */
export async function guardarDeterminantes(ambitoId, determinantes, estrategia) {
    const est = estrategia || getEstrategiaActual();
    return fb.set(FIREBASE_PATHS.determinantes(est, ambitoId), determinantes);
}

// ─────────────────────────────────────────────────────────────────────────────
// INFORME Y TEXTOS DE DIAGNÓSTICO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene el informe de situación de un ámbito.
 * Ruta: estrategias/{est}/municipios/{mun}/informe
 *
 * @param {string} ambitoId
 * @param {string} [estrategia]
 * @returns {Promise<{htmlCompleto: string, textPlano: string}|null>}
 */
export async function obtenerInforme(ambitoId, estrategia) {
    const est = estrategia || getEstrategiaActual();
    return fb.get(FIREBASE_PATHS.informe(est, ambitoId));
}

/**
 * Guarda el informe de situación.
 * Ruta: estrategias/{est}/municipios/{mun}/informe
 *
 * @param {string} ambitoId
 * @param {{ htmlCompleto: string, textPlano: string }} informe
 * @param {string} [estrategia]
 * @returns {Promise<void>}
 */
export async function guardarInforme(ambitoId, informe, estrategia) {
    const est = estrategia || getEstrategiaActual();
    return fb.set(FIREBASE_PATHS.informe(est, ambitoId), informe);
}

/**
 * Obtiene conclusiones del diagnóstico.
 * @param {string} ambitoId
 * @param {string} [estrategia]
 * @returns {Promise<*>}
 */
export async function obtenerConclusiones(ambitoId, estrategia) {
    const est = estrategia || getEstrategiaActual();
    return fb.get(FIREBASE_PATHS.conclusiones(est, ambitoId));
}

/**
 * Obtiene recomendaciones del diagnóstico.
 * @param {string} ambitoId
 * @param {string} [estrategia]
 * @returns {Promise<*>}
 */
export async function obtenerRecomendaciones(ambitoId, estrategia) {
    const est = estrategia || getEstrategiaActual();
    return fb.get(FIREBASE_PATHS.recomendaciones(est, ambitoId));
}

// ─────────────────────────────────────────────────────────────────────────────
// REFERENCIAS EAS (Andalucía / Granada)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene los valores de referencia EAS (Andalucía y Granada).
 * Ruta: referencias
 *
 * Equivalente modular de cargarReferenciasEAS().
 *
 * @returns {Promise<object|null>} Mapa de referencias por indicador
 */
export async function obtenerReferencias() {
    return fb.get(FIREBASE_PATHS.referencias());
}

/**
 * Guarda/actualiza los valores de referencia EAS.
 * Ruta: referencias
 *
 * @param {object} referencias
 * @returns {Promise<void>}
 */
export async function guardarReferencias(referencias) {
    return fb.update(FIREBASE_PATHS.referencias(), referencias);
}

/**
 * Elimina todos los valores de referencia EAS.
 * ⚠️ DESTRUCTIVO
 * @returns {Promise<void>}
 */
export async function eliminarReferencias() {
    return fb.remove(FIREBASE_PATHS.referencias());
}

// ─────────────────────────────────────────────────────────────────────────────
// IBSE (Índice de Bienestar Subjetivo en Salud)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene las respuestas individuales del cuestionario IBSE.
 * Ruta: ibse_respuestas/{mun}  (ruta primaria)
 * Fallback: ibse_monitor/{mun}  (ruta legacy)
 *
 * Equivalente modular de _cargarIBSEFirebase().
 *
 * @param {string} ambitoId
 * @returns {Promise<object|null>} Mapa pushId → respuesta, o null
 */
export async function obtenerRespuestasIBSE(ambitoId) {
    // Intentar ruta primaria
    const datos = await fb.get(FIREBASE_PATHS.ibseRespuestas(ambitoId));
    if (datos) return datos;
    // Fallback a ruta legacy
    return fb.get(FIREBASE_PATHS.ibseMonitor(ambitoId));
}

/**
 * Guarda el agregado IBSE calculado.
 * Rutas: ibse_monitor/{mun}  y  estrategias/{est}/municipios/{mun}/ibseDatos
 *
 * @param {string} ambitoId
 * @param {object} agregado   - Resultado calculado del IBSE
 * @param {string} [estrategia]
 * @returns {Promise<void[]>}
 */
export async function guardarAgregadoIBSE(ambitoId, agregado, estrategia) {
    const est = estrategia || getEstrategiaActual();
    // Escribir en ambas rutas (igual que el monolito)
    return Promise.all([
        fb.set(FIREBASE_PATHS.ibseMonitor(ambitoId), agregado),
        fb.set(FIREBASE_PATHS.ibseDatos(est, ambitoId), agregado),
    ]);
}

/**
 * Envía una respuesta de cuestionario IBSE individual.
 * Ruta: ibse_respuestas/{mun}  (push)
 *
 * @param {string} ambitoId
 * @param {object} respuesta
 * @returns {Promise<string>} Clave generada por Firebase
 */
export async function enviarRespuestaIBSE(ambitoId, respuesta) {
    return fb.push(FIREBASE_PATHS.ibseRespuestas(ambitoId), respuesta);
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIORIZACIÓN Y PARTICIPACIÓN CIUDADANA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene la participación ciudadana consolidada.
 * Ruta: estrategias/{est}/municipios/{mun}/participacionCiudadana
 *
 * @param {string} ambitoId
 * @param {string} [estrategia]
 * @returns {Promise<object|null>}
 */
export async function obtenerParticipacionCiudadana(ambitoId, estrategia) {
    const est = estrategia || getEstrategiaActual();
    return fb.get(FIREBASE_PATHS.participacionCiudadana(est, ambitoId));
}

/**
 * Obtiene la decisión formal de priorización.
 * Ruta: estrategias/{est}/municipios/{mun}/decisionPriorizacion
 *
 * Equivalente modular de cargarDecisionPriorizacion().
 *
 * @param {string} ambitoId
 * @param {string} [estrategia]
 * @returns {Promise<object|null>}
 */
export async function obtenerDecisionPriorizacion(ambitoId, estrategia) {
    const est = estrategia || getEstrategiaActual();
    return fb.get(FIREBASE_PATHS.decisionPriorizacion(est, ambitoId));
}

/**
 * Guarda la decisión formal de priorización.
 * Ruta: estrategias/{est}/municipios/{mun}/decisionPriorizacion
 *
 * @param {string} ambitoId
 * @param {object} decision
 * @param {string} [estrategia]
 * @returns {Promise<void>}
 */
export async function guardarDecisionPriorizacion(ambitoId, decision, estrategia) {
    const est = estrategia || getEstrategiaActual();
    return fb.set(FIREBASE_PATHS.decisionPriorizacion(est, ambitoId), decision);
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTUDIOS COMPLEMENTARIOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene los estudios complementarios cargados para un ámbito.
 * Ruta: estrategias/{est}/municipios/{mun}/estudiosComplementarios
 *
 * @param {string} ambitoId
 * @param {string} [estrategia]
 * @returns {Promise<object|null>}
 */
export async function obtenerEstudiosComplementarios(ambitoId, estrategia) {
    const est = estrategia || getEstrategiaActual();
    return fb.get(FIREBASE_PATHS.estudiosComplementarios(est, ambitoId));
}

/**
 * Obtiene las escalas diagnósticas calculadas desde los estudios.
 * Ruta: estrategias/{est}/municipios/{mun}/estudiosComplementariosEscalas
 *
 * @param {string} ambitoId
 * @param {string} [estrategia]
 * @returns {Promise<object|null>}
 */
export async function obtenerEscalasDiagnosticas(ambitoId, estrategia) {
    const est = estrategia || getEstrategiaActual();
    return fb.get(FIREBASE_PATHS.estudiosComplementariosEscalas(est, ambitoId));
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTURA COMPLETA DE DIAGNÓSTICO (helper compuesto)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene todos los datos de diagnóstico de un ámbito en paralelo.
 * Helper para cuando se necesitan múltiples secciones diagnósticas a la vez.
 *
 * @param {string} ambitoId
 * @param {string} [estrategia]
 * @returns {Promise<{ indicadores, determinantes, informe, conclusiones, recomendaciones, referencias }>}
 */
export async function obtenerDiagnosticoCompleto(ambitoId, estrategia) {
    const [indicadores, determinantes, informe, conclusiones, recomendaciones, referencias] =
        await Promise.all([
            obtenerIndicadores(ambitoId, estrategia),
            obtenerDeterminantes(ambitoId, estrategia),
            obtenerInforme(ambitoId, estrategia),
            obtenerConclusiones(ambitoId, estrategia),
            obtenerRecomendaciones(ambitoId, estrategia),
            obtenerReferencias(),
        ]);
    return { indicadores, determinantes, informe, conclusiones, recomendaciones, referencias };
}

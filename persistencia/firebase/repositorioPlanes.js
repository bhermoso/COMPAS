/**
 * COMPÁS — Repositorio de Planes Territoriales
 * persistencia/firebase/repositorioPlanes.js
 *
 * ITERACIÓN 5 — Encapsula el acceso Firebase relacionado con planes.
 *
 * RUTAS QUE ENCAPSULA:
 *   estrategias/{est}/municipios/{mun}              (nodo completo)
 *   estrategias/{est}/municipios/{mun}/planAccion   (plan guardado)
 *   estrategias/{est}/municipios/{mun}/seleccionEPVSA
 *   estrategias/{est}/municipios               (lista de municipios)
 *
 * FUNCIONES DEL MONOLITO QUE USAN ESTAS RUTAS (sin modificar):
 *   cargarDatosMunicipioFirebase()    → db.ref(ambito).once(...)
 *   guardarPlanEnFirebase()           → db.ref(planAccion).set(...)
 *   cargarPlanGuardado()              → lee de window.COMPAS.state.planAccionFirebase
 *   actualizarBadgesFase4()           → db.ref(ambito).once(...)
 *   actualizarEstadosCarga()          → db.ref(ambito).once(...)
 *   borrarDatosMunicipio()            → db.ref(ambito).remove()
 *   cargarMunicipiosDisponibles()     → db.ref(municipios).once(...)
 *
 * ESTADO: Preparado para migración. Las funciones heredadas NO se han tocado.
 *
 * MÓDULO: Usa Firebase via firebaseClient.js. Sin DOM. Sin efectos en globals.
 */

import { fb, FIREBASE_PATHS, getEstrategiaActual } from './firebaseClient.js';
import { planDesdeFirebase, crearRegistroPlanes } from '../../dominio/planTerritorial.js';
import { planAccionDesdeFirebase } from '../../dominio/planAccion.js';

// ─────────────────────────────────────────────────────────────────────────────
// IMPLEMENTACIÓN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene el plan de acción guardado para un ámbito.
 * Ruta: estrategias/{est}/municipios/{mun}/planAccion
 *
 * Equivale a la lectura que hace cargarDatosMunicipioFirebase() y luego
 * expone como window.COMPAS.state.planAccionFirebase.
 *
 * @param {string} ambitoId     - Clave del municipio
 * @param {string} [estrategia]
 * @returns {Promise<Readonly<object>|null>} PlanTerritorial de dominio, o null
 */
export async function obtenerPlan(ambitoId, estrategia) {
    const est = estrategia || getEstrategiaActual();
    const path = FIREBASE_PATHS.planAccion(est, ambitoId);
    const datos = await fb.get(path);
    if (!datos) return null;
    // Construir PlanTerritorial de dominio desde el formato Firebase heredado
    // El número de orden siempre es 1 por ahora (limitación L3 del monolito)
    return planDesdeFirebase(ambitoId, datos, 1, est);
}

/**
 * Obtiene el PlanAccion (nivel estratégico) para un ámbito.
 * Ruta: estrategias/{est}/municipios/{mun}/planAccion
 *
 * @param {string} ambitoId
 * @param {string} [estrategia]
 * @returns {Promise<Readonly<object>|null>} PlanAccion de dominio, o null
 */
export async function obtenerPlanAccion(ambitoId, estrategia) {
    const est = estrategia || getEstrategiaActual();
    const path = FIREBASE_PATHS.planAccion(est, ambitoId);
    const datos = await fb.get(path);
    if (!datos) return null;
    const planTerritorialId = `${ambitoId}__plan_1`;
    return planAccionDesdeFirebase(planTerritorialId, datos);
}

/**
 * Guarda un plan de acción en Firebase.
 * Ruta: estrategias/{est}/municipios/{mun}/planAccion
 *
 * ⚠️ PREPARADO PARA MIGRACIÓN:
 *   Acepta tanto el formato heredado del monolito como la entidad PlanAccion.
 *   Si se pasa un PlanAccion de dominio, se convierte al formato Firebase.
 *   El monolito sigue usando guardarPlanEnFirebase() directamente.
 *
 * @param {string} ambitoId
 * @param {object} planData  - Formato Firebase: {fechaISO, seleccionEPVSA, actuaciones, version}
 *                           - O entidad PlanAccion con .objetivos y .acciones
 * @param {string} [estrategia]
 * @returns {Promise<void>}
 */
export async function guardarPlan(ambitoId, planData, estrategia) {
    const est = estrategia || getEstrategiaActual();
    const path = FIREBASE_PATHS.planAccion(est, ambitoId);

    // Normalizar al formato Firebase heredado
    let dataToSave;
    if (planData && planData.nivelEstrategico) {
        // Es una entidad PlanAccion de dominio
        dataToSave = {
            fechaISO:       planData.fechaGuardado || new Date().toISOString(),
            seleccionEPVSA: planData.objetivos || [],
            actuaciones:    planData.acciones  || [],
            version:        planData.version   || 'auto',
        };
    } else {
        // Es el formato heredado directo
        dataToSave = planData;
    }

    return fb.set(path, dataToSave);
}

/**
 * Lista todos los planes de un ámbito.
 *
 * ⚠️ LIMITACIÓN PROVISIONAL:
 *   El sistema actual almacena UN ÚNICO plan por ámbito.
 *   Este método devuelve un array con 0 ó 1 elementos.
 *   Cuando Firebase soporte multi-plan, este método devolverá la colección completa.
 *
 * @param {string} ambitoId
 * @param {string} [estrategia]
 * @returns {Promise<Readonly<object>[]>} Array de PlanTerritorial
 */
export async function listarPlanesPorAmbito(ambitoId, estrategia) {
    const plan = await obtenerPlan(ambitoId, estrategia);
    if (!plan) return [];
    // Registrar en el RegistroPlanes de dominio para consistencia
    const registro = crearRegistroPlanes();
    registro.registrar(plan);
    return [plan];
}

/**
 * Obtiene el nodo completo de datos de un ámbito.
 * Ruta: estrategias/{est}/municipios/{mun}
 *
 * Es el equivalente modular de cargarDatosMunicipioFirebase().
 * A diferencia de la función heredada, NO actualiza window.datosMunicipioActual.
 *
 * @param {string} ambitoId
 * @param {string} [estrategia]
 * @returns {Promise<object|null>} Objeto completo de datos del municipio
 */
export async function obtenerDatosMunicipio(ambitoId, estrategia) {
    const est = estrategia || getEstrategiaActual();
    const path = FIREBASE_PATHS.ambito(est, ambitoId);
    return fb.get(path);
}

/**
 * Lista todos los municipios disponibles para una estrategia.
 * Ruta: estrategias/{est}/municipios
 *
 * Equivalente modular de cargarMunicipiosDisponibles().
 *
 * @param {string} [estrategia]
 * @returns {Promise<string[]>} Array de claves de municipio
 */
export async function listarMunicipios(estrategia) {
    const est = estrategia || getEstrategiaActual();
    const path = FIREBASE_PATHS.municipios(est);
    const datos = await fb.get(path);
    if (!datos) return [];
    return Object.keys(datos);
}

/**
 * Elimina todos los datos de un ámbito de Firebase.
 * Ruta: estrategias/{est}/municipios/{mun}
 *
 * ⚠️ DESTRUCTIVO: Equivale a borrarDatosMunicipio() del monolito.
 *    Solo llamar con confirmación explícita del usuario.
 *
 * @param {string} ambitoId
 * @param {string} [estrategia]
 * @returns {Promise<void>}
 */
export async function eliminarDatosMunicipio(ambitoId, estrategia) {
    const est = estrategia || getEstrategiaActual();
    const path = FIREBASE_PATHS.ambito(est, ambitoId);
    return fb.remove(path);
}

/**
 * Guarda el resultado del análisis IA para un ámbito.
 * Ruta: estrategias/{est}/municipios/{mun}/analisisIA
 *
 * @param {string} ambitoId
 * @param {object} analisis
 * @param {string} [estrategia]
 * @returns {Promise<void>}
 */
export async function guardarAnalisisIA(ambitoId, analisis, estrategia) {
    const est = estrategia || getEstrategiaActual();
    return fb.set(FIREBASE_PATHS.analisisIA(est, ambitoId), analisis);
}

/**
 * Guarda la propuesta IA para un ámbito.
 * Ruta: estrategias/{est}/municipios/{mun}/propuestaIA
 *
 * @param {string} ambitoId
 * @param {object} propuesta
 * @param {string} [estrategia]
 * @returns {Promise<void>}
 */
export async function guardarPropuestaIA(ambitoId, propuesta, estrategia) {
    const est = estrategia || getEstrategiaActual();
    return fb.set(FIREBASE_PATHS.propuestaIA(est, ambitoId), propuesta);
}

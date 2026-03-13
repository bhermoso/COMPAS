/**
 * COMPÁS — Repositorio de Agendas y Acciones
 * persistencia/firebase/repositorioAgendas.js
 *
 * ITERACIÓN 5 — Encapsula el acceso Firebase relacionado con agendas.
 *
 * RUTAS QUE ENCAPSULA:
 *   estrategias/{est}/municipios/{mun}/agendas
 *   estrategias/{est}/municipios/{mun}/seguimiento/{anio}
 *   estrategias/{est}/municipios/{mun}/seguimiento/{anio}/{id}
 *
 * FUNCIONES DEL MONOLITO QUE USAN ESTAS RUTAS (sin modificar):
 *   initAgendas()                     → db.ref(agendas).once(...)
 *   guardarAgendasFirebase()          → db.ref(agendas).set(...)
 *   seguimiento_generarSolicitudes()  → db.ref(seguimiento).update(...)
 *   seguimiento_cargarPanel()         → db.ref(seguimiento).once(...)
 *   seguimiento_marcarEnviada()       → db.ref(seguimientoItem).set(...)
 *   seguimiento_guardarRespuesta()    → db.ref(seguimientoItem).update(...)
 *
 * ESTADO: Preparado para migración. Las funciones heredadas NO se han tocado.
 */

import { fb, FIREBASE_PATHS, getEstrategiaActual } from './firebaseClient.js';
import { agendaDesdeAccionesHeredadas, agendasDesdePlan } from '../../dominio/agendaAnual.js';
import { accionDesdeHeredado, accionesDesdeHeredadas, accionAHeredado } from '../../dominio/accion.js';

// ─────────────────────────────────────────────────────────────────────────────
// AGENDAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene todas las acciones de la agenda de un ámbito desde Firebase.
 * Ruta: estrategias/{est}/municipios/{mun}/agendas
 *
 * Equivalente modular de initAgendas() (sin el efecto de renderizado).
 * Devuelve las acciones como entidades Accion de dominio.
 *
 * @param {string} ambitoId
 * @param {string} [planTerritorialId]  - Para poblar el campo planTerritorialId de cada Accion
 * @param {string} [estrategia]
 * @returns {Promise<Readonly<object>[]>} Array de entidades Accion
 */
export async function obtenerAcciones(ambitoId, planTerritorialId = null, estrategia) {
    const est = estrategia || getEstrategiaActual();
    const path = FIREBASE_PATHS.agendas(est, ambitoId);
    const datos = await fb.get(path);
    if (!datos) return [];

    const accionesRaw = Object.values(datos);
    return accionesDesdeHeredadas(accionesRaw, planTerritorialId, null);
}

/**
 * Obtiene las acciones de la agenda de un ámbito agrupadas por año.
 * Construye entidades AgendaAnual para cada año del período de cobertura.
 *
 * @param {string} ambitoId
 * @param {number[]} aniosCobertura     - Array de años del plan ([2026,...,2030])
 * @param {string} planTerritorialId
 * @param {string} [estrategia]
 * @returns {Promise<Map<number, Readonly<object>>>} Map anio → AgendaAnual
 */
export async function obtenerAgendasPorAnio(ambitoId, aniosCobertura, planTerritorialId, estrategia) {
    const est = estrategia || getEstrategiaActual();
    const path = FIREBASE_PATHS.agendas(est, ambitoId);
    const datos = await fb.get(path);
    const accionesRaw = datos ? Object.values(datos) : [];

    return agendasDesdePlan(accionesRaw, aniosCobertura, planTerritorialId, ambitoId);
}

/**
 * Obtiene la agenda de un año específico.
 *
 * @param {string} ambitoId
 * @param {number|string} anio
 * @param {string} planTerritorialId
 * @param {string} [estrategia]
 * @returns {Promise<Readonly<object>>} AgendaAnual
 */
export async function obtenerAgenda(ambitoId, anio, planTerritorialId, estrategia) {
    const est = estrategia || getEstrategiaActual();
    const path = FIREBASE_PATHS.agendas(est, ambitoId);
    const datos = await fb.get(path);
    const accionesRaw = datos ? Object.values(datos) : [];

    return agendaDesdeAccionesHeredadas(accionesRaw, anio, planTerritorialId, ambitoId);
}

/**
 * Guarda el array completo de acciones de la agenda en Firebase.
 * Ruta: estrategias/{est}/municipios/{mun}/agendas
 *
 * ⚠️ PREPARADO PARA MIGRACIÓN:
 *   Acepta tanto un array de entidades Accion de dominio como el formato
 *   heredado del monolito (array plano de objetos normalizados).
 *   El resultado siempre se convierte al formato Firebase heredado.
 *
 * @param {string} ambitoId
 * @param {Array} acciones   - Array de entidades Accion o de objetos heredados
 * @param {string} [estrategia]
 * @returns {Promise<void>}
 */
export async function guardarAgendas(ambitoId, acciones, estrategia) {
    const est = estrategia || getEstrategiaActual();
    const path = FIREBASE_PATHS.agendas(est, ambitoId);

    if (!Array.isArray(acciones) || acciones.length === 0) {
        return fb.set(path, {});
    }

    // Normalizar al formato heredado si es necesario
    const accionesNorm = acciones.map(a => {
        if (a && a.origenAccion !== undefined) {
            // Es una entidad Accion de dominio → convertir al formato heredado
            return accionAHeredado(a);
        }
        // Ya es formato heredado
        return a;
    });

    // Firebase no acepta arrays; guardar como objeto con id como clave
    const obj = {};
    accionesNorm.forEach(a => { if (a && a.id !== undefined) obj[a.id] = a; });
    return fb.set(path, obj);
}

/**
 * Guarda una acción individual en la agenda.
 * Ruta: estrategias/{est}/municipios/{mun}/agendas/{id}
 *
 * @param {string} ambitoId
 * @param {Readonly<object>|object} accion  - Entidad Accion o formato heredado
 * @param {string} [estrategia]
 * @returns {Promise<void>}
 */
export async function guardarAccion(ambitoId, accion, estrategia) {
    const est = estrategia || getEstrategiaActual();
    const basePath = FIREBASE_PATHS.agendas(est, ambitoId);

    const accionPlana = (accion && accion.origenAccion !== undefined)
        ? accionAHeredado(accion)
        : accion;

    if (!accionPlana || accionPlana.id === undefined) {
        throw new Error('[repositorioAgendas.guardarAccion] La acción debe tener un id.');
    }

    return fb.set(`${basePath}/${accionPlana.id}`, accionPlana);
}

// ─────────────────────────────────────────────────────────────────────────────
// SEGUIMIENTO ANUAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene el seguimiento anual de un ámbito para un año dado.
 * Ruta: estrategias/{est}/municipios/{mun}/seguimiento/{anio}
 *
 * Equivalente modular de seguimiento_cargarPanel().
 *
 * @param {string} ambitoId
 * @param {number|string} anio
 * @param {string} [estrategia]
 * @returns {Promise<object|null>} Mapa de solicitudes de seguimiento
 */
export async function obtenerSeguimiento(ambitoId, anio, estrategia) {
    const est = estrategia || getEstrategiaActual();
    const path = FIREBASE_PATHS.seguimiento(est, ambitoId, anio);
    return fb.get(path);
}

/**
 * Guarda (o actualiza) el mapa de solicitudes de seguimiento.
 * Ruta: estrategias/{est}/municipios/{mun}/seguimiento/{anio}
 *
 * @param {string} ambitoId
 * @param {number|string} anio
 * @param {object} solicitudes   - Mapa id → SolicitudSeguimiento
 * @param {string} [estrategia]
 * @returns {Promise<void>}
 */
export async function guardarSeguimiento(ambitoId, anio, solicitudes, estrategia) {
    const est = estrategia || getEstrategiaActual();
    const path = FIREBASE_PATHS.seguimiento(est, ambitoId, anio);
    return fb.update(path, solicitudes);
}

/**
 * Actualiza una solicitud de seguimiento individual.
 * Ruta: estrategias/{est}/municipios/{mun}/seguimiento/{anio}/{id}
 *
 * @param {string} ambitoId
 * @param {number|string} anio
 * @param {string} solicitudId
 * @param {object} datos         - Campos a actualizar
 * @param {string} [estrategia]
 * @returns {Promise<void>}
 */
export async function actualizarSolicitudSeguimiento(ambitoId, anio, solicitudId, datos, estrategia) {
    const est = estrategia || getEstrategiaActual();
    const path = FIREBASE_PATHS.seguimientoItem(est, ambitoId, anio, solicitudId);
    return fb.update(path, datos);
}

/**
 * Marca una solicitud de seguimiento como enviada.
 * Ruta: estrategias/{est}/municipios/{mun}/seguimiento/{anio}/{id}
 *
 * @param {string} ambitoId
 * @param {number|string} anio
 * @param {string} solicitudId
 * @param {string} [estrategia]
 * @returns {Promise<void>}
 */
export async function marcarSolicitudEnviada(ambitoId, anio, solicitudId, estrategia) {
    return actualizarSolicitudSeguimiento(
        ambitoId, anio, solicitudId,
        { estado: 'enviada', fechaEnvio: new Date().toISOString() },
        estrategia
    );
}

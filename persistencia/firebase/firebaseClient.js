/**
 * COMPÁS — Cliente Firebase modular
 * persistencia/firebase/firebaseClient.js
 *
 * ITERACIÓN 5 — Capa de acceso a Firebase.
 *
 * DISEÑO DELIBERADO:
 *   Este módulo NO inicializa Firebase. El monolito (COMPAS.html l.4186-4201)
 *   ya lo inicializa con firebase.initializeApp() y expone `window.db`.
 *   Este módulo accede a `window.db` como bridge de compatibilidad temporal.
 *
 *   En el futuro, cuando se extraiga la inicialización del monolito, este módulo
 *   pasará a inicializar Firebase por sí mismo. Ese es el único cambio necesario.
 *
 * RESPONSABILIDADES:
 *   1. Centralizar TODAS las rutas Firebase en FIREBASE_PATHS
 *   2. Proveer operaciones CRUD genéricas que devuelven Promises
 *   3. Ser el único punto de contacto entre los repositorios y Firebase SDK
 *
 * USO:
 *   import { FIREBASE_PATHS, fb } from './firebaseClient.js';
 *   const plan = await fb.get(FIREBASE_PATHS.planAccion('es-andalucia-epvsa', 'padul'));
 *
 * NO MODIFICA: COMPAS.html ni ninguna función del monolito.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ACCESO A LA INSTANCIA DB
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve la instancia de Firebase Realtime Database.
 * Lee de window.db, inicializada por el monolito (HTML l.4196).
 *
 * ⚠️ PROVISIONAL: Mientras el monolito controle la inicialización, este
 *    getter depende de que el <script> heredado haya corrido antes.
 *    Los módulos ES son diferidos, por lo que window.db SIEMPRE estará
 *    disponible cuando este módulo se ejecute.
 *
 * @returns {object} Firebase Database instance
 * @throws {Error} Si window.db no está disponible (no debería ocurrir)
 */
export function getDb() {
    if (typeof window !== 'undefined' && window.db) {
        return window.db;
    }
    throw new Error(
        '[firebaseClient] window.db no disponible. ' +
        'El monolito COMPAS.html debe haber inicializado Firebase antes de que este módulo se use.'
    );
}

/**
 * Devuelve la estrategia activa.
 * Lee de window.estrategiaActual (variable heredada del monolito).
 * ⚠️ PROVISIONAL: Debe derivarse de estadoGlobal.configuracionSistema.estrategiaId
 * @returns {string}
 */
export function getEstrategiaActual() {
    if (typeof window !== 'undefined' && window.estrategiaActual) {
        return window.estrategiaActual;
    }
    return 'es-andalucia-epvsa';
}

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS FIREBASE CENTRALIZADAS
// (anteriormente dispersas en ~50 puntos del monolito — LISTA_HARDCODING.md H10)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Catálogo centralizado de todas las rutas Firebase del sistema.
 * Cada propiedad es una función que construye la ruta con los parámetros dados.
 *
 * Convención de nombres: sustantivo en español, camelCase, sin prefijo "ruta".
 * Los parámetros se pasan siempre como {est, mun, ...} para claridad.
 */
export const FIREBASE_PATHS = Object.freeze({

    // ── Territorios ──────────────────────────────────────────────────────────
    /** Lista todos los municipios de una estrategia */
    municipios:         (est)           => `estrategias/${est}/municipios`,

    /** Nodo completo de un municipio (toda la información) */
    ambito:             (est, mun)      => `estrategias/${est}/municipios/${mun}`,

    // ── Plan de acción ────────────────────────────────────────────────────────
    /** Plan de acción guardado: { fechaISO, seleccionEPVSA, actuaciones, version } */
    planAccion:         (est, mun)      => `estrategias/${est}/municipios/${mun}/planAccion`,

    /** Selección EPVSA (escrita por _locActs, usada como fallback) */
    seleccionEPVSA:     (est, mun)      => `estrategias/${est}/municipios/${mun}/seleccionEPVSA`,

    // ── Agenda anual ──────────────────────────────────────────────────────────
    /** Agenda anual completa (array plano de acciones) */
    agendas:            (est, mun)      => `estrategias/${est}/municipios/${mun}/agendas`,

    /** Seguimiento anual de actuaciones por año */
    seguimiento:        (est, mun, anio)=> `estrategias/${est}/municipios/${mun}/seguimiento/${anio}`,

    /** Un seguimiento individual por solicitud */
    seguimientoItem:    (est, mun, anio, id) =>
                                          `estrategias/${est}/municipios/${mun}/seguimiento/${anio}/${id}`,

    // ── Diagnóstico / indicadores ─────────────────────────────────────────────
    /** Indicadores del cuadro de mandos integral (50 indicadores APQ) */
    indicadores:        (est, mun)      => `estrategias/${est}/municipios/${mun}/indicadores`,

    /** Determinantes EAS (55 determinantes) */
    determinantes:      (est, mun)      => `estrategias/${est}/municipios/${mun}/determinantes`,

    /** Informe de situación (HTML del informe Word/PDF subido) */
    informe:            (est, mun)      => `estrategias/${est}/municipios/${mun}/informe`,

    /** Conclusiones del diagnóstico */
    conclusiones:       (est, mun)      => `estrategias/${est}/municipios/${mun}/conclusiones`,

    /** Recomendaciones del diagnóstico */
    recomendaciones:    (est, mun)      => `estrategias/${est}/municipios/${mun}/recomendaciones`,

    /** Programas EPVSA del municipio */
    programas:          (est, mun)      => `estrategias/${est}/municipios/${mun}/programas`,

    // ── Análisis IA ───────────────────────────────────────────────────────────
    /** Resultado del análisis IA (motor v2) */
    analisisIA:         (est, mun)      => `estrategias/${est}/municipios/${mun}/analisisIA`,

    /** Propuesta IA (motor v2 → propuesta EPVSA) */
    propuestaIA:        (est, mun)      => `estrategias/${est}/municipios/${mun}/propuestaIA`,

    /** Priorización formal (decisión del técnico) */
    priorizacion:       (est, mun)      => `estrategias/${est}/municipios/${mun}/priorizacion`,

    // ── Participación ciudadana ───────────────────────────────────────────────
    /** Resultados consolidados de votación ciudadana EPVSA */
    participacionCiudadana: (est, mun)  => `estrategias/${est}/municipios/${mun}/participacionCiudadana`,

    /** Decisión formal de priorización (triple: epi + ciudadano + técnico) */
    decisionPriorizacion: (est, mun)    => `estrategias/${est}/municipios/${mun}/decisionPriorizacion`,

    /** Votación RELAS consolidada */
    votacionRelas:      (est, mun)      => `estrategias/${est}/municipios/${mun}/votacionRelas`,

    // ── Grupo motor y hoja de ruta ────────────────────────────────────────────
    /** Miembros del grupo motor de planificación */
    grupoMotor:         (est, mun)      => `estrategias/${est}/municipios/${mun}/grupoMotor`,

    /** Hoja de ruta (hitos del proceso de planificación) */
    hojaRuta:           (est, mun)      => `estrategias/${est}/municipios/${mun}/hojaRuta`,

    /** Un hito individual de la hoja de ruta */
    hojaRutaItem:       (est, mun, id)  => `estrategias/${est}/municipios/${mun}/hojaRuta/${id}`,

    // ── Estudios complementarios ──────────────────────────────────────────────
    /** Estudios complementarios (textos de informes externos analizados por IA) */
    estudiosComplementarios: (est, mun) => `estrategias/${est}/municipios/${mun}/estudiosComplementarios`,

    /** Escalas diagnósticas (resultado del análisis de estudios) */
    estudiosComplementariosEscalas: (est, mun) =>
                                          `estrategias/${est}/municipios/${mun}/estudiosComplementariosEscalas`,

    // ── IBSE ──────────────────────────────────────────────────────────────────
    /** Respuestas individuales del cuestionario IBSE (ruta primaria) */
    ibseRespuestas:     (mun)           => `ibse_respuestas/${mun}`,

    /** Agregado IBSE (ruta legacy / mirror) */
    ibseMonitor:        (mun)           => `ibse_monitor/${mun}`,

    /** Datos IBSE en el nodo municipio */
    ibseDatos:          (est, mun)      => `estrategias/${est}/municipios/${mun}/ibseDatos`,

    // ── Referencias EAS ───────────────────────────────────────────────────────
    /** Valores de referencia Andalucía/Granada para determinantes EAS */
    referencias:        ()              => `referencias`,

    // ── Votaciones ciudadanas ─────────────────────────────────────────────────
    /** Sesión de votación EPVSA */
    votacionSesion:     (mun, sesId)    => `votaciones/${mun}/${sesId}/sesion`,

    /** Respuestas de votación EPVSA (listener en tiempo real) */
    votacionRespuestas: (mun, sesId)    => `votaciones/${mun}/${sesId}/respuestas`,

    /** Sesión RELAS */
    relajSesion:        (mun, sesId)    => `votaciones_relas/${mun}/${sesId}/sesion`,

    /** Respuestas RELAS */
    relasRespuestas:    (mun, sesId)    => `votaciones_relas/${mun}/${sesId}/respuestas`,

    // ── Datos adicionales para módulo de prioridades ──────────────────────────
    /** Datos RELAS consolidados */
    relas:              (est, mun)      => `estrategias/${est}/municipios/${mun}/relas`,

    /** Datos históricos de RELAS */
    relasDatos:         (est, mun)      => `estrategias/${est}/municipios/${mun}/relas_datos`,
});

// ─────────────────────────────────────────────────────────────────────────────
// OPERACIONES CRUD GENÉRICAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Objeto `fb` — API de operaciones Firebase.
 * Todos los métodos devuelven Promises.
 * Usa getDb() para obtener la instancia Firebase en el momento de la llamada
 * (no en la importación del módulo), garantizando que window.db está disponible.
 */
export const fb = Object.freeze({

    /**
     * Lee un nodo de Firebase una sola vez.
     * @param {string} path
     * @returns {Promise<*>} Valor del nodo (null si no existe)
     */
    get(path) {
        return getDb().ref(path).once('value').then(snap => snap.val());
    },

    /**
     * Lee un nodo y devuelve también la clave (key) Firebase.
     * @param {string} path
     * @returns {Promise<{key: string, val: *}>}
     */
    getWithKey(path) {
        return getDb().ref(path).once('value').then(snap => ({
            key: snap.key,
            val: snap.val(),
        }));
    },

    /**
     * Escribe (reemplaza) un nodo de Firebase.
     * @param {string} path
     * @param {*} data
     * @returns {Promise<void>}
     */
    set(path, data) {
        return getDb().ref(path).set(data);
    },

    /**
     * Actualiza campos de un nodo sin reemplazarlo completamente.
     * @param {string} path
     * @param {object} data
     * @returns {Promise<void>}
     */
    update(path, data) {
        return getDb().ref(path).update(data);
    },

    /**
     * Añade un ítem a un nodo con clave auto-generada por Firebase.
     * @param {string} path
     * @param {*} data
     * @returns {Promise<string>} La clave generada por Firebase
     */
    push(path, data) {
        return getDb().ref(path).push(data).then(ref => ref.key);
    },

    /**
     * Elimina un nodo de Firebase.
     * @param {string} path
     * @returns {Promise<void>}
     */
    remove(path) {
        return getDb().ref(path).remove();
    },

    /**
     * Registra un listener en tiempo real sobre un nodo.
     * @param {string} path
     * @param {Function} callback  - Se llama con el valor cada vez que cambia
     * @param {'value'|'child_added'|'child_changed'|'child_removed'} [evento]
     * @returns {Function} Función para cancelar el listener (off)
     */
    listen(path, callback, evento = 'value') {
        const ref = getDb().ref(path);
        const handler = snap => callback(snap.val(), snap.key);
        ref.on(evento, handler);
        return () => ref.off(evento, handler);
    },

    /**
     * ¿Existe el nodo (tiene datos no nulos)?
     * @param {string} path
     * @returns {Promise<boolean>}
     */
    exists(path) {
        return getDb().ref(path).once('value').then(snap => snap.exists());
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE RUTA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Helper: construye la ruta base de un ámbito usando la estrategia activa.
 * Equivale al patrón repetido en el monolito:
 *   'estrategias/' + estrategiaActual + '/municipios/' + municipio
 *
 * @param {string} ambitoId  - Clave del municipio/territorio
 * @param {string} [est]     - ID de estrategia (opcional; usa la activa si no se da)
 * @returns {string}
 */
export function pathAmbito(ambitoId, est) {
    return FIREBASE_PATHS.ambito(est || getEstrategiaActual(), ambitoId);
}

/**
 * Helper: construye la ruta de una subsección de un ámbito.
 * @param {string} ambitoId
 * @param {string} seccion   - p.ej. 'planAccion', 'agendas', 'indicadores'
 * @param {string} [est]
 * @returns {string}
 */
export function pathSeccion(ambitoId, seccion, est) {
    return `${pathAmbito(ambitoId, est)}/${seccion}`;
}

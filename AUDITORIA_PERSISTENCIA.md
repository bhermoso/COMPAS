# AUDITORÍA DE PERSISTENCIA — COMPÁS
> Iteración 5 — Encapsulación de rutas Firebase.
> Fecha: 2026-03-12. El monolito HTML no ha sido modificado.

---

## 1. Inventario completo de rutas Firebase

### Grupo A — Plan territorial (encapsulado: repositorioPlanes.js)

| Ruta Firebase | Operaciones | Funciones heredadas | FIREBASE_PATHS key |
|---|---|---|---|
| `estrategias/{est}/municipios/{mun}` | read, remove | `cargarDatosMunicipioFirebase`, `actualizarBadgesFase4`, `actualizarEstadosCarga`, `borrarDatosMunicipio` | `ambito` |
| `estrategias/{est}/municipios/{mun}/planAccion` | set, (read vía nodo padre) | `guardarPlanEnFirebase` | `planAccion` |
| `estrategias/{est}/municipios/{mun}/seleccionEPVSA` | set | `_locActs` (interno) | `seleccionEPVSA` |
| `estrategias/{est}/municipios/{mun}/analisisIA` | set | `guardarAnalisisIA` (anónima dentro de callback) | `analisisIA` |
| `estrategias/{est}/municipios/{mun}/propuestaIA` | set | `generarPropuestaIA` | `propuestaIA` |
| `estrategias/{est}/municipios` | read | `cargarMunicipiosDisponibles` | `municipios` |

### Grupo B — Agenda anual y seguimiento (encapsulado: repositorioAgendas.js)

| Ruta Firebase | Operaciones | Funciones heredadas | FIREBASE_PATHS key |
|---|---|---|---|
| `estrategias/{est}/municipios/{mun}/agendas` | read, set | `initAgendas`, `guardarAgendasFirebase` | `agendas` |
| `estrategias/{est}/municipios/{mun}/seguimiento/{anio}` | read, update | `seguimiento_cargarPanel`, `seguimiento_generarSolicitudes` | `seguimiento` |
| `estrategias/{est}/municipios/{mun}/seguimiento/{anio}/{id}` | set, update | `seguimiento_marcarEnviada`, `seguimiento_guardarRespuesta` | `seguimientoItem` |

### Grupo C — Diagnóstico e indicadores (encapsulado: repositorioIndicadores.js)

| Ruta Firebase | Operaciones | Funciones heredadas | FIREBASE_PATHS key |
|---|---|---|---|
| `estrategias/{est}/municipios/{mun}/indicadores` | set | `cargarIndicadoresCSV` | `indicadores` |
| `estrategias/{est}/municipios/{mun}/determinantes` | read, set | `cargarDeterminantes`, `guardarDeterminantes`, `cargarDeterminantesCSV` | `determinantes` |
| `estrategias/{est}/municipios/{mun}/informe` | set | `textoPlano` (dentro de cargarInformeWord) | `informe` |
| `estrategias/{est}/municipios/{mun}/conclusiones` | set | `cargarConclusionesCSV`, `guardarConclusionesTexto` | `conclusiones` |
| `estrategias/{est}/municipios/{mun}/recomendaciones` | set | `cargarRecomendacionesCSV`, `guardarRecomendacionesTexto` | `recomendaciones` |
| `estrategias/{est}/municipios/{mun}/priorizacion` | set | `cargarPriorizacionCSV`, `guardarPriorizacionTexto` | `priorizacion` |
| `estrategias/{est}/municipios/{mun}/programas` | set | `cargarProgramasCSV` | `programas` |
| `estrategias/{est}/municipios/{mun}/participacionCiudadana` | read, set | `cargarParticipacionCiudadana`, `incorporarResultadosAlPlan` | `participacionCiudadana` |
| `estrategias/{est}/municipios/{mun}/decisionPriorizacion` | read, set | `cargarDecisionPriorizacion`, `confirmarPriorizacion`, `relas_confirmarPriorizacionTriple`, `vrelas_confirmarPriorizacionOficial` | `decisionPriorizacion` |
| `estrategias/{est}/municipios/{mun}/votacionRelas` | read | `cargarParticipacionCiudadana`, `vrelasUrlFormulario`, `vrelas_confirmarPriorizacionOficial` | `votacionRelas` |
| `estrategias/{est}/municipios/{mun}/estudiosComplementarios` | read | `_cargarEstudiosFirebase`, `paraFirebase` | `estudiosComplementarios` |
| `estrategias/{est}/municipios/{mun}/estudiosComplementariosEscalas` | read | `_cargarEscalasFirebase`, `_guardarEscalasFirebase` | `estudiosComplementariosEscalas` |
| `estrategias/{est}/municipios/{mun}/ibseDatos` | read, set, remove | `_cargarIBSEFirebase`, `ibse_guardarAgregado` | `ibseDatos` |
| `ibse_respuestas/{mun}` | read, push, remove | `ibseMonitor_abrir`, `ibse_recalcularAgregado` | `ibseRespuestas` |
| `ibse_monitor/{mun}` | read, set | `ibseMonitor_abrir`, `_cargarIBSEFirebase`, `ibse_guardarAgregado` | `ibseMonitor` |
| `referencias` | read, set, update, remove | `cargarReferenciasEAS`, `guardarReferenciasEAS`, `actualizarEstadosCarga`, `borrarDatosMunicipio`, `borrarReferencias` | `referencias` |

### Grupo D — Grupo motor y hoja de ruta (rutas centralizadas, sin repositorio específico todavía)

| Ruta Firebase | Operaciones | Funciones heredadas | FIREBASE_PATHS key |
|---|---|---|---|
| `estrategias/{est}/municipios/{mun}/grupoMotor` | read (listener .on) | `cargarMiembros` | `grupoMotor` |
| `estrategias/{est}/municipios/{mun}/hojaRuta` | read, set | `inicializarHojaRuta`, `guardarHitoPersonalizado` | `hojaRuta` |
| `estrategias/{est}/municipios/{mun}/hojaRuta/{id}` | set | `guardarHitoPersonalizado` | `hojaRutaItem` |
| `estrategias/{est}/municipios/{mun}/relas` | read | `est` (dentro de callback relas) | `relas` |
| `estrategias/{est}/municipios/{mun}/relas_datos` | read | `COMPAS_cargarPrioridadesFirebase` | `relasDatos` |

### Grupo E — Votaciones en tiempo real (rutas centralizadas, sin repositorio específico todavía)

| Ruta Firebase | Operaciones | Funciones heredadas | FIREBASE_PATHS key |
|---|---|---|---|
| `votaciones/{mun}/{ses}/sesion` | set | `iniciarSesionVotacion` | `votacionSesion` |
| `votaciones/{mun}/{ses}/respuestas` | listen, push, off | `setupVotacionListener`, `detenerSesionVotacion`, `simularVotos` | `votacionRespuestas` |
| `votaciones/{mun}/{ses}` | remove | `reiniciarVotacion` | — (derivada de votacionRespuestas) |
| `votaciones/{mun}` | read | `enviarEncuesta`, `enviarVotoDirecto`, `guardarVotoManual` | — |
| `votaciones_relas/{mun}/{ses}/sesion` | set | `vrelas_iniciarSesion` | `relajSesion` |
| `votaciones_relas/{mun}/{ses}/respuestas` | listen, push, off | `vrelas_iniciarSesion`, `vrelas_enviarVoto`, `vrelas_detenerSesion` | `relasRespuestas` |
| `votaciones_relas/{mun}/{ses}` | remove | `vrelas_reiniciar` | — |

### Grupo F — Ruta genérica (patrón con tipo variable)

| Ruta Firebase | Operaciones | Funciones heredadas | Nota |
|---|---|---|---|
| `estrategias/{est}/municipios/{mun}/{tipo}` | set | `procesarCSVMasivo` | `tipo` es dinámico: 'conclusiones', 'recomendaciones', etc. |
| `path` (variable) | read, set | `relas_cargarDesdeFirebase`, `relas_guardarEnFirebase` | Path construido dinámicamente por el módulo RELAS |

---

## 2. Resumen de encapsulación

| Repositorio | Rutas encapsuladas | Funciones heredadas cubiertas |
|---|---|---|
| `firebaseClient.js` | 34 paths en FIREBASE_PATHS | Todas (es la capa base) |
| `repositorioPlanes.js` | 6 paths (grupo A) | 8 funciones |
| `repositorioAgendas.js` | 3 paths (grupo B) | 6 funciones |
| `repositorioIndicadores.js` | 17 paths (grupos C parcial) | 20 funciones |
| Sin repositorio todavía | 11 paths (grupos D y E) | ~15 funciones (grupo motor, hoja de ruta, votaciones RT) |

**Total rutas detectadas:** ~50 expresiones de ruta → **34 paths canónicos** en FIREBASE_PATHS.

---

## 3. Funciones del monolito que siguen usando Firebase directo

Las siguientes funciones del monolito siguen llamando a `db.ref()` directamente (98 llamadas totales). **No se han modificado.** Se listan agrupadas por repositorio pendiente de migración:

### Pendiente de migrar a repositorioPlanes.js
- `cargarDatosMunicipioFirebase(municipioKey, callback)` — l.4897 — carga todo el nodo municipio
- `guardarPlanEnFirebase(version)` — l.11363 — escribe planAccion
- `actualizarBadgesFase4()` — l.5667 — lee nodo municipio
- `actualizarEstadosCarga()` — l.5559 — lee nodo municipio y referencias
- `borrarDatosMunicipio()` — l.5736 — elimina nodo municipio
- `cargarMunicipiosDisponibles()` — l.~7584 — lista municipios

### Pendiente de migrar a repositorioAgendas.js
- `initAgendas()` — l.12288 — lee agendas
- `guardarAgendasFirebase()` — l.13087 — escribe agendas
- `seguimiento_cargarPanel()` — l.29439 — lee seguimiento
- `seguimiento_generarSolicitudes()` — l.29388 — actualiza seguimiento
- `seguimiento_marcarEnviada()` — l.29518 — escribe campo
- `seguimiento_guardarRespuesta()` — l.29542 — actualiza solicitud

### Pendiente de migrar a repositorioIndicadores.js
- `cargarDeterminantes()` — l.5450
- `guardarDeterminantes()` — l.5430
- `cargarReferenciasEAS(callback)` — l.~7700
- `_cargarIBSEFirebase(municipio)` — l.~27881
- `_cargarEstudiosFirebase(mun)` — l.~23483
- `cargarDecisionPriorizacion(municipio)` — l.~18510
- `confirmarPriorizacion(decision)` — l.~18441
- `cargarParticipacionCiudadana(municipio)` — l.~17950

### Sin repositorio específico todavía (grupos D y E)
- `cargarMiembros()` — listener `.on()` en grupoMotor
- `añadirMiembro()`, `eliminarMiembro()` — grupoMotor
- `inicializarHojaRuta()`, `actHito()`, `guardarHitoPersonalizado()` — hojaRuta
- Todo el módulo de votaciones EPVSA en tiempo real (~8 funciones)
- Todo el módulo VRELAS (~6 funciones)
- `COMPAS_cargarPrioridadesFirebase()` — lee varios paths en paralelo
- Funciones del módulo RELAS (relas_cargarDesdeFirebase, relas_guardarEnFirebase)

---

## 4. Qué ya quedó preparado para migración

### Listo para usar hoy (capa paralela activa)

```js
// Desde cualquier módulo ES
import { obtenerPlan, guardarPlan } from './persistencia/firebase/repositorioPlanes.js';
import { obtenerAgenda, guardarAgendas } from './persistencia/firebase/repositorioAgendas.js';
import { obtenerIndicadores, obtenerDeterminantes, obtenerReferencias }
    from './persistencia/firebase/repositorioIndicadores.js';

// Ejemplo de uso:
const plan = await obtenerPlan('padul');   // → PlanTerritorial de dominio
const agenda = await obtenerAgenda('padul', 2026, plan.id);  // → AgendaAnual de dominio
const { indicadores, determinantes } = await obtenerDiagnosticoCompleto('padul');
```

### Estado de migración

| Componente | Estado |
|---|---|
| FIREBASE_PATHS centralizado | ✅ 34 paths en firebaseClient.js |
| Helpers CRUD genéricos (get, set, update, push, remove, listen) | ✅ En fb object |
| Repositorio de planes | ✅ 9 métodos |
| Repositorio de agendas | ✅ 9 métodos |
| Repositorio de indicadores | ✅ 20 métodos |
| Grupo motor / hoja de ruta | ⏳ Paths definidos, repositorio pendiente |
| Votaciones ciudadanas RT | ⏳ Paths definidos, repositorio pendiente |
| RELAS / módulo de prioridades | ⏳ Paths definidos, repositorio pendiente |
| Migración del monolito a usar repositorios | ⏳ Pendiente — ninguna función heredada migrada todavía |

### Pasos recomendados para la migración (iteración futura)

1. **Paso 1** — Migrar `initAgendas()` y `guardarAgendasFirebase()` a usar `repositorioAgendas`:
   Son funciones relativamente simples con una sola dependencia Firebase.

2. **Paso 2** — Migrar `guardarDeterminantes()` y `cargarDeterminantes()`:
   Funciones puras de lectura/escritura sin lógica compleja.

3. **Paso 3** — Migrar `guardarPlanEnFirebase()` y `cargarPlanGuardado()`:
   Mayor riesgo por el estado dual documentado en AUDITORIA_CODIGO.md D2.

4. **Paso 4** — Migrar `cargarDatosMunicipioFirebase()`:
   El mayor riesgo — es la función de carga principal con múltiples callbacks.

5. **Paso 5** — Crear repositorioGrupoMotor.js y repositorioVotaciones.js
   para los grupos D y E (de menor prioridad para el plan de acción).

---

## 5. Invariantes garantizados tras esta iteración

| Invariante | Verificado |
|---|---|
| COMPAS.html sin modificar | ✅ |
| Las rutas Firebase del monolito siguen funcionando | ✅ (no se tocó ninguna) |
| Los repositorios son módulos ES puros | ✅ |
| Los repositorios retornan Promises | ✅ |
| Los repositorios devuelven entidades de dominio cuando corresponde | ✅ |
| firebaseClient usa window.db (ya inicializado por el monolito) | ✅ |
| No se re-inicializa Firebase | ✅ |
| La app sigue arrancando sin cambios funcionales | ✅ |

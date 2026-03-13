# MAPA DE MÓDULOS IMPLÍCITOS — COMPÁS
> Bloques funcionales identificados en el monolito, con sus fronteras, categoría arquitectural y dependencias.
> Fecha: 2026-03-12. Solo lectura — no se modifica código.

---

## Estructura general del archivo

```
Líneas 1–4095        CSS + HTML base
Líneas 4095–4530     [MÓDULO: CORE/CONFIG]     Metadatos, Firebase init, estrategias, terminología
Líneas 4530–4715     [MÓDULO: CORE/COMPILADOR] Estado del compilador de fases
Líneas 4715–4895     [MÓDULO: DOMINIO/CMI]     Cuadro de Mandos Integral (50 indicadores)
Líneas 4895–5200     [MÓDULO: PERSISTENCIA/MUNICIPIO] Carga datos municipio Firebase
Líneas 5200–5505     [MÓDULO: DOMINIO/DETERMINANTES] Estructura EAS + UI CRUD determinantes
Líneas 5505–7060     [MÓDULO: PERSISTENCIA/CARGA] Panel de gestión de datos (CSV, ZIP, Word, PDF)
Líneas 7580–7770     [MÓDULO: PERSISTENCIA/TERRITORIOS] Carga municipios y referencias EAS
Líneas 7770–7930     [MÓDULO: CORE/AMBITO]     actualizarMunicipio() — función pivote
Líneas 7930–8108     [MÓDULO: IA/ORCHESTRATOR] verificarYGenerarAnalisisAutomatico()
Líneas 8108–8465     [MÓDULO: UI/DOCUMENTOS]   Generación de perfil e informe HTML
Líneas 8465–8620     [MÓDULO: PERSISTENCIA/GRUPO] Grupo motor + hoja de ruta
Líneas 8700–15450    [MÓDULO: DOMINIO/EPVSA]   ESTRUCTURA_EPVSA + Logos B64 + Plan de acción
Líneas 15800–22900   [MÓDULO: PERSISTENCIA/PARTICIPACION] Votaciones EPVSA + VRELAS
Líneas 23369–23620   [MÓDULO: PERSISTENCIA/ESTUDIOS] Estudios complementarios
Líneas 24000–26620   [MÓDULO: IA/MOTOR_V2]     Motor salutogénico v2 + generador propuesta
Líneas 26620–27504   [MÓDULO: IA/MOTOR_V3]     Motor v3 IIFE + scores + hook monkey-patch
Líneas 27555–28200   [MÓDULO: DOMINIO/IBSE]    Monitor IBSE + cuestionario + carga CSV
Líneas 28200–28700   [MÓDULO: DOMINIO/EVALUACION] Evaluación Fase 6 (ISS + semáforos + tabla)
Líneas 29100–29333   [MÓDULO: PERSISTENCIA/PRIORIDADES] Namespace unificado de prioridades
Líneas 29335–29640   [MÓDULO: DOMINIO/SEGUIMIENTO] Seguimiento anual de actuaciones
Líneas 29640–final   [MÓDULO: DOMINIO/MAPA]    Grafo del plan
```

---

## Ficha por módulo implícito

---

### M01 — CORE / CONFIG
**Líneas:** 4095–4530
**Categoría:** `core`

**Responsabilidades:**
- Constantes de versión y copyright (`COMPAS_VERSION`)
- Inicialización de Firebase (`firebase.initializeApp`)
- Inventario de estado global documentado (bloque de comentarios)
- Variables de estado primarias (`db`, `datosMunicipioActual`, `planLocalSalud`, `window.COMPAS`)
- Definición de estrategias (`ESTRATEGIAS_SALUD`, `TERRITORIOS`)
- Configuración del motor experto (`ANALYTIC_CONFIG`, `COMPAS_EXPERT_SYSTEM`)
- Funciones de acceso a la estrategia activa (`getConfigActual`, `getEstructuraActual`, `cambiarEstrategia`, `getTerminologia`)

**Variables de estado exportadas:**
```
db                        — instancia Firebase Realtime Database
estrategiaActual          — string ID estrategia ('es-andalucia-epvsa')
datosMunicipioActual      — objeto completo municipio desde Firebase
planLocalSalud            — { perfil, planAccion, agenda } para el compilador
window.COMPAS             — namespace global: { state, prioridades, mapa, ... }
ANALYTIC_CONFIG           — pesos y umbrales del motor experto
COMPAS_EXPERT_SYSTEM      — objeto motor experto (normalizar, calcularSFA, aplicarReglas)
ESTRATEGIAS_SALUD         — mapa de estrategias disponibles
TERRITORIOS               — territorios por estrategia (municipios, mancomunidades)
```

**Dependencias de entrada:** Firebase SDK (CDN)
**Dependencias de salida:** Todos los demás módulos

**Acoplamiento problemático:**
- `ANALYTIC_CONFIG` y `COMPAS_EXPERT_SYSTEM` coexisten en el mismo bloque con la configuración de Firebase y las variables de sesión. Son conceptualmente IA pero están en el bloque de configuración de core.
- `TERRITORIOS` y `MUNICIPIOS` (l.4915) son dos representaciones duplicadas de la misma lista.

---

### M02 — CORE / COMPILADOR
**Líneas:** 4530–4715
**Categoría:** `core`

**Responsabilidades:**
- Verificar si el plan local está completo (`verificarPlanLocalCompleto`)
- Actualizar badges de estado en el compilador de fases (`actualizarEstadoCompilador`)
- Guardar partes del plan para el compilador (`guardarPerfilParaCompilador`, `guardarPlanAccionParaCompilador`, `guardarAgendaParaCompilador`)
- Resetear el estado al cambiar de municipio (`resetearPlanLocal`)
- Controlar acceso a Fases 5-6 (`verificarAccesoFase6`)

**Estado que gestiona:** `planLocalSalud`, `window.COMPAS.state`

**Dependencias de entrada:** M01 (estado global)
**Dependencias de salida:** M08 (UI), M09 (plan), M10 (agenda)

---

### M03 — DOMINIO / CMI (Cuadro de Mandos Integral)
**Líneas:** 4715–4895
**Categoría:** `dominio`

**Responsabilidades:**
- Generar HTML de la tabla de 50 indicadores APQ (`generarCuadroMandosIntegral`)
- Utilitario de ajuste de color (`ajustarColor`)

**Constante de dominio:** `CUADRO_MANDOS_INTEGRAL` — definición de los 50 indicadores con metadata (nombre, unidad, fuente, umbral).

**Dependencias de entrada:** `datosMunicipioActual.indicadores`
**Dependencias de salida:** M08 (UI: inyecta en `#cuadro-mandos-container`)

**Nota:** Indicadores y cuadro de mandos son la misma entidad conceptual según las reglas de dominio.

---

### M04 — PERSISTENCIA / MUNICIPIO
**Líneas:** 4895–5200
**Categoría:** `persistencia`

**Responsabilidades:**
- Cargar el objeto completo de un municipio desde Firebase (`cargarDatosMunicipioFirebase`)
- Aplicar guardia anti-contaminación `[GUARDIA AM]` para evitar race conditions

**Rutas Firebase:**
- `estrategias/{est}/municipios/{mun}` — READ once

**Dependencias de entrada:** M01 (`db`, `estrategiaActual`)
**Dependencias de salida:** `datosMunicipioActual`, todos los módulos que consumen datos del municipio

---

### M05 — DOMINIO / DETERMINANTES
**Líneas:** 5200–5505
**Categoría:** `dominio` + `ui` + `persistencia` *(actualmente mezclados)*

**Responsabilidades:**
- Definición de la estructura de determinantes EAS (`ESTRUCTURA_DETERMINANTES`, ~200 indicadores)
- Generar HTML de la sección de determinantes (`generarSeccionDeterminantes`, `generarAreaDet`, `generarTablaIndicadores`)
- Colorear inputs según comparación con referencia (`actualizarColorDeterminante`, `actualizarColoresDeterminantes`)
- CRUD de determinantes en Firebase (`guardarDeterminantes`, `cargarDeterminantes`)
- Exportación a CSV (`exportarDeterminantesCSV`)

**Rutas Firebase:**
- `estrategias/{est}/municipios/{mun}/determinantes` — READ/SET

**Dependencias de entrada:** M01, M04, `referenciasEAS`
**Dependencias de salida:** M15 (motor v2), M17 (evaluación)

**Separación pendiente:** La lógica de dominio (estructura, cálculo de colores) y la lógica de persistencia (guardar/cargar) y la UI (render HTML) están en el mismo bloque.

---

### M06 — PERSISTENCIA / CARGA DE DATOS
**Líneas:** 5505–7060
**Categoría:** `persistencia` + `util`

**Responsabilidades:**
- Panel de gestión de datos: tabs por fuente (determinantes, indicadores, informe, participación, etc.)
- Carga de archivos (Word via Mammoth, PDF via pdf.js, ZIP, CSV via PapaParse)
- Validación y parseo de CSV por tipo (`validarCSV`, `parsearCSV`)
- Actualización de badges de estado de cada fuente (`actualizarEstadosCarga`, `actualizarBadgesFase4`)
- Borrado de datos (`borrarDatosMunicipio`, `borrarReferencias`)
- Guardar HTML del informe (`guardarInformeHTML`)

**Librerías externas:** Mammoth.js, pdf.js, JSZip, PapaParse

**Rutas Firebase (escritura):**
- `estrategias/{est}/municipios/{mun}/{tipo}` — SET genérico por tipo CSV
- `estrategias/{est}/municipios/{mun}/informe` — SET
- `estrategias/{est}/municipios/{mun}/conclusiones`, `/recomendaciones`, `/priorizacion` — SET

**Dependencias de entrada:** M01, M04
**Dependencias de salida:** Todos los módulos que consumen datos del municipio

---

### M07 — PERSISTENCIA / TERRITORIOS Y REFERENCIAS
**Líneas:** 7580–7770
**Categoría:** `persistencia` + `core`

**Responsabilidades:**
- Cargar lista de municipios disponibles en Firebase (`cargarMunicipiosDisponibles`)
- Cargar referencias EAS Andalucía/Granada (`cargarReferenciasEAS`)
- Actualizar celdas de referencia en la tabla de determinantes (`actualizarCeldasReferencia`)
- Getters de municipio activo (`getMunicipioActual`, `getNombreMunicipio`)

**Variables de estado:** `referenciasEAS`

**Nota:** `cargarMunicipiosDisponibles()` carga desde Firebase lo que ya está en `TERRITORIOS`/`MUNICIPIOS` hardcodeados — doble fuente de verdad.

---

### M08 — CORE / ÁMBITO ACTIVO (función pivote)
**Líneas:** 7770–7930
**Categoría:** `core`

**Responsabilidades:**
- **`actualizarMunicipio()`** — función pivote que orquesta el cambio de ámbito territorial:
  1. Resetea variables globales (`planLocalSalud`, `propuestaActual`, `window.datosIBSE`, etc.)
  2. Limpia el DOM del perfil
  3. Dispara carga de datos de municipio (Firebase)
  4. Dispara carga de determinantes (via setTimeout 300ms)
  5. Dispara carga de referencias EAS (via setTimeout 500ms)
  6. Dispara análisis automático (via setTimeout 1000ms)
  7. Actualiza estado del compilador
  8. Actualiza acceso a fases
- Cierra todos los paneles abiertos (`cerrarTodosLosPaneles`)

**Event listener:** `<select id="municipio">` → `actualizarMunicipio()` (l.13159)

**Acoplamiento:** 15+ efectos secundarios directos. Punto de fallo crítico para race conditions.

---

### M09 — IA / ORCHESTRATOR (análisis automático)
**Líneas:** 7930–8108
**Categoría:** `ia`

**Responsabilidades:**
- `verificarYGenerarAnalisisAutomatico()`: comprueba si el municipio tiene análisis IA; si faltan conclusiones, recomendaciones o priorización los genera automáticamente llamando a los motores.
- Encadena: motor v2 → motor experto → motor v3 → renderizado

**Dependencias de entrada:** M04, M15 (motor v2), M16 (motor v3)
**Dependencias de salida:** `window.analisisActual`, `window.analisisActualV3`

---

### M10 — UI / GENERACIÓN DE DOCUMENTOS (perfil e informe)
**Líneas:** 8108–8465
**Categoría:** `ui`

**Responsabilidades:**
- `generarInformeDesdeFirebase()` — HTML del informe de situación
- `generarPerfilDesdeFirebase()` — HTML del perfil completo de salud local
- `generarConclusionesDesdeFirebase()` — acordeón conclusiones/recomendaciones
- `generarPriorizacionDesdeFirebase()` — sección de priorización
- `generarCabeceraInstitucional()`, `generarMarcoEstrategico()` — fragmentos institucionales
- `poblarPerfilNuevo()` — popula secciones del perfil modular
- Generación de herramienta de seguimiento en el perfil

**Dependencias de entrada:** `datosMunicipioActual`, `referenciasEAS`, M03 (CMI)
**Dependencias de salida:** DOM (`#perfil-content`, `#informe-content`)

---

### M11 — PERSISTENCIA / GRUPO MOTOR Y HOJA DE RUTA
**Líneas:** 8465–8620
**Categoría:** `persistencia`

**Responsabilidades:**
- CRUD del grupo motor (miembros del equipo de planificación)
- CRUD de la hoja de ruta (hitos del proceso de planificación)

**Rutas Firebase:**
- `estrategias/{est}/municipios/{mun}/grupoMotor` — READ/PUSH/REMOVE
- `estrategias/{est}/municipios/{mun}/hojaRuta` — READ/SET/UPDATE

---

### M12 — DOMINIO / ESTRUCTURA EPVSA + PLAN DE ACCIÓN
**Líneas:** 8700–11560
**Categoría:** `dominio` + `ui` + `persistencia` *(actualmente mezclados)*

**Responsabilidades:**
- `ESTRUCTURA_EPVSA` — definición jerárquica de la estrategia: 5 Líneas Estratégicas, ~50 programas, ~200 actuaciones con metadata (código, nombre, color, descripción)
- Selector manual de plan (`renderPlanAccion`, `actualizarStatsPlan`)
- Tab 3: propuesta IA (`renderizarPropuestaAutomatica`, `aceptarPropuesta`, `aplicarPropuestaACheckboxes`)
- Metodología de priorización (`generarSeccionMetodologiaPriorizacion`)
- Documento de plan (`generarDocumentoPlan`)
- Persistencia del plan (`guardarPlanEnFirebase`, `cargarPlanGuardado`)
- Sincronización plan→agenda (`sincronizarPlanConAgenda`)
- Funciones de conversión (`convertirPropuestaASeleccion`, `obtenerSeleccionActual`, `generarSeleccionPropuesta`)

**Rutas Firebase:**
- `estrategias/{est}/municipios/{mun}/planAccion` — READ/SET
- `estrategias/{est}/municipios/{mun}/seleccionEPVSA` — SET

**Estado crítico:**
- `window.COMPAS.state.planAccion` — fuente operativa
- `planLocalSalud.planAccion` — fuente del compilador (puede divergir)

---

### M13 — DOMINIO / AGENDAS ANUALES
**Líneas:** 11558–13190
**Categoría:** `dominio` + `ui` + `persistencia` *(actualmente mezclados)*

**Responsabilidades:**
- Normalización de actuaciones (`normalizarActuacion`)
- Proyecciones de actuación para plan, seguimiento y evaluación (`actuacion_proyectarPlan`, `actuacion_proyectarSeguimiento`, `actuacion_proyectarEvaluacion`)
- Carga y renderizado de agendas (`initAgendas`, `renderAgendas`, `renderAgendaTipo`)
- Gestión Kanban (crear, editar, duplicar, eliminar, cambiar estado, drag-drop)
- Vista timeline (`renderTimeline`)
- Filtros de agenda (`filtrarAgendas`, `filtrarAgendaTipo`)
- Traslado desde catálogo tipo (`trasladarActuacionAAgenda`)
- Persistencia (`guardarAccion`, `guardarAgendasFirebase`)
- Exportación CSV (`exportarAgendas`)

**Estado:** `accionesAgenda` — array global de `ActuacionNormalizada`

**Rutas Firebase:**
- `estrategias/{est}/municipios/{mun}/agendas` — READ/SET

---

### M14 — UI / COMPILADOR PLS
**Líneas:** 13190–15450
**Categoría:** `ui`

**Responsabilidades:**
- Navegación entre fases con guardia de acceso (`irAFase`)
- Previsualización del Plan Local de Salud completo (`previsualizarPLS`, `generarPlanLocalSalud`)
- Compilación de partes: perfil + plan + agenda + CMI
- Logos base64 embebidos (constantes `LOGO_CONSEJERIA_B64`, `LOGO_DISTRITO_B64`, etc.)

**Dependencias de entrada:** `planLocalSalud` (M02), M10 (perfil), M12 (plan), M13 (agenda), M03 (CMI)

---

### M15 — PERSISTENCIA / PARTICIPACIÓN CIUDADANA (EPVSA + VRELAS)
**Líneas:** 15800–22900
**Categoría:** `persistencia` + `dominio`

**Sub-módulos:**

**M15a — Votación EPVSA:**
- Sesión de votación ciudadana con QR (`iniciarVotacion`, `detenerVotacion`, `generarQR`)
- Recepción en tiempo real de votos (`enviarVoto`, listener `.on()`)
- Cierre y persistencia de resultados (`guardarResultadosVotacion`)

**M15b — Carga de participación:**
- `cargarParticipacionCiudadana()` — carga VRELAS o EPVSA votes
- `normalizarParticipacion()` — normalización de formato
- `cargarDecisionPriorizacion()` / `guardarDecisionPriorizacion()` — decisión formal

**M15c — Fusión epidemiológico-ciudadana:**
- `COMPAS_ejecutarFusion(modo, pesos)` — 3 modos: `epidemiologica`, `ciudadana`, `integracion`
- Pesos por defecto: 70% epi / 30% ciudadano

**M15d — VRELAS:**
- Sesión VRELAS (`vrelas_iniciarSesion`, `vrelas_enviarVoto`)
- Combinación de votos (`vrelas_obtenerVotosCombinados`, `vrelas_fusionarConDecision`)

**Rutas Firebase:**
- `votaciones/{mun}/{ses}/respuestas` — ON listener RT + PUSH
- `votaciones_relas/{mun}/{ses}/respuestas` — ON listener RT + PUSH
- `estrategias/{est}/municipios/{mun}/participacionCiudadana` — SET
- `estrategias/{est}/municipios/{mun}/decisionPriorizacion` — READ/SET

---

### M16 — IA / MOTOR V2 (salutogénico)
**Líneas:** 24000–26620
**Categoría:** `ia`

**Responsabilidades:**
- `analizarDatosMunicipio()` — motor salutogénico principal. Integra 5 fuentes jerárquicas y produce `window.analisisActual`.
- `ejecutarMotorExpertoCOMPAS(analisis)` — enriquece con scores SFA usando `COMPAS_EXPERT_SYSTEM`.
- `generarAnalisisIA()` — orquesta análisis completo.
- `generarPropuestaIA()` — genera propuesta IA local (sin API externa).
- `_generarPropuestaLocal(municipio, datos, pop, analisis)` — núcleo del generador local.
- `renderizarPropuestaIA(r, municipio, fuentes)` — render de la propuesta.
- `COMPAS_analizarTextoEstudio(texto, nombre)` — análisis de texto libre de estudio complementario por regex.
- `COMPAS_analizarTextoInforme(html)` — análisis del informe HTML por regex.

**Constantes de dominio:**
- `MAPEO_TEMATICO_SAL` — mapeo de temas salutogénicos a áreas EPVSA
- `CONCLUSIONES_SAL_FIJAS` / `RECOMENDACIONES_SAL_FIJAS` — biblioteca de textos por área
- `REGLAS_EXPERTAS` / `TAXONOMIA_TEMAS` — reglas del motor experto

**Estado de salida:** `window.analisisActual` con estructura:
```
{
  municipio, priorizacion[], propuestaEPVSA[],
  alertasInequidad[], trazabilidad, narrativaSalutogenica,
  conclusiones[], recomendaciones[], fuentes[]
}
```

---

### M17 — IA / MOTOR V3 (scores multicriterio)
**Líneas:** 26620–27504
**Categoría:** `ia`

**Responsabilidades:**
- IIFE autónoma que registra funciones en `window.COMPAS_*`
- 6 scores: `COMPAS_scoreEpi`, `COMPAS_scoreCiudadano`, `COMPAS_scoreInequidad`, `COMPAS_scoreEvidencia`, `COMPAS_scoreConvergencia`, `COMPAS_scoreFactibilidad`
- `COMPAS_analizarV3()` — calcula scores para todas las áreas
- `COMPAS_ejecutarMotorV3()` — enriquece `window.analisisActual` con campos `_v3_*`
- `COMPAS_explicarPrioridad(areaKey)` — genera HTML de explicación
- Hook monkey-patch sobre `generarAnalisisIA` en `window.addEventListener('load')`

**Constante de dominio:** `COMPAS_PESOS_SFA` — 6 dimensiones (distinto de `ANALYTIC_CONFIG` de 10 dimensiones)

**Estado de salida:** Enriquece `window.analisisActual` y `window.analisisActualV3`

**Inconsistencia documentada:** `ANALYTIC_CONFIG` (M01) tiene 10 dimensiones; `COMPAS_PESOS_SFA` (M17) tiene 6. Los SFAs calculados no son comparables entre motores.

---

### M18 — DOMINIO / IBSE
**Líneas:** 27555–28200
**Categoría:** `dominio` + `persistencia` + `ui` *(mezclados)*

**Responsabilidades:**
- Cálculo de los 4 factores IBSE de un registro (`ibseMonitor_calcularIBSE`)
- Monitor JS embebido (`ibseMonitor_abrir`, `ibseMonitor_renderizar`, `ibseMonitor_cerrar`)
- Monitor iframe externo (`ibse_abrirMonitor`) — accede a `monitor_ibse.html`
- Cuestionario ciudadano (`ibse_abrirCuestionario`, `calcularIBSE`)
- Carga de datos IBSE desde Firebase con dual-path y fallback legacy (`_cargarIBSEFirebase`)
- Importación CSV IBSE (`ibse_cargarCSV`)
- Renderizado del panel IBSE en Fase 2 (`renderizarPanelIBSE`)

**Rutas Firebase:**
- `ibse_respuestas/{mun}` — READ/PUSH/REMOVE (ruta primaria)
- `ibse_monitor/{mun}` — READ/SET (fallback legacy + mirror)

**Nota:** Hay dos implementaciones de monitor IBSE con responsabilidades solapadas:
- `#modal-ibse-monitor` — monitor JS (ibseMonitor_abrir)
- `#modal-monitor-ibse` — monitor iframe (ibse_abrirMonitor)

---

### M19 — DOMINIO / EVALUACIÓN (Fase 6)
**Líneas:** 28200–28700
**Categoría:** `dominio` + `ui`

**Responsabilidades:**
- `eval_actualizarFase6()` — orquesta los 3 bloques
- `eval_calcularISS()` — Índice Sintético de Salud (CI 40% + CD 40% + CB 20%)
- `eval_actualizarResumenEvaluacion()` — KPIs de actuaciones + ISS
- `eval_actualizarProceso()` — Bloque 1: 5 semáforos del proceso (verde/amarillo/gris; rojo no implementado)
- `eval_actualizarResultados()` — Bloque 2: tabla objetivos→indicadores con señal de contexto
- `getSeñalLinea(lineaId)` — semáforo de contexto epidemiológico por línea EPVSA

**Dependencias de entrada:**
- `accionesAgenda` (M13)
- `window.analisisActual` (M16)
- `window.COMPAS.state` (M01)
- `datosMunicipioActual` (M04)
- `window.datosIBSE` (M18)

**Activación:** Click en tab `data-fase="6"` → delay 300ms → `eval_actualizarFase6()`

---

### M20 — PERSISTENCIA / PRIORIDADES UNIFICADAS
**Líneas:** 29100–29333
**Categoría:** `persistencia` + `core`

**Responsabilidades:**
- `COMPAS_cargarPrioridadesFirebase(municipio)` — carga en paralelo: participación ciudadana, votación RELAS, decisión de priorización
- `COMPAS_getPrioridades()` — getter del namespace `window.COMPAS.prioridades`
- `COMPAS_resetPrioridades()` — limpia el namespace de prioridades

**Estado:** `window.COMPAS.prioridades` = `{ tematicas, epvsa, relas, fusion }`

---

### M21 — DOMINIO / SEGUIMIENTO ANUAL
**Líneas:** 29335–29640
**Categoría:** `dominio` + `persistencia`

**Responsabilidades:**
- Generar solicitudes de seguimiento para actuaciones del año (`seguimiento_generarSolicitudes`)
- Cargar y renderizar panel de seguimiento (`seguimiento_cargarPanel`, `seguimiento_renderLista`)
- Gestión del estado de solicitudes (`seguimiento_marcarEnviada`, `seguimiento_guardarRespuesta`, `seguimiento_aplicarRespuesta`)
- Exportación CSV (`seguimiento_exportarCSV`)
- Modales del panel (`seguimiento_abrirPanel`, `seguimiento_cerrarPanel`)

**Ciclo de vida:** pendiente → enviada → respondida

**Rutas Firebase:**
- `estrategias/{est}/municipios/{mun}/seguimiento/{anio}` — READ/UPDATE

**Función no implementada:** `seguimiento_enviarCorreo()` — comentada

---

### M22 — DOMINIO / MAPA DEL PLAN
**Líneas:** 29640–final
**Categoría:** `dominio`

**Responsabilidades:**
- `planMapa_generarGrafo()` — genera grafo orientado del plan en `window.COMPAS.mapa`
- Nodos: líneas → objetivos → programas → actuaciones
- Aristas: relaciones de dependencia y priorización

**Dependencias de entrada:** `window.COMPAS.state`, `ESTRUCTURA_EPVSA`, `accionesAgenda`

---

## Matriz de dependencias entre módulos

```
        M01  M02  M03  M04  M05  M06  M07  M08  M09  M10  M11  M12  M13  M14  M15  M16  M17  M18  M19  M20  M21  M22
M01:         ←    ←    ←    ←    ←    ←    ←    ←    ←    ←    ←    ←    ←    ←    ←    ←    ←    ←    ←    ←    ←
M04:    →                              ←                   ←    ←    ←    ←         ←    ←
M08:    →    →         →    →         →              →     →    →    →    →         →    →    →    →         →    →
M12:    →    →         →    →              →                              ←         →    →
M13:    →    →         →                   →                         →              →         →    →              →
M14:    →    →    →                        →                    →    →    →         →
M15:    →              →                   →               →              →         →
M16:    →              →    →         →    →                         →         →
M17:    →                             →                         →    →    →
M19:    →              →    →         →                              →    →         →         →
```
*(→ indica que la fila depende de la columna)*

---

## Módulos sin frontera clara (máximo acoplamiento UI+dominio+persistencia)

| Módulo | Categorías mezcladas | Prioridad de separación |
|---|---|---|
| M05 — Determinantes | dominio + ui + persistencia | Alta |
| M12 — Plan de acción | dominio + ui + persistencia | Alta |
| M13 — Agendas | dominio + ui + persistencia | Alta |
| M18 — IBSE | dominio + ui + persistencia | Media |
| M19 — Evaluación | dominio + ui | Media |
| M06 — Carga de datos | persistencia + util + ui | Media |

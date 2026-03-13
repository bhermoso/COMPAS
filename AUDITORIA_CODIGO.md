# AUDITORÍA DE CÓDIGO — COMPÁS
> Basado en: `COMPAS--BLOQUEADA--20260311-184024.html` (~2MB, ~29.700 líneas)
> Fecha: 2026-03-12. Solo lectura — no se modifica código.

---

## 1. INVENTARIO DE FUNCIONES GLOBALES

### 1.1 Grupo: Configuración e inicialización (líneas 4095–4530)

| Función | Línea | Categoría | Descripción |
|---|---|---|---|
| `getCompasCopyright()` | 4115 | util | Footer con copyright de versión |
| `poblarFirebaseConTerritorios()` | 4389 | persistencia | Carga municipios en Firebase (one-shot) |
| `recargarSelectorTerritorios()` | 4420 | ui | Rellena `<select>` de municipios según estrategia activa |
| `getConfigActual()` | 4453 | core | Devuelve config de la estrategia activa |
| `getEstructuraActual()` | 4461 | core | Devuelve `ESTRUCTURA_EPVSA` |
| `getNivelConfig(nivelId)` | 4480 | core | Config de un nivel de jerarquía |
| `getNivelPrincipal()` | 4489 | core | Nivel principal (con color) de la estrategia |
| `cambiarEstrategia(estrategiaId)` | 4498 | core | Cambia estrategia activa y dispara evento custom |
| `getTerminologia(nivelId, plural)` | 4518 | util | Nombre localizado de un nivel jerárquico |
| `onCambioEstrategia(estrategiaId)` | 4534 | ui | Handler UI: recarga selector al cambiar estrategia |
| `verificarPlanLocalCompleto()` | 4577 | core | ¿Perfil+plan+agenda completados? |
| `actualizarEstadoCompilador()` | 4584 | ui | Actualiza badges de estado en Fase 4 |
| `guardarPerfilParaCompilador(html)` | 4635 | core | Guarda HTML perfil en `planLocalSalud.perfil` |
| `guardarPlanAccionParaCompilador(html, sel)` | 4645 | core | Guarda plan en `planLocalSalud.planAccion` |
| `guardarAgendaParaCompilador(actuaciones)` | 4656 | core | Guarda agenda en `planLocalSalud.agenda` |
| `resetearPlanLocal()` | 4665 | core | Limpia `planLocalSalud`, `propuestaActual`, `COMPAS.state` |
| `verificarAccesoFase6()` | 4688 | ui | Bloquea/desbloquea tab Fase 5-6 según plan completado |

### 1.2 Grupo: Cuadro de mandos integral (líneas 4718–4895)

| Función | Línea | Categoría | Descripción |
|---|---|---|---|
| `generarCuadroMandosIntegral(datosIndicadores)` | 4806 | ui | Genera HTML de la tabla de 50 indicadores APQ |
| `ajustarColor(color, porcentaje)` | 4885 | util | Oscurece/aclara color hexadecimal |

### 1.3 Grupo: Carga de datos municipio / Firebase (líneas 4897–8200)

| Función | Línea | Categoría | Descripción |
|---|---|---|---|
| `cargarDatosMunicipioFirebase(municipioKey, cb)` | 4897 | persistencia | Carga desde `estrategias/{est}/municipios/{mun}` con guardia AM |
| `generarSeccionDeterminantes()` | 5214 | ui | Genera HTML sección determinantes EAS |
| `generarAreaDet(areaId)` | 5257 | ui | Genera acordeón de un área de determinantes |
| `generarTablaIndicadores(indicadores)` | 5302 | ui | Genera tabla HTML de indicadores de un área |
| `actualizarColorDeterminante(input)` | 5362 | ui | Colorea input de determinantes según comparación con ref |
| `actualizarColoresDeterminantes()` | 5415 | ui | Actualiza todos los colores de determinantes |
| `mostrarAreaDet(areaId)` | 5423 | ui | Muestra/oculta acordeón de área de determinantes |
| `guardarDeterminantes()` | 5430 | persistencia | Guarda valores de determinantes en Firebase |
| `cargarDeterminantes()` | 5450 | persistencia | Carga determinantes desde Firebase a inputs DOM |
| `exportarDeterminantesCSV()` | 5477 | util | Exporta determinantes como CSV |
| `togglePanelCargaDatos()` | 5502 | ui | Toggle del panel de gestión de datos |
| `cambiarTabCarga(seccion, tab)` | 5510 | ui | Cambia tab activo en panel de carga |
| `_filtrarIndicadoresValidos(obj)` | 5530 | util | Filtra indicadores no nulos/vacíos |
| `_contarIndicadoresValidos(obj)` | 5540 | util | Cuenta indicadores válidos |
| `_filtrarDeterminantesValidos(obj)` | 5543 | util | Filtra determinantes válidos |
| `_contarDeterminantesValidos(obj)` | 5555 | util | Cuenta determinantes válidos |
| `actualizarEstadosCarga()` | 5559 | ui | Actualiza badges de estado de cada fuente de datos |
| `actualizarBadgesFase4()` | 5667 | ui | Actualiza badges del panel de Fase 4 |
| `borrarDatosMunicipio()` | 5736 | persistencia | Elimina todos los datos del municipio de Firebase |
| `borrarReferencias()` | 5763 | persistencia | Elimina referencias EAS de Firebase |
| `cargarInformeWord(input)` | 5778 | persistencia | Lee .docx/.pdf y extrae texto para guardar en Firebase |
| `_procesarConPdfJs()` | 5795 | persistencia | Extrae texto de PDF vía pdf.js |
| `_procesarConMammoth()` | 5841 | persistencia | Extrae texto de .docx vía mammoth.js |
| `guardarInformeHTML(contenidoHTML, nombreArchivo)` | 5878 | persistencia | Guarda HTML del informe en Firebase |
| `validarCSV(contenido, tipo)` | 5932 | util | Valida estructura de CSV antes de importar |
| `parsearCSV(contenido, tipo)` | 6025 | util | Parsea CSV a objetos JS según tipo |
| `checkFin()` | 6826 | util | Ayudante interno de carga de paquete ZIP |
| `cargarReferenciasEAS(callback)` | ~7700 | persistencia | Carga referencias Andalucía/Granada desde `referencias/` |
| `actualizarCeldasReferencia()` | 7722 | ui | Actualiza celdas ref Granada/Andalucía en tabla determinantes |
| `actualizarMunicipio()` | 7770 | core | **Función pivote**: resetea estado, dispara carga de todo |
| `getMunicipioActual()` | ~7580 | core | Lee `<select id="municipio">` del DOM |
| `getNombreMunicipio(key)` | ~7584 | core | Nombre desde `MUNICIPIOS[key]` o Firebase |
| `cargarMunicipiosDisponibles()` | ~7584 | persistencia | Rellena selector desde Firebase |
| `cerrarTodosLosPaneles()` | ~7915 | ui | Cierra paneles y acordeones abiertos |
| `poblarPerfilNuevo(datos, nombre)` | ~7840 | ui | Popula secciones del perfil modular |
| `limpiarSeccionesPerfil()` | ~7785 | ui | Limpia DOM de las secciones del perfil |
| `cargarConfigMarcoUI()` | ~7880 | ui | Carga configuración del marco estratégico en formulario |
| `verificarYGenerarAnalisisAutomatico()` | 7941 | ia | Si faltan conclusiones/priorización, las genera |
| `generarInformeDesdeFirebase(datos, nombre, conCab)` | 8109 | ui | Genera HTML del informe de situación |
| `generarPerfilDesdeFirebase(datos, nombre)` | 8133 | ui | Genera HTML del perfil completo |
| `generarConclusionesDesdeFirebase(c, r)` | 8205 | ui | Genera acordeón conclusiones/recomendaciones |
| `generarPriorizacionDesdeFirebase(prio, nombre)` | 8242 | ui | Genera sección de priorización |
| `generarCabeceraInstitucional(tipo, nombre)` | ~8114 | ui | Genera cabecera institucional del informe |
| `generarMarcoEstrategico(config)` | ~8148 | ui | Genera HTML del marco estratégico del PLS |
| `generarHerramientaSeguimientoDesdeFirebase(d, n)` | ~8191 | ui | Genera acordeón de seguimiento en el perfil |

### 1.4 Grupo: Grupo motor y hoja de ruta (líneas 8460–8620)

| Función | Línea | Categoría | Descripción |
|---|---|---|---|
| `cargarMiembros()` | 8465 | persistencia | Carga grupo motor con listener `.on()` |
| `añadirMiembro()` | 8479 | persistencia | Añade miembro con `.push()` |
| `eliminarMiembro(k)` | 8517 | persistencia | Elimina miembro del grupo motor |
| `inicializarHojaRuta()` | 8540 | persistencia | Carga/inicializa hoja de ruta desde Firebase |
| `actHito(k, c, v)` | 8581 | persistencia | Actualiza campo de un hito de la hoja de ruta |
| `añadirHito()` | 8584 | persistencia | Añade hito a la hoja de ruta |

### 1.5 Grupo: Plan de acción (líneas 10000–11560)

| Función | Línea | Categoría | Descripción |
|---|---|---|---|
| `renderPlanAccion()` | ~10000 | ui | Renderiza selector manual de líneas/objetivos/programas |
| `actualizarStatsPlan()` | ~10000 | ui | Actualiza contadores en el selector de plan |
| `renderizarPropuestaAutomatica(analisis)` | ~10200 | ui | Renderiza propuesta IA en tab 3 |
| `generarSeleccionPropuesta(analisis)` | 10598 | dominio | Convierte `analisis.propuestaEPVSA` al formato de selección |
| `aceptarPropuesta()` | 10630 | core | Acepta propuesta IA y la aplica a checkboxes |
| `aplicarPropuestaACheckboxes(mostrarFeedback)` | 10703 | ui | Marca checkboxes del selector manual según propuesta |
| `editarPropuesta()` | 10807 | ui | Alias de `aceptarPropuesta` para modo edición |
| `generarSeccionMetodologiaPriorizacion()` | 10816 | ui | Genera HTML con metodología de priorización usada |
| `generarDocumentoPlan()` | ~11100 | ui | Genera HTML del documento de plan de acción |
| `actualizarBadgePlan(estado, fecha)` | 11336 | ui | Actualiza badge de estado del plan |
| `guardarPlanEnFirebase(version)` | 11363 | persistencia | Guarda plan en Firebase |
| `cargarPlanGuardado()` | 11432 | persistencia | Carga plan desde Firebase y lo renderiza |
| `convertirPropuestaASeleccion(propuesta)` | 11477 | dominio | Convierte propuesta IA al formato de selección |
| `obtenerSeleccionActual()` | 11495 | dominio | Lee estado de checkboxes del DOM → objeto selección |
| `sincronizarPlanConAgenda(silencioso)` | ~11467 | core | Importa actuaciones del plan a la agenda sin duplicados |
| `imprimirPlan()` | 11543 | util | `window.print()` |
| `exportarPlanPDF()` | 11547 | util | Alert + `window.print()` |
| `cerrarDocumentoPlan()` | 11552 | ui | Oculta el contenedor del documento del plan |

### 1.6 Grupo: Agendas anuales (líneas 11558–13190)

| Función | Línea | Categoría | Descripción |
|---|---|---|---|
| `normalizarActuacion(act)` | ~12100 | dominio | Normaliza campos de actuación (backward compat) |
| `actuacion_proyectarPlan(act)` | ~12190 | dominio | Proyección de actuación para documento de plan |
| `actuacion_proyectarSeguimiento(act)` | 12230 | dominio | Proyección de actuación para seguimiento |
| `actuacion_proyectarEvaluacion(actuaciones)` | 12259 | dominio | Proyección agregada para evaluación |
| `initAgendas()` | 12288 | persistencia | Carga agenda desde Firebase y renderiza vistas kanban |
| `cambiarTipoAgenda(tipo)` | 12315 | ui | Alterna entre vista Agenda-Tipo y Agenda-Municipio |
| `inicializarFiltrosProgramaTipo()` | 12328 | ui | Rellena select de programas en Agenda-Tipo |
| `renderAgendaTipo()` | 12346 | ui | Renderiza catálogo actuaciones-tipo EPVSA |
| `toggleAgendaPrograma(codigo)` | 12435 | ui | Toggle acordeón de programa |
| `filtrarAgendaTipo()` | 12440 | ui | Refiltra la Agenda-Tipo |
| `trasladarActuacionAAgenda(l, p, a)` | 12445 | ui | Pre-rellena modal de nueva acción desde catálogo tipo |
| `renderAgendas()` | 12503 | ui | Renderiza tablero kanban y actualiza contadores |
| `crearTarjetaAccion(accion)` | 12560 | ui | Crea elemento DOM de tarjeta kanban |
| `guardarAccion()` | ~12700 | persistencia | Guarda/actualiza acción en `accionesAgenda` y Firebase |
| `editarAccion(id)` | ~12800 | persistencia | Carga datos de acción en modal de edición |
| `cambiarEstadoAccion(id, nuevoEstado)` | ~12990 | persistencia | Cambia estado de acción y guarda en Firebase |
| `duplicarAccion(id)` | 13015 | persistencia | Duplica una acción en la agenda |
| `eliminarAccion(id)` | 13025 | persistencia | Elimina acción con confirmación |
| `allowDrop(event)` | 13033 | ui | Permite drag-and-drop |
| `dropAccion(event, nuevoEntorno)` | 13038 | ui | Maneja drop y reordena acciones |
| `filtrarAgendas()` | 13083 | ui | Re-renderiza agenda con filtros activos |
| `guardarAgendasFirebase()` | 13087 | persistencia | Guarda `accionesAgenda` completo en Firebase |
| `renderTimeline(acciones)` | 13097 | ui | Renderiza vista timeline 2026-2030 por entorno |
| `exportarAgendas()` | 13132 | util | Exporta agenda a CSV |

### 1.7 Grupo: Navegación y compilación PLS (líneas 13190–15500)

| Función | Línea | Categoría | Descripción |
|---|---|---|---|
| `irAFase(numFase)` | 13194 | ui | Navega a una fase con guardia de acceso |
| `previsualizarPLS()` | 13214 | ui | Genera HTML del Plan Local de Salud completo |
| `generarPlanLocalSalud()` | ~13600 | ui | Inicia compilación del PLS completo |
| `generarPerfilSaludLocal()` | ~13700 | ui | `window.print()` sobre el perfil |

### 1.8 Grupo: Votaciones ciudadanas / participación (líneas 15800–22900)

| Función | Línea | Categoría | Descripción |
|---|---|---|---|
| `iniciarVotacion(municipio)` | ~16730 | persistencia | Inicia sesión de votación EPVSA en Firebase |
| `detenerVotacion()` | ~16833 | persistencia | Detiene listener de votaciones |
| `guardarResultadosVotacion()` | ~16905 | persistencia | Guarda resultados en `participacionCiudadana` |
| `generarQR(municipio, sessionId)` | ~17600 | ui | Genera QR con qrcode.js |
| `enviarVoto(voto)` | ~17620 | persistencia | Push de voto a `votaciones/{mun}/{ses}/respuestas` |
| `cargarParticipacionCiudadana(municipio)` | ~17950 | persistencia | Carga VRELAS o EPVSA votes desde Firebase |
| `normalizarParticipacion(datos)` | ~18070 | dominio | Normaliza objeto participación (VRELAS/EPVSA) |
| `guardarDecisionPriorizacion(decision)` | ~18441 | persistencia | Guarda decisión de priorización en Firebase |
| `cargarDecisionPriorizacion(municipio)` | ~18510 | persistencia | Carga `decisionPriorizacion` desde Firebase |
| `COMPAS_ejecutarFusion(modoFusion, pesos)` | ~18389 | ia | Fusión epidemiológica+ciudadana con pesos config. |
| `vrelas_iniciarSesion(municipio)` | ~21650 | persistencia | Inicia sesión VRELAS en Firebase |
| `vrelas_obtenerVotosCombinados()` | ~21320 | dominio | Combina votos RT con persistidos |
| `vrelas_fusionarConDecision(decision)` | ~21150 | dominio | Fusiona prioridades VRELAS con decisión |
| `COMPAS_resetPrioridades()` | ~21165 | core | Resetea `window.COMPAS.prioridades` |
| `pillsGrupo(nombre, opciones, colorAcc)` | 22247 | ui | Genera pills de botones agrupados |
| `wSample(weights, k)` | 20656 | util | Muestreo ponderado (IIFE VRELAS) |

### 1.9 Grupo: Estudios complementarios (líneas 23369–23620)

| Función | Línea | Categoría | Descripción |
|---|---|---|---|
| `_cargarEstudiosFirebase(mun)` | ~23483 | persistencia | Carga estudios complementarios de Firebase |
| `_compasEscalasSet(arr)` | 23606 | core | Setter de `window.compasEscalasDiagnosticas` |

### 1.10 Grupo: Motores IA (líneas 24000–27504)

| Función | Línea | Categoría | Descripción |
|---|---|---|---|
| `analizarDatosMunicipio()` | 24486 | ia | **Motor v2 salutogénico**: produce `window.analisisActual` completo |
| `ejecutarMotorExpertoCOMPAS(analisis)` | 24357 | ia | Enriquece análisis con scores SFA (COMPAS_EXPERT_SYSTEM) |
| `generarAnalisisIA()` | ~25300 | ia | Orquesta análisis completo e inicia motor v3 |
| `generarPropuestaIA()` | 26034 | ia | Genera propuesta IA local (sin API externa) |
| `_generarPropuestaLocal(municipio, datos, pop, a)` | 26092 | ia | Núcleo: convierte resultado motor v2 → propuesta renderizable |
| `renderizarPropuestaIA(r, municipio, fuentes)` | 26356 | ui | Renderiza propuesta IA con checkboxes de actuaciones |
| `propuestaIA_seleccionarTodo(bool)` | ~26390 | ui | Selecciona/deselecciona todos los checks de propuesta |
| `window.COMPAS_analizarTextoEstudio(texto, n)` | 26688 | ia | Analiza texto libre de estudio complementario |
| `window.COMPAS_analizarTextoInforme(html)` | 26759 | ia | Analiza HTML del informe de situación |
| `window.COMPAS_scoreEpi(...)` | 26774 | ia | Score epidemiológico de área (módulo v3 IIFE) |
| `window.COMPAS_scoreCiudadano(...)` | 26839 | ia | Score ciudadano de área |
| `window.COMPAS_scoreInequidad(...)` | 26858 | ia | Score inequidad de área |
| `window.COMPAS_scoreEvidencia(...)` | 26879 | ia | Score evidencia complementaria |
| `window.COMPAS_scoreConvergencia(...)` | 26901 | ia | Score convergencia entre fuentes |
| `window.COMPAS_scoreFactibilidad(...)` | 26932 | ia | Score factibilidad de intervención |
| `window.COMPAS_analizarV3()` | ~26945 | ia | **Motor v3**: scoring SFA multicriterio 6 dimensiones |
| `window.COMPAS_explicarPrioridad(areaKey)` | 27327 | ia | HTML de explicación de prioridad de un área |
| `window.COMPAS_ejecutarMotorV3()` | 27418 | ia | Ejecuta motor v3 y enriquece `window.analisisActual` |

### 1.11 Grupo: IBSE (líneas 27555–28200)

| Función | Línea | Categoría | Descripción |
|---|---|---|---|
| `ibseMonitor_calcularIBSE(d)` | 27647 | dominio | Calcula los 4 factores IBSE de un registro |
| `ibseMonitor_abrir()` | 27661 | ui | Abre modal IBSE y carga datos de Firebase |
| `ibseMonitor_cerrar()` | ~27700 | ui | Cierra modal IBSE y desconecta listener |
| `ibseMonitor_renderizar()` | ~27720 | ui | Renderiza KPIs, semáforo y análisis IBSE |
| `ibseMonitor_sinDatos()` | ~27700 | ui | Muestra estado vacío del monitor IBSE |
| `_cargarIBSEFirebase(municipio)` | ~27881 | persistencia | Carga agregado IBSE (ruta primaria + legacy) |
| `ibse_cargarCSV(input)` | ~27988 | persistencia | Importa CSV IBSE y calcula agregado |
| `ibse_abrirCuestionario()` | ~28100 | ui | Abre modal cuestionario ciudadano IBSE |
| `ibse_abrirMonitor()` | ~28100 | ui | Abre modal iframe del monitor IBSE externo |
| `calcularIBSE()` | ~28132 | dominio | Calcula y persiste IBSE individual de encuesta |
| `renderizarPanelIBSE(datos)` | ~28150 | ui | Renderiza panel IBSE en Fase 2 |

### 1.12 Grupo: Evaluación Fase 6 (líneas 28200–28700)

| Función | Línea | Categoría | Descripción |
|---|---|---|---|
| `eval_actualizarFase6()` | 28203 | ui | Orquesta actualización de los 3 bloques de evaluación |
| `eval_calcularISS()` | 28223 | dominio | Calcula Índice Sintético de Salud (CI+CD+CB ponderados) |
| `eval_actualizarResumenEvaluacion()` | ~28290 | ui | Renderiza panel resumen superior Fase 6 |
| `eval_actualizarProceso()` | 28425 | ui | Bloque 1: 5 semáforos de dimensiones del proceso |
| `eval_actualizarResultados()` | 28594 | ui | Bloque 2: tabla objetivos→indicadores con señales |
| `getSeñalLinea(lineaId)` | ~28622 | dominio | Semáforo de contexto para una línea EPVSA |

### 1.13 Grupo: Prioridades unificadas (líneas 29100–29333)

| Función | Línea | Categoría | Descripción |
|---|---|---|---|
| `COMPAS_cargarPrioridadesFirebase(municipio)` | ~29250 | persistencia | Carga participación, RELAS y decisión de priorización |
| `COMPAS_getPrioridades()` | ~28480 | core | Getter del namespace unificado de prioridades |

### 1.14 Grupo: Seguimiento anual (líneas 29335–29640)

| Función | Línea | Categoría | Descripción |
|---|---|---|---|
| `_seguimiento_path(municipio, anio)` | 29371 | util | Construye ruta Firebase para seguimiento |
| `_seguimiento_anioActual()` | 29376 | util | Lee año seleccionado en el selector del panel |
| `seguimiento_generarSolicitudes()` | 29388 | persistencia | Genera solicitudes para actuaciones del año |
| `seguimiento_cargarPanel()` | 29439 | persistencia | Carga y renderiza panel de seguimiento desde Firebase |
| `seguimiento_renderLista(lista)` | 29456 | ui | Renderiza lista de solicitudes con estado |
| `seguimiento_marcarEnviada(solicitudId)` | 29518 | persistencia | Marca solicitud como enviada en Firebase |
| `seguimiento_abrirRespuesta(solicitudId)` | 29532 | ui | Abre modal de respuesta de seguimiento |
| `seguimiento_guardarRespuesta()` | 29542 | persistencia | Guarda respuesta y propaga a la actuación |
| `seguimiento_aplicarRespuesta(accionId, resp)` | 29572 | persistencia | Aplica respuesta a `accionesAgenda` y Firebase |
| `seguimiento_exportarCSV()` | 29593 | util | Exporta solicitudes de seguimiento como CSV |
| `seguimiento_abrirPanel()` | 29615 | ui | Abre modal del panel de seguimiento |
| `seguimiento_cerrarPanel()` | 29626 | ui | Cierra modal del panel de seguimiento |

### 1.15 Grupo: Mapa del plan (línea 29642–final)

| Función | Línea | Categoría | Descripción |
|---|---|---|---|
| `planMapa_generarGrafo()` | 29666 | dominio | Genera grafo orientado del plan en `window.COMPAS.mapa` |

### 1.16 Utilidades generales (dispersas)

| Función | Línea | Categoría | Descripción |
|---|---|---|---|
| `mostrarToast(mensaje, tipo)` | varios | ui | Notificación temporal |
| `mostrarNotificacion(opts)` | varios | ui | Notificación avanzada con título y duración |
| `notificarExito/Error/Advertencia()` | varios | ui | Wrappers de notificación |
| `toggleAcordeon(header)` | varios | ui | Toggle de acordeón estándar |

---

## 2. DEPENDENCIAS DOM DIRECTAS

### Variables de estado que leen del DOM

| Acceso DOM | Función que lo usa | Problema |
|---|---|---|
| `document.getElementById('municipio').value` | `getMunicipioActual()` | El ámbito activo es el DOM, no el estado |
| `document.querySelectorAll('[data-epvsa-check]')` | `obtenerSeleccionActual()` | La selección del plan vive en los checkboxes |
| `document.querySelectorAll('[data-det-input]')` | `guardarDeterminantes()` | Los valores de determinantes se leen del DOM al guardar |
| `document.getElementById('seguimiento-anio').value` | `_seguimiento_anioActual()` | El año de seguimiento es un input del DOM |
| `document.querySelectorAll('[data-prio-check]')` | `aceptarPropuesta()` | La priorización se aplica marcando checkboxes |

### Escrituras DOM significativas

| Selector | Función | Tipo |
|---|---|---|
| `#perfil-content`, `#informe-content` | `generarPerfilDesdeFirebase()` | `.innerHTML` |
| `#plan-documento-acciones` | `generarDocumentoPlan()` | `.innerHTML` |
| `#eval-proceso-container` | `eval_actualizarProceso()` | `.innerHTML` |
| `#eval-resultados-container` | `eval_actualizarResultados()` | `.innerHTML` |
| `#ibse-badge-fuente` | `renderizarPanelIBSE()` | `.innerHTML` |
| `#agenda-kanban`, `#agenda-timeline` | `renderAgendas()`, `renderTimeline()` | `.innerHTML` |
| `#cuadro-mandos-container` | `generarCuadroMandosIntegral()` | `.innerHTML` |

---

## 3. ANÁLISIS POR LÓGICA DE NEGOCIO

### 3.1 — Perfil territorial / ámbito activo

**Cómo funciona:** El ámbito activo lo determina el valor de `<select id="municipio">`. Todo el sistema pivota sobre `getMunicipioActual()`, que simplemente lee ese elemento.

Al cambiar de municipio, `actualizarMunicipio()` (l.7770) desencadena una cascada:
- Resetea 8+ variables globales
- Invalida listeners Firebase activos (parcialmente)
- Reinicia el compilador
- Dispara cargas asíncronas en serie con 6 `setTimeout` (100, 300, 500, 600, 800, 1000ms)
- Programa análisis automático con delay de 1s

**Variables de estado territorial:**

| Variable | Tipo | Dónde vive |
|---|---|---|
| `datosMunicipioActual` | objeto Firebase completo | global |
| `referenciasEAS` | referencias Andalucía/Granada | global |
| `estrategiaActual` | string ID estrategia | global (siempre `'es-andalucia-epvsa'`) |
| `window.datosParticipacionCiudadanaMunicipio` | clave de municipio (guardia anti-contaminación) | window |
| `window.datosIBSE` | agregado IBSE; null al cambiar municipio | window |

**Funciones de cambio de ámbito:** Solo `actualizarMunicipio()`, disparada por event listener en `<select id="municipio">` (l.13159). No existe mecanismo de confirmación con datos no guardados ni de cancelación.

---

### 3.2 — Priorización

**Modos existentes en el código:**

| Modo | Función principal | Descripción |
|---|---|---|
| Manual | `renderPlanAccion()` / `obtenerSeleccionActual()` | El usuario marca checkboxes en el selector EPVSA |
| IA local (automática) | `generarPropuestaIA()` → `aceptarPropuesta()` | Motor v2+v3 genera propuesta; se acepta sincronizando checkboxes |
| Epidemiológica pura | `COMPAS_ejecutarFusion('epidemiologica')` | Solo análisis EAS, sin participación |
| Ciudadana pura | `COMPAS_ejecutarFusion('ciudadana')` | Solo votos VRELAS/EPVSA |
| Fusión integrada | `COMPAS_ejecutarFusion('integracion', pesos)` | 70/30 epi/ciudadano por defecto, configurable |

**Estructuras de datos de priorización:**

| Variable | Contenido |
|---|---|
| `window.analisisActual` | `priorizacion[]`, `propuestaEPVSA[]`, `alertasInequidad[]`, `trazabilidad` |
| `window.analisisActualV3` | `areaScores{}`, `prioridades[]`, `inequidades[]` |
| `window.COMPAS.prioridades` | Namespace unificado: `{ tematicas, epvsa, relas, fusion }` |
| `window.decisionPriorizacionActual` | Decisión formal persistida en Firebase |
| `propuestaActual` | Selección normalizada: `[{lineaId, objetivos:[], programas:[]}]` |

---

### 3.3 — Plan de acción

**Estructura en memoria:**

| Variable | Contenido |
|---|---|
| `planLocalSalud.planAccion` | `{ completado, html, seleccion, fecha }` — fuente del compilador |
| `window.COMPAS.state.planAccion` | `{ html, seleccion, fecha, version }` — fuente operativa |
| `window.COMPAS.state.seleccionEPVSA` | Selección normalizada activa |
| `window.COMPAS.state.planAccionFirebase` | Última versión cargada desde Firebase |

**Estructura en Firebase:**
`estrategias/{est}/municipios/{mun}/planAccion` = `{ fechaISO, seleccionEPVSA:[], actuaciones:[], version }`

**Relación con EPVSA:** La selección referencia `ESTRUCTURA_EPVSA` por **índice numérico** (`objetivoIdx`, `programaIdx`). Cualquier reordenación de la estructura EPVSA rompe todos los planes guardados.

**Deuda activa documentada:** Existen dos estados paralelos del plan (`planLocalSalud.planAccion.seleccion` y `window.COMPAS.state.planAccion.seleccion`) con posible divergencia. El código documenta el riesgo explícitamente pero no lo resuelve.

---

### 3.4 — Agendas anuales

**Cómo se crean:** La agenda es un array plano `accionesAgenda` de objetos `ActuacionNormalizada`. Orígenes posibles:

| Origen | Función | Código origen |
|---|---|---|
| Formulario manual | `guardarAccion()` | `manual_agenda` |
| Catálogo Agenda-Tipo | `trasladarActuacionAAgenda()` | `selector_epvsa` |
| Sincronización desde plan | `sincronizarPlanConAgenda()` | `generador_automatico` |
| Datos de ejemplo | `ACTUACIONES_PADUL_2026` | (código muerto de ejemplo) |

**Diferencia respecto al plan:** El plan de acción declara *qué* (selección estructural EPVSA). La agenda gestiona el *cuándo/quién/cómo* (actuaciones concretas con responsable, fecha, entorno, estado).

---

### 3.5 — Seguimiento

**Ciclo:** Para cada actuación de la agenda con contacto, se genera un `SolicitudSeguimiento` anual. Estado: `pendiente → enviada → respondida`. Al registrar respuesta, `seguimiento_aplicarRespuesta()` actualiza la actuación en `accionesAgenda` y Firebase.

**Envío de correos:** **NO IMPLEMENTADO** — la arquitectura está lista pero `seguimiento_enviarCorreo()` está comentada.

**Sin indicadores propios:** El seguimiento no tiene KPIs propios de tendencia. La evaluación cuantitativa usa el ISS (`eval_calcularISS()`).

---

### 3.6 — Evaluación (Fase 6)

**ISS — Índice Sintético de Salud** (`eval_calcularISS()`):
Combina CI (% indicadores cuadro de mandos favorables) + CD (% determinantes favorables vs Andalucía) + CB (score IBSE normalizado). Ponderación 40/40/20 inferida del código, **no declarada como constante**.

**Bloque 1 — Proceso** (`eval_actualizarProceso()`):
5 semáforos dinámicos: Gobernanza, Participación, Sistemática, Coordinación intersectorial, Rendición de cuentas. Semáforo verde/amarillo/gris. El rojo **no está implementado**.

**Bloque 2 — Resultados** (`eval_actualizarResultados()`):
Tabla objetivos→indicadores del plan seleccionado con señal de contexto epidemiológico (trazabilidad o propuesta EPVSA o priorización experta).

---

### 3.7 — Generación documental

**No hay librería PDF:** Toda exportación a PDF usa `window.print()`. No hay integración con ninguna librería de generación PDF.

**No hay exportación Word:** Mammoth.js se usa solo para **importar** .docx, no para exportar.

**Plantillas embebidas en funciones:** Todos los documentos se generan por concatenación de strings HTML dentro de las propias funciones. No hay archivos de plantilla separados.

| Documento | Función | Formato |
|---|---|---|
| Plan de acción | `generarDocumentoPlan()` | HTML → print |
| Plan Local de Salud | `previsualizarPLS()` | HTML → print |
| Perfil de salud | `generarPerfilSaludLocal()` | HTML → print |
| Agenda | `exportarAgendas()` | CSV |
| Seguimiento | `seguimiento_exportarCSV()` | CSV |
| Determinantes | `exportarDeterminantesCSV()` | CSV |

---

### 3.8 — Motores IA

**ANALYTIC_CONFIG (l.4220):**
Objeto de configuración del motor experto v3: pesos del SFA en 10 dimensiones sumando 1.0, umbrales (alta: 0.65, media: 0.40), y Floor Rules de salvaguardas éticas.

**COMPAS_EXPERT_SYSTEM (l.4317):**
Objeto literal con normalización, cálculo del SFA y aplicación de reglas expertas. Lo consume `ejecutarMotorExpertoCOMPAS()`.

**Motor v2 — `analizarDatosMunicipio()` (l.24486):**
Integra 5 fuentes en jerarquía declarada: (1) informe Word, (2) estudios complementarios, (3) priorización popular VRELAS/EPVSA, (4) determinantes EAS, (5) indicadores cuadro de mandos. Genera `window.analisisActual`. Incluye extracción de tópicos por regex y construcción de narrativa salutogénica.

**Motor v3 — `COMPAS_analizarV3()` (IIFE, l.26945):**
Módulo autónomo. Calcula 6 scores (epi, ciudadano, inequidad, evidencia, impacto, convergencia) con pesos distintos a los de ANALYTIC_CONFIG. **Los dos motores son inconsistentes** entre sí en número de dimensiones y valores de peso. `COMPAS_ejecutarMotorV3()` enriquece `window.analisisActual` con campos `_v3_*` y puede sobreescribir `alertasInequidad` y `propuestaEPVSA`.

**Activación v3:** Hook monkey-patch en `window.addEventListener('load')` que envuelve `generarAnalisisIA()`. Guardia `_COMPAS_v3_hooked` protege contra doble registro, pero solo en la misma sesión.

---

## 4. DEUDAS TÉCNICAS Y RIESGOS

### Alta severidad

| # | Descripción |
|---|---|
| D1 | **Credenciales Firebase expuestas en texto claro** (l.4188-4195). API Key, Project ID, Database URL en HTML distribuido directamente a usuarios. |
| D2 | **Estado dual divergente del plan**: `planLocalSalud.planAccion.seleccion` y `window.COMPAS.state.planAccion.seleccion` documentadas como potencialmente divergentes. El código lo reconoce pero no lo resuelve. |
| D3 | **Race condition en cambio rápido de municipio**: `setTimeout` no cancelables (800ms, 1000ms) + listeners Firebase sin `off()` completo en rutas `_cargarEstudiosFirebase()`, `cargarMiembros()`, `inicializarHojaRuta()`. |
| D4 | **Reset parcial de estado**: `actualizarMunicipio()` no cancela listeners de `ibseMonitor_listener`, `votacionListener` ni `vrelas_listener` (solo se limpian al cerrar sus modales). |

### Media severidad

| # | Descripción |
|---|---|
| D5 | Monolito ~2MB en un solo archivo HTML sin módulos ni build system |
| D6 | `ANALYTIC_CONFIG` (10 dimensiones) y `COMPAS_PESOS_SFA` (6 dimensiones) — pesos del motor v2 y v3 son **inconsistentes entre sí** |
| D7 | Lista de municipios duplicada: `TERRITORIOS` (l.4290) y `MUNICIPIOS` (l.4915) son dos listas paralelas de los mismos 85 territorios mantenidas por separado |
| D8 | Selección EPVSA por índice numérico — cualquier reordenación de `ESTRUCTURA_EPVSA` rompe planes guardados en Firebase |
| D9 | Envío de correos de seguimiento no implementado (`seguimiento_enviarCorreo()` comentada) |
| D10 | Logos base64 (~300KB) embebidos en cada documento generado; inflan el HTML y la memoria |
| D11 | 6 `setTimeout` encadenados como mecanismo de sincronización asíncrona (sin Promises ni async/await en la cadena principal) |
| D12 | Hook monkey-patch sobre `generarAnalisisIA` vía `window.addEventListener('load')` |

### Baja severidad

| # | Descripción |
|---|---|
| D13 | Año 2026 hardcodeado en múltiples lugares; requiere actualización manual |
| D14 | `ACTUACIONES_PADUL_2026` — datos de ejemplo de un municipio concreto definidos como constante global (código muerto) |
| D15 | `MUNICIPIOS.tieneInforme` hardcodeado y nunca actualizado dinámicamente |
| D16 | Dos modales IBSE con implementaciones distintas (`#modal-ibse-monitor` JS vs `#modal-monitor-ibse` iframe) |
| D17 | `console.log` masivo sin sistema de logging condicional |
| D18 | `exportarPlanPDF()` hace un `alert()` + `window.print()` — no es un export PDF real |
| D19 | Colores de líneas EPVSA duplicados en al menos 3 lugares en lugar de leer de `ESTRUCTURA_EPVSA[i].color` |
| D20 | `borrarDatosMunicipio()` elimina el nodo completo de Firebase sin advertir sobre pérdida de plan, agenda, seguimiento e IBSE |

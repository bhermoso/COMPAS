# PLAN DE TRANSICIÓN DEL MONOLITO — COMPÁS
> Iteración 10 — Consolidación institucional.
> Fecha: 2026-03-12. El monolito COMPAS.html no ha sido modificado.

---

## 1. Estado actual de la transición

El sistema funciona en **modo de convivencia**: el monolito COMPAS.html es la fuente
operativa principal y la capa modular se ejecuta en paralelo como capa superior.

Ningún comportamiento del usuario ha cambiado. Las dos capas coexisten sin conflictos
gracias al patrón de bridges bidireccionales.

### Resumen de situación

| Componente | Estado | Modo |
|---|---|---|
| Monolito COMPAS.html | Activo e intacto | Fuente de verdad operativa |
| core/ | Activo | Capa modular paralela |
| dominio/ | Activo | Entidades de dominio (no operativas aún) |
| persistencia/firebase/ | Activo | Rutas centralizadas (monolito sigue usando sus propias rutas) |
| ia/ | Activo | Motores encapsulados + modelo SFA unificado |

---

## 2. Qué partes del monolito siguen activas

### Activas sin equivalente modular

| Función/Componente | Línea aprox. | Por qué sigue en el monolito |
|---|---|---|
| `firebase.initializeApp()` + `window.db` | 4186-4201 | La inicialización Firebase no se ha extraído |
| `actualizarMunicipio()` | 7770-7930 | Función pivote con 30+ efectos en cadena; alto riesgo de romper |
| `ESTRUCTURA_EPVSA` completa | 8700-15450 | ~6800 líneas de catálogo EPVSA; pendiente de modularizar |
| `COMPAS_analizarV3()` (IIFE) | 26620-27504 | Bloqueado por inconsistencia ANALYTIC_CONFIG vs COMPAS_PESOS_SFA |
| `COMPAS_ejecutarFusion()` | ~18389 | Requiere módulo de participación ciudadana primero |
| `eval_calcularISS()` | 28223 | ISS multi-componente; depende de analisisActual |
| `eval_actualizarFase6()` | 28200 | Orquestador de Fase 6; vinculado al DOM |
| Monitor IBSE | 27555-28200 | Módulo IBSE no extraído |
| Todo el renderizado UI | disperso | Ningún módulo de UI modular aún |
| `accionesAgenda` (array) | global | Sin extracción de la lógica de agenda |
| `ANALYTIC_CONFIG` | 24220 | Config del expert system; pendiente de auditar |
| `COMPAS_PESOS_SFA` | pendiente | Config del motor v3; no localizada con exactitud |

### Activas con equivalente modular (en convivencia)

| Función heredada | Módulo modular equivalente | Estado |
|---|---|---|
| `getMunicipioActual()` (DOM) | `contextoTerritorial.getAmbitoActivo()` | Coexisten; DOM es fallback |
| `datosMunicipioActual` | `contextoIA.datosMunicipio` | Bridge: contextoIA lee el global |
| `window.analisisActual` | `motorSintesisPerfil.salidaDesdeAnalisisHeredado()` | Bridge: modular adapta el global |
| `CUADRO_MANDOS_INTEGRAL` (l.4723) | `dominio/cuadroMandos.CATALOGO_CMI` | Dos copias; modular es canónica |
| `generarCuadroMandosIntegral()` | `cuadroMandosDesdeFirebase()` (datos) | Datos modulares; render heredado |
| `guardarPlanEnFirebase()` | `repositorioPlanes.guardarPlan()` | Función heredada operativa; módulo preparado |
| `cargarDatosMunicipioFirebase()` | `repositorioPlanes.obtenerDatosCompletos()` | Función heredada operativa |
| `normalizarActuacion()` | `dominio/accion.accionDesdeHeredado()` | Bridge bidireccional |
| `eval_calcularISS()` | `motorEvaluacion.datos.baseCuantitativa.componenteCI` | Módulo usa componenteCI del CMI |
| `analizarDatosMunicipio()` | `motorSintesisPerfil` (encapsulado) | Motor llamado vía bridge |
| `_generarPropuestaLocal()` | `motorPlanAccion` (encapsulado) | Motor llamado vía bridge |

---

## 3. Orden de migración futura recomendado

La migración debe seguir el orden de **menor a mayor riesgo**, respetando las
dependencias entre módulos. Nunca extraer un módulo antes de que sus dependencias
estén modularizadas.

### Fase A — Prerequisitos técnicos (sin cambiar comportamiento)

```
A1. Auditar ANALYTIC_CONFIG (10 dims) y COMPAS_PESOS_SFA (6 dims)
    → Documentar nombres exactos de dimensiones
    → Decidir cuál es el modelo canónico (o si son escalas distintas)
    → Actualizar adaptarModeloHeredado() en modeloSFA.js con mapeo real
    PREREQUISITO PARA: migrar motor v3

A2. Extraer TAXONOMIA_TEMAS del monolito
    → dominio/priorizacion/TaxonomiaTemas.js
    PREREQUISITO PARA: scoring epidemiológico preciso en motorPriorizacion

A3. Añadir seguimientoAnual a ContextoIA
    → Añadir campo a crearContextoIA()
    → Crear repositorioAgendas.obtenerSeguimiento() (ya tiene ruta en FIREBASE_PATHS)
    PREREQUISITO PARA: evaluación del proceso en motorEvaluacion
```

### Fase B — Extracción de módulos de bajo riesgo

```
B1. Extraer inicialización Firebase
    → persistencia/firebase/firebaseInit.js
    → main.js llama a initFirebase() antes que el heredado (o al mismo tiempo)
    EFECTO: elimina dependencia de window.db en firebaseClient.js

B2. Extraer lógica de carga de datos del municipio
    → persistencia/firebase/cargaMunicipio.js (wrapper de cargarDatosMunicipioFirebase)
    → Permite crear ContextoIA directamente desde el repositorio
    EFECTO: contextoDesdeGlobalesHeredados() puede sustituirse por contextoDesdeEntidades()

B3. Crear módulo de participación ciudadana
    → dominio/participacion/ + repositorioParticipacion.js
    PREREQUISITO PARA: score participación preciso, motor fusión

B4. Extraer utilidades (fechas, exportación)
    → util/fecha.js, util/exportacion.js
    RIESGO: bajo (funciones sin estado)
```

### Fase C — Extracción de motores IA

```
C1. Migrar motor_v2_salutogenico
    → ia/motores/motorV2Salutogenico.js
    → ejecutarFn lee de ctx.determinantes, ctx.indicadores, ctx.informe (no de globales)
    → Los bridges en motorSintesisPerfil.js se eliminan
    PREREQUISITO: B2 (carga de datos modularizada)

C2. Migrar motor_expert_system
    → ia/motores/motorExpertSystem.js
    → usa MODELO_SFA_UNIFICADO como configuración
    PREREQUISITO: C1 + A1 (ANALYTIC_CONFIG auditado)

C3. Migrar motor_v3_multicriterio
    → ia/motores/motorV3Multicriterio.js
    → elimina el monkey-patch hook (window.addEventListener)
    PREREQUISITO: A1 (inconsistencia resuelta) + C1 + C2

C4. Migrar motor_propuesta_local
    → ia/motores/motorPropuesta.js
    → ejecutarFn usa ctx.analisisPrevio (del motor v2 modular)
    PREREQUISITO: C1

C5. Migrar motor_fusion_priorizacion
    → ia/motores/motorFusion.js
    PREREQUISITO: B3 (participación modularizada)

C6. Migrar eval_calcularISS
    → ia/motores/motorISS.js
    → usa cmi.componenteCI + otros componentes
    PREREQUISITO: C1
```

### Fase D — Extracción de UI (último)

```
D1. UI Fase 1 — AmbitoTerritorial
D2. UI Fase 2 — Diagnóstico (IBSE, CMI, estudios)
D3. UI Fase 3 — Priorización
D4. UI Fase 4 — Plan de acción
D5. UI Fase 5 — Agenda anual
D6. UI Fase 6 — Evaluación

NOTA: La UI es el paso final porque depende de TODOS los módulos de dominio y IA.
      No se debe iniciar la extracción de UI hasta que todos los módulos de dominio
      e IA estén completos y con tests de equivalencia aprobados.
```

### Fase E — Retirada del monolito

```
E1. Tests de regresión completos (comportamiento observable igual antes/después)
E2. Eliminación de bridges window.* en módulos modulares
E3. Eliminación de ANALYTIC_CONFIG, COMPAS_PESOS_SFA del monolito
E4. COMPAS.html reducido a orquestador de imports ES
E5. COMPAS.html eliminado — plataforma completamente modular
```

---

## 4. Prerequisitos antes de iniciar la migración profunda

| # | Prerequisito | Estado | Bloquea |
|---|---|---|---|
| P1 | Auditar ANALYTIC_CONFIG y COMPAS_PESOS_SFA | ⏳ Pendiente | Motor v3 |
| P2 | Extraer TAXONOMIA_TEMAS | ⏳ Pendiente | Score epidemiológico preciso |
| P3 | Centralizar participación ciudadana | ⏳ Pendiente | Motor fusión, score participación |
| P4 | Añadir seguimientoAnual a ContextoIA | ⏳ Pendiente | Evaluación proceso |
| P5 | Tests de equivalencia motor v2 | ⏳ Pendiente | Migración C1 segura |
| P6 | Inicialización Firebase modular | ⏳ Pendiente | B1, eliminación window.db |
| P7 | Credenciales Firebase en config externo | ⚠️ Urgente | Seguridad (H01 en LISTA_HARDCODING.md) |

---

## 5. Qué se puede eliminar cuando se retiren los motores

### Al completar Fase C:

| Qué eliminar | Cuándo |
|---|---|
| `analizarDatosMunicipio()` (l.24486) | Tras validar motor_v2_salutogenico modular |
| `ejecutarMotorExpertoCOMPAS()` (l.24357) | Tras validar motor_expert_system modular |
| `ANALYTIC_CONFIG` (l.24220) | Tras decidir modelo SFA canónico y migrar ambos motores |
| `COMPAS_analizarV3()` IIFE (l.26620) | Tras validar motor_v3_multicriterio modular |
| `COMPAS_ejecutarFusion()` | Tras validar motor_fusion modular |
| `_generarPropuestaLocal()` (l.26092) | Tras validar motor_propuesta modular |
| `generarPropuestaIA()` (l.26034) | Junto con el anterior |
| `eval_calcularISS()` (l.28223) | Tras validar motor_ISS modular |
| `adaptarModeloHeredado()` en modeloSFA.js | Al eliminar los dos modelos heredados |
| Bridges window.* en motorSintesisPerfil.js | Al eliminar las funciones heredadas |
| Bridges window.* en motorPlanAccion.js | Al eliminar las funciones heredadas |

### Al completar Fase D + E:

| Qué eliminar | Cuándo |
|---|---|
| `window.COMPAS` | Al eliminar todas las referencias en código modular |
| `datosMunicipioActual` (global) | Al extraer carga de datos a persistencia modular |
| `planLocalSalud` | Al extraer compilador de fases |
| `accionesAgenda` (array global) | Al modularizar la agenda anual |
| `window.analisisActual`, `window.analisisActualV3` | Al migrar motores v2 y v3 |
| Todo el DOM inline del HTML | Al completar extracción de UI |
| COMPAS.html (el fichero completo) | Al final de Fase E, cuando todo esté en módulos |

---

## 6. Criterios de aceptación de cada migración

Antes de considerar migrado un módulo del monolito:

1. **Test de equivalencia**: el módulo modular produce la misma salida que el heredado
   para los mismos datos de entrada (mínimo 3 municipios reales).
2. **Trazabilidad**: todas las ejecuciones quedan registradas en `trazabilidadIA.historial`.
3. **Sin DOM**: el módulo no lee ni escribe en el DOM directamente.
4. **Sin globales**: el módulo no lee de `window.*` (excepto bridges explícitamente marcados como provisionales).
5. **Revisión humana**: ningún resultado IA se aplica automáticamente sin `estadoRevisionHumana: 'aprobado'`.
6. **Documentación**: el módulo tiene su correspondiente sección en ARQUITECTURA_COMPAS_FINAL.md actualizada.

---

## 7. Coherencia de imports — Verificación

### ia/motores/ — estado actual de imports

| Motor | motorBase | contextoIA | modeloSFA | ¿DOM? | ¿Firebase directo? |
|---|---|---|---|---|---|
| motorSintesisPerfil | ✅ importa | ✅ recibe como parámetro | ✗ (no necesita) | ✗ No | ✗ No |
| motorPlanAccion | ✅ importa | ✅ recibe como parámetro | ✗ (no necesita) | ✗ No | ✗ No |
| motorPriorizacion | ✅ importa | ✅ recibe como parámetro | ✅ importa | ✗ No | ✗ No |
| motorEvaluacion | ✅ importa | ✅ recibe como parámetro | ✅ importa | ✗ No | ✗ No |

### dominio/ — estado actual de imports

| Módulo | ¿DOM? | ¿Firebase directo? | ¿Globales window.*? |
|---|---|---|---|
| ambitoTerritorial.js | ✗ No | ✗ No | ✗ No |
| planTerritorial.js | ✗ No | ✗ No | ✗ No |
| planAccion.js | ✗ No | ✗ No | ✗ No |
| agendaAnual.js | ✗ No | ✗ No | ✗ No |
| accion.js | ✗ No | ✗ No | ✗ No |
| cuadroMandos.js | ✗ No | ✗ No | ✗ No |

### ia/ — estado actual de imports

| Módulo | ¿DOM? | ¿Firebase directo? | ¿Globales window.*? |
|---|---|---|---|
| motorBase.js | ✗ No | ✗ No | ✗ No |
| validacionIA.js | ✗ No | ✗ No | ✗ No |
| trazabilidadIA.js | ✗ No | ✗ No | ⚠️ window.COMPAS.__trazabilidadIA (bridge lectura) |
| contextoIA.js | ✗ No | ✗ No | ⚠️ window.* en bridge heredado (explícito, provisional) |
| modeloSFA.js | ✗ No | ✗ No | ✗ No |

### Incoherencias encontradas

| # | Módulo | Descripción | Severidad | Acción |
|---|---|---|---|---|
| I1 | `trazabilidadIA.js` | Lee/escribe en `window.COMPAS.__trazabilidadIA` | Baja | Diseño intencional (bridge de acceso desde código heredado). Marcado como provisional. |
| I2 | `contextoIA.contextoDesdeGlobalesHeredados()` | Lee de `window.datosMunicipioActual`, `window.analisisActual`, etc. | Media | Diseño intencional (bridge). Se eliminará cuando se extraigan los loaders de datos. |
| I3 | `motorEvaluacion.salidaDesdeEvaluacionHeredada()` | Accede a `datosMunicipioActual` (global sin `window.`) | Baja | Variable global del scope del monolito. Marcado como provisional en el código. |
| I4 | `motorSintesisPerfil._llamarMotorHeredado()` | Llama a `analizarDatosMunicipio()` sin `window.` | Baja | Función global del monolito. Intencional: bridge explícito. |
| I5 | `core/contextoTerritorial.js` | Lee del DOM (`document.getElementById('municipio')`) | Baja | Diseño intencional: módulo core puede leer del DOM. No es capa de dominio ni IA. |

**Conclusión:** No se han encontrado incoherencias estructurales graves. Todas las
referencias a globales y DOM están en puentes explícitamente marcados como provisionales.
Los módulos de dominio (`dominio/`) y los núcleos de IA (`ia/motorBase`, `ia/modeloSFA`,
`ia/validacionIA`) son completamente puros.

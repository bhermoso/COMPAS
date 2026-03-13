# MAPA ARQUITECTURA COMPÁS
> Iteración 10 — Consolidación institucional.
> Fecha: 2026-03-12.

---

## 1. Arquitectura por capas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COMPAS.html — Sistema heredado operativo (~29 854 líneas)                 │
│  Firebase SDK · window.COMPAS · window.db · datosMunicipioActual           │
│  Motor v2 · Expert system · Motor v3 · Evaluación ISS · UI DOM completa    │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │ bridges bidireccionales (window.*, DOM listeners)
┌────────────────────────────▼────────────────────────────────────────────────┐
│  CORE — Bootstrapping y estado de sesión                                   │
│                                                                             │
│  core/main.js ──────── core/estadoGlobal.js ──── core/contextoTerritorial  │
│  (punto entrada)       (store pub/sub)            (selector #municipio)    │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │ usa entidades de dominio
┌────────────────────────────▼────────────────────────────────────────────────┐
│  DOMINIO — Modelo de negocio puro (sin DOM, sin Firebase)                  │
│                                                                             │
│  AmbitoTerritorial ── PlanTerritorial ── PlanAccion                        │
│                                      └── AgendaAnual ── Accion             │
│  CuadroMandosIntegral (50 indicadores INFOWEB)                             │
│    ├── IndicadorCMI (con semáforo favorable/amejorar/estable)              │
│    └── componenteCI (% indicadores favorables)                             │
└────────────────────────────┬────────────────────────────────────────────────┘
                    ┌────────┴────────┐
                    │                 │
┌───────────────────▼────┐  ┌────────▼────────────────────────────────────────┐
│  PERSISTENCIA          │  │  IA — Subsistema de inteligencia artificial     │
│                        │  │                                                  │
│  firebaseClient.js     │  │  motorBase.js ← crearMotor() + SalidaMotor     │
│  FIREBASE_PATHS        │  │  contextoIA.js ← ContextoIA (entrada motores)  │
│                        │  │  validacionIA.js ← guardas de entrada/salida   │
│  repositorioPlanes     │  │  trazabilidadIA.js ← historial de ejecuciones  │
│  repositorioAgendas    │  │  modeloSFA.js ← 8 dimensiones unificadas       │
│  repositorioIndicadores│  │                                                  │
│                        │  │  motores/                                        │
│  window.db (bridge)    │  │  ├── motorSintesisPerfil (encapsula v2)         │
│                        │  │  ├── motorPlanAccion (encapsula propuesta)      │
│                        │  │  ├── motorPriorizacion (4 criterios + SFA)      │
│                        │  │  └── motorEvaluacion (CMI + cualitativa)        │
└────────────────────────┘  └─────────────────────────────────────────────────┘
```

---

## 2. Flujo de datos principal

```
Selección municipio
      │
      ├──[HEREDADO]──────────────────────────────────────────────────────────▶
      │   actualizarMunicipio()
      │   └─ Firebase read: datosMunicipioActual
      │   └─ Firebase read: planAccion, agendas, indicadores
      │   └─ Renderiza DOM (fases 1-6)
      │
      └──[MODULAR]──────────────────────────────────────────────────────────▶
          contextoTerritorial listener
          └─ setAmbitoActivo({ key, nombre, tipo, estrategia })
          └─ estadoGlobal.ambitoTerritorialActivo actualizado
          └─ main.js: AmbitoTerritorial + PlanTerritorial de dominio
          └─ window.COMPAS.__dominio.ambitoActual actualizado
```

---

## 3. Relaciones entre módulos

```
core/main.js
  │ importa
  ├─ core/estadoGlobal.js ──────────────────── PUB/SUB ──▶ suscriptores
  ├─ core/contextoTerritorial.js
  ├─ dominio/ambitoTerritorial.js
  └─ dominio/planTerritorial.js

ia/contextoIA.js
  │ importa
  ├─ core/estadoGlobal.js (getEstado)
  ├─ core/contextoTerritorial.js (getAmbitoActivo)
  └─ dominio/cuadroMandos.js (cuadroMandosDesdeFirebase)

ia/motorBase.js
  │ importa
  ├─ ia/trazabilidadIA.js
  └─ ia/validacionIA.js

ia/motores/motorSintesisPerfil.js
  │ importa
  ├─ ia/motorBase.js
  └─ ia/validacionIA.js
  [bridge → window.analizarDatosMunicipio() + window.ejecutarMotorExpertoCOMPAS()]

ia/motores/motorPlanAccion.js
  │ importa
  ├─ ia/motorBase.js
  └─ ia/validacionIA.js
  [bridge → window._generarPropuestaLocal()]

ia/motores/motorPriorizacion.js
  │ importa
  ├─ ia/motorBase.js
  ├─ ia/validacionIA.js
  └─ ia/modeloSFA.js          ← integración SFA

ia/motores/motorEvaluacion.js
  │ importa
  ├─ ia/motorBase.js
  ├─ ia/validacionIA.js
  └─ ia/modeloSFA.js          ← integración SFA

persistencia/firebase/repositorioPlanes.js
  │ importa
  ├─ persistencia/firebase/firebaseClient.js
  ├─ dominio/planTerritorial.js
  └─ dominio/planAccion.js

persistencia/firebase/repositorioAgendas.js
  │ importa
  ├─ persistencia/firebase/firebaseClient.js
  ├─ dominio/agendaAnual.js
  └─ dominio/accion.js

persistencia/firebase/repositorioIndicadores.js
  │ importa
  ├─ persistencia/firebase/firebaseClient.js
  └─ dominio/cuadroMandos.js
```

---

## 4. Diagrama del subsistema IA

```
  ContextoIA (inmutable, snapshot de datos)
    ◀── contextoDesdeGlobalesHeredados()   [hoy: lee window.*]
    ◀── contextoDesdeEntidades(...)        [futuro: sin globales]
    │
    ├── ambitoId, ambitoNombre, ambitoTipo, estrategia, planTerritorialId
    ├── datosMunicipio, determinantes, indicadores, referenciasEAS, informe
    ├── cuadroMandos (CuadroMandosIntegral)
    ├── analisisPrevio, analisisPrevioV3
    ├── participacion, estudiosComplementarios
    └── fuentes: { tieneInforme, tieneDet, tieneIndicadores, tienePopular, tieneEstudios }
         │
         ▼
  motor.validarContexto(contextoIA)    ←── validacionIA.js
  { valido, errores[], advertencias[] }
         │ (si valido)
         ▼
  motor.ejecutarFn(contextoIA)
  [llamada al motor heredado vía bridge o lógica modular propia]
         │
         ▼
  calcularConfianza(resultado, contextoIA)   [0-1]
         │
         ▼
  crearRegistroTrazabilidad(...)     ←── trazabilidadIA.js
  registrarEjecucion(traza)
  → _historial (memoria de sesión)
  → window.COMPAS.__trazabilidadIA.historial
         │
         ▼
  normalizarSalidaMotor(resultado, traza)   ←── motorBase.js
         │
         ▼
  SalidaMotor (Readonly)
  {
    motorId, motorVersion, fechaGeneracion, duracionMs,
    estadoRevisionHumana: 'pendiente',   ← SIEMPRE
    gradoConfianza, gradoConfianzaLabel, fuentesUsadas,
    datos,           ← resultado del motor
    advertencias[],
    error, sinDatos,
    trazabilidadId   ← referencia a la traza
  }
         │
         ▼
  [Técnico revisa]
  actualizarRevision(trazaId, 'aprobado' | 'rechazado' | 'parcial')
         │ (solo si 'aprobado')
         ▼
  UI aplica el resultado al plan / priorización
```

---

## 5. Diagrama del modelo SFA unificado

```
  ContextoIA
       │
       ▼
  calcularScoreSFA(contextoIA)
       │
       ├── D1 epidemiología    (0.22) ← analisisPrevio.priorizacion[] / determinantes
       ├── D2 tendencias CMI   (0.20) ← 1 - componenteCI/100
       ├── D3 determinantes s. (0.14) ← min(1, nDeterminantes/20)
       ├── D4 inequidad        (0.12) ← min(1, nAlertasInequidad/5)
       ├── D5 evidencia cual.  (0.12) ← informe + estudios + conclusiones + oportunidades
       ├── D6 participación    (0.12) ← min(1, nParticipantes/100)
       ├── D7 factibilidad     (0.10) ← plan + estrategia + análisis [inverso]
       └── D8 convergencia     (0.08) ← propuestaEPVSA + priorizacion [inverso]
       │
       ▼
  scoreTotal = Σ(score_dim × peso) / Σ(pesos disponibles)
  (dimensiones sin datos: score=null, excluidas del cómputo)
       │
       ▼
  { scoreTotal, scorePorDimension{}, fuentesUsadas[], trazabilidad{} }
  → añadido como resultado.perfilSFA en motorPriorizacion y motorEvaluacion
```

---

## 6. Mapa de rutas Firebase centralizadas

```
FIREBASE_PATHS (firebaseClient.js)
│
├── ambito(est, mun)           → estrategias/{est}/municipios/{mun}
├── planAccion(est, mun)       → .../planAccion
├── seleccionEPVSA(est, mun)   → .../seleccionEPVSA
├── agendas(est, mun)          → .../agendas
├── seguimiento(est, mun, a)   → .../seguimiento/{anio}
├── indicadores(est, mun)      → .../indicadores
├── determinantes(est, mun)    → .../determinantes
├── informe(est, mun)          → .../informe
├── participacionCiudadana(..) → .../participacionCiudadana
├── estudiosComplementarios(..)→ .../estudiosComplementarios
├── ibseDatos(est, mun)        → .../ibseDatos
├── ibseRespuestas(mun)        → ibse_respuestas/{mun}
├── ibseMonitor(mun)           → ibse_monitor/{mun}
├── referencias                → referencias
├── municipios(est)            → estrategias/{est}/municipios
└── ... (18 rutas más auditadas en AUDITORIA_PERSISTENCIA.md)
```

---

## 7. Mapa de módulos implícitos del monolito

```
COMPAS.html (~29 854 líneas)
│
├── l.4095–4530   [M01 CORE/CONFIG]          Firebase init, variables globales, ANALYTIC_CONFIG
├── l.4530–4715   [M02 CORE/COMPILADOR]      planLocalSalud, verificarPlanLocalCompleto
├── l.4715–4895   [M03 DOMINIO/CMI]          CUADRO_MANDOS_INTEGRAL, generarCuadroMandosIntegral
├── l.4895–5200   [M04 PERSISTENCIA/MUN]     cargarDatosMunicipioFirebase
├── l.5200–5505   [M05 DOMINIO/DET]          Determinantes EAS, CRUD
├── l.5505–7060   [M06 PERSISTENCIA/CARGA]   CSV, ZIP, Word, PDF upload
├── l.7580–7770   [M07 PERSISTENCIA/TERR]    TERRITORIOS, referencias EAS
├── l.7770–7930   [M08 CORE/AMBITO]          actualizarMunicipio() — función pivote
├── l.7930–8108   [M09 IA/ORCHESTR]         verificarYGenerarAnalisisAutomatico()
├── l.8108–8465   [M10 UI/DOCS]              generarPerfilSalud(), informe HTML
├── l.8465–8620   [M11 PERSISTENCIA/GRUPO]   grupoMotor, hojaRuta
├── l.8700–15450  [M12 DOMINIO/EPVSA]        ESTRUCTURA_EPVSA, plan de acción completo
├── l.15800–22900 [M13 PERSISTENCIA/PART]    Votaciones EPVSA, VRELAS, participación
├── l.23369–23620 [M14 PERSISTENCIA/EST]     estudiosComplementarios
├── l.24000–26620 [M15 IA/MOTOR_V2]          analizarDatosMunicipio + generarPropuestaIA
├── l.26620–27504 [M16 IA/MOTOR_V3]          COMPAS_analizarV3 IIFE + monkey-patch
├── l.27555–28200 [M17 DOMINIO/IBSE]         Monitor IBSE, cuestionario
├── l.28200–28700 [M18 DOMINIO/EVAL]         eval_calcularISS, eval_actualizarFase6
├── l.29100–29333 [M19 PERSISTENCIA/PRIO]    Namespace prioridades unificado
├── l.29335–29640 [M20 DOMINIO/SEGUIM]       Seguimiento anual actuaciones
└── l.29640–final [M21 DOMINIO/MAPA]         Grafo del plan
```

---

## 8. Estado de modularización por módulo implícito

```
M01 CORE/CONFIG         ● Parcial   → estadoGlobal.js (constantes), firebaseClient.js (db/rutas)
M02 CORE/COMPILADOR     ○ Pendiente → ningún equivalente modular todavía
M03 DOMINIO/CMI         ● Completo  → dominio/cuadroMandos.js (catálogo + entidades + semáforo)
M04 PERSISTENCIA/MUN    ● Completo  → repositorioPlanes.js (rutas + funciones)
M05 DOMINIO/DET         ○ Pendiente → solo presente en contextoIA como campo raw
M06 PERSISTENCIA/CARGA  ○ Pendiente → no hay módulo de carga CSV/ZIP aún
M07 PERSISTENCIA/TERR   ● Parcial   → contextoTerritorial.js (lista territorios vía bridge)
M08 CORE/AMBITO         ● Completo  → contextoTerritorial.js (listener aditivo, sin reemplazar)
M09 IA/ORCHESTR         ● Parcial   → motores encapsulan la ejecución; orquestación aún heredada
M10 UI/DOCS             ○ Pendiente → ningún módulo de renderizado todavía
M11 PERSISTENCIA/GRUPO  ○ Pendiente → en FIREBASE_PATHS pero sin repositorio específico
M12 DOMINIO/EPVSA       ○ Pendiente → estructura EPVSA muy grande (8700-15450), sin extracción
M13 PERSISTENCIA/PART   ○ Pendiente → participación ciudadana encapsulada en repositorioIndicadores
M14 PERSISTENCIA/EST    ● Parcial   → repositorioIndicadores.obtenerEstudios()
M15 IA/MOTOR_V2         ● Encapsul  → motorSintesisPerfil.js (wrapper; motor intacto)
M16 IA/MOTOR_V3         ○ Pendiente → bloqueado por inconsistencia ANALYTIC_CONFIG/COMPAS_PESOS_SFA
M17 DOMINIO/IBSE        ○ Pendiente → ningún módulo IBSE extraído todavía
M18 DOMINIO/EVAL        ● Encapsul  → motorEvaluacion.js (CMI + cualitativa; ISS en monolito)
M19 PERSISTENCIA/PRIO   ○ Pendiente → prioridades en window.COMPAS.prioridades (heredado)
M20 DOMINIO/SEGUIM      ○ Pendiente → seguimientoAnual no está en ContextoIA todavía
M21 DOMINIO/MAPA        ○ Pendiente → grafo del plan no extraído
```

**Leyenda:** ● Completo/Encapsulado · ● Parcial · ○ Pendiente

---

## 9. Porcentaje estimado de modularización

| Capa | % modularizado | Notas |
|---|---|---|
| Core (infraestructura) | ~65% | Estado y contexto territorial modulares; Firebase init y compilador heredados |
| Dominio (entidades) | ~70% | 6 módulos con entidades completas; EPVSA, IBSE y evaluación pendientes |
| Persistencia | ~45% | Rutas centralizadas; funciones CRUD encapsuladas; lógica de carga heredada |
| IA (motores) | ~50% | Contrato, contexto y trazabilidad modulares; lógica de motores v2/v3 heredada |
| UI (renderizado) | ~0% | Todo el renderizado DOM sigue en el monolito |
| **TOTAL** | **~40%** | La plataforma está modularizada en infraestructura y modelo; la lógica de negocio profunda y la UI siguen en el monolito |

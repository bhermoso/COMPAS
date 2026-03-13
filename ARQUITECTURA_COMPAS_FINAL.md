# ARQUITECTURA COMPÁS — DOCUMENTO FINAL
> Iteración 10 — Consolidación institucional.
> Fecha: 2026-03-12. El monolito COMPAS.html no ha sido modificado.

---

## 1. Descripción del sistema

COMPÁS (**C**ompetencias y **O**bjetivos del **M**unicipio en **P**lanificación de la **S**alud) es
una plataforma de planificación local de salud para municipios y entidades territoriales de Andalucía,
enmarcada en la estrategia EPVSA 2024-2030 (Escuela de Pacientes y Vida Saludable en Andalucía).

El sistema guía al técnico de salud a través de 6 fases:
1. Ámbito territorial — selección del municipio/mancomunidad
2. Diagnóstico — perfil de salud, IBSE, estudios complementarios
3. Priorización — qué áreas de salud son prioritarias
4. Plan de acción — selección de líneas EPVSA y actuaciones
5. Agenda anual — programación operativa por año
6. Evaluación — seguimiento y valoración del plan

COMPÁS integra datos de INFOWEB (Junta de Andalucía), participación ciudadana, determinantes EAS
y análisis salutogénico para producir planes de acción institucionalmente fundamentados.

---

## 2. Objetivo de la plataforma

**Objetivo principal:** Apoyar técnicamente la elaboración, seguimiento y evaluación del Plan
Local de Salud de cada territorio andaluz, garantizando:
- Trazabilidad de todas las decisiones de priorización
- Separación entre análisis IA (apoyo) y decisión técnica (humana)
- Coherencia metodológica con el marco EPVSA
- Persistencia de planes en Firebase para continuidad entre sesiones

**Principio rector irrenunciable:**
> "La IA es apoyo técnico, no decisora automática."
> Toda salida de un motor IA comienza como `estadoRevisionHumana: 'pendiente'`
> y no se aplica al plan hasta que el técnico la aprueba explícitamente.

---

## 3. Estructura completa del proyecto

```
COMPÁS MODULARIZADO/
│
├── COMPAS.html                         ← Monolito operativo principal (~29 854 líneas)
│
├── core/
│   ├── main.js                         ← Punto de entrada del sistema modular
│   ├── estadoGlobal.js                 ← Store mínimo con pub/sub
│   └── contextoTerritorial.js          ← Ámbito territorial activo
│
├── dominio/
│   ├── ambitoTerritorial.js            ← Entidad territorial (municipio/mancomunidad/distrito)
│   ├── planTerritorial.js              ← Entidad plan + RegistroPlanes
│   ├── planAccion.js                   ← Nivel estratégico (selección EPVSA)
│   ├── agendaAnual.js                  ← Nivel operativo (programación por año)
│   ├── accion.js                       ← Unidad atómica de implementación
│   └── cuadroMandos.js                 ← 50 indicadores INFOWEB + semáforos + componenteCI
│
├── persistencia/
│   └── firebase/
│       ├── firebaseClient.js           ← FIREBASE_PATHS + operaciones CRUD genéricas
│       ├── repositorioPlanes.js        ← CRUD plan territorial en Firebase
│       ├── repositorioAgendas.js       ← CRUD agendas anuales y seguimiento
│       └── repositorioIndicadores.js   ← CRUD indicadores, determinantes, participación
│
├── ia/
│   ├── motorBase.js                    ← Factory crearMotor() + contrato SalidaMotor
│   ├── contextoIA.js                   ← Constructor de ContextoIA (entrada de motores)
│   ├── validacionIA.js                 ← Guardas de entrada/salida de motores
│   ├── trazabilidadIA.js               ← Historial de ejecuciones IA en sesión
│   ├── modeloSFA.js                    ← Modelo SFA unificado (8 dimensiones)
│   └── motores/
│       ├── motorSintesisPerfil.js      ← Encapsula analizarDatosMunicipio() + expert system
│       ├── motorPlanAccion.js          ← Encapsula _generarPropuestaLocal()
│       ├── motorPriorizacion.js        ← Scoring multicriterio (4 criterios + SFA)
│       └── motorEvaluacion.js          ← Evaluación basada en CMI + evidencia cualitativa
│
├── ARQUITECTURA_OBJETIVO.md
├── ARQUITECTURA_COMPAS_FINAL.md        ← (este documento)
├── MAPA_ARQUITECTURA_COMPAS.md
├── PLAN_TRANSICION_MONOLITO.md
├── MAPA_MODULOS_IMPLICITOS.md
├── LISTA_HARDCODING.md
├── MODELO_DOMINIO_BASE.md
├── MODELO_ACCIONES_Y_AGENDAS.md
├── MODELO_CUADRO_MANDOS.md
├── MODELO_PRIORIZACION_Y_EVALUACION.md
├── MODELO_SFA_UNIFICADO.md
├── CONTRATO_MOTORES_IA.md
├── AUDITORIA_PERSISTENCIA.md
├── AUDITORIA_MOTORES_CONSERVABLES.md
├── MIGRACION_CONTEXTO.md
└── README_BOOTSTRAP.md
```

---

## 4. Responsabilidad de cada carpeta

| Carpeta | Responsabilidad | Regla de acceso |
|---|---|---|
| `core/` | Estado global de sesión, ámbito activo, bootstrapping | Lee del DOM y de `window.*`; escribe en `estadoGlobal` |
| `dominio/` | Entidades de negocio inmutables, reglas de dominio | Módulos puros. Sin DOM, sin Firebase, sin efectos secundarios |
| `persistencia/firebase/` | CRUD Firebase, centralización de rutas | Único punto de acceso a Firebase en la capa modular |
| `ia/` | Subsistema IA: contrato, contexto, trazabilidad, modelo SFA | Módulos puros. Sin DOM. Lee solo de ContextoIA |
| `ia/motores/` | Motores concretos de análisis | Usan bridges hacia el monolito; sin DOM directo |

---

## 5. Responsabilidad de cada módulo

### core/

| Módulo | Responsabilidad |
|---|---|
| `main.js` | Punto de entrada: inicializa estado global, contexto territorial, registro de planes, suscriptores de diagnóstico |
| `estadoGlobal.js` | Store con 5 campos: ambitoActivo, planActivo, usuario, configuracion, vistaActiva. Pub/sub interno |
| `contextoTerritorial.js` | Lee el selector `#municipio` y publica el ámbito en estadoGlobal. Listener ADITIVO (no reemplaza el heredado) |

### dominio/

| Módulo | Responsabilidad |
|---|---|
| `ambitoTerritorial.js` | Entidad `AmbitoTerritorial`: id, nombre, tipo (municipio/mancomunidad/distrito), estrategia |
| `planTerritorial.js` | Entidad `PlanTerritorial` + `RegistroPlanes` (multi-plan). Estado: borrador/activo/cerrado/archivado |
| `planAccion.js` | Entidad `PlanAccion` (nivel estratégico): seleccionEPVSA, actuaciones-tipo |
| `agendaAnual.js` | Entidad `AgendaAnual` (nivel operativo): acciones programadas por año |
| `accion.js` | Entidad `Accion`: unidad atómica. Origen: generador_automatico/selector_epvsa/manual_agenda |
| `cuadroMandos.js` | `CuadroMandosIntegral`: 50 indicadores INFOWEB, semáforos, componenteCI, 3 categorías |

### persistencia/firebase/

| Módulo | Responsabilidad |
|---|---|
| `firebaseClient.js` | `FIREBASE_PATHS` (todas las rutas centralizadas) + operaciones `fb.get/set/push/remove` |
| `repositorioPlanes.js` | `obtenerPlan`, `obtenerPlanAccion`, `guardarPlan`, `obtenerDatosCompletos` |
| `repositorioAgendas.js` | `obtenerAgendas`, `guardarAgendas`, `obtenerSeguimiento` |
| `repositorioIndicadores.js` | `obtenerIndicadores`, `obtenerDeterminantes`, `obtenerParticipacion`, `obtenerEstudios` |

### ia/

| Módulo | Responsabilidad |
|---|---|
| `motorBase.js` | `crearMotor()` factory. Contrato `SalidaMotor`. `ESTADOS_REVISION`. `salidaDesdeAnalisisHeredado()` |
| `contextoIA.js` | `crearContextoIA()`, `contextoDesdeGlobalesHeredados()`, `contextoDesdeEntidades()` |
| `validacionIA.js` | `validarContextoMinimo()`, `validarContextoAnalitico()`, `validarContextoPropuesta()`, `diagnosticoContexto()` |
| `trazabilidadIA.js` | `crearRegistroTrazabilidad()`, `registrarEjecucion()`, `obtenerHistorial()`, `obtenerPendientesRevision()` |
| `modeloSFA.js` | `MODELO_SFA_UNIFICADO` (8 dims), `calcularScoreSFA()`, `adaptarModeloHeredado()` |

### ia/motores/

| Motor | Hereda de | Encapsula |
|---|---|---|
| `motorSintesisPerfil` | motorBase | `analizarDatosMunicipio()` + `ejecutarMotorExpertoCOMPAS()` |
| `motorPlanAccion` | motorBase | `_generarPropuestaLocal()` |
| `motorPriorizacion` | motorBase | Scoring modular propio (4 criterios + SFA) |
| `motorEvaluacion` | motorBase | Análisis CMI + evidencia cualitativa (nuevo, sin equivalente directo en monolito) |

---

## 6. Flujo de datos del sistema

```
Usuario selecciona municipio (#municipio)
         │
         ├─→ [HEREDADO] actualizarMunicipio()
         │     └─→ Firebase lee datosMunicipioActual
         │     └─→ Firebase lee planAccion, agendas
         │     └─→ renderiza DOM del sistema
         │
         └─→ [MODULAR] contextoTerritorial listener
               └─→ setAmbitoActivo({ key, nombre, tipo, estrategia })
               └─→ estadoGlobal actualizado
               └─→ main.js: ambitoDesdeContexto() → AmbitoTerritorial de dominio
               └─→ main.js: planDesdeFirebase() → PlanTerritorial de dominio
               └─→ window.COMPAS.__dominio.ambitoActual y planActual actualizados
```

---

## 7. Flujo de generación del perfil territorial

```
Técnico pulsa "Analizar" (Fase 2/3)
         │
         ├─→ [HEREDADO] analizarDatosMunicipio()
         │     Lee: datosMunicipioActual, referenciasEAS, estudiosComplementarios
         │     Lee: window.datosParticipacionCiudadana
         │     Produce: window.analisisActual { priorizacion, propuestaEPVSA, fortalezas,
         │              oportunidades, conclusiones, alertasInequidad, fuentes, ... }
         │     └─→ ejecutarMotorExpertoCOMPAS(analisis)
         │           Enriquece con vector SFA (ANALYTIC_CONFIG, 10 dims)
         │
         └─→ [MODULAR] motorSintesisPerfil.ejecutar(contextoIA)
               contextoIA ← contextoDesdeGlobalesHeredados()
               Bridge → analizarDatosMunicipio() (ya ejecutado)
               Normaliza → SalidaMotor { perfil, priorizacion, propuestaEPVSA,
                            conclusiones, recomendaciones }
               estadoRevisionHumana: 'pendiente'
               Trazabilidad registrada en trazabilidadIA.historial
```

---

## 8. Flujo de generación del plan de acción

```
Técnico revisa análisis → selecciona líneas EPVSA → "Generar propuesta"
         │
         ├─→ [HEREDADO] generarPropuestaIA()
         │     Lee: window.analisisActual
         │     Llama: _generarPropuestaLocal(municipio, datos, pop, analisis)
         │     Renderiza: renderizarPropuestaIA() [DOM]
         │
         └─→ [MODULAR] motorPlanAccion.ejecutar(contextoIA)
               contextoIA.analisisPrevio = window.analisisActual
               Bridge → _generarPropuestaLocal() (sin DOM)
               Produce: SalidaMotor { lineasPropuestas, seleccionNormalizada,
                         justificacionGlobal, accionesSugeridas }
               estadoRevisionHumana: 'pendiente'

Técnico aprueba → guardarPlanEnFirebase()
         │
         └─→ Firebase: estrategias/{est}/municipios/{mun}/planAccion
               └─→ [MODULAR] repositorioPlanes.guardarPlan()  ← equivalente modular
```

---

## 9. Flujo de priorización

```
Técnico elige tipo de priorización (manual/estratégica/temática/mixta)
         │
         └─→ [MODULAR] motorPriorizacion.ejecutar(contextoIA)
               contextoIA._tipoPriorizacion = 'mixta' | 'estrategica' | 'tematica' | 'manual'
               │
               ├─→ _obtenerAreasBase() → áreas de analisisPrevio.priorizacion[] o 3 categorías CMI
               ├─→ _scoringMulticriterio():
               │     criterio epidemiológico (determinantes + analisisPrevio)
               │     criterio CMI (porCategoria.aMejorar/conDatos)
               │     criterio cualitativo (informe + estudios + conclusiones)
               │     criterio participación (temasFreq + nParticipantes)
               │     → Pesos aplicados según tipo de priorización
               │     → Redistribución automática si faltan datos
               │
               └─→ calcularScoreSFA(contextoIA)  ← modelo unificado 8 dimensiones
                     Añadido como perfilSFA al resultado

               Produce: SalidaMotor { prioridadesPropuestas[], criteriosAplicados,
                         inconsistenciaHeredada, perfilSFA }
               estadoRevisionHumana: 'pendiente'
               → Técnico revisa y establece el orden definitivo
```

---

## 10. Flujo de evaluación

```
Técnico abre Fase 6 (Evaluación)
         │
         ├─→ [HEREDADO] eval_actualizarFase6()
         │     eval_calcularISS() → ISS multi-componente (l.28223)
         │     eval_actualizarProceso() → 5 semáforos (Bloque 1)
         │     eval_actualizarResultados() → tabla obj→indicadores (Bloque 2)
         │
         └─→ [MODULAR] motorEvaluacion.ejecutar(contextoIA)
               contextoIA.cuadroMandos ← CuadroMandosIntegral (50 indicadores INFOWEB)
               contextoIA.analisisPrevio ← window.analisisActual
               │
               ├─→ _analizarCMI(cmi) → { avances[], dificultades[], areasCriticas[] }
               ├─→ _extraerEvidenciaCualitativa() → { alertasInequidad, conclusiones, ... }
               ├─→ calcularScoreSFA() → perfilSFA (8 dimensiones)
               └─→ _generarRecomendaciones() → observaciones para el técnico

               Produce: SalidaMotor { estadoGlobal, avances, dificultades, areasCriticas,
                         recomendacionesEvaluacion, perfilSFA, limitacionesConocidas }
               estadoRevisionHumana: 'pendiente'
               Trazabilidad registrada automáticamente
```

---

## 11. Cómo se construye el ContextoIA

```js
// Método bridge (hoy — lee de variables globales del monolito):
const ctx = contextoDesdeGlobalesHeredados();
// Lee: datosMunicipioActual, window.analisisActual, window.analisisActualV3,
//      window.datosParticipacionCiudadana, window.estudiosComplementarios, referenciasEAS

// Método modular (futuro — cuando se extraigan los loaders de datos):
const ctx = contextoDesdeEntidades(ambitoTerritorial, planTerritorial, datosMunicipio);

// Estructura del ContextoIA:
{
    ambitoId, ambitoNombre, ambitoTipo, estrategia, planTerritorialId, timestamp,
    datosMunicipio, determinantes, indicadores, referenciasEAS, informe, cuadroMandos,
    analisisPrevio, analisisPrevioV3, participacion, estudiosComplementarios,
    fuentes: { tieneInforme, tieneEstudios, tienePopular, tieneDet, tieneIndicadores,
               nEstudios, nParticipantes }
}
```

---

## 12. Cómo se calcula el modelo SFA

```js
import { calcularScoreSFA } from './ia/modeloSFA.js';

const perfil = calcularScoreSFA(contextoIA);
// Calcula 8 dimensiones desde el ContextoIA:
//   D1 epidemiología    (0.22) ← analisisPrevio.priorizacion[] o determinantes
//   D2 tendencias CMI   (0.20) ← 1 - componenteCI/100
//   D3 determinantes s. (0.14) ← min(1, nDet/20)
//   D4 inequidad        (0.12) ← min(1, nAlertas/5)
//   D5 evidencia cual.  (0.12) ← informe + estudios + conclusiones
//   D6 participación    (0.12) ← min(1, nPart/100)
//   D7 factibilidad     (0.10) ← plan + estrategia + análisis
//   D8 convergencia     (0.08) ← propuestaEPVSA + priorizacion

// scoreTotal = Σ(score_dim × peso) / Σ(pesos disponibles)
// → Dimensiones sin datos: score=null, excluidas sin penalizar
```

---

## 13. Cómo se registra trazabilidad

```
Cada motor.ejecutar(contextoIA):
  1. Valida contextoIA (validarFn personalizada)
  2. Ejecuta ejecutarFn(contextoIA)
  3. calcularConfianzaFn(resultado, contextoIA) → gradoConfianza [0-1]
  4. crearRegistroTrazabilidad({ motorId, ambitoId, fuentesUsadas, gradoConfianza, ... })
  5. registrarEjecucion(traza)  → añade a _historial (en memoria, sesión)
     └─→ window.COMPAS.__trazabilidadIA.historial  (acceso desde código heredado)
  6. normalizarSalidaMotor(resultado, traza) → SalidaMotor con trazabilidadId

// Consulta del historial:
import { obtenerHistorial, obtenerPendientesRevision } from './ia/trazabilidadIA.js';
const pendientes = obtenerPendientesRevision();  // revisión obligatoria antes de aplicar
```

---

## 14. Cómo convive la arquitectura modular con el monolito

### Modelo de convivencia: capas aditivas, no sustitutivas

```
COMPAS.html (monolito)          Capa modular
─────────────────────           ─────────────────────────────
window.COMPAS               ←→  window.COMPAS.__estadoGlobal
window.COMPAS.__ambitoActivo ←→ estadoGlobal.ambitoTerritorialActivo
window.db                   ←   persistencia/firebase/firebaseClient.getDb()
analisisActual              ←→  motorSintesisPerfil.salidaDesdeAnalisisHeredado()
accionesAgenda[]            ←→  accionesDesdeHeredadas()
planLocalSalud              ←→  planDesdeFirebase() → PlanTerritorial
ANALYTIC_CONFIG             ←→  modeloSFA.adaptarModeloHeredado('ANALYTIC_CONFIG')
```

### Reglas de convivencia

1. El monolito sigue siendo la **fuente de verdad operativa** (renderiza, carga Firebase, gestiona UI).
2. La capa modular es **siempre aditiva**: añade entidades, contratos y trazabilidad sin reemplazar.
3. Los bridges leen del monolito (`window.*`) pero **nunca escriben directamente** en sus variables.
4. `window.analisisActual` se mantiene actualizado por `motorSintesisPerfil` al ejecutar (bridge explícito).
5. Los módulos ES son diferidos y siempre corren **después** de los `<script>` clásicos del HTML.

---

## 15. Qué partes siguen heredadas

### Completamente en el monolito (sin equivalente modular todavía)

| Componente | Líneas | Descripción |
|---|---|---|
| Inicialización Firebase | 4186-4201 | `firebase.initializeApp()` + `window.db` |
| Motor v2 salutogénico | 24486-25200 | `analizarDatosMunicipio()` |
| Expert system SFA | 24357-24486 | `ejecutarMotorExpertoCOMPAS()`, `ANALYTIC_CONFIG` |
| Motor v3 multicriterio | 26620-27504 | `COMPAS_analizarV3()` IIFE + monkey-patch |
| Motor fusión | ~18389 | `COMPAS_ejecutarFusion()` |
| Generador propuesta | 26034-26620 | `generarPropuestaIA()`, `_generarPropuestaLocal()` |
| Evaluación ISS | 28200-28700 | `eval_calcularISS()`, `eval_actualizarFase6()` |
| Módulo IBSE | 27555-28200 | Monitor IBSE, cuestionario, carga CSV |
| Participación ciudadana | 15800-22900 | VRELAS, votaciones EPVSA |
| UI (todo el renderizado) | disperso | Todas las funciones de render DOM |
| Compilador de fases | 4530-4715 | `verificarPlanLocalCompleto()`, `planLocalSalud` |
| Taxonomía EPVSA | 8700-15450 | `ESTRUCTURA_EPVSA`, líneas, objetivos, programas |
| Determinantes EAS UI | 5200-5505 | CRUD determinantes |

### Variables globales heredadas que siguen activas

`db`, `datosMunicipioActual`, `planLocalSalud`, `window.COMPAS`, `window.COMPAS.state`,
`accionesAgenda`, `referenciasEAS`, `window.analisisActual`, `window.analisisActualV3`,
`ANALYTIC_CONFIG`, `COMPAS_PESOS_SFA`, `TAXONOMIA_TEMAS`, `MAPEO_EPVSA`, `REGLAS_EXPERTAS`

---

## 16. Qué partes ya están completamente modularizadas

| Componente | Módulo modular | Estado |
|---|---|---|
| Ámbito territorial activo | `core/contextoTerritorial.js` | ✅ Modularizado (con bridge DOM) |
| Estado global de sesión | `core/estadoGlobal.js` | ✅ Modularizado |
| Bootstrapping | `core/main.js` | ✅ Modularizado |
| Entidad territorio | `dominio/ambitoTerritorial.js` | ✅ Entidad de dominio completa |
| Entidad plan | `dominio/planTerritorial.js` | ✅ Entidad de dominio + RegistroPlanes |
| Entidad plan de acción | `dominio/planAccion.js` | ✅ Entidad de dominio |
| Entidad agenda anual | `dominio/agendaAnual.js` | ✅ Entidad de dominio |
| Entidad acción | `dominio/accion.js` | ✅ Entidad de dominio completa |
| Cuadro de mandos integral | `dominio/cuadroMandos.js` | ✅ Catálogo 50 indicadores + semáforo + componenteCI |
| Rutas Firebase | `persistencia/firebase/firebaseClient.js` | ✅ FIREBASE_PATHS centralizadas |
| CRUD planes | `persistencia/firebase/repositorioPlanes.js` | ✅ Funciones modulares (heredadas intactas) |
| CRUD agendas | `persistencia/firebase/repositorioAgendas.js` | ✅ Funciones modulares (heredadas intactas) |
| CRUD indicadores | `persistencia/firebase/repositorioIndicadores.js` | ✅ Funciones modulares (heredadas intactas) |
| Contrato IA | `ia/motorBase.js` | ✅ Factory + SalidaMotor + estados revisión |
| ContextoIA | `ia/contextoIA.js` | ✅ Constructor + bridges heredados |
| Validación IA | `ia/validacionIA.js` | ✅ Validadores por nivel de exigencia |
| Trazabilidad IA | `ia/trazabilidadIA.js` | ✅ Historial de sesión + actualizarRevision() |
| Modelo SFA unificado | `ia/modeloSFA.js` | ✅ 8 dimensiones + mapeo heredados |
| Motor síntesis perfil | `ia/motores/motorSintesisPerfil.js` | ✅ Encapsulado (motor heredado intacto) |
| Motor plan de acción | `ia/motores/motorPlanAccion.js` | ✅ Encapsulado (motor heredado intacto) |
| Motor priorización | `ia/motores/motorPriorizacion.js` | ✅ Scoring modular propio |
| Motor evaluación | `ia/motores/motorEvaluacion.js` | ✅ CMI + cualitativa + SFA |

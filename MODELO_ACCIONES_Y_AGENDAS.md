# MODELO DE ACCIONES Y AGENDAS — COMPÁS
> Iteración 4 — Nivel estratégico y operativo del plan.
> Fecha: 2026-03-12. El monolito HTML no ha sido modificado.

---

## 1. Separación de niveles

```
NIVEL ESTRATÉGICO                     NIVEL OPERATIVO
──────────────────────               ─────────────────────────────────────
PlanTerritorial                       AgendaAnual (una por año de cobertura)
  └── PlanAccion                        └── [refs a Accion por id]
        ├── objetivos (seleccionEPVSA)
        └── acciones (catálogo tipo)   Accion
                                         ├── planTerritorialId
                                         ├── agendaAnualId
                                         ├── origenAccion
                                         └── campos operativos
```

**La separación es unidireccional:**
- Las Accion y las AgendaAnual apuntan al PlanTerritorial
- El PlanAccion NO contiene referencias a Accion ni a AgendaAnual
- Las agendas NO forman parte del compilado del plan

---

## 2. Cómo se modela PlanAccion

**Archivo:** `dominio/planAccion.js`

### Propósito
El PlanAccion es el nivel estratégico: la declaración formal de qué objetivos y programas EPVSA se activan para el territorio. Es el equivalente modular de la selección EPVSA que el técnico hace en Fase 3.

### Estados

```js
ESTADOS_PLAN_ACCION = {
    BORRADOR:  'borrador',   // en elaboración, no guardado
    GENERADO:  'generado',   // generado en sesión (por IA o manual), no confirmado
    GUARDADO:  'guardado',   // guardado formalmente en Firebase
    EDITADO:   'editado',    // modificado respecto a la última versión guardada
}
```

### Estructura

```js
{
    id:               '{planTerritorialId}__planaccion_{version}',  // generado
    planTerritorialId: string,
    version:          'auto' | 'editado',
    fechaGuardado:    string | null,      // ISO datetime de Firebase
    estado:           ESTADOS_PLAN_ACCION,

    // NIVEL ESTRATÉGICO — lo que se declara en el plan
    objetivos: [                          // = seleccionEPVSA del monolito
        { id: 'LE1', objetivos: [...], programas: [...] },
        ...
    ],
    acciones: [                           // actuaciones-tipo activadas del catálogo
        { lineaId, lineaCodigo, programaCodigo, codigo, nombre },
        ...
    ],

    // ⚠️ NOTA: 'acciones' aquí son actuaciones del catálogo EPVSA (nivel estratégico)
    //          NO son instancias de dominio/accion.js (nivel operativo)

    tieneContenido:   boolean,
    totalLineas:      number,
    totalAcciones:    number,
    nivelEstrategico: true,               // marca explícita de nivel
}
```

### Bridges disponibles

| Función | Desde |
|---|---|
| `planAccionDesdeFirebase(planTerritorialId, planFB)` | `window.COMPAS.state.planAccionFirebase` |
| `planAccionDesdeMemoria(planTerritorialId, planEnMem)` | `window.COMPAS.state.planAccion` |

---

## 3. Cómo se modela AgendaAnual

**Archivo:** `dominio/agendaAnual.js`

### Propósito
La AgendaAnual es el nivel operativo: la programación concreta de acciones para un año específico. Un plan de cobertura 2026-2030 tiene 5 AgendaAnual posibles.

### Regla de dominio formalizada
```
Si planTerritorial.aniosCobertura = [2026, 2027, 2028, 2029, 2030]
→ Existen potencialmente 5 AgendaAnual: una por año
→ Cada agenda puede tener 0..N acciones
→ Las acciones de agenda NO forman parte del documento de plan
```

### Estados

```js
ESTADOS_AGENDA = {
    PENDIENTE:  'pendiente',   // año futuro o sin acciones
    ACTIVA:     'activa',      // año en curso
    CERRADA:    'cerrada',     // año concluido, auditado
    ARCHIVADA:  'archivada',   // plan histórico cerrado
}
```

### Estructura

```js
{
    id:                '{planTerritorialId}__agenda_{anio}',
    planTerritorialId: string,
    ambitoId:          string | null,
    estrategia:        string,
    anio:              number,            // 2026, 2027...
    estado:            ESTADOS_AGENDA,

    // Referencias a acciones (por id, no los objetos completos)
    accionesProgramadas: [id1, id2, id3, ...],
}
```

### Separación de responsabilidades

La agenda contiene **referencias a IDs de acciones**, no las acciones completas. Esto evita duplicar datos y permite que las acciones tengan su propio ciclo de vida independiente de la agenda.

### Bridges disponibles

| Función | Propósito |
|---|---|
| `agendaDesdeAccionesHeredadas(accionesAgenda, anio, planTerritorialId)` | Filtra el array plano del monolito por año |
| `agendasDesdePlan(accionesAgenda, aniosCobertura, planTerritorialId)` | Crea todas las AgendaAnual del plan de una vez |

---

## 4. Cómo se modelan las Acciones

**Archivo:** `dominio/accion.js`

### Propósito
La Accion es la unidad atómica de implementación. Pertenece al nivel operativo. Se programa en una AgendaAnual y ejecuta en un contexto territorial concreto.

### Estructura dividida en grupos semánticos

```js
{
    // Identificación
    id:                number,
    titulo:            string,
    descripcion:       string,
    origenAccion:      ORIGENES_ACCION,
    planTerritorialId: string | null,
    agendaAnualId:     string | null,
    prioridadId:       string | null,

    // Trazabilidad EPVSA (puente al nivel estratégico)
    codigoEPVSA:       string,          // 'P03-A01'
    lineaEpvsa:        string,          // '1', '2'...
    objetivoEPVSA:     string,
    programa:          string,

    // Planificación operativa
    entorno:           string,          // sanitario|comunitario|educativo|laboral
    anio:              string,          // '2026'
    trimestre:         string,          // T1|T2|T3|T4
    estado:            ESTADOS_ACCION,  // planificada|en ejecucion|finalizada|suspendida
    prioridad:         string,          // alta|media|baja
    fechaPrevista:     string,
    fechaReal:         string,
    observaciones:     string,

    // Responsabilidad
    responsable, organizacion, profesionales,
    entidadResponsable, personaReferente, contacto,
    poblacion, etapaVida,

    // Medición
    indicadorPrincipal, indicadoresSecundarios[], meta, frecuencia, evidencia, recursos,

    // Predicados de conveniencia
    esPlanificada:              boolean,
    estaEnEjecucion:            boolean,
    estaFinalizada:             boolean,
    tieneCodigoEPVSA:           boolean,
    fueGeneradaAutomaticamente: boolean,
    fueSeleccionadaDeCatalogo:  boolean,
    fueCreadadManualmente:      boolean,
}
```

### Bridges disponibles

| Función | Propósito |
|---|---|
| `accionDesdeHeredado(act, planTerritorialId, agendaAnualId)` | Un objeto del array `accionesAgenda` |
| `accionesDesdeHeredadas(accionesAgenda, planTerritorialId, agendaAnualId)` | Todo el array |
| `accionAHeredado(accion)` | Formato plano para escritura en `accionesAgenda` |

---

## 5. Cómo se representa el origen de una acción

### Constante `ORIGENES_ACCION`

```js
ORIGENES_ACCION = {
    GENERADOR_AUTOMATICO: 'generador_automatico',
    SELECTOR_EPVSA:       'selector_epvsa',
    MANUAL_AGENDA:        'manual_agenda',
}
```

### Correspondencia con el monolito

| Origen | Función heredada que crea la acción | Heurística de detección |
|---|---|---|
| `generador_automatico` | `sincronizarPlanConAgenda()` (l.28917) | `descripcion` contiene "incorporada desde el Plan local" |
| `selector_epvsa` | `trasladarActuacionAAgenda()` (l.12445) + `guardarAccion()` | `codigoEPVSA` presente, sin la marca del generador |
| `manual_agenda` | `guardarAccion()` (l.12886) desde cero | Sin codigoEPVSA o vacío |

### Inferencia para datos heredados

Los datos existentes en Firebase no tienen el campo `origenAccion`. Al crear una entidad Accion desde datos heredados, `accionDesdeHeredado()` **infiere** el origen probable usando las heurísticas anteriores. Esta inferencia es **provisional** — los datos nuevos creados con el modelo de dominio tendrán el origen explícito.

---

## 6. Cómo se conectan plan y agenda sin fusionarse

```
PlanTerritorial (padul__plan_1)
    │
    ├── PlanAccion (padul__plan_1__planaccion_auto)    ← NIVEL ESTRATÉGICO
    │     ├── objetivos: [LE1, LE2, LE3]               (selección EPVSA)
    │     └── acciones:  [P03-A01, P03-A02, ...]       (catálogo activado)
    │
    └── AgendaAnual (padul__plan_1__agenda_2026)       ← NIVEL OPERATIVO
          ├── accionesProgramadas: [101, 102, 103]      (refs por id)
          └── AgendaAnual (padul__plan_1__agenda_2027)  (vacía hasta 2027)
                └── ...

Accion(101) → planTerritorialId: 'padul__plan_1'
              agendaAnualId: 'padul__plan_1__agenda_2026'
              origenAccion: 'generador_automatico'
              codigoEPVSA: 'P03-A01'   ← trazabilidad al nivel estratégico
```

**La conexión es referencial, no estructural:**
- El PlanAccion NO contiene AgendaAnual ni Accion
- Las AgendaAnual referencian al PlanTerritorial (no al PlanAccion)
- Las Accion tienen `planTerritorialId` y `agendaAnualId`
- La trazabilidad estratégica-operativa se mantiene mediante `codigoEPVSA`

---

## 7. Qué sigue heredado en el monolito

| Componente | Estado | Por qué no se mueve |
|---|---|---|
| `let accionesAgenda = []` | **Heredado, intacto** | Array global del que dependen render, Firebase, seguimiento |
| `function normalizarActuacion()` | **Heredado, intacto** | Normaliza campos en datos viejos de Firebase |
| `function guardarAccion()` | **Heredado, intacto** | Escritura en DOM + Firebase; muchas dependencias |
| `function initAgendas()` | **Heredado, intacto** | Carga Firebase → accionesAgenda |
| `function guardarAgendasFirebase()` | **Heredado, intacto** | Persistencia Firebase de la agenda |
| `function sincronizarPlanConAgenda()` | **Heredado, intacto** | Importa plan → agenda (función crítica) |
| `function trasladarActuacionAAgenda()` | **Heredado, intacto** | Pre-rellena modal desde catálogo tipo |
| `function renderAgendas()` | **Heredado, intacto** | Render kanban / timeline |
| `function guardarPlanEnFirebase()` | **Heredado, intacto** | Persistencia del plan |
| `function cargarPlanGuardado()` | **Heredado, intacto** | Restauración del plan |
| `planLocalSalud.planAccion` | **Heredado, intacto** | Estado del compilador |
| `window.COMPAS.state.planAccion` | **Heredado, intacto** | Estado operativo del plan |
| El año `'2026'` hardcodeado en `sincronizarPlanConAgenda` (l.29000) | **Heredado, no resuelto** | En el monolito; no tocar aún |

---

## 8. Limitaciones que siguen pendientes para separar del todo plan y agenda

### L1 — accionesAgenda no tiene campo `origenAccion`
Los objetos guardados en Firebase no tienen el campo `origenAccion`. El modelo de dominio lo infiere por heurística. La solución definitiva requiere migrar los datos existentes en Firebase (no implementado).

### L2 — AgendaAnual no se persiste como entidad en Firebase
No existe una ruta `agendas/{anio}` en Firebase. Todo está en el nodo plano `agendas` sin separación por año. La AgendaAnual modular es una vista virtual del array plano. La persistencia multi-año requiere una nueva estructura de Firebase.

### L3 — La separación plan/agenda no existe en el compilador (Fase 4)
`previsualizarPLS()` mezcla el contenido del plan y la agenda en el mismo documento. La regla "las agendas no forman parte del compilado principal" no se aplica aún en el compilador heredado.

### L4 — PlanAccion y planLocalSalud.planAccion tienen el mismo nombre (colisión semántica)
`planLocalSalud.planAccion` en el monolito es el objeto `{completado, html, seleccion, fecha}` del compilador, no el `PlanAccion` del dominio modular. Son cosas distintas con el mismo nombre. Resolver requiere renombrar uno de los dos, lo que afecta el monolito.

### L5 — Las actuaciones del plan confunden "actuaciones-tipo" con "acciones de agenda"
En el monolito, `planAccion.actuaciones` son las actuaciones del catálogo EPVSA normalizadas. En `accionesAgenda` están las acciones operativas. Los nombres similares generan confusión. El modelo modular los distingue explícitamente: `PlanAccion.acciones` (tipo estratégico) vs `Accion` de dominio (operativo).

### L6 — `anio: '2026'` hardcodeado en sincronizarPlanConAgenda (l.29000)
Al crear acciones desde el plan, el año se fija a '2026'. El modelo modular usa constantes nombradas (`ANIO_INICIO_IMPLANTACION`) pero el monolito sigue con el valor literal. No se puede resolver sin tocar `sincronizarPlanConAgenda`.

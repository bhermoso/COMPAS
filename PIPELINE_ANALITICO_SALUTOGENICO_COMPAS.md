# Pipeline Analítico Salutogénico — COMPÁS

Fecha: 2026-03-14
Versión: propuesta v1

---

## 1. Pipeline actual

### Flujo de datos

```
datos de entrada
  ├─ Informe local (texto libre)
  ├─ EAS / determinantes (tabla indicadores)
  ├─ Participación ciudadana (temas frecuentes, ranking)
  └─ CMI / indicadores epidemiológicos

    ↓

analizarDatosMunicipio() [index.html:24553]
  + ejecutarMotorExpertoCOMPAS() [index.html:24424]   ← si está disponible
  ↕ (o vía módulo ES6)
motorSintesisPerfil.js [línea 497]

    ↓

window.analisisActual {
  municipio, fortalezas[], oportunidades[],
  conclusiones[], recomendaciones[],
  priorizacion[], propuestaEPVSA[],
  alertasInequidad[], narrativa{}, perfilSOC
}

    ↓

motorPriorizacion.js [línea 683]
  Scoring multicriterio:
    epidemiológico × peso_epi
    + CMI × peso_cmi
    + cualitativo × peso_cualitativo
    + participación × peso_participacion

    ↓

motorPlanAccion.js [línea 257]
  Consume: analisisPrevio (analisisActual)
  Produce: lineasPropuestas[], propuestaEPVSA[]
```

### Problemas del pipeline actual

| Problema | Descripción |
|----------|-------------|
| **Objeto intermedio implícito** | `window.analisisActual` actúa de bus entre motores, pero no tiene estructura formal garantizada |
| **Enfoque deficitario** | `priorizacion[]` ordena por `nAMejorar` (cuántos indicadores están mal), no por activos |
| **Sin colectivos** | No existe campo explícito para colectivos prioritarios ni entornos de intervención |
| **Sin trazabilidad de derivación** | No se sabe qué campo del analisis viene de qué fuente |
| **Inconsistencia SFA** | ANALYTIC_CONFIG usa 10 dimensiones, COMPAS_PESOS_SFA usa 6 — produce scores incompatibles entre v2 y v3 |
| **motorPlanAccion sin salutogenia** | Genera propuestaEPVSA desde líneas 1-5 sin considerar activos ni capacidades comunitarias |

---

## 2. Pipeline propuesto

### Principio rector

> El análisis parte de lo que existe y funciona (activos, capacidades, oportunidades), no de lo que falta.
> La priorización pondera recursos y viabilidad comunitaria, no solo carga de enfermedad.
> El plan de acción es accionable desde el primer momento porque se basa en capacidades reales.

### Flujo propuesto

```
datos de entrada
  ├─ Informe local (texto libre)
  ├─ EAS / determinantes (indicadores)
  ├─ Participación ciudadana (temas, ranking, frecuencias)
  ├─ CMI / indicadores epidemiológicos
  ├─ IBSE (bienestar socioemocional)
  └─ Escalas diagnósticas (SF-12, Duke-UNC, CAGE, PREDIMED)

    ↓

motorSintesisPerfil [MODIFICAR]
  Síntesis con lente salutogénica:
  - Detectar activos en datos cualitativos y cuantitativos
  - Identificar capacidades comunitarias (participación, redes)
  - Distinguir señales de riesgo vs oportunidades de mejora
  - Detectar colectivos y entornos prioritarios

    ↓  produce  ↓

analisisAccionable  ← OBJETO NUEVO (ver sección 3)
  {
    activosDetectados,
    oportunidadesAccion,
    capacidadesComunitarias,
    senalesRelevantes,
    colectivosPrioritarios,
    entornosPrioritarios,
    trazabilidad
  }

    ↓

motorPriorizacion [MODIFICAR]
  Consume analisisAccionable:
  - Candidatos de priorización: oportunidadesAccion
  - Scoring salutogénico: activos disponibles para abordar cada área
  - Equity weighting: colectivosPrioritarios
  - Feasibility factor: capacidadesComunitarias
  - Señales epidemiológicas: senalesRelevantes

    ↓  produce  ↓

prioridadesValidadas {
  areas[], scores{}, colectivosAsociados[], activosAplicables[]
}

    ↓

motorPlanAccion [MODIFICAR]
  Consume analisisAccionable + prioridadesValidadas:
  - Acciones ancladas en activos (no solo en déficits)
  - Intervenciones adaptadas a entornos prioritarios
  - Involucra capacidades comunitarias reales
  - Propuesta coherente con marco EPVSA
```

---

## 3. Definición de `analisisAccionable`

### Propósito

Objeto intermedio estructurado que hace explícita la lectura salutogénica del perfil de salud.
Es el único contrato de datos entre `motorSintesisPerfil` y los motores posteriores.

### Estructura completa

```javascript
window.analisisAccionable = {

  // ── Identificación ────────────────────────────────────────────────────
  municipio:        String,             // nombre del municipio
  fechaGeneracion:  String,             // ISO 8601
  trazabilidadId:   String,             // 'aa_' + timestamp
  motorOrigen:      String,             // 'motor_sintesis_perfil_v3' | 'analizarDatosMunicipio_v2'

  // ── Activos detectados ────────────────────────────────────────────────
  // Qué funciona bien: indicadores favorables, fortalezas comunitarias, recursos existentes
  activosDetectados: [
    {
      id:           String,             // ej. 'activo_vacunacion_alta'
      area:         String,             // área temática (ej. 'conductas_saludables')
      texto:        String,             // descripción del activo
      fuente_tipo:  String,             // 'indicador_favorable' | 'participacion' | 'informe' | 'estudio'
      especifica:   String | null,      // dato concreto si procede (ej. '87% cobertura vacunal')
    }
  ],

  // ── Oportunidades de acción ───────────────────────────────────────────
  // Áreas donde hay margen de mejora + capacidad para actuar
  oportunidadesAccion: [
    {
      id:                 String,       // ej. 'op_actividad_fisica_mayor'
      area:               String,       // área temática
      texto:              String,       // descripción de la oportunidad
      prioridad_estimada: Number,       // 0–1 (estimación inicial, sin scoring multicriterio)
      fundamento:         String,       // qué dato justifica esta oportunidad
      activosAplicables:  String[],     // IDs de activosDetectados que pueden aprovecharse
    }
  ],

  // ── Capacidades comunitarias ──────────────────────────────────────────
  // Recursos sociales, relacionales e institucionales disponibles
  capacidadesComunitarias: [
    {
      tipo:        String,              // 'participacion' | 'red_social' | 'recurso_institucional' | 'tejido_asociativo'
      descripcion: String,              // descripción concreta
      fuente:      String,              // 'participacion_popular' | 'informe' | 'estudio'
      referencia:  String | null,       // si hay dato cuantitativo (ej. 'n=45 participantes')
    }
  ],

  // ── Señales relevantes ────────────────────────────────────────────────
  // Indicadores de alerta, desigualdad o deterioro que requieren atención
  senalesRelevantes: [
    {
      tipo:              String,        // 'inequidad' | 'deterioro' | 'riesgo_emergente' | 'brecha'
      area:              String,
      texto:             String,
      magnitud:          String | null, // dato cuantitativo si disponible
      colectivo_afectado: String | null, // si la señal afecta a colectivo específico
      fuente_tipo:       String,        // 'indicador_amejorar' | 'alertaInequidad' | 'participacion'
    }
  ],

  // ── Colectivos prioritarios ───────────────────────────────────────────
  // Grupos con mayor necesidad o menor acceso
  colectivosPrioritarios: [
    {
      id:          String,              // ej. 'mayores_65_solos'
      nombre:      String,              // etiqueta
      descripcion: String,              // por qué es prioritario
      fundamento:  String,              // origen del dato (alerta inequidad, participación, etc.)
      senalesIds:  String[],            // IDs de senalesRelevantes asociadas
    }
  ],

  // ── Entornos prioritarios ─────────────────────────────────────────────
  // Espacios o contextos donde concentrar la intervención
  entornosPrioritarios: [
    {
      id:          String,              // ej. 'entorno_escolar' | 'entorno_laboral'
      nombre:      String,
      descripcion: String,
      fundamento:  String,              // dimensión SFA | determinante | participación
      areas:       String[],            // áreas temáticas que aplican en este entorno
    }
  ],

  // ── Trazabilidad ──────────────────────────────────────────────────────
  // Origen de cada campo para auditoría y revisión humana
  trazabilidad: {
    fuentesUsadas:        String[],     // 'informe' | 'eas_determinantes' | 'cmi' | 'participacion' | 'ibse' | 'escalas'
    gradoConfianza:       Number,       // 0–1
    estadoRevisionHumana: String,       // 'pendiente' | 'revisado' | 'aprobado'
    camposDerivados: {
      activosDetectados:        String, // 'fortalezas[] motorSintesisPerfil'
      oportunidadesAccion:      String, // 'oportunidades[] + recomendaciones[]'
      capacidadesComunitarias:  String, // 'participacion + narrativa.activos'
      senalesRelevantes:        String, // 'alertasInequidad[] + indicadoresAMejorar'
      colectivosPrioritarios:   String, // 'alertasInequidad[].colectivo'
      entornosPrioritarios:     String, // 'SFA dimensiones + determinantes'
    }
  }
};
```

---

## 4. Cambios necesarios por motor

### 4.1 motorSintesisPerfil — PRIMER CAMBIO

**Rol actual:** Produce `window.analisisActual` con `fortalezas[]`, `oportunidades[]`, `conclusiones[]`, etc.

**Cambio requerido:** Añadir función `_construirAnalisisAccionable(analisis, contextoIA)` que mapee la salida existente al nuevo objeto.

**Mapeo de campos:**

| Campo de `analisisAccionable` | Fuente actual en `analisisActual` |
|-------------------------------|----------------------------------|
| `activosDetectados` | `fortalezas[]` + `indicadoresFavorables[]` |
| `oportunidadesAccion` | `oportunidades[]` + `recomendaciones[]` con `prioridad_estimada` desde `priorizacion[].score` |
| `capacidadesComunitarias` | `participacion.temasFreq` + `narrativa.activos` + `participacion.nParticipantes` |
| `senalesRelevantes` | `alertasInequidad[]` + `indicadoresAMejorar[]` + señales de `conclusiones[]` |
| `colectivosPrioritarios` | `alertasInequidad[].colectivo` (cuando existe) + análisis de participación por subgrupos |
| `entornosPrioritarios` | Dimensiones SFA con score bajo + `determinantes[]` de área contextual |

**Estrategia:** No romper la salida existente. `window.analisisActual` sigue siendo el mismo.
`window.analisisAccionable` se genera como derivación adicional al final de `motorSintesisPerfil`.

**Esfuerzo estimado:** Medio. La lógica de derivación es nueva pero los datos ya existen.

---

### 4.2 motorPriorizacion — SEGUNDO CAMBIO

**Rol actual:** Scoring multicriterio con 4 pesos (epidemiológico, CMI, cualitativo, participación).

**Cambio requerido:** Añadir criterio 5 — **potencial salutogénico**:

```
scoreTotal = (epidemiologico × peso_epi) +
             (cmi × peso_cmi) +
             (cualitativo × peso_cualitativo) +
             (participacion × peso_participacion) +
             (salutogenico × peso_salutogenico)    ← NUEVO
```

**Criterio salutogénico:** para cada área candidata:
- ¿Hay `activosDetectados` disponibles en esa área? → factor positivo
- ¿Hay `capacidadesComunitarias` aplicables? → factor positivo
- ¿Hay `colectivosPrioritarios` afectados? → weight de equidad
- ¿Hay `entornosPrioritarios` que encajen? → viabilidad de intervención

**Candidatos de priorización:** cambiar fuente de `oportunidades[]` a `analisisAccionable.oportunidadesAccion`, que ya incluye `activosAplicables[]` y `prioridad_estimada`.

**Salida nueva a añadir:**
```javascript
{
  ...salidaActual,
  colectivosAsociados:  [],   // por área priorizada
  activosAplicables:    [],   // activos que sostienen la intervención
  capacidadesRelevantes: [],  // capacidades comunitarias aprovechables
}
```

**Esfuerzo estimado:** Medio-alto. Requiere rediseño del scoring sin romper los 4 criterios actuales.

---

### 4.3 motorPlanAccion — TERCER CAMBIO

**Rol actual:** Genera `propuestaEPVSA[]` con líneas 1-5. Consume `analisisPrevio` (analisisActual).

**Cambio requerido:** Consumir `analisisAccionable` además de `analisisPrevio`. Para cada línea de acción propuesta:

- Anclar acciones en `activosDetectados` (qué existe para apoyar esta acción)
- Adaptar intervención al `entornoPrioritario` correspondiente
- Señalar `colectivosPrioritario` al que se dirige
- Indicar `capacidadesComunitarias` que hacen viable la acción

**Salida nueva a añadir:**
```javascript
accionesSugeridas[i] = {
  ...accionActual,
  activoQueApoya:       String,   // ID de activosDetectados
  entornoIntervención:  String,   // ID de entornosPrioritarios
  colectivoDirigido:    String,   // ID de colectivosPrioritarios
  capacidadNecesaria:   String,   // ID de capacidadesComunitarias
  justificacionSalutogenica: String  // por qué esta acción parte de fortalezas
}
```

**Esfuerzo estimado:** Medio. El generator local ya produce propuestas; se trata de enriquecerlas con referencias a `analisisAccionable`.

---

## 5. Orden recomendado de implementación

### Fase 1 — Definir e instanciar `analisisAccionable` (prerequisito)

**Objetivo:** Crear el objeto sin modificar ningún motor todavía.

1. Crear función `construirAnalisisAccionable(analisisActual, contextoIA)` en `index.html` o en nuevo módulo.
2. Mapear campos desde la salida existente de `motorSintesisPerfil` (ver tabla de mapeo sección 4.1).
3. Asignar a `window.analisisAccionable` al final de `generarAnalisisIA()`, después de que `window.analisisActual` ya esté disponible.
4. Verificar: consolar `window.analisisAccionable` en navegador para validar estructura.

**Criterio de éxito:** `window.analisisAccionable` existe con los 7 campos, todos derivados de datos reales del municipio seleccionado.

---

### Fase 2 — Adaptar motorSintesisPerfil para producirlo de forma nativa

**Objetivo:** Que el motor produzca `analisisAccionable` directamente, no como derivación post-hoc.

1. En `_calcularAnalisisModular()` (motorSintesisPerfil.js:76): añadir llamada a `_construirAnalisisAccionable()`.
2. Incluir `analisisAccionable` en `SalidaMotor.datos`.
3. En `adaptarSalidaMotorAAnalisisActual()` (línea 557): propagar `analisisAccionable` a `window.analisisAccionable`.

**Criterio de éxito:** El motor modular produce `analisisAccionable` como parte de su salida formal.

---

### Fase 3 — motorPriorizacion consume analisisAccionable

**Objetivo:** El scoring incorpora la dimensión salutogénica.

1. En `ejecutarFn(contextoIA)`: leer `contextoIA.analisisAccionable || window.analisisAccionable`.
2. Implementar `_calcularScoreSalutogenico(area, analisisAccionable)`.
3. Añadir criterio 5 con peso configurable (default: 0.10 en todas las modalidades).
4. Incluir `colectivosAsociados` y `activosAplicables` en salida por área.

**Criterio de éxito:** La priorización devuelve áreas con activos y colectivos asociados, no solo scores numéricos.

---

### Fase 4 — motorPlanAccion consume analisisAccionable

**Objetivo:** Las acciones propuestas están ancladas en activos y capacidades reales.

1. En `ejecutarFn(contextoIA)`: leer `analisisAccionable`.
2. Para cada línea de propuestaEPVSA: buscar activo, entorno y colectivo asociado.
3. Añadir `justificacionSalutogenica` a cada acción.

**Criterio de éxito:** Cada acción propuesta cita al menos un activo comunitario que la sostiene.

---

### Fase 5 — UI: mostrar analisisAccionable en TAB 2 y panel IA (pospuesta)

No incluida en el alcance actual. Se aborda en etapa posterior.

---

## 6. Inconsistencia bloqueante a resolver antes de Fase 3

**Problema SFA:** ANALYTIC_CONFIG define 10 dimensiones SFA, COMPAS_PESOS_SFA define 6.
El `motorPriorizacion` v3 y el expert system v2 producen scores SFA incompatibles.

**Impacto en pipeline salutogénico:** `entornosPrioritarios` se deriva de dimensiones SFA.
Si los scores son inconsistentes, los entornos derivados también lo serán.

**Resolución necesaria antes de Fase 3:**
- Decidir cuántas dimensiones SFA son canónicas (6 o 10)
- Unificar ANALYTIC_CONFIG y COMPAS_PESOS_SFA
- Asegurar que `motorSintesisPerfil` y `motorPriorizacion` usan la misma base

---

## 7. Resumen ejecutivo

### Pipeline propuesto

```
datos (EAS + participación + CMI + estudios)
  → motorSintesisPerfil (lente salutogénica)
  → analisisAccionable (objeto intermedio estructurado)
  → motorPriorizacion (scoring + dimensión salutogénica)
  → prioridadesValidadas
  → motorPlanAccion (acciones ancladas en activos)
  → plan de acción accionable
```

### Estructura de analisisAccionable

7 campos: `activosDetectados · oportunidadesAccion · capacidadesComunitarias · senalesRelevantes · colectivosPrioritarios · entornosPrioritarios · trazabilidad`

### Qué motor debe cambiar primero

**motorSintesisPerfil** — es la fuente. Sin que produzca `analisisAccionable`, los demás no tienen qué consumir.
Pero en Fase 1 se crea `analisisAccionable` como derivación de la salida existente, sin modificar el motor todavía.

### Orden de implementación

| Fase | Qué | Dependencia |
|------|-----|-------------|
| 1 | Crear `construirAnalisisAccionable()` como función derivada | Sin dependencias — arranca aquí |
| 2 | motorSintesisPerfil produce `analisisAccionable` nativamente | Fase 1 completa |
| 3 | motorPriorizacion consume `analisisAccionable` | Fase 2 + resolver inconsistencia SFA |
| 4 | motorPlanAccion consume `analisisAccionable` | Fase 3 completa |
| 5 | UI muestra activos, colectivos, entornos | Fase 4 completa |

---

*Documento generado tras auditoría técnica de index.html, motorSintesisPerfil.js, motorPriorizacion.js, motorPlanAccion.js*
*Revisión humana obligatoria antes de implementación de Fase 2 en adelante*

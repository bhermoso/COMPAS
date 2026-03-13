# MODELO DE PRIORIZACIÓN Y EVALUACIÓN — COMPÁS
> Iteración 9 — Motores modular de priorización y evaluación.
> Fecha: 2026-03-12. El monolito COMPAS.html no ha sido modificado.

---

## 1. Cómo se modela ahora la priorización

**Archivo:** `ia/motores/motorPriorizacion.js`

### Principio de diseño

La priorización en COMPÁS es una **decisión técnica humana apoyada por evidencia**.
El motor propone un ordenamiento con justificación explícita por criterios; el técnico
decide el orden definitivo. Ningún resultado se aplica sin revisión (`estadoRevisionHumana: 'pendiente'`).

### Tipos soportados (únicos válidos según regla de dominio)

| Tipo | Descripción | Peso predominante |
|---|---|---|
| `manual` | El técnico establece el orden. El motor provee estructura y evidencia. | N/A (sin scoring) |
| `estrategica` | Enfoque basado en datos epidemiológicos y CMI | Epidemiológico 45% + CMI 30% |
| `tematica` | Enfoque comunitario: emerge de la participación ciudadana | Participación 50% + Cualitativo 30% |
| `mixta` | Síntesis metodológica equilibrada | Epidemiológico 28% + CMI 22% + Cualitativo 25% + Participación 25% |

### Cómo se pasa el tipo al motor

El tipo se inyecta en el contextoIA vía el campo `_tipoPriorizacion`:
```js
// El llamador (código heredado o código modular) crea el contexto con el tipo:
const ctx = crearContextoIA({ ambitoId: 'padul', ..., _tipoPriorizacion: 'mixta' });
await motorPriorizacion.ejecutar(ctx);
```
Si no se especifica, el motor usa `'mixta'` como tipo por defecto.

### Estructura de salida (SalidaMotor.datos)

```js
{
    prioridadesPropuestas: [     // Áreas ordenadas por score (mayor = más prioritario)
        {
            id:              string,   // código del área
            label:           string,   // nombre visible
            rangoSugerido:   number,   // 1 = más prioritario
            origen:          'analisis_previo' | 'categorias_cmi',
            tipoPriorizacion: string,
            scoreTotal:      number,   // [0-1] agregado ponderado
            scores: {
                epidemiologico: number,
                cmi:            number,
                cualitativo:    number,
                participacion:  number,
            },
            pesos: { epidemiologico, cmi, cualitativo, participacion },
        }
    ],
    nAreas,
    tipoPriorizacion:      string,
    criteriosAplicados:    [],   // con peso, disponibilidad y limitaciones
    inconsistenciaHeredada: {},  // documentación de ANALYTIC_CONFIG vs COMPAS_PESOS_SFA
    justificacion:         string,
    fuentesUsadas:         string[],
    analisisBase:          object | null,
}
```

---

## 2. Cómo funciona el scoring multicriterio

### 4 criterios explícitos

#### Criterio 1 — Epidemiológico
- **Fuente:** `contextoIA.determinantes` (mapa código→valor) + analisisPrevio si existe
- **Cálculo:** Si analisisPrevio.priorizacion[] tiene pesos epidemiológicos del motor v2, se usan.
  Si el área es una categoría CMI, se usa el ratio `aMejorar/conDatos` de esa categoría.
- **Limitación conocida:** El mapping determinante→área de salud requiere `TAXONOMIA_TEMAS` del
  monolito (l.24248). Mientras no se extraiga, el score es una aproximación estructural.

#### Criterio 2 — CMI
- **Fuente:** `contextoIA.cuadroMandos` (CuadroMandosIntegral de dominio/cuadroMandos.js)
- **Cálculo:** `ratio = nIndicadoresAMejorar / nIndicadoresConDatos` por categoría CMI
- **Limitación conocida:** Las 3 categorías CMI (determinantes, eventos no transmisibles,
  prevención) son agrupaciones amplias que no mapean directamente a áreas específicas de salud.

#### Criterio 3 — Evidencia cualitativa
- **Fuente:** `analisisPrevio.oportunidades`, `analisisPrevio.alertasInequidad`,
  `analisisPrevio.conclusiones`, presencia de informe y estudios
- **Cálculo:** Score estructural basado en presencia de elementos (no semántico)
- **Limitación conocida:** Sin NLP no se puede hacer matching texto→área.
  El score refleja la riqueza de evidencia disponible, no su contenido temático.

#### Criterio 4 — Participación ciudadana
- **Fuente:** `contextoIA.participacion.temasFreq` o `rankingObjetivos`
- **Cálculo:** Frecuencia relativa de temas del área en el total de participación.
  Si el área tiene `temasCiudadanos[]` del análisis previo, usa ese mapping directo.
- **Limitación conocida:** Si la participación no tiene temas mapeados a áreas, se usa
  una señal de presencia (0.15 si hay participación pero no mapping).

### Redistribución de pesos cuando faltan datos

Si un criterio no tiene datos disponibles, su peso se redistribuye
proporcionalmente entre los criterios que sí tienen datos:

```
Ejemplo: tipo 'mixta', sin participación ciudadana (peso 0.25)
Pesos base:    epidemiologico=0.28, cmi=0.22, cualitativo=0.25, participacion=0.25
Bonus por crit: 0.25 / 3 criterios disponibles = 0.083 por criterio
Pesos efectivos: epidemiologico=0.363, cmi=0.303, cualitativo=0.333, participacion=0
```

---

## 3. Cómo se modela ahora la evaluación

**Archivo:** `ia/motores/motorEvaluacion.js`

### Principio de diseño

> **"La evaluación general NO debe basarse en indicadores EPVSA antiguos."**

Los indicadores EPVSA miden el proceso del plan (acciones, coberturas de programas).
La evaluación general del estado de salud del municipio usa el **Cuadro de Mandos Integral**:
50 indicadores INFOWEB con tendencias observadas y deseadas.

### Base cuantitativa real: CuadroMandosIntegral

| Elemento | Descripción |
|---|---|
| `componenteCI` | % de indicadores con tendencia favorable / total con tendencias |
| `coberturaCMI` | % de los 50 indicadores que tienen datos registrados |
| `avances[]` | Indicadores con `semaforo === 'favorable'` |
| `dificultades[]` | Indicadores con `semaforo === 'amejorar'` |
| `areasCriticas[]` | Categorías con mayor ratio aMejorar/conDatos |

### Estructura de salida (SalidaMotor.datos)

```js
{
    estadoGlobal:      'favorable' | 'intermedio' | 'desfavorable' | 'parcial' | 'sin_datos',

    baseCuantitativa: {
        fuente:         'Cuadro de Mandos Integral (50 indicadores INFOWEB)',
        disponible:     boolean,
        componenteCI:   number | null,   // % favorables sobre total con tendencias
        coberturaCMI:   number,          // % indicadores con datos
        nConDatos:      number,
        nConTendencias: number,
        resumenPorCategoria: {
            determinantes:           { conDatos, favorables, aMejorar, ratioProblema },
            eventos_no_transmisibles: { ... },
            prevencion:              { ... },
        },
    },

    avances:           IndicadorCMI[],  // solo indicadores INFOWEB favorables
    nAvances:          number,
    dificultades:      IndicadorCMI[],  // solo indicadores INFOWEB desfavorables
    nDificultades:     number,
    areasCriticas:     [],              // categorías con mayor concentración de problemas

    evidenciaCualitativa: {
        disponible:       boolean,
        alertasInequidad: [],
        conclusiones:     [],
        oportunidades:    [],
        recomendaciones:  [],
        perfilSOC:        object | null,
    },

    seguimientoAnual: {
        disponible: false,              // no disponible en versión actual
        mensaje:    string,             // explica por qué y qué falta
    },

    recomendacionesEvaluacion: [        // observaciones para el técnico
        {
            id:          string,
            texto:       string,
            categoria:   'datos' | 'seguimiento' | 'resultado' | 'equidad' | 'proceso',
            prioridad:   'alta' | 'media' | 'baja' | 'informativo',
            fuenteOrigen: string,
        }
    ],

    limitacionesConocidas: [],          // limitaciones metodológicas documentadas
    fuentesUsadas:         string[],
}
```

### Estados globales de evaluación

| Estado | Criterio |
|---|---|
| `favorable` | componenteCI ≥ 60% |
| `intermedio` | componenteCI entre 40% y 59% |
| `desfavorable` | componenteCI < 40% |
| `parcial` | CMI disponible pero sin suficientes tendencias para calcular componenteCI |
| `sin_datos` | Sin CMI ni evidencia cualitativa |

---

## 4. Evidencias cualitativas que puede integrar el motor de evaluación

| Evidencia | Fuente | Condición |
|---|---|---|
| Alertas de inequidad | `analisisPrevio.alertasInequidad[]` | Si analisisPrevio existe |
| Conclusiones del análisis | `analisisPrevio.conclusiones[]` | Si analisisPrevio existe |
| Oportunidades identificadas | `analisisPrevio.oportunidades[]` | Si analisisPrevio existe |
| Recomendaciones del análisis | `analisisPrevio.recomendaciones[]` | Si analisisPrevio existe |
| Perfil SOC (Sentido de Coherencia) | `analisisPrevio.perfilSOC` | Si el motor v2 lo calculó |
| Estudios complementarios | señal estructural de presencia | Si `fuentes.tieneEstudios` |

**Lo que NO integra todavía:**
- Seguimiento anual de acciones (progreso real de la agenda)
- ISS completo ponderado (sigue en `eval_calcularISS()` del monolito)
- Texto libre del informe de situación de salud (requiere NLP)
- Resultados de evaluación de la jornada (Fase 6 Bloque 3)

---

## 5. Qué sigue heredado

### Priorización

| Componente | Línea | Por qué sigue heredado |
|---|---|---|
| `analizarDatosMunicipio()` | l.24486 | Motor v2 completo; produce priorizacion[] con scoring SFA |
| `ejecutarMotorExpertoCOMPAS()` | l.24357 | Enriquece áreas con vector de 10 scores ANALYTIC_CONFIG |
| `COMPAS_analizarV3()` | l.26945 | Motor v3 con COMPAS_PESOS_SFA (6 dimensiones) — IIFE |
| `COMPAS_ejecutarFusion()` | l.~18389 | Fusión epi+ciudadano; depende de módulo de participación |
| `ANALYTIC_CONFIG` | l.24220 | 10 dimensiones SFA — referenciado por expert system |
| `COMPAS_PESOS_SFA` | pendiente auditar | 6 dimensiones SFA — referenciado por motor v3 |
| `TAXONOMIA_TEMAS` | l.24248 | Mapping determinante/tema → área de salud |
| `window.COMPAS.prioridades` | global | Prioridades actualmente aplicadas en el monolito |

### Evaluación

| Componente | Línea | Por qué sigue heredado |
|---|---|---|
| `eval_calcularISS()` | l.28223 | ISS completo con múltiples componentes y pesos adaptativos |
| `eval_actualizarProceso()` | heredado | Semáforos dinámicos Fase 6 Bloque 1 |
| `eval_actualizarResultados()` | heredado | Tabla objetivos→indicadores Fase 6 Bloque 2 |
| `eval_actualizarFase6()` | heredado | Orquestador de la Fase 6 completa |
| Bloque 3 jornada evaluación | heredado | Estático, sin motor IA |

---

## 6. Inconsistencias metodológicas abiertas

### ⚠️ INCONSISTENCIA CRÍTICA: ANALYTIC_CONFIG vs COMPAS_PESOS_SFA

**Naturaleza del problema:**

El sistema de scoring SFA (Salutogenic Framework Analysis) tiene **dos configuraciones
incompatibles** en el monolito:

| Configuración | Ubicación | Dimensiones | Usado por |
|---|---|---|---|
| `ANALYTIC_CONFIG` | l.24220 | **10 dimensiones** | `ejecutarMotorExpertoCOMPAS()` (motor v2 + expert system) |
| `COMPAS_PESOS_SFA` | pendiente de auditar | **6 dimensiones** | `COMPAS_analizarV3()` (motor v3) |

**Consecuencia práctica:**

Cuando un técnico ejecuta el motor v2 y luego el v3 para el mismo municipio, obtiene
dos vectores de scores SFA con distinto número de dimensiones. Los resultados de
priorización pueden ser inconsistentes aunque los datos de entrada sean los mismos.

**Estado:** No resuelto. Requiere:
1. Auditar ambas configuraciones en el código del monolito.
2. Decidir si son versiones distintas de la misma escala o escalas diferentes.
3. Si son la misma: unificar a 10 dimensiones (o a 6).
4. Si son distintas: documentar cuándo usar cada una y para qué fin.

**Impacto en los nuevos motores:**
- `motorPriorizacion` NO usa ninguna de las dos configuraciones.
  Usa su propio scoring de 4 criterios. La inconsistencia no le afecta directamente.
- `motorSintesisPerfil` llama al motor v2 heredado (que usa ANALYTIC_CONFIG).
  Hasta que se resuelva la inconsistencia, los resultados del expert system no son
  comparables con los del motor v3.

**Prerequisito bloqueante para:** migrar `motor_v3_multicriterio`.

---

### ⚠️ INCONSISTENCIA SECUNDARIA: seguimientoAnual no en ContextoIA

El motor de evaluación necesita el progreso real de las acciones del plan (qué
actuaciones se ejecutaron, con qué cobertura) para evaluar el proceso. Este dato
existe en Firebase bajo `agendaAnual/{año}/seguimiento` pero:

1. `crearContextoIA()` no tiene campo `seguimientoAnual`.
2. `repositorioAgendas.js` no tiene función `obtenerSeguimiento()`.
3. El modelo de dominio `AgendaAnual` no tiene campo `seguimiento` formalizado.

**Impacto:** La evaluación del proceso del plan no está disponible en el módulo modular.
El motor de evaluación documenta esta limitación explícitamente en su salida.

---

## 7. Qué queda pendiente antes de considerar migrados estos motores críticos

### Para `motor_priorizacion`

| Pendiente | Descripción | Prerequisito para |
|---|---|---|
| **P1 — Resolver ANALYTIC_CONFIG vs COMPAS_PESOS_SFA** | Sin resolver, el scoring estratégico no puede usar los scores SFA del motor v2 | Integración con motor v2/v3 |
| **P2 — Extraer TAXONOMIA_TEMAS** | Necesaria para el mapping determinante/tema → área de salud | Score epidemiológico más preciso |
| **P3 — Centralizar participación ciudadana** | `window.datosParticipacionCiudadana` necesita módulo propio | Score participación más preciso |
| **P4 — Validar pesos del scoring** | Los pesos actuales (0.45/0.30/0.15/0.10 para tipo estratégica, etc.) son propuesta técnica inicial | Calibración metodológica |
| **P5 — Tests de equivalencia** | Verificar que el scoring modular produce resultados comparables a los motores heredados para los mismos datos | Migración completa |

### Para `motor_evaluacion`

| Pendiente | Descripción | Prerequisito para |
|---|---|---|
| **E1 — Añadir seguimientoAnual a ContextoIA** | Añadir campo + obtenerSeguimiento() en repositorioAgendas + formalizar en AgendaAnual | Evaluación del proceso |
| **E2 — Migrar eval_calcularISS()** | El ISS completo ponderado multi-componente sigue en el monolito | ISS modular |
| **E3 — Conectar componenteCI con eval_calcularISS()** | eval_calcularISS() recalcula el CI desde analisisActual; debería leer de cmi.componenteCI | Simplificar el monolito |
| **E4 — Evaluación de la jornada (Fase 6 Bloque 3)** | Estático en el monolito; no hay motor IA que lo alimente | Jornada evaluación modular |
| **E5 — Tests de integración** | Verificar que la salida del motor modular es consistente con la evaluación del monolito para los mismos datos | Confianza en la migración |

### Orden de migración recomendado para completar estos motores

```
1. Extraer TAXONOMIA_TEMAS del monolito → dominio/priorizacion/TaxonomiaTemas.js
2. Resolver ANALYTIC_CONFIG vs COMPAS_PESOS_SFA
3. Añadir seguimientoAnual a ContextoIA + repositorioAgendas
4. Centralizar participación ciudadana → dominio/participacion/
5. Migrar eval_calcularISS() → ia/motores/motorISS.js
6. Tests de equivalencia para motorPriorizacion y motorEvaluacion
7. Conectar componenteCI a eval_calcularISS() del monolito como transición
```

---

## 8. Bridges de compatibilidad disponibles

| Función | Motor | Descripción |
|---|---|---|
| `salidaDesdePrioridadesHeredadas(ambitoId)` | motorPriorizacion | Lee `window.COMPAS.prioridades` y devuelve SalidaMotor con `estadoRevisionHumana: 'revisado'` |
| `salidaDesdeEvaluacionHeredada(ambitoId)` | motorEvaluacion | Construye evaluación desde `window.analisisActual` + `datosMunicipioActual` sin re-ejecutar |

Ambos bridges producen `estadoRevisionHumana: 'revisado'` porque el monolito ya aplicó esos
resultados. Se usan para integrar resultados heredados en el subsistema modular sin re-ejecutar.

---

## 9. Invariantes de compatibilidad garantizadas

Tras esta iteración, los siguientes invariantes se mantienen:

- `window.analisisActual` no es modificado por ninguno de los dos nuevos motores.
- `window.analisisActualV3` no es modificado.
- `window.COMPAS.prioridades` no es modificado automáticamente (solo tras aprobación humana).
- `eval_calcularISS()`, `eval_actualizarProceso()`, `eval_actualizarFase6()` no han sido tocados.
- La Fase 6 del monolito sigue funcionando con independencia del motor modular.
- El módulo IBSE no ha sido tocado.
- Firebase paths sin modificaciones.

# MODELO SFA UNIFICADO — COMPÁS
> Iteración 10 — Resolución de la inconsistencia de scoring SFA heredada.
> Fecha: 2026-03-12. El monolito COMPAS.html no ha sido modificado.

---

## 1. Problema detectado en el monolito

El monolito `COMPAS.html` contiene **dos configuraciones de scoring SFA incompatibles**
que producen resultados distintos para el mismo municipio con los mismos datos:

| Configuración | Ubicación | Dimensiones | Usado por |
|---|---|---|---|
| `ANALYTIC_CONFIG` | l.24220 | **10 dimensiones** | `ejecutarMotorExpertoCOMPAS()` (motor v2 + expert system) |
| `COMPAS_PESOS_SFA` | pendiente de auditar | **6 dimensiones** | `COMPAS_analizarV3()` (motor v3) |

### Consecuencia práctica

Cuando un técnico ejecuta el análisis completo (motor v2 → expert system → motor v3),
obtiene dos vectores de scores SFA de **distinto tamaño e incompatibles**:
- Motor v2 + expert: 10 dimensiones ponderadas por `ANALYTIC_CONFIG`
- Motor v3: 6 dimensiones ponderadas por `COMPAS_PESOS_SFA`

No existe ningún mecanismo documentado para comparar o fusionar esos dos resultados.
Esto hace que los dos motores produzcan priorizaciones potencialmente contradictorias
que el técnico no tiene forma de reconciliar.

---

## 2. Comparación: ANALYTIC_CONFIG vs COMPAS_PESOS_SFA vs Modelo Unificado

> ⚠️ Las dimensiones de ANALYTIC_CONFIG y COMPAS_PESOS_SFA son **estimaciones provisionales**.
> Los nombres exactos deben validarse auditando el monolito. Ver Sección 9.

### Tabla comparativa

| Dimensión conceptual | ANALYTIC_CONFIG (10 dims) | COMPAS_PESOS_SFA (6 dims) | Modelo Unificado (8 dims) |
|---|---|---|---|
| Carga epidemiológica | `carga_epidemiologica` (1) | `carga_enfermedad` (1) — fusiona con crónicas | **D1** Epidemiología territorial |
| Tendencias CMI/crónicas | `enfermedades_cronicas` (3) + `salud_mental` (4) + `prevencion` (5) | `carga_enfermedad` (1) + `prevencion` (3) | **D2** Tendencias CMI |
| Determinantes sociales | `factores_riesgo_conductual` (2) + `determinantes_sociales` (6) | `determinantes` (2) | **D3** Determinantes sociales |
| Inequidad | `equidad` (8) | `inequidad` (5) | **D4** Inequidad en salud |
| Evidencia cualitativa | *(sin dimensión explícita)* | *(sin dimensión explícita)* | **D5** Evidencia cualitativa *(nueva)* |
| Participación ciudadana | `participacion_comunitaria` (7) | `participacion` (4) | **D6** Participación ciudadana |
| Factibilidad institucional | `capacidad_institucional` (9) | `capacidad` (6) — fusiona con convergencia | **D7** Factibilidad institucional |
| Convergencia estratégica | `convergencia_epvsa` (10) | `capacidad` (6) — fusiona con factibilidad | **D8** Convergencia estratégica |

### Diferencias clave

1. **ANALYTIC_CONFIG tiene 10 dims, COMPAS_PESOS_SFA tiene 6**: las diferencias no son
   de contenido sino de granularidad. COMPAS_PESOS_SFA fusiona dimensiones que ANALYTIC_CONFIG
   trata por separado (p.ej. enfermedades crónicas + salud mental → carga de enfermedad).

2. **Evidencia cualitativa**: ninguno de los dos modelos heredados tiene una dimensión
   dedicada a la evidencia cualitativa (informe, estudios, conclusiones). El modelo
   unificado la introduce explícitamente como **D5**.

3. **Pesos**: los pesos de cada dimensión en ANALYTIC_CONFIG y COMPAS_PESOS_SFA no están
   documentados fuera del monolito. El modelo unificado usa pesos explícitos y justificados.

---

## 3. El modelo SFA unificado

**Archivo:** `ia/modeloSFA.js`

Un único modelo de **8 dimensiones** para toda la plataforma modular. Explícito, documentado
y reproducible sin dependencias del monolito.

### Principio de diseño

> Cada dimensión captura una fuente de evidencia distinta e independiente.
> El score total es una media ponderada solo de las dimensiones disponibles.
> Dimensiones sin datos → score = null, excluidas del cómputo (el peso se redistribuye).

---

## 4. Definición de cada dimensión

### D1 — Epidemiología territorial
- **Peso base:** 0.22 (mayor peso del modelo)
- **Interpreta:** mayor score = mayor carga epidemiológica identificada
- **Fuente de datos:**
  - `contextoIA.analisisPrevio.priorizacion[]` — posición de áreas en el análisis v2
  - `contextoIA.determinantes` — mapa de determinantes EAS registrados
- **Cálculo:**
  ```
  Si priorizacion[] disponible:
    score = media ponderada de posición inversa de las áreas
    (área en rango 1 → score 1.0, área en rango N → score 1/N)
  Si solo determinantes:
    score = min(1, nDeterminantes / 20)
  Sin datos: null
  ```
- **Limitación:** depende del análisis salutogénico previo o de determinantes EAS

---

### D2 — Tendencias del Cuadro de Mandos Integral
- **Peso base:** 0.20
- **Interpreta:** mayor score = más indicadores con tendencia desfavorable
- **Fuente de datos:**
  - `contextoIA.cuadroMandos.componenteCI` — % indicadores favorables
  - `contextoIA.cuadroMandos.aMejorar / conTendencias`
- **Cálculo:**
  ```
  score = 1 - (componenteCI / 100)
  Si CMI con datos pero sin tendencias: score = 0.5 (neutral)
  Sin CMI: null
  ```
- **Ventaja:** única dimensión plenamente cuantitativa sin ambigüedad metodológica

---

### D3 — Determinantes sociales de la salud
- **Peso base:** 0.14
- **Interpreta:** mayor score = más determinantes sociales registrados
- **Fuente de datos:**
  - `contextoIA.determinantes` — mapa código → valor (EAS)
- **Cálculo:**
  ```
  score = min(1, nDeterminantesRegistrados / 20)
  Sin determinantes: null
  ```
- **Pendiente:** el catálogo completo de códigos EAS y el umbral de referencia están
  en el monolito (parte de `datosMunicipioActual`). El umbral 20 es provisional.

---

### D4 — Alertas de inequidad en salud
- **Peso base:** 0.12
- **Interpreta:** mayor score = más alertas de inequidad detectadas
- **Fuente de datos:**
  - `contextoIA.analisisPrevio.alertasInequidad[]`
- **Cálculo:**
  ```
  score = min(1, nAlertasInequidad / 5)
  Sin analisisPrevio: null
  ```
- **Pendiente:** el umbral de 5 alertas debe calibrarse con datos reales de municipios.

---

### D5 — Evidencia cualitativa disponible *(dimensión nueva, sin equivalente heredado)*
- **Peso base:** 0.12
- **Interpreta:** mayor score = más riqueza de evidencia cualitativa disponible
- **Fuente de datos:**
  - `contextoIA.fuentes.tieneInforme` (+0.30)
  - `contextoIA.fuentes.nEstudios` (+min 0.25)
  - `analisisPrevio.conclusiones[]` (+min 0.25)
  - `analisisPrevio.oportunidades[]` (+min 0.20)
- **Nota:** esta dimensión no existía en ninguno de los dos modelos heredados.
  Representa la evidencia documental y analítica que justifica la priorización.

---

### D6 — Participación ciudadana
- **Peso base:** 0.12
- **Interpreta:** mayor score = más participación ciudadana disponible
- **Fuente de datos:**
  - `contextoIA.participacion.totalParticipantes / nParticipantes`
  - `contextoIA.participacion.temasFreq` (nº temas distintos)
- **Cálculo:**
  ```
  score_n     = min(1, nParticipantes / 100)
  score_temas = min(0.3, nTemasDistintos / 20)
  score = 0.7 * score_n + 0.3 * score_temas
  Sin participación: null
  ```
- **Pendiente:** el umbral de 100 participantes debe ajustarse según el tamaño del municipio.

---

### D7 — Factibilidad institucional
- **Peso base:** 0.10
- **Interpreta:** mayor score = mayor capacidad institucional disponible
  ⚠️ INTERPRETACIÓN INVERSA a D1-D4: mayor factibilidad ≠ mayor urgencia.
- **Fuente de datos:**
  - `contextoIA.planTerritorialId` (+0.40)
  - `contextoIA.estrategia` (+0.30)
  - `contextoIA.analisisPrevio` (existencia) (+0.30)

---

### D8 — Convergencia estratégica EPVSA
- **Peso base:** 0.08
- **Interpreta:** mayor score = mayor alineación con el marco estratégico EPVSA
  ⚠️ INTERPRETACIÓN INVERSA: mayor convergencia ≠ mayor urgencia.
- **Fuente de datos:**
  - `analisisPrevio.propuestaEPVSA[]` (nº líneas EPVSA activadas)
  - `analisisPrevio.priorizacion[]` (nº áreas priorizadas)
- **Cálculo:**
  ```
  score_lineas = min(1, nLineasEPVSA / 8)
  score_areas  = min(0.4, nAreas / 10)
  score = 0.6 * score_lineas + 0.4 * score_areas
  ```

---

## 5. Fuentes de datos por dimensión

| Dimensión | Campo ContextoIA | Disponibilidad |
|---|---|---|
| D1 | `analisisPrevio.priorizacion[]` o `determinantes{}` | Si se ha ejecutado motor v2 o hay det. EAS |
| D2 | `cuadroMandos.componenteCI` | Si se han cargado indicadores INFOWEB |
| D3 | `determinantes{}` | Si los determinantes EAS están en Firebase |
| D4 | `analisisPrevio.alertasInequidad[]` | Si se ha ejecutado motor v2 |
| D5 | `fuentes.tieneInforme` + `analisisPrevio.conclusiones[]` | Si hay informe o análisis previo |
| D6 | `participacion.totalParticipantes` + `temasFreq` | Si hay datos de participación |
| D7 | `planTerritorialId` + `estrategia` | Siempre disponible (estructural) |
| D8 | `analisisPrevio.propuestaEPVSA[]` | Si se ha ejecutado motor v2 + propuesta |

---

## 6. Fórmula de cálculo del scoreTotal

```
scoreTotal = Σ(score_dim × peso_dim) / Σ(peso_dim)
             solo para dimensiones con datos (score ≠ null)
```

**Redistribución de pesos:** cuando una dimensión no tiene datos (score = null),
su peso NO se descarta — se distribuye implícitamente al normalizar por el peso
total disponible. Esto evita scores artificialmente bajos por falta de datos.

**Ejemplo con 5 dimensiones disponibles de 8:**
```
Disponibles: D1(0.22), D2(0.20), D3(0.14), D5(0.12), D7(0.10)
Peso total disponible: 0.22+0.20+0.14+0.12+0.10 = 0.78
scoreTotal = (0.7×0.22 + 0.4×0.20 + 0.5×0.14 + 0.6×0.12 + 0.9×0.10) / 0.78
```

---

## 7. Cómo se integra en priorización

**Archivo:** `ia/motores/motorPriorizacion.js`

El motor de priorización **mantiene su scoring propio de 4 criterios** (epidemiológico,
CMI, cualitativo, participación) y **añade el perfil SFA como capa adicional**:

```js
// En ejecutarFn (motorPriorizacion.js):
const areasConScore = _scoringMulticriterio(areasBase, tipo, contextoIA); // 4 criterios
const perfilSFA     = calcularScoreSFA(contextoIA);                        // 8 dimensiones SFA

resultado.perfilSFA = perfilSFA; // campo adicional en la salida
```

### Qué aporta el SFA a la priorización

| Aportación | Descripción |
|---|---|
| `perfilSFA.scoreTotal` | Score territorial global para contextualizar la urgencia |
| `perfilSFA.scorePorDimension` | Perfil detallado de las 8 dimensiones para el técnico |
| `perfilSFA.trazabilidad` | Qué dimensiones estaban disponibles y cuáles no |
| `perfilSFA.fuentesUsadas` | Lista de fuentes que alimentaron el SFA |

El técnico puede comparar el `scoreTotal` SFA con los scores por área (4 criterios)
para identificar si la urgencia territorial es consistente con la priorización de áreas.

### Relación entre SFA territorial y scoring por área

El SFA territorial da contexto global; el scoring de 4 criterios da ranking de áreas.
Son complementarios, no equivalentes:
- SFA alto + área con score alto → área crítica con respaldo territorial
- SFA bajo + área con score alto → área que destaca en un municipio con buen perfil general

---

## 8. Cómo se integra en evaluación

**Archivo:** `ia/motores/motorEvaluacion.js`

El motor de evaluación **mantiene su análisis basado en el CMI** y **añade el perfil SFA**:

```js
// En ejecutarFn (motorEvaluacion.js):
const anCMI      = _analizarCMI(contextoIA.cuadroMandos);   // base cuantitativa
const cualitativa = _extraerEvidenciaCualitativa(contextoIA); // evidencia cualitativa
const perfilSFA  = calcularScoreSFA(contextoIA);              // perfil SFA unificado

resultado.perfilSFA = perfilSFA;
```

### Dimensiones SFA relevantes para evaluación

| Dimensión | Relevancia para evaluación |
|---|---|
| D2 (Tendencias CMI) | Alineado con la base cuantitativa del motor evaluación |
| D4 (Inequidad) | Complementa las alertas de inequidad del análisis cualitativo |
| D7 (Factibilidad) | Contextualiza la capacidad institucional para ejecutar el plan |
| D8 (Convergencia) | Mide si el plan está alineado con la propuesta EPVSA |

La evaluación puede comparar el perfil SFA entre distintos momentos de seguimiento
para ver si el territorio evoluciona favorablemente (cuando el seguimiento anual se implemente).

---

## 9. Qué sigue heredado

| Componente | Ubicación | Estado |
|---|---|---|
| `ANALYTIC_CONFIG` | COMPAS.html l.24220 | **Intacto.** Sigue usado por `ejecutarMotorExpertoCOMPAS()`. |
| `COMPAS_PESOS_SFA` | COMPAS.html (localización pendiente) | **Intacto.** Sigue usado por `COMPAS_analizarV3()`. |
| Dimensiones exactas de ANALYTIC_CONFIG | No auditadas | **Pendiente.** El mapeo de `adaptarModeloHeredado('ANALYTIC_CONFIG')` es provisional. |
| Dimensiones exactas de COMPAS_PESOS_SFA | No auditadas | **Pendiente.** El mapeo de `adaptarModeloHeredado('COMPAS_PESOS_SFA')` es provisional. |
| Pesos de cada dimensión en los modelos heredados | No documentados | **Pendiente.** Los pesos heredados no son visibles sin auditar el monolito. |
| `window.analisisActual.priorizacion_experta[]` | Global | Sigue siendo el vector de scores SFA del expert system. |

---

## 10. Qué se podrá eliminar cuando se retire el monolito

Una vez completada la migración completa, los siguientes elementos pueden eliminarse:

| Qué eliminar | Prerequisito para eliminarlo |
|---|---|
| `ANALYTIC_CONFIG` (10 dims) | Motor v2 + expert system completamente migrado a `ia/motores/motorV2Salutogenico.js` |
| `COMPAS_PESOS_SFA` (6 dims) | Motor v3 completamente migrado a `ia/motores/motorV3Multicriterio.js` |
| `ejecutarMotorExpertoCOMPAS()` | motor_expert_system.js funcional y validado |
| `COMPAS_analizarV3()` (IIFE) | motor_v3_multicriterio.js funcional, con inconsistencia SFA resuelta |
| `_MAPEO_ANALYTIC_CONFIG` en modeloSFA.js | Ya no hay resultados heredados que adaptar |
| `_MAPEO_COMPAS_PESOS_SFA` en modeloSFA.js | Ídem |
| `adaptarModeloHeredado()` en modeloSFA.js | Solo útil durante el período de transición |

### Condición de eliminación definitiva

```
1. Auditar y documentar exactamente ANALYTIC_CONFIG y COMPAS_PESOS_SFA
2. Actualizar los mapeos provisionales en adaptarModeloHeredado()
3. Migrar motor_v2_salutogenico → ia/motores/ con scoring SFA del modelo unificado
4. Migrar motor_expert_system → ia/motores/ usando MODELO_SFA_UNIFICADO
5. Resolver inconsistencia ANALYTIC_CONFIG vs COMPAS_PESOS_SFA (decidir cuál es el canónico)
6. Migrar motor_v3_multicriterio usando el modelo canónico unificado
7. Tests de equivalencia: verificar que los nuevos motores producen resultados comparables
8. Eliminar ANALYTIC_CONFIG, COMPAS_PESOS_SFA y las funciones heredadas
```

---

## 11. API pública del módulo

```js
import {
    // Constantes
    DIM,                    // IDs de las 8 dimensiones: DIM.D1_EPIDEMIOLOGIA, etc.
    MODELO_SFA_UNIFICADO,   // Definición completa de las 8 dimensiones
    PESOS_SFA_BASE,         // Mapa dimId → pesoBase

    // Función principal
    calcularScoreSFA,       // (contextoIA) → { scoreTotal, scorePorDimension, fuentesUsadas, trazabilidad }

    // Puente con modelos heredados
    adaptarModeloHeredado,  // (scoresHeredados, 'ANALYTIC_CONFIG'|'COMPAS_PESOS_SFA') → mapeado

    // Helpers
    getDimensionesOrdenadas,    // () → dimensiones ordenadas por peso desc
    tieneDatosSuficientesSFA,   // (contextoIA) → { suficiente, nDisponibles }
    resumirPerfilSFA,           // (sfaResult) → string legible
} from './ia/modeloSFA.js';
```

### Ejemplo de uso

```js
import { calcularScoreSFA, resumirPerfilSFA } from './ia/modeloSFA.js';
import { contextoDesdeGlobalesHeredados } from './ia/contextoIA.js';

const ctx = contextoDesdeGlobalesHeredados();
if (ctx) {
    const perfil = calcularScoreSFA(ctx);
    console.log(resumirPerfilSFA(perfil));
    // → "Perfil SFA: score 0.63 (nivel Medio). 6/8 dimensiones disponibles. Modelo v1.0."
    console.log('D2 tendencias:', perfil.scorePorDimension.d2_tendencias_cmi.score);
    console.log('Advertencias:', perfil.trazabilidad.advertencias);
}
```

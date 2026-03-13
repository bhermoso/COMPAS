# MODELO DEL CUADRO DE MANDOS INTEGRAL — COMPÁS
> Iteración 6 — Base cuantitativa del seguimiento territorial.
> Fecha: 2026-03-12. El monolito HTML no ha sido modificado.

---

## 1. Principio de diseño: indicadores = cuadro de mandos

**Regla de dominio (ver ARQUITECTURA_OBJETIVO.md):**
> Indicadores y cuadro de mandos integral son la **misma entidad conceptual**.

El sistema no distingue entre un módulo "indicadores" y un módulo "cuadro de mandos". El `CuadroMandosIntegral` **es** la colección estructurada de los 50 indicadores de seguimiento de la salud del territorio. Son dos vistas del mismo objeto, no dos objetos distintos.

---

## 2. Cómo se modela el cuadro de mandos integral

**Archivo:** `dominio/cuadroMandos.js`

### Jerarquía de entidades

```
CuadroMandosIntegral
│   ambitoId, planTerritorialId
│   totalIndicadores: 50 (constante)
│   conDatos, conTendencias, favorables, aMejorar
│   componenteCI: number|null   ← componente para el ISS
│
├── porCategoria.determinantes      (11 indicadores, INFOWEB)
│   ├── IndicadorCMI(1) … IndicadorCMI(11)
│
├── porCategoria.eventos_no_transmisibles  (22 indicadores, INFOWEB)
│   ├── IndicadorCMI(12) … IndicadorCMI(33)
│
└── porCategoria.prevencion         (17 indicadores, INFOWEB)
    ├── IndicadorCMI(34) … IndicadorCMI(50)
```

### IndicadorCMI — campos

| Campo | Tipo | Descripción |
|---|---|---|
| `numero` | number | Número del indicador (1-50) |
| `nombre` | string | Nombre del indicador (del catálogo) |
| `unidad` | string | 'N', '%', 'DDD/TAFE' |
| `categoriaId` | string | Categoría a la que pertenece |
| `valor` | any | Valor observado (null si no hay datos) |
| `tendenciaObservada` | string | 'ascendente'|'descendente'|'estable'|'' |
| `tendenciaDeseada` | string | ídem |
| `semaforo` | string | 'favorable'|'amejorar'|'estable'|'sin_datos' |
| `tieneDatos` | boolean | ¿Hay valor registrado? |
| `esFavorable` | boolean | `semaforo === 'favorable'` |
| `esAMejorar` | boolean | `semaforo === 'amejorar'` |
| `serie` | array | Serie temporal `[{fecha, valor}]` cuando existe |

### Semáforo de indicador

```
tendenciaObservada === tendenciaDeseada  →  favorable  🟢
tendencias opuestas                      →  amejorar   🔴
sin ambas tendencias                     →  sin_datos  ⚪
caso intermedio                          →  estable    🟡
```

La lógica de semáforo estaba dispersa en `generarCuadroMandosIntegral()` (HTML l.4854-4864). Ahora está formalizada en `calcularSemaforo()` y `SEMAFORO_INDICADOR`.

### componenteCI — componente del ISS

El `componenteCI` es el porcentaje de indicadores con tendencia **favorable** sobre el total de indicadores con tendencias registradas:

```
componenteCI = (nFavorables / nConTendencias) × 100
```

Este valor alimenta `eval_calcularISS()` como el "componente CI" con peso 40% (o adaptado si faltan otras fuentes). Esta relación estaba implícita; ahora es explícita en el modelo de dominio.

---

## 3. Relación con PlanTerritorial

```
PlanTerritorial (padul__plan_1)
    │
    ├── PlanAccion               ← nivel estratégico
    ├── AgendaAnual × 5          ← nivel operativo
    └── CuadroMandosIntegral     ← base cuantitativa de seguimiento
          ├── ambitoId:           'padul'
          ├── planTerritorialId:  'padul__plan_1'
          └── 50 IndicadorCMI con sus valores y tendencias
```

**La relación es de pertenencia**, no de composición obligatoria:
- Un PlanTerritorial puede no tener CMI (si el técnico no ha cargado datos INFOWEB todavía)
- El CMI existe mientras haya datos de indicadores cargados en Firebase
- El CMI se construye bajo demanda, no es parte del objeto PlanTerritorial

---

## 4. Cómo se construye desde el sistema heredado

### Método 1 — Desde Firebase (uso principal)

```js
import { cuadroMandosDesdeFirebase } from './dominio/cuadroMandos.js';
import { obtenerIndicadores } from './persistencia/firebase/repositorioIndicadores.js';

const datosInd = await obtenerIndicadores('padul');
const cmi = cuadroMandosDesdeFirebase(datosInd, 'padul', 'padul__plan_1');
```

El repositorio lee la ruta `estrategias/{est}/municipios/{mun}/indicadores` y devuelve el mapa `num → {dato|valor, tendenciaObservada, tendenciaDeseada}`.

### Método 2 — Desde la variable global del monolito

```js
import { cuadroMandosDesdeGlobal } from './dominio/cuadroMandos.js';

// Cuando datosMunicipioActual ya está cargado por el monolito:
const cmi = cuadroMandosDesdeGlobal(
    window.datosMunicipioActual,
    window.COMPAS.__ambitoActivo?.key
);
```

### Método 3 — Desde el bridge de window.COMPAS (acceso desde código heredado)

```js
// Disponible en window.COMPAS.__dominio tras la iteración de integración futura:
window.COMPAS.__dominio.cuadroMandos.cuadroMandosDesdeGlobal(...)
```

### Formato Firebase heredado que consume el módulo

```json
{
  "indicadores": {
    "1":  { "dato": "145", "tendenciaObservada": "ascendente", "tendenciaDeseada": "descendente" },
    "15": { "dato": "892", "tendenciaObservada": "▼", "tendenciaDeseada": "▼" },
    ...
  }
}
```

El módulo acepta tanto el formato con texto ('ascendente') como con símbolos ('▲','▼') — compatibilidad con ambas variantes presentes en el sistema.

---

## 5. Qué sigue heredado en el monolito

| Componente heredado | Línea HTML | Módulo modular equivalente |
|---|---|---|
| `const CUADRO_MANDOS_INTEGRAL` | l.4723 | `CATALOGO_CMI` en cuadroMandos.js |
| `const TOTAL_INDICADORES_MANDOS = 50` | l.4112 | `TOTAL_INDICADORES_CMI = 50` |
| `function generarCuadroMandosIntegral(datos)` | l.4806 | Sin equivalente UI todavía (renderiza HTML) |
| `function ajustarColor(color, pct)` | l.4885 | `util/color.js` (futuro) |
| `function _filtrarIndicadoresValidos(obj)` | l.5530 | Lógica de filtrado ahora en `indicadorDesdeFirebase()` |
| `function _contarIndicadoresValidos(obj)` | l.5540 | Derivable de `cmi.conDatos` |
| Semáforo inline en `generarCuadroMandosIntegral` | l.4854-4864 | `calcularSemaforo()` |
| `function eval_calcularISS()` | l.28223 | Consume `componenteCI`; sigue en monolito |
| `analisis.datosAnalisis.indicadoresFavorables` | l.24656 | `getIndicadoresFavorables(cmi)` |
| `analisis.datosAnalisis.indicadoresAMejorar` | l.24657 | `getIndicadoresAMejorar(cmi)` |

Todos estos siguen siendo la fuente operativa. El módulo modular es la capa adicional.

---

## 6. Qué queda pendiente para integración con evaluación y documentación

### P1 — eval_calcularISS() debería consumir componenteCI del CuadroMandosIntegral

Actualmente `eval_calcularISS()` recalcula el componente CI desde `window.analisisActual.datosAnalisis`. El nuevo modelo lo tiene calculado en `cmi.componenteCI`. Cuando se migre `eval_calcularISS()`, simplemente importará `getComponenteCI(cmi)`.

```js
// Futuro (eval_calcularISS migrada):
import { getComponenteCI } from './dominio/cuadroMandos.js';
const CI = getComponenteCI(cmi);   // directo, sin recalcular desde analisisActual
```

### P2 — generarCuadroMandosIntegral() debería usar CATALOGO_CMI del dominio

La función HTML genera el HTML del CMI desde `CUADRO_MANDOS_INTEGRAL` (definición embebida). Cuando se extraiga la UI, generará desde `CATALOGO_CMI` importado del dominio. El cambio es trivial: misma estructura, distinta fuente.

### P3 — Integrar CuadroMandosIntegral en el compilador del PLS

El compilador de Fase 4 (`previsualizarPLS()`) incluye el CMI como sección del plan. Actualmente llama a `generarCuadroMandosIntegral(indicadores)`. La versión futura construirá el CMI como entidad y luego lo renderizará:
```js
const cmi = cuadroMandosDesdeFirebase(datos.indicadores, ambitoId, planId);
htmlCMI = renderizarCMI(cmi);   // función UI futura
```

### P4 — Series temporales no implementadas todavía

El campo `serie` del `IndicadorCMI` está modelado pero el formato Firebase actual no almacena series temporales por indicador. Cuando el sistema comience a guardar histórico año a año (seguimiento a lo largo de varias anualidades del plan), el repositorio de indicadores deberá leer la ruta `seguimiento/{anio}/indicadores/{num}` y el módulo de CMI podrá construir `serie = [{anio, valor}, ...]`.

### P5 — Conectar resumenDiagnostico() con los motores IA

`resumenDiagnostico(cmi)` devuelve un objeto compacto con estadísticas del CMI. Este objeto es apto para ser consumido por `analizarDatosMunicipio()` (motor v2) como sustituto de la lectura directa de `datosMunicipioActual.indicadores`. La conexión se hará cuando se extraiga el motor IA.

---

## 7. API pública del módulo

```js
import {
    // Catálogo y constantes
    CATALOGO_CMI,              // definición de las 3 categorías con 50 indicadores
    TOTAL_INDICADORES_CMI,     // 50
    INDICE_INDICADORES,        // num → {numero, nombre, unidad, categoriaId}
    SEMAFORO_INDICADOR,        // { FAVORABLE, A_MEJORAR, ESTABLE, SIN_DATOS }

    // Lógica de semáforo
    calcularSemaforo,          // (tObs, tDes) → SEMAFORO_INDICADOR value

    // Factories
    crearIndicadorCMI,         // ({ numero, valor, tendencias, ... }) → IndicadorCMI
    crearCuadroMandosIntegral, // ({ ambitoId, planTerritorialId, indicadores[] }) → CMI

    // Bridges desde heredado
    indicadorDesdeFirebase,    // (numero, datoFirebase) → IndicadorCMI
    cuadroMandosDesdeFirebase, // (datosIndicadores, ambitoId, planId?) → CMI
    cuadroMandosDesdeGlobal,   // (datosMunicipioActual, ambitoId, planId?) → CMI

    // Helpers de consulta
    getIndicadoresFavorables,  // (cmi) → IndicadorCMI[]
    getIndicadoresAMejorar,    // (cmi) → IndicadorCMI[]
    getIndicadoresPorCategoria,// (cmi, categoriaId) → IndicadorCMI[]
    getComponenteCI,           // (cmi) → number|null (componente CI del ISS)
    resumenDiagnostico,        // (cmi) → objeto compacto para motores y documentación
} from './dominio/cuadroMandos.js';
```

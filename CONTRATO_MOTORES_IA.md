# CONTRATO DE MOTORES IA — COMPÁS
> Iteración 7 — Subsistema IA base.
> Fecha: 2026-03-12. El monolito HTML no ha sido modificado.

---

## 1. Principio fundamental

> **"La IA es apoyo técnico, no decisora automática."**

Todo resultado producido por un motor IA de COMPÁS comienza con estado `pendiente`. Ningún resultado se aplica al plan ni a la priorización sin que el técnico lo revise y apruebe explícitamente. Esta regla está codificada estructuralmente: `normalizarSalidaMotor()` fija `estadoRevisionHumana: 'pendiente'` en toda salida.

---

## 2. Contrato base de los motores IA

**Archivo:** `ia/motorBase.js`

### Interfaz obligatoria

Todo motor creado con `crearMotor(spec)` tiene garantizados estos campos:

```js
motor.id           // string — identificador único
motor.version      // string — versión semántica
motor.descripcion  // string

motor.validarContexto(contextoIA)
// → { valido: boolean, errores: string[], advertencias: string[] }

await motor.ejecutar(contextoIA)
// → SalidaMotor (siempre, incluso si hay error)
```

### Estructura de SalidaMotor

```js
{
    // Metadatos
    motorId:               string,
    motorVersion:          string,
    fechaGeneracion:       ISO string,
    duracionMs:            number,

    // Revisión humana (SIEMPRE empieza en 'pendiente')
    estadoRevisionHumana:  'pendiente' | 'revisado' | 'aprobado' | 'rechazado' | 'parcial',

    // Confianza
    gradoConfianza:        number [0-1],
    gradoConfianzaLabel:   'Muy alto' | 'Alto' | 'Medio' | 'Bajo' | 'Muy bajo',
    fuentesUsadas:         string[],

    // Contenido
    datos:                 any,           // resultado del motor
    advertencias:          string[],
    error:                 string|null,
    sinDatos:              boolean,

    // Trazabilidad
    trazabilidadId:        string,        // referencia al registro de trazabilidad
}
```

### Ciclo de vida de una ejecución

```
1. contextoDesdeGlobalesHeredados() o contextoDesdeEntidades()
   → Produce ContextoIA (inmutable, sin DOM)

2. motor.validarContexto(contextoIA)
   → { valido, errores, advertencias }
   → Si !valido: devuelve SalidaMotor con error, sin ejecutar

3. await motor.ejecutar(contextoIA)
   → ejecutarFn(contextoIA)
   → calcularConfianza(resultado, contextoIA)
   → crearRegistroTrazabilidad(...)
   → registrarEjecucion(traza)
   → normalizarSalidaMotor(resultado, traza)
   → SalidaMotor con estadoRevisionHumana: 'pendiente'

4. Técnico revisa → actualizarRevision(trazaId, 'aprobado'|'rechazado')
   → Solo si 'aprobado': la UI aplica el resultado al plan/priorización
```

### Motores concretos planificados

| Motor ID | Origen heredado | Estado |
|---|---|---|
| `motor_v2_salutogenico` | `analizarDatosMunicipio()` (l.24486) | ⏳ Pendiente de migrar |
| `motor_expert_system` | `ejecutarMotorExpertoCOMPAS()` (l.24357) | ⏳ Pendiente |
| `motor_v3_multicriterio` | `COMPAS_analizarV3()` (l.26945) | ⏳ Pendiente |
| `motor_propuesta_local` | `generarPropuestaIA()` (l.26034) | ⏳ Pendiente |
| `motor_fusion_priorizacion` | `COMPAS_ejecutarFusion()` (l.~18389) | ⏳ Pendiente |

---

## 3. Cómo se construye el ContextoIA

**Archivo:** `ia/contextoIA.js`

### Estructura del ContextoIA

```js
{
    // Identidad territorial
    ambitoId:               string,           // 'padul'
    ambitoNombre:           string,           // 'Padul'
    ambitoTipo:             string,           // 'municipio'|'mancomunidad'|'distrito_municipal'
    estrategia:             string,           // 'es-andalucia-epvsa'
    planTerritorialId:      string|null,
    timestamp:              ISO string,

    // Datos diagnósticos (raw, para que los motores procesen)
    datosMunicipio:         object,           // nodo completo Firebase (sin determinantes/indicadores separados)
    determinantes:          object,           // mapa código → valor
    indicadores:            object,           // mapa num → {dato, tendencias}
    referenciasEAS:         object,           // valores ref Andalucía/Granada
    informe:                object|null,      // { htmlCompleto, textPlano }
    cuadroMandos:           CuadroMandosIntegral|null,  // entidad de dominio construida

    // Análisis y participación
    analisisPrevio:         object|null,      // window.analisisActual (si ya se ejecutó)
    analisisPrevioV3:       object|null,      // window.analisisActualV3
    participacion:          object|null,      // participación ciudadana normalizada
    estudiosComplementarios: array,

    // Inventario de fuentes (clave para los motores)
    fuentes: {
        tieneInforme:       boolean,
        tieneEstudios:      boolean,
        tienePopular:       boolean,
        tieneDet:           boolean,
        tieneIndicadores:   boolean,
        nEstudios:          number,
        nParticipantes:     number,
    },
}
```

### Métodos de construcción

| Función | Cuándo usar |
|---|---|
| `contextoDesdeGlobalesHeredados()` | **Hoy** — lee de window.datosMunicipioActual y globales del monolito |
| `contextoDesdeEntidades(ambito, plan, datos)` | **Futuro** — cuando se extraigan las cargas de datos a repositorios |
| `crearContextoIA({ ambitoId, ... })` | Test o construcción explícita con datos conocidos |

---

## 4. Trazabilidad mínima exigida

**Archivo:** `ia/trazabilidadIA.js`

### Campos obligatorios de cada traza

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Generado automáticamente: `traza_{motorId}_{ambitoId}_{n}` |
| `motorId` | string | Identifica qué motor corrió |
| `motorVersion` | string | Versión del motor |
| `ambitoId` | string | Para qué territorio |
| `fuentesUsadas` | string[] | Lista de fuentes que alimentaron el motor |
| `gradoConfianza` | number [0-1] | Calculado por el motor o por heurística de fuentes |
| `fechaGeneracion` | ISO string | Cuándo se ejecutó |
| `estadoRevisionHumana` | string | Empieza en `'pendiente'` |
| `resumenEntrada` | object | Compacto: { ambitoId, fuentes, timestamp } |
| `resumenSalida` | object | Compacto: { tienePriorizacion, nAreas, tienePropuesta, tieneAlertas } |
| `duracionMs` | number | Tiempo de ejecución |
| `error` | string\|null | Error capturado si hubo fallo |
| `heredado` | boolean | true = resultado de motor heredado del monolito |

### Historial de sesión

Las trazas se acumulan en memoria durante la sesión y se exponen en:
```js
window.COMPAS.__trazabilidadIA.historial   // array de trazas
obtenerHistorial()                          // desde módulo ES
resumenHistorial()                          // estadísticas
obtenerPendientesRevision()                 // trazas sin revisar
```

---

## 5. Validaciones de entrada/salida

**Archivo:** `ia/validacionIA.js`

### Jerarquía de validadores

| Validador | Usa en | Requisito mínimo |
|---|---|---|
| `validarContextoMinimo(ctx)` | Todos los motores (por defecto) | ambitoId + ≥1 fuente |
| `validarContextoAnalitico(ctx)` | Motor v2, motor v3 | + informe O determinantes |
| `validarContextoPropuesta(ctx)` | Motor de propuesta | + analisisPrevio con priorizacion |

### Herramientas de diagnóstico previo

```js
// Antes de ejecutar un motor, el técnico puede ver qué datos faltan:
const diag = diagnosticoContexto(contextoIA);
diag.nivelAnalisis          // 'sin_datos'|'basico'|'intermedio'|'completo'
diag.puedeEjecutar          // boolean
diag.fuentes                // array con estado de cada fuente
diag.advertencias           // qué mejoraría el análisis
```

---

## 6. Qué sigue heredado en el monolito

| Componente | Línea HTML | Por qué no se migra todavía |
|---|---|---|
| `function analizarDatosMunicipio()` | l.24486 | Motor v2 principal; lógica compleja de 500+ líneas |
| `function ejecutarMotorExpertoCOMPAS()` | l.24357 | Expert system con ANALYTIC_CONFIG; dependencias internas |
| `window.COMPAS_analizarV3` | l.26945 | IIFE autónoma; monkey-patch hook en window.addEventListener |
| `function generarPropuestaIA()` | l.26034 | Genera propuesta; depende de analisisActual ya ejecutado |
| `function COMPAS_ejecutarFusion()` | l.~18389 | Fusión epi+ciudadano con pesos; depende de participación |
| `window.analisisActual` | global | Variable global que todos los motores producen y consumen |
| `window.analisisActualV3` | global | Variante del análisis v3 |
| `ANALYTIC_CONFIG` | l.24220 | Pesos del SFA — referenciado por ambos motores v2 y v3 |
| `COMPAS_EXPERT_SYSTEM` | l.24317 | Objeto motor heredado |
| `TAXONOMIA_TEMAS`, `MAPEO_EPVSA` | l.24248, l.24263 | Datos del motor v2 |
| `REGLAS_EXPERTAS` | anterior a l.24317 | Reglas del expert system |

---

## 7. Qué queda pendiente para migrar motores concretos

### Paso 1 — motor_v2_salutogenico

**Criterio previo:** Centralizar las 5 fuentes que lee (informe, determinantes, indicadores, participación, estudios) en el ContextoIA (ya hecho).

**Migración:**
```js
// ia/motores/motorV2Salutogenico.js (a crear)
export const motorV2 = crearMotor({
    id: 'motor_v2_salutogenico',
    version: '2.0',
    validarFn: validarContextoAnalitico,
    ejecutarFn: (ctx) => _logicaV2(ctx),  // extraer de HTML l.24486-25200
});
// _logicaV2 es el cuerpo de analizarDatosMunicipio() refactorizado para
// leer de ctx.determinantes, ctx.indicadores, ctx.informe, etc.
// (en lugar de datosMunicipioActual, referenciasEAS globales)
```

### Paso 2 — motor_expert_system

**Criterio previo:** Motor v2 migrado (el expert system enriquece el resultado del v2).

**Migración:** extraer `ejecutarMotorExpertoCOMPAS()` a `ia/motores/motorExpertSystem.js`.

### Paso 3 — motor_v3_multicriterio

**Criterio previo:** Resolver inconsistencia entre ANALYTIC_CONFIG (10 dimensiones) y COMPAS_PESOS_SFA (6 dimensiones) — detectada en LISTA_HARDCODING.md.

**Migración:** Extraer la IIFE de l.26945 a `ia/motores/motorV3Multicriterio.js`.
Eliminar el hook monkey-patch al migrar.

### Paso 4 — motor_propuesta_local

**Criterio previo:** Motores v2 y v3 migrados (la propuesta toma su output).

**Migración:** Extraer `generarPropuestaIA()` y `_generarPropuestaLocal()` a `ia/motores/motorPropuesta.js`.
Usar `validarContextoPropuesta()` como validador.

### Paso 5 — motor_fusion_priorizacion

**Criterio previo:** Módulo de participación ciudadana centralizado.

**Migración:** Extraer `COMPAS_ejecutarFusion()` a `ia/motores/motorFusion.js`.

---

## 8. Diagrama de dependencias del subsistema IA

```
ContextoIA
  ←  contextoDesdeGlobalesHeredados()   [bridge temporal → window.*]
  ←  contextoDesdeEntidades(...)         [futuro, sin globales]
       │
       ▼
validarContexto(ctx)     ←  validacionIA.js
       │
       ▼
   motorFn(ctx)          ←  logica propia del motor (heredada o modular)
       │
       ▼
crearRegistroTrazabilidad(...)  ←  trazabilidadIA.js
registrarEjecucion(traza)
       │
       ▼
normalizarSalidaMotor(resultado, traza)
→ SalidaMotor { estadoRevisionHumana: 'pendiente', datos, trazabilidadId }
       │
       ▼
  [Técnico revisa]
actualizarRevision(id, 'aprobado')
       │
       ▼
  UI aplica el resultado al plan / priorización
```

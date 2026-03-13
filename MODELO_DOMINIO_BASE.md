# MODELO DE DOMINIO BASE — COMPÁS
> Iteración 3 — Entidades raíz del dominio.
> Fecha: 2026-03-12. El monolito HTML no ha sido modificado.

---

## 1. Cómo se modela ambitoTerritorial

**Archivo:** `dominio/ambitoTerritorial.js`

### Tipos explícitos

```js
TIPOS_AMBITO = {
    MUNICIPIO:          'municipio',          // entidad municipal autónoma
    MANCOMUNIDAD:       'mancomunidad',       // agrupación de municipios
    DISTRITO_MUNICIPAL: 'distrito_municipal', // subdivisión de municipio grande
}
```

Antes de esta iteración los tres tipos coexistían como strings crudos sin distinción formal en el código. Ahora son constantes validadas y verificadas en cada factory.

### Estructura de la entidad (inmutable, congelada)

```js
{
    id:                   string,   // clave única ('padul', 'mancomunidad-alhama', 'granada-beiro')
    nombre:               string,   // nombre legible ('Padul', 'Mancomunidad de Alhama de Granada')
    tipo:                 string,   // uno de TIPOS_AMBITO
    estrategia:           string,   // ID de estrategia de salud ('es-andalucia-epvsa')
    metadata:             object,   // datos adicionales libres (poblacion, comarca, etc.)

    // Predicados de conveniencia (boolean)
    esMunicipio:          boolean,
    esMancomunidad:       boolean,
    esDistritoMunicipal:  boolean,
}
```

### Factories disponibles

| Función | Propósito |
|---|---|
| `crearAmbitoTerritorial(datos)` | Factory principal — crea desde datos explícitos con validación |
| `ambitoDesdeContexto(contexto)` | Bridge desde el formato `{ key, nombre, tipo, estrategia }` de `core/contextoTerritorial.js` |
| `ambitoDesdeFirebase(key, datos)` | Bridge desde datos crudos de Firebase |

### Helpers disponibles

| Función | Propósito |
|---|---|
| `sonMismoAmbito(a, b)` | Comparación por identidad de id |
| `agruparPorTipo(ambitos[])` | Agrupa array de ámbitos por tipo |

### Regla territorial no jerárquica

Las reglas de dominio establecen que no existe jerarquía funcional entre los tres tipos. Un municipio no está "por debajo" de una mancomunidad en el modelo; son entidades del mismo nivel que comparten el mismo contrato de planificación.

---

## 2. Cómo se modela planTerritorial

**Archivo:** `dominio/planTerritorial.js`

### Estados del ciclo de vida

```js
ESTADOS_PLAN = {
    BORRADOR:  'borrador',   // en elaboración; sin selección EPVSA consolidada
    ACTIVO:    'activo',     // plan vigente guardado en Firebase
    CERRADO:   'cerrado',    // período concluido; consultable, no editable
    ARCHIVADO: 'archivado',  // histórico; territorio tiene un plan posterior
}
```

Los estados CERRADO y ARCHIVADO no tienen equivalente en el monolito actual (que no gestiona ciclo de vida del plan). Son parte del modelo para iteraciones futuras.

### Estructura de la entidad (inmutable, congelada)

```js
{
    // Identificación
    id:            string,   // generado: '{ambitoId}__plan_{numeroOrden}'
    ambitoId:      string,   // referencia al AmbitoTerritorial
    estrategia:    string,

    // Orden y posición en la serie de planes del ámbito
    numeroOrden:   number,   // 1 = primer plan, 2 = segundo plan sucesivo, etc.
    esPrimerPlan:  boolean,  // true si numeroOrden === 1

    // Período temporal
    fechaInicio:   string,   // ISO date string 'YYYY-MM-DD'
    fechaFin:      string,   // ISO date string 'YYYY-MM-DD'
    aniosCobertura: number[], // [2026, 2027, 2028, 2029, 2030]

    // Estado del ciclo de vida
    estado:        string,   // uno de ESTADOS_PLAN
    esActivo:      boolean,
    esBorrador:    boolean,
    esCerrado:     boolean,
    esArchivado:   boolean,

    // Contenido del plan (bridge con sistema heredado) — ⚠️ PROVISIONAL
    tienePlan:     boolean,
    seleccionEPVSA: array|null,  // selección de líneas/objetivos/programas EPVSA
    actuaciones:   array,        // actuaciones normalizadas
    version:       string,       // 'auto' | 'editado'
    fechaGuardado: string|null,  // ISO datetime de última escritura en Firebase

    // Metadata libre
    metadata:      object,
}
```

### Factories disponibles

| Función | Propósito |
|---|---|
| `crearPlanTerritorial(datos)` | Factory principal con validación y cálculo de campos derivados |
| `planDesdeFirebase(ambitoId, planFB, numeroOrden)` | Bridge desde el objeto Firebase `{ fechaISO, seleccionEPVSA, actuaciones, version }` |

### Helpers disponibles

| Función | Propósito |
|---|---|
| `sonMismoPlan(a, b)` | Comparación por identidad de id |
| `planCubreAnio(plan, anio)` | ¿El plan cubre ese año? |
| `crearRegistroPlanes()` | Crea una instancia del registro multi-plan |

---

## 3. Cómo se representa que un ámbito puede tener varios planes

**`RegistroPlanes`** — estructura en memoria creada por `crearRegistroPlanes()`:

```
RegistroPlanes
│
├── 'padul' → [ PlanTerritorial(numero=1, estado=ACTIVO, 2026→2030) ]
│
├── 'armilla' → [
│       PlanTerritorial(numero=1, estado=ARCHIVADO, 2020→2024),
│       PlanTerritorial(numero=2, estado=ACTIVO,    2025→2029),
│   ]
│
└── 'mancomunidad-alhama' → [ PlanTerritorial(numero=1, estado=BORRADOR, 2026→2030) ]
```

### API del RegistroPlanes

```js
const registro = crearRegistroPlanes();

registro.registrar(plan)                // añade o actualiza un plan
registro.obtenerPlanes(ambitoId)        // todos los planes del ámbito, por orden
registro.obtenerPlanActivo(ambitoId)    // el plan con estado ACTIVO de mayor orden
registro.obtenerUltimoPlan(ambitoId)    // el plan de mayor número de orden
registro.siguienteNumeroOrden(ambitoId) // próximo número de orden disponible
registro.limpiarAmbito(ambitoId)        // elimina planes del ámbito del registro
registro.totalAmbitos                  // getter: cuántos ámbitos tienen planes
registro.totalPlanes                   // getter: total de planes en el registro
```

### Instancia global en la sesión

```js
// Acceso desde código modular (import):
import { registroPlanes } from './core/main.js';

// Acceso desde código heredado (window):
window.COMPAS.__dominio.registroPlanes
```

### Regla de integridad multi-plan

El `id` del plan se genera de forma determinista: `{ambitoId}__plan_{numeroOrden}`. Esto permite que el registro sea reconstruible desde Firebase sin necesidad de almacenar el id por separado. Un mismo par (ambitoId, numeroOrden) produce siempre el mismo id.

---

## 4. Acceso desde el código heredado (window.COMPAS.__dominio)

Para que el monolito pueda usar las entidades de dominio sin modificar imports:

```js
// Crear un ámbito desde código heredado:
const ambito = window.COMPAS.__dominio.ambitoDesdeContexto(
    window.COMPAS.__ambitoActivo
);
ambito.esMancomunidad // → true si 'mancomunidad-alhama'
ambito.tipo           // → 'mancomunidad'

// Consultar el plan actual:
const plan = window.COMPAS.__dominio.planActual;
plan.esPrimerPlan    // → true si es el primer plan del territorio
plan.aniosCobertura  // → [2026, 2027, 2028, 2029, 2030]
plan.estado          // → 'activo'

// Consultar el registro:
const reg = window.COMPAS.__dominio.registroPlanes;
reg.obtenerPlanes('padul')       // → [PlanTerritorial]
reg.obtenerPlanActivo('padul')   // → PlanTerritorial activo

// Tipos y constantes:
window.COMPAS.__dominio.TIPOS_AMBITO.MANCOMUNIDAD  // → 'mancomunidad'
window.COMPAS.__dominio.ESTADOS_PLAN.ACTIVO        // → 'activo'
```

---

## 5. Qué sigue heredado en el monolito

| Componente | Ubicación heredada | Por qué no se ha movido |
|---|---|---|
| `planLocalSalud` | HTML l.4213 | Compilador de fases; muchas dependencias |
| `window.COMPAS.state.planAccion` | HTML l.4243 | Estado operativo del plan actual |
| `window.COMPAS.state.planAccionFirebase` | HTML l.22741 | Cargado async por callback Firebase |
| `actualizarMunicipio()` | HTML l.7770 | Función pivote con 15+ efectos secundarios |
| `guardarPlanEnFirebase()` | HTML l.11363 | Persistencia — pendiente de encapsular |
| `cargarPlanGuardado()` | HTML l.11432 | Carga y restauración — pendiente |
| `resetearPlanLocal()` | HTML l.4665 | Reseteo en cascada — pendiente |
| `ESTRUCTURA_EPVSA` | HTML l.~8700 | Datos de estrategia — no mover todavía |
| `accionesAgenda` | HTML l.11563 | Array de agenda anual — pendiente |

**El modelo de dominio modular no reemplaza nada de lo anterior todavía.**
Coexiste: el monolito gestiona el estado operativo; el dominio modular gestiona la representación canónica de las entidades.

---

## 6. Limitaciones provisionales del modelo actual

### L1 — Fechas por defecto hardcodeadas en el módulo de dominio

```js
// dominio/planTerritorial.js l.~70 — ⚠️ PROVISIONAL
const _ANIO_INICIO_DEFECTO = 2026;
const _ANIO_FIN_DEFECTO    = 2030;
```

Cuando no se proveen fechas al crear un plan (caso habitual desde el bridge Firebase, ya que el formato actual no las almacena), se usan estos defaults. Son correctos para el período EPVSA 2024-2030 pero están hardcodeados en el módulo de dominio. Deben derivarse de la configuración de estrategia en una iteración futura.

### L2 — El formato Firebase heredado no incluye fechas de inicio/fin del plan

El objeto `planAccion` almacenado en Firebase es `{ fechaISO, seleccionEPVSA, actuaciones, version }`. El campo `fechaISO` es la fecha de guardado (timestamp), no la fecha de inicio del plan de salud. El modelo de dominio los distingue (`fechaGuardado` vs `fechaInicio`), pero el bridge `planDesdeFirebase()` no puede inferir `fechaInicio` real desde el formato actual.

### L3 — Un único plan por territorio en Firebase

El monolito solo admite un plan por territorio en la ruta `estrategias/{est}/municipios/{mun}/planAccion`. El modelo de dominio (RegistroPlanes) ya soporta múltiples planes, pero la persistencia de planes sucesivos en Firebase requiere una nueva ruta (ej: `planAccion_v2` con array, o una subcollección `planes/{id}`) que se definirá en la iteración de persistencia.

### L4 — El número de orden siempre es 1 actualmente

```js
// En main.js — ⚠️ PROVISIONAL
const plan = planDesdeFirebase(
    contextoNuevo.key,
    planFB,
    registroPlanes.siguienteNumeroOrden(contextoNuevo.key),  // = 1 siempre ahora
    ...
);
```

El `siguienteNumeroOrden` devuelve siempre 1 mientras el registro no tenga planes previos de ese ámbito. En una implementación completa, este número debe venir de Firebase (historial de planes del territorio).

### L5 — La seleccionEPVSA usa índices numéricos, no códigos

El campo `seleccionEPVSA` del plan referencia posiciones en `ESTRUCTURA_EPVSA` por índice de array (`objetivoIdx`, `programaIdx`). El modelo de dominio almacena esto tal cual por compatibilidad. Una refactorización futura debe reemplazar los índices por códigos semánticos (`OE1.1`, `P03`, etc.) para que los planes guardados en Firebase sean robustos ante cambios en la estructura EPVSA.

---

## 7. Criterios de aceptación verificados

| Criterio | Estado |
|---|---|
| Representación explícita de ámbito territorial | ✅ `dominio/ambitoTerritorial.js` — 3 tipos, factory con validación |
| Representación explícita de plan territorial | ✅ `dominio/planTerritorial.js` — 8 campos obligatorios, ciclo de vida |
| El modelo permite múltiples planes por ámbito | ✅ `crearRegistroPlanes()` — indexado por ambitoId, ordenado por numeroOrden |
| No se ha roto la app | ✅ COMPAS.html sin modificar; 0 cambios en el monolito |
| No se ha hecho migración masiva | ✅ Solo archivos nuevos + ajuste mínimo de main.js |

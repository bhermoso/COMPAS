# AUDITORÍA DE MOTORES CONSERVABLES — COMPÁS
> Iteración 8 — Encapsulación de motores heredados.
> Fecha: 2026-03-12. El monolito COMPAS.html no ha sido modificado.

---

## Resumen ejecutivo

Se han encapsulado los dos motores IA heredados más estables dentro del subsistema
modular, sin mover ni reescribir su lógica. Ambos motores han recibido:
- Un wrapper conforme al contrato `crearMotor()` de `ia/motorBase.js`
- Entrada estructurada vía `ContextoIA` de `ia/contextoIA.js`
- Registro de trazabilidad automático por cada ejecución
- Normalización de salida al formato `SalidaMotor`
- Estado `estadoRevisionHumana: 'pendiente'` en toda salida nueva

---

## 1. Motor encapsulado: `motor_sintesis_perfil`

**Archivo:** `ia/motores/motorSintesisPerfil.js`

### Funciones heredadas que utiliza

| Función heredada | Línea (COMPAS.html) | Rol |
|---|---|---|
| `analizarDatosMunicipio()` | l.24486 | Motor principal — integra 5 fuentes y produce perfil, priorizacion, propuestaEPVSA |
| `ejecutarMotorExpertoCOMPAS(analisis)` | l.24357 | Enriquece la priorizacion con vector de 10 scores SFA y reglas expertas |

### Variables globales heredadas que lee (via bridge)

| Variable | Rol en el motor |
|---|---|
| `datosMunicipioActual` | Datos diagnósticos del municipio (determinantes, indicadores, informe) |
| `referenciasEAS` | Valores de referencia Andalucía/Granada para comparativa |
| `window.estudiosComplementarios` | Array de estudios complementarios disponibles |
| `window.datosParticipacionCiudadana` | Datos de participación ciudadana |
| `ANALYTIC_CONFIG` | Pesos y configuración del sistema experto |
| `TAXONOMIA_TEMAS`, `MAPEO_EPVSA` | Datos estructurales del motor v2 |
| `REGLAS_EXPERTAS`, `COMPAS_EXPERT_SYSTEM` | Reglas y motor experto |

### Datos que usa como entrada (ContextoIA)

```js
contextoIA.ambitoId          // Identidad del territorio
contextoIA.ambitoNombre      // Nombre legible del territorio
contextoIA.datosMunicipio    // Nodo raw Firebase
contextoIA.determinantes     // Mapa código → valor
contextoIA.indicadores       // Mapa num → {dato, tendencias}
contextoIA.referenciasEAS    // Valores ref Andalucía/Granada
contextoIA.informe           // { htmlCompleto, textPlano }
contextoIA.participacion     // Datos de participación ciudadana
contextoIA.estudiosComplementarios  // Array de estudios
contextoIA.fuentes           // Inventario { tieneInforme, tieneDet, ... }
```

### Estructura de salida estructurada (SalidaMotor.datos)

```js
{
    // El análisis completo original (para bridges con código heredado)
    analisis: window.analisisActual,

    // Vista del perfil de salud
    perfil: {
        municipio, fortalezas[], oportunidades[],
        nFortalezas, nOportunidades,
        indicadoresFavorables[], indicadoresAMejorar[], totalIndicadores,
        alertasInequidad[], nAlertasInequidad,
        narrativa, perfilSOC
    },

    // Priorización de áreas
    priorizacion: {
        areas[],         // priorizacion salutogénica
        nAreas,
        areasExperta[],  // enriquecida por expert system con scores SFA
        patronesTransversales[]
    },

    // Propuesta de líneas EPVSA
    propuestaEPVSA[],

    // Conclusiones y recomendaciones
    conclusiones: { lista[], nTotal, porFuente{} },
    recomendaciones: { lista[], nTotal },

    // Metadatos del motor
    motorVersion,       // '2.0' o versión del motor v3 si se usó
    trazabilidadInterna,
    fuentes: {}
}
```

### Validador utilizado

`validarContextoAnalitico()` — exige `ambitoId` + ≥1 fuente + (informe O determinantes).

### Función de confianza

Heurística propia: base 0.17 por fuente (hasta 0.85) + bonus si expert system enriqueció
la priorizacion (+0.07) + bonus si hay conclusiones específicas (+0.05). Máximo: 0.95.

### Bridge de compatibilidad

`salidaDesdeAnalisisHeredado(ambitoId)` — adapta `window.analisisActual` ya existente
a `SalidaMotor` sin re-ejecutar el motor. `estadoRevisionHumana: 'revisado'`
(el monolito ya lo aplicó).

---

## 2. Motor encapsulado: `motor_plan_accion`

**Archivo:** `ia/motores/motorPlanAccion.js`

### Funciones heredadas que utiliza

| Función heredada | Línea (COMPAS.html) | Rol |
|---|---|---|
| `_generarPropuestaLocal(municipio, datos, pop, analisis)` | l.26092 | Núcleo puro del generador — convierte análisis en propuesta de líneas EPVSA con programas y objetivos |
| `generarPropuestaIA()` | l.26034 | Orquestador (NO se llama; se llama directamente a `_generarPropuestaLocal` para evitar efectos DOM) |

### Variables globales heredadas que lee (via bridge)

| Variable | Rol en el motor |
|---|---|
| `window.analisisActual` | Análisis salutogénico previo (si no está en `contextoIA.analisisPrevio`) |
| `window.propuestaActual` | Selección normalizada ya aplicada (usada en bridge de compatibilidad) |

### Datos que usa como entrada (ContextoIA)

```js
contextoIA.ambitoId          // Identidad del territorio
contextoIA.ambitoNombre      // Nombre para justificación textual
contextoIA.datosMunicipio    // Datos del municipio
contextoIA.participacion     // Datos de participación ciudadana
contextoIA.analisisPrevio    // window.analisisActual (resultado de motorSintesisPerfil)
contextoIA.fuentes           // Inventario de fuentes disponibles
```

### Estructura de salida estructurada (SalidaMotor.datos)

```js
{
    // Propuesta completa para renderización y selección
    lineasPropuestas[]:    // propuestaEPVSA[] con lineaId, titulo, relevancia, programas_sugeridos, objetivos
    seleccionNormalizada[]: // formato para convertirPropuestaASeleccion()

    // Resumen compacto para UI
    lineasActivas[]: {
        lineaId, lineaCodigo, titulo, relevancia, justificacion,
        nProgramas, nObjetivos, temasCiudadanos[]
    },
    nLineas,

    // Justificación textual para documento del plan
    justificacionGlobal: string,
    fuentesUsadas: string[],

    // Actuaciones-tipo sugeridas (primer nivel de la agenda)
    accionesSugeridas[]: {
        lineaId, lineaCodigo, programa, actuacion, ambito, origen
    },
    nAccionesSugeridas,

    // Análisis subyacente (bridge)
    analisisBase: contextoIA.analisisPrevio
}
```

### Validador utilizado

`validarContextoPropuesta()` — exige `ambitoId` + ≥1 fuente + `analisisPrevio` con
`priorizacion.length > 0`.

### Función de confianza

Base 0.16 por fuente (hasta 0.80) + bonus si hay participación ciudadana (+0.08) +
bonus si la propuesta tiene ≥4 líneas (+0.05). Máximo: 0.90.

### Bridge de compatibilidad

`salidaDesdePropuestaHeredada(ambitoId)` — adapta `window.analisisActual.propuestaEPVSA`
a `SalidaMotor` sin re-ejecutar. `estadoRevisionHumana: 'revisado'`.

---

## 3. Qué sigue heredado en COMPAS.html

Los motores encapsulados NO han sido extraídos del monolito. Siguen existiendo íntegros
en `COMPAS.html` y el código heredado los sigue usando directamente:

| Componente heredado | Línea | Estado tras esta iteración |
|---|---|---|
| `function analizarDatosMunicipio()` | l.24486 | **Intacto.** El nuevo motor lo llama vía bridge. |
| `function ejecutarMotorExpertoCOMPAS()` | l.24357 | **Intacto.** Se llama tras analizarDatosMunicipio(). |
| `function _generarPropuestaLocal()` | l.26092 | **Intacto.** El nuevo motor lo llama directamente. |
| `function generarPropuestaIA()` | l.26034 | **Intacto.** El módulo modular NO la llama (evita DOM). |
| `window.analisisActual` | global | **Sigue activo.** Los bridges lo mantienen actualizado. |
| `window.analisisActualV3` | global | **Intacto.** No encapsulado en esta iteración. |
| `COMPAS_analizarV3` | l.26945 (IIFE) | **Intacto.** Pendiente (requiere resolver conflicto de pesos). |
| `COMPAS_ejecutarFusion()` | l.~18389 | **Intacto.** Pendiente (requiere módulo de participación). |
| `ANALYTIC_CONFIG` | l.24220 | **Intacto.** Referenciado por ambos motores v2 y v3. |
| `COMPAS_EXPERT_SYSTEM` | l.24317 | **Intacto.** Utilizado por ejecutarMotorExpertoCOMPAS(). |
| `TAXONOMIA_TEMAS`, `MAPEO_EPVSA` | l.24248-24263 | **Intactos.** Datos estructurales del motor v2. |
| `REGLAS_EXPERTAS` | anterior a l.24317 | **Intacto.** Reglas del expert system. |

---

## 4. Qué queda pendiente antes de migrar motores críticos

### Prerequisito 1 — Extraer lógica de carga de datos de Firebase

Los motores heredados leen de variables globales (`datosMunicipioActual`, `referenciasEAS`).
Mientras no se extraigan los loaders a `persistencia/firebase/`, el bridge vía `window.*`
es necesario. Ver `ia/contextoIA.js → contextoDesdeGlobalesHeredados()`.

### Prerequisito 2 — Resolver conflicto de pesos SFA (antes de motor_v3)

`ANALYTIC_CONFIG` define 10 dimensiones; `COMPAS_PESOS_SFA` define 6.
El motor v3 (`COMPAS_analizarV3`) depende de ambos. Esta inconsistencia debe resolverse
antes de extraer el motor v3. Ver `LISTA_HARDCODING.md`.

### Prerequisito 3 — Módulo de participación ciudadana (antes de motor_fusion)

`COMPAS_ejecutarFusion()` depende de los datos de participación ciudadana normalizados.
Requiere crear un módulo dedicado que centralice la carga y normalización de estos datos.

### Prerequisito 4 — Tests de integración mínimos

Antes de eliminar los bridges `window.*` y hacer que los motores modulares sean la única
implementación, se necesitan tests que verifiquen que los motores modulares producen
el mismo resultado que los heredados con los mismos datos de entrada.

### Orden de migración recomendado

```
1. Extraer loaders de datos       → persistencia/firebase/ (prerequisito general)
2. Migrar motor_v2_salutogenico   → ia/motores/motorV2Salutogenico.js
3. Migrar motor_expert_system     → ia/motores/motorExpertSystem.js
4. Migrar motor_v3_multicriterio  → ia/motores/motorV3Multicriterio.js (tras resolver pesos)
5. Migrar motor_propuesta_local   → ia/motores/motorPropuesta.js (tras v2+v3)
6. Migrar motor_fusion            → ia/motores/motorFusion.js (tras módulo participación)
```

---

## 5. Invariantes de compatibilidad garantizadas

Los siguientes invariantes se mantienen tras esta iteración:

- `window.analisisActual` se mantiene actualizado por `motorSintesisPerfil` al ejecutar.
- `renderizarPropuestaIA()` y el sistema de checkboxes del monolito no han sido modificados.
- `convertirPropuestaASeleccion()` sigue recibiendo el mismo formato `seleccionNormalizada`.
- `sincronizarPlanConAgenda()` sigue leyendo `planAccionFirebase.actuaciones` sin cambios.
- La Fase 6 (evaluación) y el módulo IBSE no han sido tocados.
- Firebase paths (`estrategias/{est}/municipios/{mun}/{sec}`) sin modificaciones.

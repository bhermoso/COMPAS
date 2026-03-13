# SUSTITUCIÓN REAL DEL MOTOR DE SÍNTESIS — COMPÁS
> Iteración 10 — Motor modular como calculador real.
> Fecha: 2026-03-12. COMPAS.html modificado mínimamente.

---

## 1. Qué cálculo heredado deja de ser la vía principal

Antes de esta iteración, `motorSintesisPerfil.ejecutar()` llamaba **siempre** a:

```
analizarDatosMunicipio()         (HTML l.24486, ~500 líneas)
  └─ TAXONOMIA_TEMAS             (HTML l.24248)
  └─ PLANTILLAS_SAL              (HTML ~l.23295)
  └─ CONCLUSIONES_SAL_FIJAS      (HTML ~l.23383)
  └─ MAPEO_EPVSA                 (HTML l.24263)

ejecutarMotorExpertoCOMPAS()     (HTML l.24357)
  └─ ANALYTIC_CONFIG (10 dims)   (HTML l.24220)
  └─ COMPAS_EXPERT_SYSTEM        (HTML l.24317)
```

Ahora estas funciones **no se llaman en condiciones normales**. Solo se activan
en el fallback (cuando el cálculo modular no tiene datos suficientes).

---

## 2. Qué usa ahora `motorSintesisPerfil` para calcular

### Ruta principal (modular) — `_calcularAnalisisModular(contextoIA)`

| Fuente de datos | Campo en ContextoIA | Qué produce |
|---|---|---|
| **CuadroMandosIntegral** | `contextoIA.cuadroMandos` | `fortalezas[]`, `oportunidades[]`, `priorizacion[]`, `datosAnalisis{}`, `alertasInequidad[]` |
| **Determinantes EAS** | `contextoIA.determinantes` | Señal en `fortalezas[]` y `conclusiones[id='determinantes_sociales']` |
| **Participación ciudadana** | `contextoIA.participacion.temasFreq` | `recomendaciones[id=rec_popular_N]` |
| **Modelo SFA (8 dims)** | `calcularScoreSFA(contextoIA)` | Score D4 para `alertasInequidad[]`, enriquecimiento de `priorizacion[]` |
| **Inventario de fuentes** | `contextoIA.fuentes` | `conclusiones[]`, `recomendaciones[]`, `propuestaEPVSA[]` |

### Fallback (heredado) — condición de activación

```
if (!cmi && nDeterminantes === 0)
  → sinDatos: true → ejecutarFn llama a _llamarMotorHeredado()
  → analizarDatosMunicipio() + ejecutarMotorExpertoCOMPAS()
  → window.analisisActual = resultado heredado
```

---

## 3. Cómo se reconstruye `window.analisisActual`

### Flujo completo (ruta modular)

```
generarAnalisisIA() / verificarYGenerarAnalisisAutomatico()
         │
         ▼
window.__COMPAS_ejecutarMotorSintesis()
         │
         ├─ contextoDesdeGlobalesHeredados()    ← snapshot de variables globales
         │    (datosMunicipioActual, referenciasEAS, participacion, etc.)
         │
         ├─ motorSintesisPerfil.ejecutar(ctx)
         │    │
         │    ├─ _calcularAnalisisModular(ctx)  ← SIN analizarDatosMunicipio()
         │    │    ├─ CuadroMandosIntegral → fortalezas, oportunidades, priorizacion
         │    │    ├─ determinantes → señales epidemiológicas
         │    │    ├─ participacion → prioridades ciudadanas
         │    │    └─ calcularScoreSFA() → 8 dims SFA, alertas inequidad
         │    │
         │    └─ _normalizarAnalisis() → SalidaMotor.datos { analisis, perfil, ... }
         │
         ├─ adaptarSalidaMotorAAnalisisActual(salida, ctx)
         │    → analisis + _motorId + _trazabilidadId + _origenCalculo + ...
         │
         ├─ window.analisisActual = analisisAdaptado   ← ASIGNACIÓN EXPLÍCITA
         ├─ window.__ultimaSalidaMotorSintesis = salida ← SalidaMotor completa
         │
         └─ return analisisAdaptado
```

### Por qué la asignación ahora es explícita

En la iteración anterior, `window.analisisActual` se asignaba dentro de `_llamarMotorHeredado()`.
Ahora que la ruta modular no llama a ese bridge, la asignación se hace explícitamente
en `window.__COMPAS_ejecutarMotorSintesis()` (COMPAS.html), después de llamar a
`adaptarSalidaMotorAAnalisisActual()`.

---

## 4. Qué campos del formato heredado siguen siendo compatibles

`_adaptarAnalisisAFormatoUI(analisis, fuentesUsadas)` espera estos campos en `analisis`:

| Campo | Ruta modular | Ruta heredada | Compatible |
|---|---|---|---|
| `conclusiones[]` con `{ id, texto }` | ✅ IDs conocidos: `tendencias`, `oportunidades`, `determinantes_sociales`, `priorizacion_ciudadana`, `marco_salutogenico`, `epvsa_alineamiento`, `estudios_complementarios` | ✅ | ✅ |
| `recomendaciones[]` con `{ id, texto }` o `{ area, texto }` | ✅ IDs conocidos: `mapeo_activos`, `relas_gobernanza`, `rec_estudios`, `evaluacion_participativa`, `rec_popular_N`; `{ area }` para áreas CMI | ✅ | ✅ |
| `propuestaEPVSA[]` con `{ lineaId, justificacion, relevancia }` | ⚠️ `[]` vacío (sin ESTRUCTURA_EPVSA) | ✅ Con datos | Parcial |
| `priorizacion[]` | ✅ Array de categorías CMI ordenadas por score | ✅ Array de áreas salutogénicas | ✅ |
| `fuentes{}` | ✅ De `contextoIA.fuentes` | ✅ | ✅ |
| `municipio` | ✅ | ✅ | ✅ |
| `fortalezas[]`, `oportunidades[]` | ✅ Desde CMI | ✅ Desde análisis v2 | ✅ |
| `alertasInequidad[]` | ✅ Desde SFA D4 + CMI | ✅ | ✅ |
| `datosAnalisis{}` | ✅ Desde CMI stats | ✅ | ✅ |

### Diferencias visibles en la UI (ruta modular vs heredada)

| Sección UI | Ruta modular | Ruta heredada |
|---|---|---|
| "Líneas estratégicas EPVSA" | **Vacía** (`propuestaEPVSA = []`) | Con propuesta generada |
| "Conclusiones" | Desde CMI + SFA | Desde PLANTILLAS_SAL |
| "Recomendaciones" | Desde CMI + participación | Desde RECOMENDACIONES_SAL_FIJAS |
| "Fortalezas y oportunidades" | Indicadores INFOWEB concretos | Textos de análisis salutogénico |
| "Priorización de áreas" | 3 categorías CMI por score aMejorar | Áreas priorizadas con scoring ANALYTIC_CONFIG |
| Log de consola | `[COMPÁS modular] motorSintesisPerfil v3.0` | No aparece |

---

## 5. Cómo funciona el fallback

### Nivel 1 — Fallback dentro del motor (`_llamarMotorHeredado`)

Se activa cuando `_calcularAnalisisModular()` devuelve `sinDatos: true`, es decir:
- Sin `contextoIA.cuadroMandos` (no hay indicadores cargados)
- Y sin `contextoIA.determinantes` (nDeterminantes = 0)

```
ejecutarFn(ctx)
  └─ _calcularAnalisisModular(ctx) → { sinDatos: true }
  └─ console.warn('[motorSintesisPerfil v3.0] Ruta modular sin datos. Fallback...')
  └─ _llamarMotorHeredado(ctx)
       └─ analizarDatosMunicipio()
       └─ ejecutarMotorExpertoCOMPAS()
       └─ window.analisisActual = analisis  (asignación dentro del bridge)
```

El fallback produce el mismo resultado que el sistema anterior.

### Nivel 2 — Fallback por error del motor

Si `motorSintesisPerfil.ejecutar()` lanza un error o `adaptarSalidaMotorAAnalisisActual()` devuelve null:

```js
// En window.__COMPAS_ejecutarMotorSintesis:
} catch (errMotor) {
    console.warn('[COMPÁS modular] Fallback a motor heredado:', errMotor.message);
    return _fallbackMotorHeredado();   // llama analizarDatosMunicipio() directamente
}
```

### Nivel 3 — Fallback por módulo no disponible

Si el `<script type="module">` no cargó, el bloque inline de cada punto de llamada:
```js
var analisis = window.__COMPAS_ejecutarMotorSintesis
    ? await window.__COMPAS_ejecutarMotorSintesis()
    : (function() { /* motor heredado directo */ })();
```

---

## 6. Cómo verificar que el análisis ya no es el antiguo

### Método 1 — Campo `_origenCalculo` en consola

```js
console.log(window.analisisActual._origenCalculo);
// → 'motor_modular'  (ruta modular activa)
// → 'motor_heredado' (fallback)
// → undefined        (motor antiguo, sin este campo)
```

### Método 2 — Log de consola al ejecutar el análisis

Con la ruta modular activa, verás en consola:
```
[motorSintesisPerfil v3.0] Ruta modular exitosa. CMI: 32/50 ind. SFA: 5/8 dims
[COMPÁS modular] motorSintesisPerfil v3.0: SalidaMotor(motor_sintesis_perfil v3.0 [pendiente] conf=Medio) | origen: motor_modular | confianza: Medio | traza: traza_motor_sintesis_perfil_padul_1
```

Con el sistema antiguo (fallback), NO aparece ese log.

### Método 3 — Campo `_trazabilidadId`

```js
console.log(window.analisisActual._trazabilidadId);
// → 'traza_motor_sintesis_perfil_padul_1'  (modular con trazabilidad)
// → undefined                               (motor antiguo)
```

### Método 4 — `window.__ultimaSalidaMotorSintesis`

```js
console.log(window.__ultimaSalidaMotorSintesis);
// → SalidaMotor completa (solo disponible si el motor modular corrió)
// → undefined (si el módulo no cargó o se usó el fallback inline)
```

### Método 5 — Campo `motor_version`

```js
console.log(window.analisisActual.motor_version);
// → '2.0-modular'  (ruta modular)
// → '2.0' o '3.0' (motor heredado, según el análisis v2 o v3)
// → undefined      (análisis muy antiguo)
```

### Método 6 — Campo `propuestaEPVSA`

```js
console.log(window.analisisActual.propuestaEPVSA.length);
// → 0  (ruta modular: sin mapeo EPVSA)
// → >0 (ruta heredada: con propuesta generada)
```

Si `propuestaEPVSA` es vacío y `_origenCalculo` es `'motor_modular'`, estás viendo el cálculo modular.

---

## 7. Archivos modificados en esta iteración

| Archivo | Tipo de cambio |
|---|---|
| `ia/motores/motorSintesisPerfil.js` | Reescrito (v3.0): nueva `_calcularAnalisisModular()`, `adaptarSalidaMotorAAnalisisActual()` exportada, `ejecutarFn` modificado |
| `COMPAS.html` | Mínimo: importa `adaptarSalidaMotorAAnalisisActual`, asignación explícita de `window.analisisActual` |

---

## 8. Lo que sigue intacto

- `analizarDatosMunicipio()` (HTML l.24486) — intacta, solo activa en fallback
- `ejecutarMotorExpertoCOMPAS()` (HTML l.24357) — intacta, solo activa en fallback
- `_adaptarAnalisisAFormatoUI()` (HTML l.25270) — intacta, compatible con ambas rutas
- `renderizarResultadoIA()` (HTML l.25637) — intacta
- El hook del motor v3 (500ms tras generarAnalisisIA) — intacto
- `window.COMPAS.prioridades` — sin modificar
- Firebase paths — sin modificar

# CORRECCIÓN — Guardado de priorización con motor modular

**Fecha:** 2026-03-13
**Error original:**
```
update failed: values argument contains undefined in property
'municipios.atarfe.priorizacion.areas.eventos_no_transmisibles.justificacion'
```

---

## Causa exacta del error

### Flujo afectado

```
verificarYGenerarAnalisisAutomatico()
  → window.__COMPAS_ejecutarMotorSintesis()          [bootstrap modular]
    → motorSintesisPerfil.ejecutar(ctx)
      → _calcularAnalisisModular(ctx)                [ruta modular]
    → adaptarSalidaMotorAAnalisisActual(salida, ctx)
  → analisis.priorizacion[]                          ← array sin justificacion
  → priorizacionObj.areas[key] = { justificacion: p.justificacion }  ← undefined
  → db.ref().update(updates)                         ← RECHAZADO por Firebase
```

### Propiedad afectada

`ia/motores/motorSintesisPerfil.js` — función `_calcularAnalisisModular()`, líneas 138–155.

El array `priorizacion` se construía desde las categorías del CMI con estos campos únicamente:

```javascript
{ area, label, score, nAMejorar, nFavorables, nConDatos, fuente, orden }
```

**Campos ausentes** que el motor heredado sí producía y que `verificarYGenerarAnalisisAutomatico()` consumía sin guardia:

| Campo | Valor en motor modular | Efecto |
|---|---|---|
| `justificacion` | `undefined` | Firebase rechaza |
| `lineaEPVSA` | `undefined` | Firebase rechaza |
| `objetivoEPVSA` | `undefined` | Firebase rechaza |
| `areaKey` | `undefined` | key generada incorrectamente |

### Segunda fuente: narrativa vacía

El motor modular devuelve `narrativa: {}` (objeto vacío). El guard anterior era:

```javascript
if (analisis.narrativa) { ... }  // {} es truthy → entra
```

Resultado: `analisis.narrativa.contexto`, `.activos`, etc. = `undefined`.

---

## Corrección aplicada

### 1. Motor — `ia/motores/motorSintesisPerfil.js`

Se añaden `areaKey` y `justificacion` generada a partir de los datos disponibles del CMI:

```javascript
priorizacion.push({
    ...area,
    areaKey: area.area,          // clave normalizada lista para Firebase
    orden: idx + 1,
    justificacion: area.nAMejorar > 0
        ? `${area.nAMejorar} de ${area.nConDatos} indicadores con tendencia desfavorable (${pct}%).`
        : `${area.nConDatos} indicadores analizados. Sin tendencias desfavorables destacadas.`,
});
```

### 2. Guardado — `index.html` (función `verificarYGenerarAnalisisAutomatico`)

**Priorizacion — fallbacks explícitos en todos los campos opcionales:**

```javascript
priorizacionObj.areas[key] = {
    nombre:        p.area || p.label || key,
    prioridad:     idx + 1,
    justificacion: p.justificacion || '',   // '' en lugar de undefined
    lineaEPVSA:    p.lineaEPVSA    || '',
    objetivoEPVSA: p.objetivoEPVSA || ''
};
```

**Narrativa — guard corregido para detectar objeto vacío:**

```javascript
// Antes: if (analisis.narrativa) { ... }       // {} → truthy → undefined
// Después:
if (analisis.narrativa && typeof analisis.narrativa === 'object' &&
    (analisis.narrativa.contexto || analisis.narrativa.activos || analisis.narrativa.sintesis)) {
    updates[...] = {
        contexto: analisis.narrativa.contexto || '',
        // ...
    };
}
```

### 3. Saneamiento general — `_sanitizarParaFirebase()`

Función defensiva añadida antes de cada `db.ref().update()` en este flujo:

```javascript
function _sanitizarParaFirebase(obj) {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object' || Array.isArray(obj)) return obj;
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v === undefined) continue;  // omitir — Firebase lo rechaza
        clean[k] = (v !== null && typeof v === 'object' && !Array.isArray(v))
            ? _sanitizarParaFirebase(v)
            : v;
    }
    return clean;
}
```

Uso:
```javascript
await db.ref().update(_sanitizarParaFirebase(updates));
```

---

## Por qué no ocurría con el motor heredado

El motor heredado (`analizarDatosMunicipio` + `ejecutarMotorExpertoCOMPAS`) construía
el array `priorizacion` a partir de `ANALYTIC_CONFIG` y `priorizacion_experta`, que sí
incluían `justificacion`, `lineaEPVSA` y `objetivoEPVSA` explícitamente (ver `index.html`
l.24916). El motor modular aún no mapea estas relaciones EPVSA.

---

## Cómo se evita que vuelva a ocurrir

1. **Motor** — `areaKey` y `justificacion` son ahora parte del contrato de salida del
   motor modular. Todo ítem de `priorizacion[]` los lleva siempre.

2. **Punto de escritura** — cada campo opcional usa `|| ''` explícito; ningún campo
   puede llegar como `undefined` al objeto Firebase.

3. **Capa de defensa** — `_sanitizarParaFirebase()` actúa como última barrera antes
   de cualquier `update()` en este flujo, eliminando silenciosamente claves `undefined`
   aunque un cambio futuro los vuelva a introducir.

4. **Guard de narrativa** — el bloque solo escribe en Firebase si la narrativa tiene
   contenido real, no solo por ser un objeto truthy.

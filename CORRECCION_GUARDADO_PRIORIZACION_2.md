# CORRECCIÓN — Guardado de priorización con motor modular (iteración 2)

**Fecha:** 2026-03-13
**Error actual en producción:**
```
update failed: values argument contains undefined in property
'municipios.atarfe.priorizacion.areas.eventos_no_transmisibles.lineaEPVSA'
```

---

## 1. Nuevo campo afectado

`lineaEPVSA` (y por extensión `objetivoEPVSA`).

### Por qué aparece ahora y no antes

La corrección anterior (CORRECCION_GUARDADO_PRIORIZACION.md) **documentó** el fix pero **no lo aplicó** en el código. El bloque de guardado de `priorizacion.areas.*` en `index.html` quedó así después de esa iteración:

```javascript
// Código real en index.html — sin corregir tras la iteración anterior:
priorizacionObj.areas[p.areaKey || p.area...] = {
    nombre:        p.area,
    prioridad:     idx + 1,
    justificacion: p.justificacion,   // ← SIN fallback → undefined si motor modular
    lineaEPVSA:    p.lineaEPVSA,      // ← SIN fallback → undefined ← ERROR ACTUAL
    objetivoEPVSA: p.objetivoEPVSA   // ← SIN fallback → undefined
};
```

El motor modular (`motorSintesisPerfil.js`) produce ítems de `priorizacion[]` desde el CMI con estos campos:
```javascript
{ area, label, score, nAMejorar, nFavorables, nConDatos, fuente, areaKey, orden, justificacion }
```

`lineaEPVSA` y `objetivoEPVSA` **no existen** en la salida del motor modular — solo los produce el motor heredado (`analizarDatosMunicipio` con `ANALYTIC_CONFIG` y `priorizacion_experta`). El error aparece exactamente cuando el motor modular es la vía principal.

---

## 2. Cómo se corrigió

### Corrección 1 — Fallbacks explícitos en `priorizacion.areas.*` (index.html ~l.8037)

```javascript
// ANTES:
priorizacionObj.areas[p.areaKey || p.area.toLowerCase().replace(/\s+/g, '_')] = {
    nombre:        p.area,
    prioridad:     idx + 1,
    justificacion: p.justificacion,   // undefined posible
    lineaEPVSA:    p.lineaEPVSA,      // undefined → error Firebase
    objetivoEPVSA: p.objetivoEPVSA   // undefined → error Firebase
};

// DESPUÉS:
const key = p.areaKey || p.area.toLowerCase().replace(/\s+/g, '_');
priorizacionObj.areas[key] = {
    nombre:        p.area        || p.label || key,
    prioridad:     idx + 1,
    justificacion: p.justificacion    != null ? p.justificacion    : '',
    lineaEPVSA:    p.lineaEPVSA    != null ? p.lineaEPVSA    : '',
    objetivoEPVSA: p.objetivoEPVSA != null ? p.objetivoEPVSA : '',
};
```

Se usa `!= null` (que cubre `undefined` y `null`) en lugar de `|| ''` para preservar el valor `0` cuando `lineaEPVSA` o `objetivoEPVSA` son índices numéricos (`0` es válido en la taxonomía EPVSA).

### Corrección 2 — Guard de narrativa con objeto vacío (index.html ~l.8051)

```javascript
// ANTES: {} es truthy → entra al bloque → narrativa.contexto = undefined
if (analisis.narrativa) {
    updates[...narrativa] = {
        contexto: analisis.narrativa.contexto,   // undefined si motor modular devuelve {}
        ...
    };
}

// DESPUÉS: solo entra si hay contenido real
if (analisis.narrativa && typeof analisis.narrativa === 'object' &&
        (analisis.narrativa.contexto || analisis.narrativa.activos || analisis.narrativa.sintesis)) {
    updates[...narrativa] = {
        contexto:      analisis.narrativa.contexto      || '',
        activos:       analisis.narrativa.activos       || '',
        oportunidades: analisis.narrativa.oportunidades || '',
        patrones:      analisis.narrativa.patrones      || '',
        sintesis:      analisis.narrativa.sintesis      || '',
        fecha:         new Date().toISOString()
    };
}
```

---

## 3. Saneamiento adicional añadido

### `_sanitizarParaFirebase(obj)` — implementada (index.html ~l.7939)

La función existía solo en la documentación; ahora está en el código:

```javascript
function _sanitizarParaFirebase(obj) {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object' || Array.isArray(obj)) return obj;
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v === undefined) continue;   // omite claves con undefined
        clean[k] = (v !== null && typeof v === 'object' && !Array.isArray(v))
            ? _sanitizarParaFirebase(v)  // recursiva en objetos anidados
            : v;
    }
    return clean;
}
```

Se aplica en el `db.ref().update()` del flujo automático:

```javascript
// ANTES:
await db.ref().update(updates);

// DESPUÉS:
await db.ref().update(_sanitizarParaFirebase(updates));
```

Esta función actúa como **última barrera defensiva**: si un cambio futuro vuelve a introducir un `undefined` en cualquier campo del objeto `updates`, lo elimina silenciosamente antes de que Firebase lo rechace. Funciona de forma recursiva sobre cualquier nivel de anidamiento.

---

## 4. Confirmación de que ya no falla el guardado automático

### Rutas corregidas

| Campo | Motor modular | Antes del fix | Después del fix |
|---|---|---|---|
| `priorizacion.areas.*.justificacion` | Generado por motor | `undefined` posible | `''` si ausente |
| `priorizacion.areas.*.lineaEPVSA` | **No generado** | `undefined` → **error** | `''` si ausente |
| `priorizacion.areas.*.objetivoEPVSA` | **No generado** | `undefined` → **error** | `''` si ausente |
| `narrativa.*` | Objeto vacío `{}` | Campos `undefined` | Bloque omitido si vacío |

### Capas de defensa activas

1. **Fallbacks explícitos** en la construcción de `priorizacion.areas.*` — primera línea de defensa
2. **Guard de contenido** en narrativa — evita escritura de campos vacíos
3. **`_sanitizarParaFirebase()`** sobre el objeto `updates` completo — última barrera antes del `db.ref().update()`

Con estas tres capas, el guardado automático no puede fallar por `undefined` en ningún campo del flujo `verificarYGenerarAnalisisAutomatico`, independientemente de si el motor activo es el modular o el heredado.

---

## 5. Campos que siguen sin mapeo real en el motor modular

`lineaEPVSA` y `objetivoEPVSA` son relaciones EPVSA que el motor heredado calcula desde `ANALYTIC_CONFIG` y `priorizacion_experta`. El motor modular aún no implementa este mapeo (produce priorizaciones desde el CMI, no desde la taxonomía EPVSA directamente). Por eso se guardan como `''` cuando provienen del motor modular — es un valor semánticamente correcto ("sin mapeo conocido"), no un error.

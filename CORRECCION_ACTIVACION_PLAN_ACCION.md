# CORRECCIÓN — Activación funcional real de motorPlanAccion
> Fecha: 2026-03-13

**Síntoma en producción:**
```javascript
window.propuestaActual          // → []
window.propuestaActual?._origenCalculo  // → undefined
```

---

## 1. Por qué propuestaActual quedaba en []

### Cadena de fallo completa

```
generarPropuestaIA()
  └─→ motorPlanAccion.ejecutar(ctx)
        └─→ _llamarGeneradorLocal(ctx)
              └─→ _generarPropuestaLocal(municipio, datos, pop, analisis)
                    └─→ return {
                            propuestaEPVSA: [...],
                            _seleccion: [...]     ← clave "_seleccion" (con guión bajo)
                        }
        └─→ _normalizarPropuesta(resultado, ctx, fuentes)
              resultado.propuestaEPVSA        ✅  → líneas propuestas (populated)
              resultado.seleccionNormalizada  ❌  → undefined (clave no existe)
              resultado._seleccion            ✅  → datos reales (nunca leída)
              → seleccionNormalizada = undefined || [] = []
              → salidaMotor.datos.seleccionNormalizada = []

  └─→ adaptarSalidaMotorPlanAFormatoUI(salidaMotor)
        d.seleccionNormalizada = []
        → resultado._seleccion = []

  └─→ renderizarPropuestaIA(resultado)
        window.propuestaActual = r._seleccion || r.propuestaEPVSA || []
        //                       []   → truthy en JS → cortocircuita ||
        //                       propuestaActual = [] ← vacío
```

**Bug raíz:** discrepancia de nombre de propiedad entre el motor y el código que lo llama.

| Quién | Clave que usa |
|---|---|
| `_generarPropuestaLocal()` (monolito) | `_seleccion` |
| `_normalizarPropuesta()` (motor modular) | `seleccionNormalizada` |

El motor nunca leyó `_seleccion` → la selección siempre fue `[]` → como `[]` es truthy en JS, el `||` de `renderizarPropuestaIA` no llegó a `propuestaEPVSA` → `propuestaActual = []`.

---

## 2. Qué formato real esperaba la UI en propuestaActual

`propuestaActual` debe ser un **array de objetos** con esta estructura exacta (la que produce `_generarPropuestaLocal` en `_seleccion`):

```javascript
propuestaActual = [
    {
        lineaId:    number,                       // ID de línea EPVSA (1-7)
        relevancia: number,
        justificacion: string,
        objetivos: [
            { objetivoIdx: number, indicadores: [number] }
        ],
        programas: [
            { programaIdx: number, actuaciones: [number] }
        ]
    },
    ...
]
```

Funciones que consumen `propuestaActual` con este formato:

| Función | Cómo lo usa |
|---|---|
| `aceptarPropuesta()` | Itera `propuestaActual.map(lineaProp => ...)`, lee `lineaProp.lineaId`, `progProp.programaIdx`, `actIdx` |
| `convertirPropuestaASeleccion()` | Mapea a `{ id: lineaProp.lineaId, objetivos:[{idx, indicadores}], programas:[{idx, actuaciones}] }` |
| `aplicarPropuestaACheckboxes()` | Itera la selección para marcar checkboxes del modo manual |
| `guardarPlanEnFirebase()` | Lee `window.COMPAS.state.planAccion.seleccion` (resultado de `convertirPropuestaASeleccion`) |

**`propuestaActual` NO puede llevar metadatos directamente** porque `aceptarPropuesta()` hace `.map()` sobre él esperando que cada elemento sea `{ lineaId, objetivos, programas }`.

---

## 3. Cómo se corrigió la asignación de la propuesta modular

### Corrección 1 — `ia/motores/motorPlanAccion.js` (línea 53)

```javascript
// ANTES:
const seleccionNormalizada = resultado.seleccionNormalizada  || [];

// DESPUÉS:
// _generarPropuestaLocal devuelve la selección en _seleccion (con guión bajo),
// no en seleccionNormalizada. Se lee ambas claves para cubrir ambas fuentes.
const seleccionNormalizada = resultado.seleccionNormalizada || resultado._seleccion || [];
```

Esto hace que `salidaMotor.datos.seleccionNormalizada` contenga la selección real de `_generarPropuestaLocal`.

### Corrección 2 — `index.html` (en `generarPropuestaIA`, ruta modular)

Asignación explícita de `propuestaActual` **antes** de llamar a `renderizarPropuestaIA`, usando la selección del motor:

```javascript
propuestaActual = resultado._seleccion && resultado._seleccion.length
    ? resultado._seleccion
    : (resultado.propuestaEPVSA || []);
window.propuestaActual = propuestaActual;
```

La asignación explícita garantiza que el valor correcto está disponible independientemente de lo que haga `renderizarPropuestaIA` internamente. `renderizarPropuestaIA` después hace:

```javascript
window.propuestaActual = r._seleccion || r.propuestaEPVSA || [];
```

Tras la corrección 1, `r._seleccion` ya es el array poblado → la asignación interna también será correcta. Las dos correcciones son redundantes por diseño (doble garantía).

---

## 4. Dónde quedan ahora los metadatos del motor

`propuestaActual` sigue siendo un array plano (sin metadatos) para no romper `aceptarPropuesta()`. Los metadatos se guardan en una variable auxiliar:

```javascript
window.__ultimaPropuestaPlanMotor = {
    motorId:            'motor_plan_accion',
    motorVersion:       '1.0',
    trazabilidadId:     'trz-xxxxxxxx-xxxx',
    gradoConfianza:     0.64,
    gradoConfianzaLabel:'Alto',
    origenCalculo:      'motor_modular',
    estadoRevision:     'pendiente',
    nLineas:            4,
    fechaGeneracion:    '2026-03-13T...',
};
```

Accesible desde consola: `window.__ultimaPropuestaPlanMotor`.

Si el motor falla y se usa el heredado, esta variable **no se sobrescribe** → permite saber si la propuesta visible es modular (variable existe y `origenCalculo === 'motor_modular'`) o heredada (variable no existe o es de una ejecución anterior).

---

## 5. Cómo funciona el fallback

```javascript
Promise.all([import(motor), import(contexto)])
    .then(...)   // motor modular
    .catch(function(err) {
        // cualquier fallo → heredado
        var resultado = _generarPropuestaLocal(municipio, datos, pop, analisis);
        renderizarPropuestaIA(resultado, municipio, fuentesUsadas);
        // renderizarPropuestaIA asigna window.propuestaActual = resultado._seleccion || ...
        // en el heredado _seleccion está siempre poblado → funciona correctamente
    });
```

El fallback no toca `window.__ultimaPropuestaPlanMotor`, lo que permite detectar el cambio de origen.

---

## 6. Cómo verificar que la propuesta visible ya proviene del motor modular

### En consola del navegador, tras pulsar "🧠 Generar propuesta con IA":

```
[COMPÁS] 🤖 motorPlanAccion — propuesta modular activa
  Motor: motor_plan_accion v1.0
  Confianza: 0.64 (Alto)
  TrazabilidadId: trz-...
  Estado revisión: pendiente
  Líneas propuestas: 4
  propuestaActual.length: 4      ← antes era 0, ahora es > 0
  Origen: motor_modular
```

### Verificación directa en consola:

```javascript
// Propuesta operativa (debe ser array no vacío)
window.propuestaActual.length           // > 0 ✅
window.propuestaActual[0].lineaId       // número (1-7) ✅

// Metadatos del motor
window.__ultimaPropuestaPlanMotor.origenCalculo    // "motor_modular" ✅
window.__ultimaPropuestaPlanMotor.trazabilidadId   // "trz-..." ✅
window.__ultimaPropuestaPlanMotor.gradoConfianza   // número (0-1) ✅

// Trazabilidad en sesión
window.COMPAS.__trazabilidadIA.historial.at(-1).motorId  // "motor_plan_accion" ✅
```

---

## 7. Archivos modificados

| Archivo | Cambio |
|---|---|
| `ia/motores/motorPlanAccion.js` | `_normalizarPropuesta`: añadido `resultado._seleccion` como alternativa a `resultado.seleccionNormalizada` |
| `index.html` | `generarPropuestaIA` (ruta modular): asignación explícita de `propuestaActual` + `window.__ultimaPropuestaPlanMotor` antes de llamar a `renderizarPropuestaIA` |

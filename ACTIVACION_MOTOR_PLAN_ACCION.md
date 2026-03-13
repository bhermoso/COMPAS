# Activación del motor modular del Plan de Acción — COMPÁS
> Fecha: 2026-03-13

---

## 1. Dónde se interceptó el flujo heredado

**Punto de intercepción único:** función `generarPropuestaIA()` (index.html, ~l.26033).

Esta función es la que llama el botón "🧠 Generar propuesta con IA" (HTML, ~l.1826):
```html
<button onclick="generarPropuestaIA()">🧠 Generar propuesta con IA</button>
```

Anteriormente, dentro del `setTimeout(400ms)`, hacía:
```javascript
var resultado = _generarPropuestaLocal(municipio, datos, pop, analisis);
renderizarPropuestaIA(resultado, municipio, fuentesUsadas);
```

Ahora el `setTimeout` contiene un `Promise.all` de imports dinámicos que ejecuta el motor modular primero, con fallback al motor heredado si falla.

No se tocó ninguna otra función: `_generarPropuestaLocal`, `renderizarPropuestaIA`, `aceptarPropuesta`, `convertirPropuestaASeleccion`, `guardarPlanEnFirebase` permanecen intactas.

---

## 2. Cómo se ejecuta motorPlanAccion

Desde el bloque heredado (no-ES-module), se usa **dynamic import** para cargar los módulos ES:

```javascript
Promise.all([
    import('./ia/motores/motorPlanAccion.js'),
    import('./ia/contextoIA.js'),
]).then(function(modulos) {
    var motorMod = modulos[0];
    var ctxMod   = modulos[1];

    // 1. Construir ContextoIA desde variables globales del monolito
    var ctx = ctxMod.contextoDesdeGlobalesHeredados();
    // Lee: datosMunicipioActual, window.analisisActual, window.datosParticipacionCiudadana,
    //      window.estudiosComplementarios, referenciasEAS, estadoGlobal

    // 2. Ejecutar motor (async)
    return motorMod.motorPlanAccion.ejecutar(ctx).then(function(salidaMotor) { ... });
});
```

`motorPlanAccion.ejecutar(ctx)` internamente:
1. Valida el contexto con `validarContextoPropuesta()`
2. Llama a `_generarPropuestaLocal()` (lógica pura, sin DOM)
3. Normaliza la salida con `_normalizarPropuesta()`
4. Registra trazabilidad en `trazabilidadIA.historial`
5. Devuelve `Promise<SalidaMotor>`

---

## 3. Cómo se adapta la salida modular a la UI actual

La función `adaptarSalidaMotorPlanAFormatoUI(salidaMotor, municipio, fuentesUsadas, pop)` mapea:

| Campo SalidaMotor (`datos.*`) | Campo UI (`renderizarPropuestaIA`) |
|---|---|
| `datos.justificacionGlobal` | `justificacion_global` |
| `datos.lineasPropuestas` | `propuestaEPVSA` |
| `datos.seleccionNormalizada` | `_seleccion` (→ `propuestaActual` en `renderizarPropuestaIA`) |
| `datos.analisisBase.fortalezas` | `fortalezas[]` (reconstruido) |
| `datos.analisisBase.alertasInequidad` | `oportunidades[]` (primer elemento) |
| `salidaMotor.gradoConfianza` | `_gradoConfianza` (metadato, no renderizado) |
| `salidaMotor.trazabilidadId` | `_trazabilidadId` (metadato, no renderizado) |

`fortalezas` y `oportunidades` se reconstruyen desde `datos.analisisBase` (= `window.analisisActual` en el momento de ejecución) usando la misma lógica que `_generarPropuestaLocal`.

La salida adaptada es compatible byte a byte con lo que `renderizarPropuestaIA` espera:
- Renderiza `propuesta-resumen` y `propuesta-detalle` igual que antes
- `window.propuestaActual` se asigna desde `resultado._seleccion`
- `aceptarPropuesta()` lee `propuestaActual` sin cambios

---

## 4. Cómo funciona el fallback

```
Promise.all([import motores]).then(...)
    .catch(function(err) {
        // Cualquier fallo entra aquí:
        // - Error de importación (red/CORS)
        // - Sin contexto territorial activo
        // - Motor modular devuelve sinDatos o propuesta vacía
        // - Cualquier excepción en el motor
        console.warn('[COMPÁS] motorPlanAccion fallo — usando motor heredado. Causa:', err.message);
        var resultado = _generarPropuestaLocal(municipio, datos, pop, analisis);
        renderizarPropuestaIA(resultado, municipio, fuentesUsadas);
    });
```

El fallback activa el motor heredado exactamente como antes. La UI no distingue entre una propuesta modular y una heredada (mismo formato de salida).

Si el fallback también falla, muestra el alert de error como hacía el código original.

---

## 5. Qué funciones heredadas siguen activas

| Función | Estado | Rol |
|---|---|---|
| `_generarPropuestaLocal()` | ✅ Intacta | Núcleo puro del generador. El motor modular la llama internamente y también se usa en el fallback |
| `renderizarPropuestaIA()` | ✅ Intacta | Renderiza el DOM a partir del resultado adaptado |
| `aceptarPropuesta()` | ✅ Intacta | Lee `propuestaActual` (asignado por `renderizarPropuestaIA`) y filtra por checkboxes |
| `convertirPropuestaASeleccion()` | ✅ Intacta | Convierte `propuestaActual` al formato `{id, objetivos, programas}` para el plan |
| `guardarPlanEnFirebase()` | ✅ Intacta | Lee `window.COMPAS.state.planAccion.seleccion` y escribe en Firebase |
| `propuestaIA_generarEnAgenda()` | ✅ Intacta | Lee los checkboxes `.propIA-actuacion-chk` para generar agenda |
| `aplicarPropuestaACheckboxes()` | ✅ Intacta | Aplica la selección al modo manual |

---

## 6. Cómo verificar que la propuesta visible ya no es la antigua

### En consola del navegador, al pulsar "Generar propuesta con IA":

```
[COMPÁS] 🤖 motorPlanAccion — propuesta modular activa
  Motor: motor_plan_accion v1.0
  Confianza: 0.64 (Alto)
  TrazabilidadId: trz-xxxxxxxx-xxxx
  Estado revisión: pendiente
  Líneas propuestas: 4
  Origen: motor_modular
```

### En Firebase (`propuestaIA`), el objeto guardado tendrá:
```javascript
{
  _origenCalculo: "motor_modular",
  _trazabilidadId: "trz-...",
  _gradoConfianza: 0.64,
  ...
}
```

### En el objeto de resultado pasado a renderizarPropuestaIA:
```javascript
resultado._origenCalculo === 'motor_modular'  // true si motor modular activo
resultado._origenCalculo === undefined         // si se usó el fallback heredado
```

### Historial de trazabilidad en sesión:
```javascript
window.COMPAS.__trazabilidadIA.historial
// El último registro debe ser motor_plan_accion
```

---

## 7. Flujo completo tras la activación

```
Usuario pulsa "🧠 Generar propuesta con IA"
  │
  ├─→ generarPropuestaIA() [index.html]
  │     Verifica fuentes disponibles
  │     Muestra spinner
  │     setTimeout(400ms)
  │       │
  │       ├─→ import('./ia/motores/motorPlanAccion.js')
  │       ├─→ import('./ia/contextoIA.js')
  │       │
  │       └─→ motorPlanAccion.ejecutar(ctx) [ES module]
  │             ctx ← contextoDesdeGlobalesHeredados()
  │             │     (lee datosMunicipioActual, analisisActual, participación, ...)
  │             │
  │             ├─→ validarContextoPropuesta(ctx)
  │             ├─→ _generarPropuestaLocal(municipio, datos, pop, analisis) [heredada]
  │             │     propuestaActual = seleccionNormalizada
  │             │     return { propuestaEPVSA, seleccionNormalizada }
  │             ├─→ _normalizarPropuesta() → { lineasPropuestas, seleccionNormalizada,
  │             │                              justificacionGlobal, analisisBase, ... }
  │             ├─→ calcularConfianza()
  │             ├─→ registrarEjecucion(traza) → trazabilidadIA.historial
  │             └─→ SalidaMotor { datos, gradoConfianza, trazabilidadId, ... }
  │
  ├─→ adaptarSalidaMotorPlanAFormatoUI(salidaMotor)
  │     → { justificacion_global, fortalezas, oportunidades, propuestaEPVSA, _seleccion, _origenCalculo }
  │
  ├─→ Log consola ([COMPÁS] 🤖 motorPlanAccion — propuesta modular activa)
  ├─→ Firebase propuestaIA guardada con _origenCalculo: 'motor_modular'
  └─→ renderizarPropuestaIA(resultado, municipio, fuentesUsadas) [heredada]
        propuesta-resumen: justificación, fortalezas, oportunidades
        propuesta-detalle: líneas EPVSA + programas + actuaciones checkboxeadas
        window.propuestaActual = resultado._seleccion
        [UI idéntica al motor heredado]

Usuario acepta → aceptarPropuesta() [heredada, intacta]
  └─→ window.seleccionAceptada = convertirPropuestaASeleccion(propuestaActual)

Usuario genera documento → guardarPlanEnFirebase() [heredada, intacta]
  └─→ Firebase: estrategias/{est}/municipios/{mun}/planAccion
```

---

## 8. Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | Añadida `adaptarSalidaMotorPlanAFormatoUI()` justo antes de `generarPropuestaIA()`. El interior del `setTimeout` de `generarPropuestaIA()` sustituido por `Promise.all([import...])` con fallback |

No se modificó ningún módulo ES (`ia/`, `core/`, `dominio/`, `persistencia/`).

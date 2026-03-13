# ACTIVACIÓN DEL MOTOR MODULAR — motorSintesisPerfil
> Fecha: 2026-03-12. COMPAS.html modificado mínimamente.

---

## 1. Dónde se intercepta el flujo del monolito

### Dos rutas de ejecución del análisis

El análisis territorial puede activarse por dos caminos:

| Ruta | Función | Trigger | Línea original |
|---|---|---|---|
| Manual | `generarAnalisisIA()` | Botón "🧠 Generar análisis" (l.1664) | l.25338 |
| Automática | `verificarYGenerarAnalisisAutomatico()` | Al cargar datos del municipio | l.7941 |

### Punto exacto de intercepción

En ambas rutas, el bloque que antes hacía:
```js
// ANTES (motor heredado directo):
let analisis = analizarDatosMunicipio();
if (typeof ejecutarMotorExpertoCOMPAS === 'function') {
    analisis = ejecutarMotorExpertoCOMPAS(analisis);
}
window.analisisActual = analisis;
```

Ahora hace:
```js
// DESPUÉS (motor modular con fallback):
let analisis = window.__COMPAS_ejecutarMotorSintesis
    ? await window.__COMPAS_ejecutarMotorSintesis()
    : (function() {
        var a = analizarDatosMunicipio();
        if (typeof ejecutarMotorExpertoCOMPAS === 'function') a = ejecutarMotorExpertoCOMPAS(a);
        if (a && !a.sinDatos) window.analisisActual = a;
        return a;
      })();
```

El `setTimeout` de `generarAnalisisIA` pasó de `function()` a `async function()` para
poder usar `await`. Esto es completamente compatible — `setTimeout` ignora el valor de
retorno de su callback, y el comportamiento del bloque try/catch no cambia.

---

## 2. Cómo se ejecuta el motor modular

### Definición de `window.__COMPAS_ejecutarMotorSintesis`

Un `<script type="module">` añadido al final de `<body>` (antes de `core/main.js`) contiene
una IIFE async que:

1. Importa dinámicamente `motorSintesisPerfil` y `contextoDesdeGlobalesHeredados`:
   ```js
   const [{ motorSintesisPerfil }, { contextoDesdeGlobalesHeredados }] = await Promise.all([
       import('./ia/motores/motorSintesisPerfil.js'),
       import('./ia/contextoIA.js'),
   ]);
   ```

2. Registra la función global:
   ```js
   window.__COMPAS_ejecutarMotorSintesis = async function() {
       const ctx = contextoDesdeGlobalesHeredados();   // snapshot de globales heredados
       const salida = await motorSintesisPerfil.ejecutar(ctx);
       window.__ultimaSalidaMotorSintesis = salida;    // SalidaMotor completa
       return salida.datos.analisis;                   // objeto analisis para el monolito
   };
   ```

### Cadena de ejecución dentro del motor

```
motorSintesisPerfil.ejecutar(ctx)
  │
  ├─ validarContextoAnalitico(ctx)          ← requiere ambitoId + informe/determinantes
  │
  ├─ _llamarMotorHeredado(ctx)
  │     ├─ analizarDatosMunicipio()         ← motor v2 heredado (intacto)
  │     ├─ ejecutarMotorExpertoCOMPAS()     ← expert system (intacto)
  │     └─ window.analisisActual = analisis ← asignación de compatibilidad
  │
  ├─ crearRegistroTrazabilidad(...)         ← trazabilidad IA registrada
  ├─ registrarEjecucion(traza)
  │     └─ window.COMPAS.__trazabilidadIA.historial actualizado
  │
  └─ normalizarSalidaMotor(resultado, traza)
        └─ SalidaMotor { datos: { analisis, perfil, priorizacion, ... },
                         estadoRevisionHumana: 'pendiente',
                         trazabilidadId: 'traza_motor_sintesis_perfil_...' }
```

---

## 3. Cómo se mantiene `window.analisisActual`

`window.analisisActual` se asigna en **dos momentos**, ambos antes de que `renderizarResultadoIA` corra:

1. **Dentro del motor** — `_llamarMotorHeredado()` en `motorSintesisPerfil.js` hace:
   ```js
   if (analisis && !analisis.sinDatos) {
       window.analisisActual = analisis;
   }
   ```
   Esto ocurre en el mismo punto que antes (justo después de `analizarDatosMunicipio()`).

2. **En el fallback inline** (si `window.__COMPAS_ejecutarMotorSintesis` no está disponible):
   ```js
   if (a && !a.sinDatos) window.analisisActual = a;
   ```

El objeto `analisis` que se asigna a `window.analisisActual` es **exactamente el mismo**
que producía `analizarDatosMunicipio()` antes. No hay ningún cambio en su estructura.
La UI que lee `window.analisisActual` no necesita modificación.

### Nuevo campo disponible

```js
window.__ultimaSalidaMotorSintesis
// → SalidaMotor completa con trazabilidad, datos normalizados y grado de confianza
// Solo disponible si el motor modular se ejecutó (no en fallback)
```

---

## 4. Cómo funciona el fallback

Hay **dos niveles de fallback**, en orden de prioridad:

### Nivel 1 — Fallback por error del motor (dentro de `window.__COMPAS_ejecutarMotorSintesis`)

Si `motorSintesisPerfil.ejecutar()` lanza un error o devuelve `sinDatos: true`:

```js
// En el módulo (ia/motores/motorSintesisPerfil.js):
} catch (errMotor) {
    console.warn('[COMPÁS modular] Fallback a motor heredado:', errMotor.message);
    return _fallbackMotorHeredado();   // llama analizarDatosMunicipio() directamente
}
```

### Nivel 2 — Fallback por módulo no disponible (inline en el monolito)

Si `window.__COMPAS_ejecutarMotorSintesis` es `undefined` (los módulos no cargaron):

```js
var analisis = window.__COMPAS_ejecutarMotorSintesis
    ? await window.__COMPAS_ejecutarMotorSintesis()
    : (function() {
        // ← Este bloque es idéntico al código original pre-activación
        var a = analizarDatosMunicipio();
        if (typeof ejecutarMotorExpertoCOMPAS === 'function') a = ejecutarMotorExpertoCOMPAS(a);
        if (a && !a.sinDatos) window.analisisActual = a;
        return a;
      })();
```

### Cuándo se activa el fallback

| Situación | Nivel | Comportamiento |
|---|---|---|
| Motor ejecuta correctamente | — | Motor modular, trazabilidad registrada |
| Motor modular falla (error interno) | 1 | `_fallbackMotorHeredado()` en el módulo |
| Módulo no carga (error de red, sintaxis) | 2 | Bloque inline idéntico al original |
| Módulo aún no inicializado al momento de llamada | 2 | Bloque inline (ocurre si el análisis corre antes de que la IIFE resuelva) |

En todos los casos, `window.analisisActual` se asigna correctamente y la UI funciona sin cambios.

---

## 5. Cómo revertir al sistema anterior

Para desactivar el motor modular y volver exactamente al estado previo:

### Opción A — Eliminar el `<script type="module">` del motor

Eliminar el bloque comentado entre:
```
<!-- ═══ Motor modular: motorSintesisPerfil ... ═══ -->
```
y el `<script type="module" src="./core/main.js"></script>`.

Con esto, `window.__COMPAS_ejecutarMotorSintesis` queda `undefined` y ambas rutas
(manual y automática) caen automáticamente en el fallback inline, ejecutando el
motor heredado directamente. El comportamiento es idéntico al estado anterior.

### Opción B — Flag de desactivación rápida (sin modificar el HTML)

Añadir en la consola del navegador:
```js
window.__COMPAS_ejecutarMotorSintesis = undefined;
```
Esto desactiva el motor modular para la sesión actual sin tocar el código.

### Opción C — Flag en el HTML (para desactivación persistente sin eliminar el bloque)

Añadir antes del bloque del motor modular:
```html
<script>window.__COMPAS_forzar_motor_heredado = true;</script>
```

Y en la función `window.__COMPAS_ejecutarMotorSintesis`:
```js
if (window.__COMPAS_forzar_motor_heredado) return _fallbackMotorHeredado();
```
(Esta opción no está implementada todavía; las opciones A y B son suficientes.)

---

## 6. Cambios en COMPAS.html — resumen de diffs

### Diff 1 — `verificarYGenerarAnalisisAutomatico()` (l.7981)

```diff
-    // Ejecutar análisis
-    let analisis = analizarDatosMunicipio();
-
-    if (analisis.sinDatos) {
-        console.log('📊 Análisis sin datos suficientes');
-        return;
-    }
-
-    // Motor experto v3
-    if (typeof ejecutarMotorExpertoCOMPAS === 'function') {
-        analisis = ejecutarMotorExpertoCOMPAS(analisis);
-    }
-
-    // [ESCRITURA — window.analisisActual]
-    window.analisisActual = analisis;
+    // Motor modular con fallback al motor heredado si falla o aún no está disponible.
+    // Ver: ACTIVACION_MOTOR_SINTESIS.md
+    let analisis = window.__COMPAS_ejecutarMotorSintesis
+        ? await window.__COMPAS_ejecutarMotorSintesis()
+        : (function() {
+            var a = analizarDatosMunicipio();
+            if (typeof ejecutarMotorExpertoCOMPAS === 'function') a = ejecutarMotorExpertoCOMPAS(a);
+            if (a && !a.sinDatos) window.analisisActual = a;
+            return a;
+          })();
+
+    if (!analisis || analisis.sinDatos) {
+        console.log('📊 Análisis sin datos suficientes');
+        return;
+    }
```

### Diff 2 — `generarAnalisisIA()` setTimeout (l.25487)

```diff
-    setTimeout(function() {
+    setTimeout(async function() {
         try {
-            // Ejecutar análisis completo salutogénico
-            var analisis = analizarDatosMunicipio();
-            // Motor experto v3
-            if (typeof ejecutarMotorExpertoCOMPAS === 'function') {
-                analisis = ejecutarMotorExpertoCOMPAS(analisis);
-            }
-            // Guardar analisis en window
-            window.analisisActual = analisis;
+            // Motor modular con fallback al motor heredado si falla o aún no está disponible.
+            // Ver: ACTIVACION_MOTOR_SINTESIS.md
+            var analisis = window.__COMPAS_ejecutarMotorSintesis
+                ? await window.__COMPAS_ejecutarMotorSintesis()
+                : (function() {
+                    var a = analizarDatosMunicipio();
+                    if (typeof ejecutarMotorExpertoCOMPAS === 'function') a = ejecutarMotorExpertoCOMPAS(a);
+                    if (a && !a.sinDatos) window.analisisActual = a;
+                    return a;
+                  })();
```

### Diff 3 — Nuevo `<script type="module">` antes de `core/main.js` (l.29861)

```diff
+<!-- ═══ Motor modular: motorSintesisPerfil ═══ -->
+<script type="module">
+  // Define window.__COMPAS_ejecutarMotorSintesis()
+  // Con fallback a motor heredado si los módulos no cargan
+</script>
 <script type="module" src="./core/main.js"></script>
```

---

## 7. Invariantes garantizados

- `analizarDatosMunicipio()` no se elimina ni modifica.
- `ejecutarMotorExpertoCOMPAS()` no se elimina ni modifica.
- `generarAnalisisIA()` no se elimina (solo se parchea internamente).
- `window.analisisActual` sigue asignándose en el mismo momento del flujo.
- La UI (`renderizarResultadoIA`, Tab 3, etc.) no necesita ningún cambio.
- El hook del motor v3 (`setTimeout(COMPAS_ejecutarMotorV3, 900)`) sigue activo.
- Si los módulos no cargan, el sistema funciona exactamente igual que antes.

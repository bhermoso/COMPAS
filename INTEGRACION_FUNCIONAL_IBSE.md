# Integración funcional IBSE — COMPÁS
> Fecha: 2026-03-13

---

## 1. Rutas Firebase que usa IBSE

| Ruta | Tipo de dato | Quién escribe | Quién lee |
|---|---|---|---|
| `ibse_respuestas/{municipio}` | Colección de respuestas individuales (push) | `ibse_cargarCSV`, `ibse_enviarRespuesta` | `ibse_recalcularAgregado`, `monitor_ibse.html` (primaria) |
| `estrategias/{estrategia}/municipios/{municipio}/ibseDatos` | Objeto agregado `{n, media, factorVinculo, factorSituacion, factorControl, factorPersona, fuente, timestamp}` | `ibse_guardarAgregado` | `_cargarIBSEFirebase` (al cambiar municipio), ISS en Fase 6 |
| `ibse_monitor/{municipio}` | Copia del objeto agregado (mirror) | `ibse_guardarAgregado` | `monitor_ibse.html` (fallback si `ibse_respuestas` vacío) |

### Jerarquía de lectura del monitor

```
monitor_ibse.html?municipio=X
  └─→ 1.º lee ibse_respuestas/{X}       (respuestas individuales — fuente primaria)
  └─→ 2.º fallback ibse_monitor/{X}     (agregado — si no hay respuestas individuales)
```

---

## 2. Flujo de datos completo

### Carga por CSV REDCap
```
ibse_cargarCSV(input)
  ├─ Papa.parse → filas válidas[]
  ├─ ibse_respuestas/{mun} → remove() + push(cada fila)
  ├─ Calcular agregado en memoria
  ├─ window.datosIBSE = agregado
  ├─ ibse_guardarAgregado() → ibseDatos + ibse_monitor
  │    └─ iframe.dataset.munActual = ''  ← fuerza recarga monitor
  └─ renderizarPanelIBSE() + actualizarChecklistIA()
```

### Cuestionario directo (modal)
```
ibse_enviarRespuesta()
  ├─ Validar 8 ítems
  ├─ calcularIBSE() → factores
  ├─ ibse_respuestas/{mun}.push(respuesta)
  └─ ibse_recalcularAgregado()
       ├─ Lee todas ibse_respuestas/{mun}
       ├─ Si vacío → limpia ibseDatos + ibse_monitor + window.datosIBSE
       ├─ Si hay datos → recalcula media de factores
       ├─ window.datosIBSE = agregado
       ├─ ibse_guardarAgregado() → ibseDatos + ibse_monitor
       │    └─ iframe.dataset.munActual = ''  ← fuerza recarga monitor
       └─ renderizarPanelIBSE() + actualizarChecklistIA()
```

### Cambio de municipio (carga inicial)
```
cargarMunicipio(key)
  └─ _cargarIBSEFirebase(key)
       ├─ Lee estrategias/{est}/municipios/{mun}/ibseDatos
       ├─ Si tiene datos → window.datosIBSE = datos
       │    └─ Sincroniza a ibse_monitor/{mun} si estaba vacío
       └─ renderizarPanelIBSE() + actualizarChecklistIA()
```

---

## 3. Cómo se recalcula el agregado

`ibse_recalcularAgregado(municipio)` lee **todas** las respuestas individuales de `ibse_respuestas/{municipio}` y calcula la media de cada factor:

```
agregado.factorVinculo   = Σ(r.factorVinculo)   / n
agregado.factorSituacion = Σ(r.factorSituacion) / n
agregado.factorControl   = Σ(r.factorControl)   / n
agregado.factorPersona   = Σ(r.factorPersona)   / n
agregado.media           = (Σ totales) / n
```

Se invoca automáticamente tras cada `ibse_enviarRespuesta()`. **No se invoca automáticamente tras cargar CSV** (el CSV calcula su propio agregado directamente para evitar una lectura doble).

---

## 4. Cómo funciona el borrado

`ibse_borrarDatos()` hace:

1. `ibse_respuestas/{municipio}` → `remove()` — elimina todas las respuestas individuales
2. `estrategias/{est}/municipios/{municipio}/ibseDatos` → `remove()` — elimina el agregado del nodo municipio
3. `ibse_monitor/{municipio}` → `remove()` — elimina el mirror del monitor ← **añadido en esta iteración**
4. `window.datosIBSE = null` — limpia la variable en sesión
5. `iframe.dataset.munActual = ''` — fuerza recarga del monitor en la próxima apertura ← **añadido en esta iteración**
6. `renderizarPanelIBSE()` — limpia el panel visual inmediatamente

> **Antes de esta corrección**: `ibse_monitor/{municipio}` no se borraba, por lo que el monitor seguía mostrando los datos hasta que se recargaba manualmente.

---

## 5. Sincronización de window.datosIBSE

`window.datosIBSE` se actualiza en estos momentos:

| Evento | Resultado |
|---|---|
| Cambio de municipio | Cargado desde `ibseDatos` de Firebase |
| Cargar CSV | Calculado en memoria, guardado en Firebase |
| Enviar respuesta cuestionario | Recalculado desde `ibse_respuestas` en Firebase |
| Borrar datos | Puesto a `null` |
| Recalcular (sin respuestas) | Puesto a `null`, Firebase limpiado |

La estructura del objeto:
```javascript
window.datosIBSE = {
    n:               <número de registros>,
    media:           <IBSE total medio 0-100>,
    factorVinculo:   <media factor vínculo 0-100>,
    factorSituacion: <media factor situación 0-100>,
    factorControl:   <media factor control 0-100>,
    factorPersona:   <media factor persona 0-100>,
    fuente:          "csv_redcap" | "cuestionario_directo",
    timestamp:       <ISO 8601>
}
```

---

## 6. Sincronización panel COMPÁS ↔ monitor

### Panel COMPÁS (index.html)
- Renderizado por `renderizarPanelIBSE()` — lee directamente de `window.datosIBSE`
- Se actualiza sincrónicamente tras cualquier operación IBSE

### Monitor (monitor_ibse.html)
- Es un iframe independiente que lee Firebase directamente al cargarse
- **Lee primero** `ibse_respuestas/{mun}` (respuestas individuales)
- **Fallback** a `ibse_monitor/{mun}` si no hay respuestas individuales
- Se mantiene sincronizado porque `ibse_guardarAgregado` y `ibse_borrarDatos` resetean `iframe.dataset.munActual = ''`, forzando que la próxima apertura del modal recargue el iframe con datos frescos

> El monitor no se refresca automáticamente mientras está abierto. Si se añaden datos con el monitor ya abierto, hay que cerrarlo y reabrirlo.

---

## 7. Uso en el ISS (Índice Sintético de Salud — Fase 6)

`window.datosIBSE.media` alimenta el componente CB del ISS:

```
ISS = (CI × 0.40 + CD × 0.35 + CB × 0.25) / pesos_disponibles
```

- `CB` = `window.datosIBSE.media` (escala 0–100)
- Si `window.datosIBSE` es null, el componente CB se excluye y los pesos se redistribuyen

---

## 8. Qué sigue pendiente

| Funcionalidad | Estado | Notas |
|---|---|---|
| Editar respuestas individuales | ❌ No implementado | No hay UI para modificar una respuesta concreta. Solo se puede borrar todo y volver a cargar |
| REDCap API (sincronización directa) | ❌ Stub | `ibse_sincronizarREDCap()` muestra un alert. Requiere URL + token REDCap |
| Refresco automático del monitor mientras está abierto | ❌ No implementado | Requeriría listener `on('value')` en el iframe. Hoy solo se refresca al reabrir |
| Historial de cargas (quién cargó, cuándo) | ❌ No implementado | Solo se guarda el `timestamp` del último agregado |

---

## 9. Resumen de cambios aplicados en esta iteración

| Fichero | Cambio |
|---|---|
| `index.html` — `ibse_borrarDatos` | Añadido borrado de `ibse_monitor/{mun}` y reset del iframe |
| `index.html` — `ibse_guardarAgregado` | Añadido reset del iframe al guardar (cubre CSV y cuestionario) |
| `index.html` — `ibse_recalcularAgregado` | Cuando no hay respuestas: limpia `window.datosIBSE`, borra las dos rutas del agregado y re-renderiza |
| `monitor_ibse.html` | Eliminados marcadores de merge conflict (`<<<<<<< HEAD` / `>>>>>>> a3a35ad`) |

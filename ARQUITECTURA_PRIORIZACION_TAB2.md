# Arquitectura: Sección Priorización — TAB 2 (Perfil de salud local)

Fecha: 2026-03-14
Acordeón: **04 Priorización** (antes "04 Priorización ciudadana")
Contenedor HTML: `id="seccion-priorizacion-popular"`

---

## 1. Estructura anterior del acordeón

### HTML (sin cambios funcionales)

```html
<!-- 04 PRIORIZACIÓN CIUDADANA — Estratégica · Temática · Mixta -->
<div class="acordeon-item">
  <div class="acordeon-header" onclick="toggleAcordeon(this); renderizarSeccionPriorizacion();">
    <span>04 Priorización ciudadana</span>
    <span>🎯 Estratégica · Temática · Mixta</span>
  </div>
  <div class="acordeon-contenido" id="seccion-priorizacion-popular"></div>
</div>
```

### Función `renderizarSeccionPriorizacion()` anterior (v1)

Una única función de ~205 líneas que generaba tres bloques inline sin helper compartido:

| Bloque | Color | Botón principal | Destino |
|--------|-------|-----------------|---------|
| Estratégica | Rosa/fuchsia | `🎯 Ver / Abrir` | `cambiarTabManual('votacion')` |
| Temática | Azul | `🗳️ Herramienta / Abrir` | `cambiarTabManual('votacion-relas')` |
| Mixta | Verde | `🗂️ Ver / Abrir` | `cambiarTabManual('relas')` |

### Problemas detectados

1. **Sin helper común**: cada bloque repetía la estructura de cabecera, estado y cuerpo con estilos distintos e inconsistentes
2. **Jerarquía visual no homogénea**: los tres bloques tenían tamaños, márgenes y pesos visuales diferentes según el estado de los datos
3. **Sin patrón config-driven**: añadir un nuevo método requería modificar el cuerpo entero de la función
4. **Botón principal inconsistente**: el botón cambiaba de texto, color y destino según estado (Ver/Abrir), sin un "Abrir monitor" unificado
5. **Sin acciones secundarias estructuradas**: el bloque temático tenía un botón "📊 Análisis" adicional que aparecía solo si había datos, sin ubicación fija
6. **Sin funciones de borrado accesibles**: no había botones de borrado para gestionar datos cargados
7. **Sin monitor real**: los botones navegaban a TABs de herramientas, no a monitores de datos

---

## 2. Nueva arquitectura

### Badge del acordeón (actualizado)

```
🎯 Ciudadana · Técnica · VRELAS
```

### Helper `_renderTarjetaPriorizacion(cfg)`

Idéntico en estructura a `_renderTarjetaEstudio(cfg)` de la sección de estudios. Acepta:

```javascript
cfg = {
  icon,         // emoji del método
  iconBg,       // color de fondo del icono
  nombre,       // nombre del método
  descripcion,  // subtítulo de la tarjeta
  estado,       // texto del badge de estado
  estadoBg,     // color de fondo del badge
  estadoFg,     // color del texto del badge
  datoHtml,     // HTML del bloque de datos (ranking, resumen, etc.)
  monitorFn,    // expresión JS para el botón "Abrir monitor"
  monitorLabel, // texto del botón principal
  accionesHtml, // botones secundarios (cargar, herramienta, borrar)
  detalleHtml   // HTML del bloque expandible <details>
}
```

**Patrón visual:** fondo blanco · borde #e2e8f0 · border-radius 12px · sombra 1px · cabecera #fafbfc · botón principal azul #0074c8

### Métodos de priorización renderizados (config inline)

La función `renderizarSeccionPriorizacion()` construye las tarjetas directamente con datos en tiempo de render, sin un array PRIORIZACIONES_CFG separado (la configuración es dinámica porque los estados, datos y acciones dependen del estado en memoria en el momento del render).

---

## 3. Métodos de priorización soportados

### Tarjeta 1 — Priorización ciudadana

| Propiedad | Valor |
|-----------|-------|
| Icon | 🎯 |
| Descripción | Estratégica · Temática · Mixta |
| Fuente de datos | `window.datosParticipacionCiudadana`, `window.COMPAS.prioridades.epvsa`, `window.COMPAS.prioridades.relas` |
| Estado con datos | 🟢 N part. |
| Estado sin datos | Sin datos |
| datoHtml | Badges de subtipos disponibles + top objetivo estratégico o top tema temático |
| Botón principal | `📊 Abrir monitor` → `priorizacion_abrirMonitor('ciudadana')` |
| Acción secundaria 1 | `🎯 Estratégica` → `cambiarTabManual('votacion')` |
| Acción secundaria 2 | `🗳️ Temática` → `cambiarTabManual('votacion-relas')` |
| Acción secundaria 3 | `🗑️` → `priorizacion_borrarCiudadana()` (visible solo si hay datos) |

### Tarjeta 2 — Priorización técnica

| Propiedad | Valor |
|-----------|-------|
| Icon | 📊 |
| Descripción | Análisis epidemiológico integrado |
| Fuente de datos | `window.decisionPriorizacionActual`, `window.datosFusionPriorizacion` |
| Estado con datos | ✔ Integrada / Epidemiológica / Ciudadana |
| Estado sin datos | Sin decisión |
| datoHtml | Método elegido + área prioritaria si existe |
| Botón principal | `📊 Abrir monitor` → `priorizacion_abrirMonitor('tecnica')` |
| Acción secundaria 1 | `⚖️ Priorizar` → `mostrarPriorizacionDual()` |
| Acción secundaria 2 | `🗑️` → `priorizacion_borrarTecnica()` (visible solo si hay decisión) |

### Tarjeta 3 — VRELAS

| Propiedad | Valor |
|-----------|-------|
| Icon | 🗳️ |
| Descripción | 10 temas de salud · Hábitos · Colectivos |
| Fuente de datos | `window.datosParticipacionCiudadana.temasFreq` |
| Estado con datos | 🟢 N part. |
| Estado sin datos | Sin datos |
| datoHtml | Ranking top 5 de temas con barras de progreso (mismo render que bloque Temática anterior) |
| Botón principal | `📊 Abrir monitor` → `priorizacion_abrirMonitor('vrelas')` |
| Acción secundaria 1 | `🗳️ Herramienta` → `cambiarTabManual('votacion-relas')` |
| Acción secundaria 2 | `🗂️ RELAS` → `cambiarTabManual('relas')` |
| Acción secundaria 3 | `🗑️` → `priorizacion_borrarVrelas()` (visible solo si hay datos) |

---

## 4. Monitores asociados

| Método | Función de apertura | Estado actual |
|--------|--------------------|-|
| Priorización ciudadana | `priorizacion_abrirMonitor('ciudadana')` | **Modal inline** (placeholder) |
| Priorización técnica | `priorizacion_abrirMonitor('tecnica')` | **Modal inline** (placeholder) |
| VRELAS | `priorizacion_abrirMonitor('vrelas')` | **Modal inline** (placeholder) |

### `priorizacion_abrirMonitor(tipo)`

Abre un modal inline que muestra los datos disponibles en memoria para cada tipo. El modal usa el mismo patrón visual que `estudiosComplementarios_abrirVisor()`.

**Contenido por tipo:**

| tipo | Contenido del modal |
|------|---------------------|
| `ciudadana` | Top 5 objetivos estratégicos + top 5 temas temáticos + top 3 hábitos/problemas mixtos |
| `tecnica` | Método de decisión + área prioritaria + ranking de fusión (si existe) + botón "Ir a priorización dual" |
| `vrelas` | Ranking completo de los 10 temas con barras de progreso + medallas top 3 |

**Nota:** El modal muestra un pie de página: *"Monitor provisional — monitor_priorizacion.html en desarrollo"*. Cuando se cree `monitor_priorizacion.html`, la función deberá actualizarse para abrirlo en iframe o ventana con el parámetro `?tipo=X`.

**Ruta prevista del monitor real:**
```
monitor_priorizacion.html?tipo=ciudadana
monitor_priorizacion.html?tipo=tecnica
monitor_priorizacion.html?tipo=vrelas
```

---

## 5. Funciones unificadas

### Nuevas funciones añadidas

| Función | Propósito |
|---------|-----------|
| `_renderTarjetaPriorizacion(cfg)` | Helper de render idéntico a `_renderTarjetaEstudio()` |
| `priorizacion_abrirMonitor(tipo)` | Abre monitor inline por tipo (ciudadana/tecnica/vrelas) |
| `priorizacion_borrarCiudadana()` | Limpia `datosParticipacionCiudadana` + `COMPAS.prioridades.epvsa` en memoria |
| `priorizacion_borrarVrelas()` | Limpia datos VRELAS/RELAS en memoria |
| `priorizacion_borrarTecnica()` | Limpia `decisionPriorizacionActual` + `datosFusionPriorizacion` en memoria |

### Funciones existentes preservadas (sin cambios)

| Función | Línea aprox. | Estado |
|---------|-------------|--------|
| `normalizarParticipacion(p)` | 17779 | Sin cambios |
| `cargarParticipacionCiudadana(municipio)` | 17842 | Sin cambios |
| `resolverPriorizacionCiudadana(municipio)` | 17897 | Sin cambios |
| `mostrarPriorizacionDual()` | 17959 | Sin cambios |
| `cerrarModalPriorizacion()` | 18091 | Sin cambios |
| `confirmarPriorizacion()` | 18262 | Sin cambios |
| `vrelas_incorporarAlPlan()` | 22355 | Sin cambios |
| `vrelas_confirmarPriorizacionOficial()` | 22599 | Sin cambios |
| `actualizarChecklistIA()` | 23401 | Sin cambios |
| `cambiarTabManual(tab)` | 9258+ | Sin cambios |

---

## 6. Compatibilidad garantizada

- Firebase: rutas de guardado/carga sin cambios (`votacionRelas`, `participacionCiudadana`, `decisionPriorizacion`)
- Todos los llamadores de `renderizarSeccionPriorizacion()` (17 llamadas en el código) siguen funcionando
- `actualizarChecklistIA()` sigue actualizando `ia-check-priorizacion` y `ia-check-relas`
- El modal `modal-priorizacion-dual` de `mostrarPriorizacionDual()` es independiente del rediseño
- Los datos en `window.datosParticipacionCiudadana`, `window.COMPAS.prioridades`, `window.decisionPriorizacionActual` no se modifican

---

## 7. Pendientes

| Tarea | Tipo | Prioridad |
|-------|------|-----------|
| Crear `monitor_priorizacion.html` real con `?tipo=` query param | Nuevo archivo | Media |
| Actualizar `priorizacion_abrirMonitor()` para abrir el archivo real cuando exista | Función JS | Media — requiere monitor_priorizacion.html |
| Añadir botón "🔄 Recalcular" a tarjeta técnica (llame a `confirmarPriorizacion()` con método guardado) | Mejora | Baja |
| Extensibilidad: si se añade un 4º método, añadir bloque análogo en `renderizarSeccionPriorizacion()` | Diseño | Baja |

---

*Rediseño aplicado mediante `patch_priorizacion_tab2.py`*
*Revisión humana recomendada antes de crear snapshot.*

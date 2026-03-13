# Arquitectura: Estudios en TAB 2 (Perfil de salud local)

Fecha: 2026-03-14
Archivo afectado: `index.html`
Función principal: `renderizarSeccionEstudios()`

---

## Estructura anterior

El acordeón agrupaba los estudios en 3 tarjetas por familia, creando jerarquías artificiales:

| Tarjeta | Contenido | Monitor |
|---------|-----------|---------|
| IBSE | Card especial (diseño propio) | `ibseMonitor_abrir()` |
| Estudios complementarios | Todos los docs agrupados | `estudiosComplementarios_abrirVisor()` |
| Escalas diagnósticas | SF-12 + Duke-UNC + CAGE + PREDIMED juntas | `abrirModalEscalasDiagnosticas()` (sin parámetro) |

**Problemas:**
- La tarjeta "Escalas diagnósticas" mezclaba 4 instrumentos distintos en un solo bloque
- No había forma de acceder a una escala individual desde la vista de TAB 2
- Las escalas tenían diferente peso visual respecto a IBSE
- `abrirModalEscalasDiagnosticas()` no aceptaba parámetros: abría siempre el modal completo

---

## Estructura nueva

Cada estudio es una tarjeta independiente con el mismo peso visual.
Orden de render:

| # | Tarjeta | Tipo | Monitor |
|---|---------|------|---------|
| 1 | IBSE — Índice de Bienestar Socioemocional | Cuestionario propio (REDCap/CSV) | `ibseMonitor_abrir()` |
| 2 | SF-12 | Escala diagnóstica validada | `abrirModalEscalasDiagnosticas('sf12')` |
| 3 | Duke-UNC | Escala diagnóstica validada | `abrirModalEscalasDiagnosticas('duke')` |
| 4 | CAGE | Escala diagnóstica validada | `abrirModalEscalasDiagnosticas('cage')` |
| 5 | PREDIMED | Escala diagnóstica validada | `abrirModalEscalasDiagnosticas('predimed')` |
| 6 | Estudios documentales | Documentos del municipio (PDF/Word/txt/CSV) | `estudiosComplementarios_abrirVisor()` |

---

## Estudios soportados

### IBSE — Índice de Bienestar Socioemocional
- Datos: `window.datosIBSE` (cargado desde CSV REDCap)
- Campos: `ibse` (score 0–100), `n` (muestra), `vinculo`, `situacion`, `control`, `persona`
- Con datos: muestra score, barras de 4 factores, badge de semáforo (🟢/🟡/🔴)
- Sin datos: estado "Sin datos", botón de carga CSV
- Monitor: `ibseMonitor_abrir()` → abre `monitor_ibse.html` (iframe)

### SF-12
- Datos: `window.compasEscalasDiagnosticas` donde `nombre_escala === 'SF-12'`
- Campos relevantes: `resultado_principal` (PCS/MCS), `interpretacion`, `fuente_estudio`, `anio_estudio`, `tamano_muestra`
- Con datos: muestra resultado + interpretación + fuente
- Sin datos: estado "Sin datos"
- Monitor: `abrirModalEscalasDiagnosticas('sf12')` → abre modal con SF-12 preseleccionada

### Duke-UNC
- Datos: `window.compasEscalasDiagnosticas` donde `nombre_escala === 'Duke-UNC'`
- Con datos: muestra resultado + interpretación + fuente
- Monitor: `abrirModalEscalasDiagnosticas('duke')` → modal con Duke-UNC preseleccionada

### CAGE
- Datos: `window.compasEscalasDiagnosticas` donde `nombre_escala === 'CAGE'`
- Con datos: muestra resultado + interpretación + fuente
- Monitor: `abrirModalEscalasDiagnosticas('cage')` → modal con CAGE preseleccionada

### PREDIMED
- Datos: `window.compasEscalasDiagnosticas` donde `nombre_escala === 'PREDIMED'`
- Con datos: muestra resultado + interpretación + fuente
- Monitor: `abrirModalEscalasDiagnosticas('predimed')` → modal con PREDIMED preseleccionada

### Estudios documentales
- Datos: `window.estudiosComplementarios[]` (array de `{nombre, texto, tipo}`)
- Sin documentos: drop-zone + textarea para pegar texto
- Con documentos: una tarjeta por documento, botón "Añadir más"
- Monitor: `_estudioComplementarioVisor(idx)` → `estudiosComplementarios_abrirVisor(nombre, texto)`

---

## Monitores asociados

| Estudio | Función de apertura | Tipo de monitor |
|---------|---------------------|-----------------|
| IBSE | `ibseMonitor_abrir()` | Iframe real (`monitor_ibse.html`) |
| SF-12 | `abrirModalEscalasDiagnosticas('sf12')` | Modal existente (pre-selecciona escala) |
| Duke-UNC | `abrirModalEscalasDiagnosticas('duke')` | Modal existente (pre-selecciona escala) |
| CAGE | `abrirModalEscalasDiagnosticas('cage')` | Modal existente (pre-selecciona escala) |
| PREDIMED | `abrirModalEscalasDiagnosticas('predimed')` | Modal existente (pre-selecciona escala) |
| Estudios documentales | `estudiosComplementarios_abrirVisor()` | Modal inline genérico |

---

## Lógica de render

### `renderizarSeccionEstudios()`

```
1. Tarjeta IBSE
   - Lee window.datosIBSE
   - Si existe: card con datos + barras de factores
   - Si no: card vacía con botón de carga

2. Loop ESCALAS_CFG (SF-12, Duke-UNC, CAGE, PREDIMED)
   - Construye mapa: escalasMap[nombre_escala] = datos
   - Para cada escala: busca en mapa, renderiza card con o sin datos
   - monitorFn dinámico: 'abrirModalEscalasDiagnosticas(\'' + cfg.id + '\')'

3. Estudios documentales
   - Si window.estudiosComplementarios vacío: card de upload
   - Si hay documentos: una card por documento + botón "Añadir más"
```

### Helper `_renderTarjetaEstudio(cfg)`
Función común que genera estructura visual uniforme para todos los estudios.
Parámetros: `icon`, `iconBg`, `nombre`, `descripcion`, `estado`, `estadoBg`, `estadoFg`, `datoHtml`, `monitorFn`, `monitorLabel`, `accionesHtml`, `detalleHtml`.

### `abrirModalEscalasDiagnosticas(escalaId)` — modificada
Ahora acepta parámetro opcional. Si se pasa `escalaId` (ej. `'sf12'`), pre-selecciona la escala en el dropdown `#escala-nombre` y ejecuta `autocompletarEscalaDiagnostica()` antes de abrir el modal.

Mapa interno:
```js
{ sf12: 'SF-12', duke: 'Duke-UNC', cage: 'CAGE', predimed: 'PREDIMED' }
```

---

## Compatibilidad

| Función | Estado | Notas |
|---------|--------|-------|
| `ibseMonitor_abrir()` | ✅ Sin cambios | Tarjeta IBSE |
| `ibse_cargarCSV(this)` | ✅ Sin cambios | Tarjeta IBSE |
| `ibse_borrarDatos()` | ✅ Sin cambios | Tarjeta IBSE |
| `cargarEstudiosComplementarios(this)` | ✅ Sin cambios | Estudios documentales |
| `cargarEstudioTextoLibreSec03(this)` | ✅ Sin cambios | Estudios documentales |
| `_compasEscalasGet()` / `_compasEscalasSet()` | ✅ Sin cambios | Base de datos escalas |
| `guardarEscalaDiagnostica()` | ✅ Sin cambios | Modal escalas |
| `eliminarEscalaDiagnostica()` | ✅ Sin cambios | Modal escalas |
| `generarResumenEscalasDiagnosticas()` | ✅ Sin cambios | Usado en síntesis IA |
| `renderizarListadoEscalasDiagnosticas()` | ✅ Sin cambios | Listado en modal |
| `abrirModalEscalasDiagnosticas()` | ✅ Retrocompatible | Acepta escalaId opcional; sin argumento funciona igual que antes |

---

## Pendiente

| Ítem | Estado | Prioridad |
|------|--------|-----------|
| Monitor real SF-12 (visualización de PCS/MCS, distribución) | Provisional (usa modal de registro) | Media |
| Monitor real Duke-UNC (distribución de puntuación, subgrupos) | Provisional (usa modal de registro) | Media |
| Monitor real CAGE (% cribado positivo, comparativa) | Provisional (usa modal de registro) | Baja |
| Monitor real PREDIMED (distribución de adherencia) | Provisional (usa modal de registro) | Baja |
| Validación en navegador de preselección de escala al abrir modal | Pendiente de prueba | Alta |
| Snapshot — no crear hasta validación | En espera | — |

---

*Reestructuración aplicada mediante `patch_estudios_v2.py`*
*Script anterior: `patch_estudios.py` (v1, 2026-03-14, obsoleto)*

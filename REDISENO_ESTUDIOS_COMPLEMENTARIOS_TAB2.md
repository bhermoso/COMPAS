# Rediseño: Acordeón de Estudios Complementarios (TAB 2)

Fecha: 2026-03-14
Archivo afectado: `index.html`
Función principal: `renderizarSeccionEstudios()`

---

## Situación antes del rediseño

### Estructura previa

El acordeón de TAB 2 renderizaba tres tipos de contenido con pesos visuales y estructuras distintas:

| Estudio | Render previo | Monitor | Color/Estilo |
|---------|--------------|---------|--------------|
| **IBSE** | Card especial con barras de factores, ícono de semáforo, diseño propio | `ibseMonitor_abrir()` / `ibse_abrirMonitor()` | Verde (#ecfdf5), cabecera diferenciada |
| **Estudios complementarios** | Lista de documentos sin card estructurada, sin botón de monitor | Ninguno | Sin identidad visual propia |
| **Escalas diagnósticas** | Sección al final del acordeón, con color teal (#0f766e), peso visual distinto | `abrirModalEscalasDiagnosticas()` | Teal, tratamiento especial |

### Inconsistencias detectadas

1. IBSE tenía card con cabecera propia; los demás, no.
2. Estudios complementarios no tenían botón de acceso a visor.
3. Escalas diagnósticas estaban visualmente separadas del resto, con color diferente.
4. No existía un helper común de render: cada bloque era código ad-hoc.
5. Dos nombres de función para el monitor IBSE: `ibseMonitor_abrir()` y `ibse_abrirMonitor()`.

---

## Cambios realizados

### Nuevas funciones insertadas

#### `_renderTarjetaEstudio(cfg)`
Helper común que genera una card homogénea para cualquier estudio complementario.

Parámetros de configuración (`cfg`):
- `icon` — emoji del ícono de cabecera
- `iconBg` — color de fondo del ícono
- `nombre` — título del estudio
- `descripcion` — subtítulo/descripción breve (opcional)
- `estado` — etiqueta de estado (badge)
- `estadoBg` / `estadoFg` — color del badge
- `datoHtml` — HTML del cuerpo de datos (opcional)
- `monitorFn` — llamada JS del botón monitor (ej. `ibseMonitor_abrir()`)
- `monitorLabel` — etiqueta del botón (default: `📊 Abrir monitor`)
- `accionesHtml` — HTML de botones adicionales opcionales
- `detalleHtml` — HTML del bloque `<details>` desplegable (opcional)

#### `estudiosComplementarios_abrirVisor(nombre, texto)`
Modal genérico de texto para estudios sin monitor propio (PDF/Word/txt/CSV cargados como texto).
- Crea un `div#modal-visor-estudio` dinámicamente si no existe.
- Cierra al hacer clic en el fondo.
- Muestra el texto con `white-space: pre-wrap`.

#### `_estudioComplementarioVisor(idx)`
Acceso por índice para usar en atributos `onclick` inline:
```js
_estudioComplementarioVisor(0) // abre window.estudiosComplementarios[0]
```

### Reescritura de `renderizarSeccionEstudios()`

Tres tarjetas de igual peso visual, en este orden:

#### Tarjeta 1 — IBSE
- Ícono: 📊 · Fondo: #ecfdf5
- Con datos: muestra score, barras de 4 factores, badge de semáforo (🟢/🟡/🔴)
- Sin datos: estado "Sin datos", solo botón de carga CSV
- Monitor: `ibseMonitor_abrir()`
- Acciones extra: `ibse_cargarCSV(this)` · `ibse_borrarDatos()`
- Detalle desplegable: descripción de factores y umbrales

#### Tarjeta 2 — Estudios complementarios
- Ícono: 📁 · Fondo: #f0f9ff
- Sin estudios: drop-zone + textarea para texto libre
- Con estudios: una card por estudio (`window.estudiosComplementarios[idx]`), más botón "Añadir más"
- Monitor: `_estudioComplementarioVisor(idx)` → abre `estudiosComplementarios_abrirVisor()`
- Etiqueta botón: `📊 Abrir visor`

#### Tarjeta 3 — Escalas diagnósticas
- Ícono: 🧪 · Fondo: #f0fdfa
- Muestra resumen generado por `generarResumenEscalasDiagnosticas()`
- Badge: N registradas / Sin registrar
- Monitor: `abrirModalEscalasDiagnosticas()`
- Instrumentos: SF-12, Duke-UNC, CAGE, PREDIMED

---

## Compatibilidad

| Función preexistente | Uso en nuevo código | Estado |
|----------------------|---------------------|--------|
| `ibseMonitor_abrir()` | Tarjeta 1, botón monitor | ✅ Mantenido |
| `ibse_abrirMonitor()` | No usado en render (existe en otro contexto) | ✅ Sin tocar |
| `ibse_cargarCSV(this)` | Tarjeta 1, input file | ✅ Mantenido |
| `ibse_borrarDatos()` | Tarjeta 1, botón borrar | ✅ Mantenido |
| `cargarEstudiosComplementarios(this)` | Tarjeta 2, input file | ✅ Mantenido |
| `cargarEstudioTextoLibreSec03(this)` | Tarjeta 2, textarea | ✅ Mantenido |
| `abrirModalEscalasDiagnosticas()` | Tarjeta 3, botón monitor | ✅ Mantenido |
| `generarResumenEscalasDiagnosticas()` | Tarjeta 3, resumen | ✅ Mantenido |

---

## Monitores provisionales

| Estudio | Monitor | Tipo |
|---------|---------|------|
| IBSE | `ibseMonitor_abrir()` → `monitor_ibse.html` (iframe) | Real |
| Estudios complementarios | `estudiosComplementarios_abrirVisor()` (modal inline) | Provisional |
| Escalas diagnósticas | `abrirModalEscalasDiagnosticas()` (modal inline) | Real |

---

## Pendiente de validación

- [ ] Comprobar render en navegador: TAB 2 → sección estudios
- [ ] Verificar carga CSV IBSE → actualiza tarjeta 1
- [ ] Verificar carga de estudios complementarios → genera tarjeta(s) 2
- [ ] Verificar apertura del visor de texto
- [ ] Verificar apertura del modal de escalas diagnósticas
- [ ] Snapshot cuando se confirme OK

---

*Rediseño aplicado mediante `patch_estudios.py`*

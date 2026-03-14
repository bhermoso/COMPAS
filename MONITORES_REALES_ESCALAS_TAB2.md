# Monitores reales para escalas diagnósticas — TAB 2

Fecha: 2026-03-14
Archivo nuevo: `monitor_escalas.html`
Función nueva: `escalaMonitor_abrir(escalaId)` en `index.html`

---

## 1. Cómo se almacenan las escalas

### Estructura de datos

Cada escala registrada en COMPÁS es un objeto con 7 campos:

```javascript
{
  nombre_escala:       "SF-12",         // clave de identificación
  fuente_estudio:      "Estudio local", // texto libre
  anio_estudio:        "2025",          // número o texto
  tamano_muestra:      "320",           // número o texto
  resultado_principal: "PCS medio 47 / MCS medio 51",  // texto libre
  interpretacion:      "Calidad de vida en rango intermedio...",
  observaciones:       "Resultados agregados de muestra comunitaria."
}
```

Las escalas NO tienen datos individuales por participante — son registros agregados (resúmenes de estudio). El usuario introduce manualmente `resultado_principal` e `interpretacion`.

### Almacenamiento en memoria

- Array global: `window.compasEscalasDiagnosticas[]`
- Acceso: `_compasEscalasGet()` / `_compasEscalasSet(arr)`

### Ruta Firebase

```
estrategias/{estrategiaActual}/municipios/{municipio}/estudiosComplementariosEscalas
```

### Funciones de carga/guardado

| Función | Propósito |
|---------|-----------|
| `_guardarEscalasFirebase()` | Escribe el array a Firebase |
| `_cargarEscalasFirebase(municipio)` | Lee de Firebase, actualiza `window.compasEscalasDiagnosticas`, llama a `renderizarSeccionEstudios()` |
| `guardarEscalaDiagnostica()` | Guarda desde formulario del modal, llama a `_guardarEscalasFirebase()` |
| `eliminarEscalaDiagnostica(idx)` | Borra por índice, actualiza Firebase |

---

## 2. Monitor que usa cada escala

| Escala | Función botón "📊 Abrir monitor" | Archivo destino |
|--------|----------------------------------|-----------------|
| IBSE | `ibseMonitor_abrir()` | Modal inline en `index.html` (Firebase: `ibse_respuestas/{mun}`) |
| SF-12 | `escalaMonitor_abrir('sf12')` | `monitor_escalas.html?tipo=sf12` |
| Duke-UNC | `escalaMonitor_abrir('duke')` | `monitor_escalas.html?tipo=duke` |
| CAGE | `escalaMonitor_abrir('cage')` | `monitor_escalas.html?tipo=cage` |
| PREDIMED | `escalaMonitor_abrir('predimed')` | `monitor_escalas.html?tipo=predimed` |
| Estudios documentales | `estudiosComplementarios_abrirVisor()` | Modal inline en `index.html` |

### Lógica de `escalaMonitor_abrir(escalaId)`

```
1. Buscar el registro en _compasEscalasGet() por nombre_escala
2. Si no tiene datos (resultado_principal vacío):
      → abrir abrirModalEscalasDiagnosticas(escalaId) [modal de registro preseleccionado]
3. Si tiene datos:
      → escribir en localStorage['compas_monitor_escala'] = { tipo, escala, municipio, municipioNombre, timestamp }
      → abrir monitor_escalas.html?tipo={escalaId} en ventana nueva (960×760)
      → si popup bloqueado: abrir en pestaña nueva (_blank)
```

### Bridge de datos

`monitor_escalas.html` **no tiene conexión directa con Firebase**. Lee los datos desde `localStorage['compas_monitor_escala']`, que `escalaMonitor_abrir()` escribe justo antes de abrir la ventana. Esto garantiza:
- No necesita conocer la configuración de Firebase
- Funciona aunque la escala no esté persistida todavía
- Los datos del municipio actual siempre están disponibles

---

## 3. Qué muestra cada monitor (`monitor_escalas.html?tipo=X`)

El monitor tiene estructura visual idéntica a la identidad COMPÁS (paleta, tipografía, franja degradada). Layout: topbar + grid de cards.

### Cards comunes a todos los tipos

| Card | Contenido |
|------|-----------|
| **Resultado + Visualización** | Texto del resultado registrado · Badge de estado · Visualización gráfica |
| **Interpretación** | Texto de `interpretacion` del registro · Observaciones (si existen) |
| **Referencia clínica** | Tabla de umbrales validados del instrumento · Marcador del resultado actual |
| **Datos del estudio** | Muestra (n) · Año · Fuente/nombre del estudio |
| **Descripción técnica** | Número de ítems, escala, punto de corte, referencia bibliográfica |

### Visualizaciones específicas por tipo

**SF-12 (`?tipo=sf12`)**
- Parser: extrae PCS y MCS del texto libre (`"PCS medio 47 / MCS medio 51"`)
- Dos bloques independientes: PCS (físico) y MCS (mental)
- Barra 0–100 con línea de referencia en 50 para cada componente
- Colores: verde ≥55 · azul 45–55 · ámbar 35–45 · rojo <35

**Duke-UNC (`?tipo=duke`)**
- Parser: extrae puntuación numérica del texto libre (`"Puntuación media 41"`)
- Barra 11–55 con marcador de corte en 32
- Umbrales: Alto ≥44 · Moderado 32–43 · Bajo <32

**CAGE (`?tipo=cage`)**
- Parser: extrae porcentaje (`"6% con resultado..."`)
- Barra 0–100% con referencia en ~5%
- Umbrales: Sin señal <5% · Señal moderada 5–10% · Señal relevante >10%

**PREDIMED (`?tipo=predimed`)**
- Parser: extrae puntuación (`"Puntuación media 7 sobre 14"`, detecta patrón "X sobre")
- Barra 0–14 con marcador de corte en 9
- Umbrales: Alta adherencia ≥9 · Intermedia 7–8 · Baja <7

### Comportamiento sin datos numéricos

Si el parser no puede extraer un valor numérico del `resultado_principal`, el bloque de visualización muestra un aviso. La card de interpretación sigue mostrando el texto registrado.

### Comportamiento sin datos de escala

Si `escalaMonitor_abrir()` se llama sin datos registrados, abre automáticamente el modal de registro (`abrirModalEscalasDiagnosticas()`). Si se accede directamente a `monitor_escalas.html` sin localStorage, muestra pantalla de "Sin datos disponibles" con botón "Volver a COMPÁS".

---

## 4. Funciones del TAB 2 actualizadas

### `escalaMonitor_abrir(escalaId)` — Nueva

Inserada en `index.html` justo antes de `_renderTarjetaEstudio()` (línea ~23591).

### `renderizarSeccionEstudios()` — 2 cambios

1. **`monitorFn` del loop `ESCALAS_CFG.forEach`**: cambiado de `abrirModalEscalasDiagnosticas('...')` a `escalaMonitor_abrir('...')`
2. **`accionesHtml`**: cuando la escala no tiene datos, añade botón `✏️ Registrar datos` → `abrirModalEscalasDiagnosticas(cfg.id)`. Cuando tiene datos, `accionesHtml` queda vacío (acciones de borrado y recarga ya vienen del contexto).

### Sin cambios

| Función | Estado |
|---------|--------|
| `abrirModalEscalasDiagnosticas(escalaId)` | Sin cambios — sigue accesible vía botón "Registrar datos" y directamente |
| `guardarEscalaDiagnostica()` | Sin cambios |
| `eliminarEscalaDiagnostica(idx)` | Sin cambios |
| `_guardarEscalasFirebase()` | Sin cambios |
| `_cargarEscalasFirebase(municipio)` | Sin cambios |
| `ibseMonitor_abrir()` | Sin cambios — IBSE usa su propio monitor inline |
| `estudiosComplementarios_abrirVisor()` | Sin cambios — estudios documentales usan su propio visor |

---

## 5. Pendientes y limitaciones

### Escalas: datos solo agregados

Las escalas SF-12, Duke-UNC, CAGE y PREDIMED almacenan UN ÚNICO registro agregado por escala y municipio. No hay datos individuales por participante en Firebase para estas escalas. Consecuencias:

- **No hay distribución de valores individuales** — solo el resultado agregado
- **No hay análisis de subgrupos** — el monitor muestra lo que el técnico introdujo
- **El parser numérico depende del formato del texto libre** — si el técnico escribe en un formato muy atípico, el valor puede no extraerse correctamente

Si en el futuro se recogen datos individuales (formularios digitales, CSV), se puede actualizar `escalaMonitor_abrir()` para leer desde Firebase y renderizar distribuciones.

### Parser de SF-12: supone PCS/MCS en texto

El parser busca patrones `PCS medio N` y `MCS medio N`. Si el técnico escribe solo un número sin etiqueta, se usa como PCS sin MCS.

### Popup puede bloquearse

Los navegadores modernos bloquean `window.open()` iniciados sin interacción directa del usuario. `escalaMonitor_abrir()` hace fallback a `window.open('_blank')`, pero si el bloqueador de popups es agresivo, podría fallar. Solución futura: embed como iframe modal (patrón del IBSE monitor inline).

### LocalStorage: TTL no gestionado

Los datos en `localStorage['compas_monitor_escala']` persisten hasta que se sobreescriban o se borre el storage. No hay expiración automática. Si el usuario abre el monitor horas después de haberlo escrito, verá datos posiblemente desactualizados. Se añade `timestamp` al payload para diagnóstico futuro.

---

*Monitores implementados: 2026-03-14*
*Revisión humana recomendada antes de crear snapshot.*

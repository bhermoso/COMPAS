# Monitor real EAS — TAB 2

Fecha: 2026-03-14
Archivos nuevos: `monitor_eas.html`, `patch_monitor_eas.py`, `patch_eas_card.py`
Función nueva: `easMonitor_abrir()` en `index.html`

---

## 1. Estructura de datos EAS en COMPÁS

### Variables globales (index.html)

| Variable | Tipo | Contenido |
|----------|------|-----------|
| `ESTRUCTURA_DETERMINANTES` | `const` objeto | Definición de 55 indicadores en 3 áreas con código, texto, unidad y polaridad |
| `valoresMunicipio` | `let` objeto | `{ P7: 72.1, P7b: 65.2, ... }` — valores del municipio actual |
| `referenciasEAS` | `let` objeto | `{ P7: { refGranada: 70.0, refAndalucia: 68.0 }, ... }` |

### Ruta Firebase

```
estrategias/{estrategiaActual}/municipios/{municipio}/determinantes    ← valores
referencias/                                                            ← referenciasEAS
```

### 55 indicadores en 3 áreas

| Área | Grupos | Indicadores |
|------|--------|-------------|
| Área 1: Salud percibida y CVRS | 1 (SF-12) | 13 (P7–P13) |
| Área 2: Estilos de vida | 5 (tabaco, alcohol, sueño, AF, PREDIMED) | 22 |
| Área 3: Entorno y apoyo | 5 (vivienda, barrio, Duke-UNC, bienestar, economía) | 20 |
| **Total** | | **55** |

---

## 2. Textos reales de las preguntas EAS

Los textos usados en `monitor_eas.html` provienen del cuestionario oficial:
**CuestionarioUnificadoHogarAdultos_EAS2007a2023.pdf** (escritorio).

Contraste con etiquetas técnicas del editor (index.html que usan "Declara..."):

| Código | Etiqueta técnica en editor | Texto real del cuestionario |
|--------|----------------------------|-----------------------------|
| P7 | "Declara salud percibida buena o muy buena" | "¿En general, diría que su salud es buena o muy buena?" |
| P7b | "Declara salud mental percibida buena o muy buena" | "¿En general, diría que su salud mental es buena o muy buena?" |
| P8a | "Declara limitación para esfuerzos moderados" | "¿Su salud actual le limita para hacer esfuerzos moderados (mover una mesa, pasar el aspirador, caminar más de una hora)?" |
| P11 | "Declara que el dolor dificulta trabajo (bastante/mucho)" | "¿El dolor le ha dificultado bastante o mucho su trabajo habitual?" |
| P32_CAGE | "CAGE positivo (≥2 respuestas afirmativas)" | CAGE positivo — escala de cribado de problemas relacionados con el alcohol (4 ítems) |
| P57b1 | "Declara sentirse deprimido frecuentemente" | "¿Durante las últimas semanas se ha sentido deprimido/a con frecuencia o siempre?" |
| P71_dificultad | "Declara llegar a fin de mes con dificultad" | "¿Llega a fin de mes con dificultad (dificultad + mucha dificultad)?" |

Las etiquetas del editor mantienen el prefijo "Declara..." para recordar al técnico que son autoinformes.
El monitor muestra las preguntas reales para contextualizar el indicador al usuario final.

---

## 3. Tarjeta resumen EAS en TAB 2

Añadida al inicio del contenido de `generarSeccionDeterminantes()` (antes del acordeón de tabla).

### Elementos de la tarjeta

```
📊  Encuesta Andaluza de Salud (EAS) 2023
     Estimación municipal Bettersurveys · 55 indicadores en 3 áreas · Autorreporte poblacional (CAPI)
     [badge dinámico: "N/55 indicadores cargados"]              [📊 Abrir monitor EAS]
```

### Badge dinámico (`id="eas-resumen-badge"`)

Actualizado automáticamente tras `cargarDeterminantes()`:
- Sin datos: fondo amarillo — "Sin datos cargados"
- Con datos: fondo verde — "N/55 indicadores cargados"

---

## 4. Función `easMonitor_abrir()`

Insertada en `index.html` justo antes de `generarSeccionDeterminantes()`.

### Lógica

```
1. Leer valoresMunicipio (global) + fallback DOM (.det-input)
2. Leer referenciasEAS (global)
3. Si no hay datos → alert explicativo
4. Si hay datos:
     → escribir localStorage['compas_monitor_eas'] = { municipio, municipioNombre, valores, referencias, timestamp }
     → abrir monitor_eas.html en ventana 1100×820
     → si popup bloqueado: abrir en _blank
```

### Payload localStorage

```javascript
{
    municipio:       "cod_municipio",
    municipioNombre: "Nombre Municipio",
    valores:         { P7: 72.1, P7b: 65.2, ... },   // object de 55 entradas
    referencias:     { P7: { refGranada: 70.0, refAndalucia: 68.0 }, ... },
    timestamp:       1741953600000
}
```

### Fallback DOM

Si `valoresMunicipio` no está sincronizado con los inputs (edición en curso sin guardar),
lee los valores directamente de `document.querySelectorAll('.det-input')`.
Los valores DOM tienen prioridad sobre los de memoria mediante `Object.assign({}, valores, valoresDOM)`.

---

## 5. Archivo `monitor_eas.html`

Standalone. No tiene conexión directa con Firebase. Lee todo de `localStorage['compas_monitor_eas']`.

### Estructura visual

```
HEADER gradient (azul COMPÁS)
  → título, municipio, fecha, N/55 cargados

SUMMARY GRID (4 tarjetas)
  → Indicadores cargados · Señales detectadas · Por mejorar · Por encima

SEÑALES (panel desplegado)
  → Top 8 indicadores con mayor desviación de Andalucía (verde/rojo)
  → Código · Texto real de la pregunta · Valor mun · And · % desviación

NOTA METODOLÓGICA

3 ÁREAS (acordeones colapsables)
  → Por cada área: grupos → por cada indicador:
      Código EAS | Texto real de la pregunta | Tipo de dato
      Valor municipio (con color) | Ref Andalucía | Ref Granada
      Barra horizontal (barra gris = ref. Andalucía, marcador vertical = municipio)
```

### Colores de señal

| Color | Criterio polaridad 1 (más es mejor) | Criterio polaridad −1 (menos es mejor) |
|-------|--------------------------------------|----------------------------------------|
| Verde | Municipio > And × 1.05 | Municipio < And × 0.95 |
| Rojo | Municipio < And × 0.95 | Municipio > And × 1.05 |
| Gris | Diferencia < 5% o sin referencia | Igual |
| Neutro | polaridad = 0 (ej: horas de sueño) | — |

### Pantalla de error

Si `localStorage['compas_monitor_eas']` está vacío o corrupto: muestra pantalla "Sin datos disponibles" con botón "Cerrar ventana".

---

## 6. Funciones sin cambios

| Función | Estado |
|---------|--------|
| `generarSeccionDeterminantes()` | Se añade tarjeta al inicio, el resto sin cambios |
| `generarAreaDet(areaId)` | Sin cambios |
| `guardarDeterminantes()` | Sin cambios |
| `cargarDeterminantes()` | Se añade actualización de badge al final |
| `exportarDeterminantesCSV()` | Sin cambios |
| `cargarReferenciasEAS()` | Sin cambios |
| `actualizarColoresDeterminantes()` | Sin cambios |

---

## 7. Pendientes y limitaciones

### Datos solo agregados por municipio

La EAS en COMPÁS almacena un único valor por indicador por municipio (estimación media/porcentaje). No hay datos individuales por participante. El monitor visualiza la estimación agregada frente a la referencia autonómica.

### referenciasEAS puede estar vacío

Si el usuario no ha cargado referencias desde Firebase (`cargarReferenciasEAS()`), las barras de comparación no se mostrarán. El monitor sigue mostrando los valores del municipio pero sin barra de referencia.

### Popup puede bloquearse

`easMonitor_abrir()` hace fallback a `_blank`, pero navegadores con bloqueo agresivo pueden requerir permitir popups para `file://` o el dominio de producción.

### localStorage TTL no gestionado

Los datos persisten hasta sobreescritura. Se incluye `timestamp` para diagnóstico. Si el usuario abre el monitor horas después, verá los datos del último `cargarDeterminantes()` o `guardarDeterminantes()`.

### Parser de señales: umbral fijo 5%

El umbral de "señal" es una diferencia relativa > 5% respecto a la referencia de Andalucía. Para indicadores con valores muy pequeños (< 5%), este umbral puede generar señales con diferencias absolutas mínimas.

---

*Monitor EAS implementado: 2026-03-14*
*Revisión humana recomendada antes de crear snapshot.*

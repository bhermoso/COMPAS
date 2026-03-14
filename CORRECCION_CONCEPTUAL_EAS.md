# Corrección conceptual: terminología EAS en COMPÁS

Fecha: 2026-03-14
Archivo afectado: `index.html`
Scripts: `patch_eas_terminologia.py` + `patch_eas_terminologia_fix.py`

---

## Por qué "determinantes" era incorrecto en ese contexto

En epidemiología y salud pública, **determinantes de la salud** son los factores estructurales, sociales, económicos y ambientales que condicionan el estado de salud de la población (modelo Dahlgren-Whitehead, OMS).

La **Encuesta Andaluza de Salud (EAS)** es un instrumento de encuesta que recoge, entre otras cosas, autopercepción de salud, conductas declaradas (tabaco, alcohol, ejercicio, alimentación), situación socioeconómica y apoyo social. Sus preguntas e indicadores son **datos de la EAS**, no "determinantes".

**El problema:** COMPÁS utilizaba "determinantes" como nombre coloquial del bloque analítico que contiene las respuestas y valores de la EAS. Esto confundía dos planos:

| Plano | Concepto correcto | Uso incorrecto que se estaba haciendo |
|-------|-------------------|--------------------------------------|
| Conceptual | Determinantes de la salud = factores estructurales | "Determinantes" como nombre del bloque de datos EAS |
| Instrumental | Encuesta Andaluza de Salud (EAS) = instrumento de encuesta | "Determinantes" como sinónimo de "datos EAS" |

El efecto era que un usuario podía leer "cargados 40 determinantes" creyendo que COMPÁS estaba analizando factores estructurales de salud, cuando en realidad se refería a 40 preguntas/indicadores de la EAS con valor asignado.

---

## Zonas visibles corregidas

### Interfaz general

| Zona | Texto anterior | Texto nuevo |
|------|---------------|-------------|
| Portada — tarjeta "Analizar" | "Perfil de salud local, determinantes, indicadores y síntesis analítica." | "Perfil de salud local, indicadores EAS y síntesis analítica." |
| Gestor de fuentes — cabecera bloque | **Determinantes (EAS)** | **Encuesta Andaluza de Salud (EAS)** |
| Kit previo — lista de contenido | 🏠 Determinantes de la salud | 🏠 Indicadores EAS |

### TAB 2 — Perfil de salud local

| Zona | Texto anterior | Texto nuevo |
|------|---------------|-------------|
| Acordeón cabecera sección EAS | "03 Determinantes de la salud (Selección EAS 2023)" | "03 Encuesta Andaluza de Salud (EAS) — Selección 2023" |

### Panel de estado y badges

| Zona | Texto anterior | Texto nuevo |
|------|---------------|-------------|
| Badge inicial (DOM) | "📊 Determinantes: --" | "📊 EAS: --" |
| Badge JS dinámico (valor OK) | "📊 Determinantes: N/45" | "📊 EAS: N/45" |
| Badge JS dinámico (valor parcial) | "📊 Determinantes: N/45" | "📊 EAS: N/45" |
| Badge JS dinámico (valor 0) | "📊 Determinantes: 0/45" | "📊 EAS: 0/45" |

### Panel IA — checks de fuentes

| Zona | Texto anterior | Texto nuevo |
|------|---------------|-------------|
| Check HTML | "⬜ Determinantes EAS" | "⬜ Indicadores EAS" |
| Check JS (label dinámico) | ' Determinantes EAS' | ' Indicadores EAS' |

### Alertas y mensajes del sistema

| Zona | Texto anterior | Texto nuevo |
|------|---------------|-------------|
| Confirm borrar datos — ítem | "• Determinantes" | "• Indicadores EAS" |
| Alert carga CSV sin datos | "No se encontraron determinantes válidos en el CSV" | "No se encontraron indicadores EAS válidos en el CSV" |
| Estado HTML carga CSV OK | "✅ N/45 determinantes" | "✅ N/45 indicadores EAS" |
| Alert carga CSV OK | "N determinantes cargados correctamente" | "N indicadores EAS cargados correctamente" |
| Alert carga CSV parcial | "N/45 determinantes cargados (faltan X)" | "N/45 indicadores EAS cargados (faltan X)" |
| Lista de fuentes / ayuda | "Determinantes EAS (CSV)" | "Indicadores EAS (CSV)" |

### Descripciones de motores y tarjetas

| Zona | Texto anterior | Texto nuevo |
|------|---------------|-------------|
| Tarjeta motor síntesis | "determinantes e indicadores integrados" | "datos EAS e indicadores integrados" |
| Tarjeta motor priorización | "indicadores, determinantes y priorización ciudadana" | "indicadores EAS y priorización ciudadana" |

### Narrativa JS de análisis

| Zona | Texto anterior | Texto nuevo |
|------|---------------|-------------|
| Narrativa generada | "N determinantes de la Encuesta Andaluza de Salud" | "N indicadores de la Encuesta Andaluza de Salud" |

### Documentos generados (actas, agenda)

| Zona | Texto anterior | Texto nuevo |
|------|---------------|-------------|
| Diagnóstico comunitario | "el análisis de determinantes y un proceso de priorización" | "el análisis de indicadores EAS y un proceso de priorización" |
| Perfil de salud local (acta) | "determinantes y activos para la salud" | "indicadores EAS y activos para la salud" |
| Orden del día — punto 2 | "Presentación de los Determinantes de Salud — Encuesta de Activos y Salud (EAS)" | "Presentación de los Indicadores EAS — Encuesta Andaluza de Salud (EAS)" |
| Material de la sesión | "Los informes de determinantes e indicadores se enviarán" | "Los indicadores EAS se enviarán" |
| Acta sección 2 — título | "2. Determinantes de Salud presentados" | "2. Indicadores EAS presentados" |
| Acta sección 2 — subtítulo | "Encuesta de Activos y Salud (EAS)" | "Encuesta Andaluza de Salud (EAS)" |

### Hoja de ruta y agenda de seguimiento

| Zona | Texto anterior | Texto nuevo |
|------|---------------|-------------|
| Hoja de ruta — fases | "Determinantes sociales · Indicadores" | "Datos EAS · Indicadores" |
| Kit año 1 — descripción | "informe de salud, determinantes e indicadores" | "informe de salud, datos EAS e indicadores" |
| Kit años siguientes — descripción | "indicadores, determinantes y evidencias disponibles" | "indicadores EAS y evidencias disponibles" |
| Agenda seguimiento | "Revisión de indicadores, determinantes y nuevas evidencias" | "Revisión de indicadores EAS y nuevas evidencias" |

**Total: 28 sustituciones aplicadas en 26 zonas distintas.**

---

## Términos finales adoptados

| Contexto | Término adoptado |
|----------|-----------------|
| Nombre del bloque / sección | **Encuesta Andaluza de Salud (EAS)** |
| Nombre abreviado del bloque | **EAS** |
| Indicadores individuales de la encuesta | **indicadores EAS** |
| Datos del bloque en general | **datos EAS** |
| Badge de estado (campo corto) | **EAS:** |
| Corrección adicional | "Encuesta de Activos y Salud" → **Encuesta Andaluza de Salud** (nombre oficial) |

---

## Usos de "determinantes" que se mantienen (correctos)

Los siguientes usos de "determinantes" son conceptualmente correctos y **no se han modificado**:

### Usos epidemiológicos correctos (término propio de salud pública)

| Línea aprox. | Texto | Por qué se mantiene |
|-------------|-------|---------------------|
| Múltiples | "Equidad y determinantes sociales" | Nombre de área temática EPVSA (término oficial) |
| 9861 | "determinantes modificables con mayor impacto en la salud" | Uso epidemiológico correcto |
| 9910 | "determinantes más potentes de la salud" | Uso epidemiológico correcto |
| 9918 | "determinante más estructural de la salud" | Uso epidemiológico correcto |
| 10059 | "actuar sobre estos determinantes estructurales" | Uso epidemiológico correcto |
| 13352, 14603 | "determinantes que generan desigualdades en salud" | Texto oficial EPVSA |
| 24112 | "determinantes ambientales" | Uso epidemiológico correcto |
| 3758 | "acción sobre los determinantes de la salud" | Uso conceptual correcto |
| 1621 | "05 Determinantes sociales de la salud" | Sección del perfil sobre factores estructurales (no EAS) |
| 13370, 14621 | "Determinantes de la salud" (cabeceras PDF) | Capítulo de documento, uso conceptual |

---

## Renombres internos pendientes para otra fase

Los siguientes elementos usan "determinantes" internamente. **No se han modificado** porque:
- Son nombres de función, variable o CSS que no son visibles al usuario
- Cambiarlos requiere refactoring coordinado (romperían referencias internas)

| Elemento | Tipo | Ejemplos |
|----------|------|---------|
| Funciones JS | Nombre de función | `guardarDeterminantes()`, `cargarDeterminantes()`, `exportarDeterminantesCSV()`, `descargarPlantillaDeterminantes()`, `actualizarColoresDeterminantes()`, `generarSeccionDeterminantes()`, `cargarDeterminantesCSV()`, `generarDeterminantesCompletosPDF()` |
| Variables JS | Nombre de variable | `tieneDeterminantes`, `estadoDeterminantes`, `poblarDeterminantes`, `totalDeterminantes`, `TOTAL_DETERMINANTES_EPVSA` |
| Clases CSS | Nombre de clase | `.tabla-determinantes`, `.grupo-determinantes`, `.determinantes-tabs`, `.determinantes-area`, `.determinantes-tab` |
| IDs HTML | Atributo id | `id="estado-determinantes"`, `id="badge-determinantes"`, `id="seccion-determinantes"`, `id="ia-check-determinantes"` |
| Rutas Firebase | Path de base de datos | `municipios/{key}/determinantes` |
| Constantes | Nombre de constante | `TOTAL_DETERMINANTES_EPVSA` |
| Claves de datos | Objeto JS / Firebase | `datos.determinantes`, `paquete.determinantes`, `fuente_tipo: 'determinantes'` |
| Comentarios de código | Comentarios internos | Varios (no visibles en UI) |

**Refactoring recomendado para fase posterior:**
- Renombrar claves Firebase: `determinantes` → `indicadoresEAS` (requiere migración de datos)
- Renombrar funciones JS: `guardarDeterminantes` → `guardarIndicadoresEAS` etc.
- Renombrar clases CSS: `.tabla-determinantes` → `.tabla-eas` etc.
- Renombrar constante: `TOTAL_DETERMINANTES_EPVSA` → `TOTAL_INDICADORES_EAS`

Este refactoring es una tarea de ingeniería independiente que no afecta a la UI visible pero mejora la coherencia del código.

---

*Corrección aplicada mediante `patch_eas_terminologia.py` + `patch_eas_terminologia_fix.py`*
*Revisión humana recomendada antes de persistir versiones.*

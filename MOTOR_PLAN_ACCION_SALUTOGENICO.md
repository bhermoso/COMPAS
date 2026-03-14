# Motor Plan de Acción Salutogénico — COMPÁS v2.0

Fecha: 2026-03-14
Archivo: `ia/motores/motorPlanAccion.js`
Versión anterior: 1.x (iteraciones 1–8)
Versión actual: **2.0 (iteración 9)**

---

## 1. Lógica del motor

### Principio rector

El motor ya no parte de un listado de problemas para asignar líneas de intervención. Parte de lo que el municipio **tiene y puede hacer** (activos, capacidades, oportunidades) para identificar qué líneas EPVSA están mejor respaldadas localmente.

Cadena lógica:

```
señal relevante → activo local aplicable → oportunidad comunitaria
      → línea EPVSA → programa (orden comunitario) → actuaciones
```

### Flujo de ejecución (`ejecutarFn`)

```
1. _extraerFuentes(contextoIA)
      → lista de fuentes disponibles para trazabilidad

2. _obtenerAnalisisAccionable(analisis, contextoIA)
      → si window.analisisAccionable existe y tiene activosDetectados[]
            → lo usa directamente (motorSintesisPerfil v3+)
        si no
            → _derivarAnalisisAccionable() desde analisisActual

3. _llamarGeneradorLocal(contextoIA)
      → llama a _generarPropuestaLocal() (heredada del HTML monolito)
      → obtiene { propuestaEPVSA[], seleccionNormalizada[] }

4. _normalizarPropuesta(resultado, contextoIA, fuentes, aa)
      → _enriquecerPropuestaSalutogenica(propuestaEPVSA, aa)
           Para cada línea EPVSA:
             a. _extraerAreasLinea(linea) → áreas temáticas de la línea
             b. Cruza con aa.activosDetectados[] por área (top 3)
             c. Cruza con aa.oportunidadesAccion[] por área (primero encontrado)
             d. Reescribe justificacion: "Activos locales: X; Y. Oportunidad: Z. [texto original]"
             e. Ordena programas_sugeridos[] por _ORDEN_AMBITO
             f. Añade campos nuevos (no sobrescribe los existentes):
                  activosAplicables[], oportunidadComunitaria,
                  capacidadComunitaria, colectivosPrioritarios[], enfoqueSalutogenico:true
      → _construirJustificacion() → parte de nActivos y nOportunidades, no de problemas
      → _extraerAccionesSugeridas() → incluye activoDeLinea por acción
      → devuelve SalidaMotor normalizada

5. _calcularConfianza()
      → base = nFuentes * 0.16 (máx 0.80)
      → +0.08 si hay participación ciudadana
      → +0.05 si ≥ 4 líneas propuestas
      → +0.03 si analisisAccionable tiene ≥ 2 activos y ≥ 1 oportunidad (bonus salutogénico)
      → máximo: 0.93
```

### Orden de preferencia de programas (`_ORDEN_AMBITO`)

| Ámbito | Orden |
|--------|-------|
| Comunitario | 0 (primero) |
| Educativo | 1 |
| Laboral | 2 |
| Servicios sociales | 2 |
| Información y comunicación | 3 |
| Formación e investigación | 3 |
| Empresarial | 3 |
| Sanitario | 4 (último) |

El motor no elimina programas sanitarios: los mantiene pero los coloca al final de la lista cuando hay alternativas comunitarias equivalentes.

### Derivación de `analisisAccionable` (fallback)

Cuando `window.analisisAccionable` no existe (fases iniciales del pipeline), el motor deriva la estructura completa desde `analisisActual`:

| Campo derivado | Fuente en analisisActual |
|---|---|
| `activosDetectados[]` | `fortalezas[]` |
| `oportunidadesAccion[]` | `oportunidades[]` |
| `capacidadesComunitarias[]` | `participacion` + `narrativa.activos` |
| `senalesRelevantes[]` | `alertasInequidad[]` + `datosAnalisis.indicadoresAMejorar[]` |
| `colectivosPrioritarios[]` | `alertasInequidad[].colectivo` únicos |
| `entornosPrioritarios[]` | 4 entornos fijos (comunitario, escolar, laboral, sanitario) |

El grado de confianza del objeto derivado se marca en `trazabilidad.gradoConfianza = 0.55` (inferior al nativo, que llegará a 0.85+).

---

## 2. Ejemplo de propuesta generada

**Municipio hipotético:** Maracena
**Fuentes disponibles:** Informe de salud + Indicadores EAS + Priorización ciudadana (28 participantes)
**analisisAccionable:** derivado de analisisActual (motorOrigen: 'derivado_analisisActual')

### Justificación global generada

```
Para Maracena, el análisis salutogénico identifica 4 activos locales
(destacado: Alta tasa de actividad física en mayores de 65 años)
y 3 oportunidades de acción comunitaria
(principal: Tejido asociativo activo en barrio norte) que fundamentan
la propuesta de 3 líneas estratégicas EPVSA (LE2, LE3, LE5).
Propuesta elaborada a partir de: Informe de situación de salud,
Indicadores EAS, Priorización ciudadana (28 participantes),
Análisis salutogénico (activos + oportunidades).
Áreas de acción prioritarias: Actividad física, Alimentación saludable,
Salud mental.
Las actuaciones propuestas son de carácter comunitario, municipal
e intersectorial.
Requiere revisión y validación técnica antes de incorporarse al
Plan Local de Salud.
```

### Ejemplo de línea EPVSA enriquecida (LE3 — Alimentación saludable)

**Antes (v1.x):**
```json
{
  "lineaId": 3,
  "lineaCodigo": "LE3",
  "titulo": "Alimentación saludable",
  "relevancia": 82,
  "justificacion": "Áreas relacionadas: Alimentación, Obesidad. Alta prevalencia de sobrepeso en la EAS 2023.",
  "programas_sugeridos": [
    { "codigo": "P3A", "ambito": "Sanitario", "actuaciones_tipo": ["consejo_dietetico"] },
    { "codigo": "P3B", "ambito": "Educativo", "actuaciones_tipo": ["taller_nutricion"] },
    { "codigo": "P3C", "ambito": "Comunitario", "actuaciones_tipo": ["mercado_saludable"] }
  ],
  "objetivos": ["OBJ3.1", "OBJ3.2"],
  "temasCiudadanos": ["alimentación", "peso"],
  "origenCiudadano": true
}
```

**Después (v2.0):**
```json
{
  "lineaId": 3,
  "lineaCodigo": "LE3",
  "titulo": "Alimentación saludable",
  "relevancia": 82,
  "justificacion": "Activos locales: Huerto comunitario activo en zona norte; Mercado municipal con productores locales. Oportunidad: Proyecto 'Come bien' con 3 centros escolares disponible. Áreas relacionadas: Alimentación, Obesidad. Alta prevalencia de sobrepeso en la EAS 2023.",
  "programas_sugeridos": [
    { "codigo": "P3C", "ambito": "Comunitario", "actuaciones_tipo": ["mercado_saludable"] },
    { "codigo": "P3B", "ambito": "Educativo", "actuaciones_tipo": ["taller_nutricion"] },
    { "codigo": "P3A", "ambito": "Sanitario", "actuaciones_tipo": ["consejo_dietetico"] }
  ],
  "objetivos": ["OBJ3.1", "OBJ3.2"],
  "temasCiudadanos": ["alimentación", "peso"],
  "origenCiudadano": true,
  "activosAplicables": [
    { "id": "activo_0", "area": "Alimentación", "texto": "Huerto comunitario activo en zona norte" },
    { "id": "activo_1", "area": "Alimentación", "texto": "Mercado municipal con productores locales" }
  ],
  "oportunidadComunitaria": "Proyecto 'Come bien' con 3 centros escolares disponible",
  "capacidadComunitaria": "Proceso participativo con 28 participantes registrados.",
  "colectivosPrioritarios": [
    { "id": "col_mujeres_mayores", "nombre": "Mujeres mayores" }
  ],
  "enfoqueSalutogenico": true
}
```

**Cambios observables:**
- La justificación abre con activos y oportunidad, no con el problema
- Los programas están reordenados: Comunitario (P3C) → Educativo (P3B) → Sanitario (P3A)
- 5 campos nuevos añadidos (sin eliminar ninguno existente)

---

## 3. Cambios respecto al motor anterior

| Aspecto | v1.x | v2.0 |
|---------|------|------|
| Punto de partida de la propuesta | Problema / déficit detectado | Activo local + oportunidad comunitaria |
| Justificación de cada línea | Describe el problema | Abre con activos aplicables |
| Orden de programas | Sin orden definido (índice EPVSA) | Comunitario → Educativo → Intersectorial → Sanitario |
| `window.analisisAccionable` | No leído | Leído si existe; si no, derivado automáticamente |
| Campos por línea EPVSA | Estructura base EPVSA | + `activosAplicables`, `oportunidadComunitaria`, `capacidadComunitaria`, `colectivosPrioritarios`, `enfoqueSalutogenico` |
| Fuentes en trazabilidad | "Determinantes EAS" | "Indicadores EAS" + "Análisis salutogénico (activos + oportunidades)" |
| Justificación global | Lista de áreas problemáticas | Cantidad de activos y oportunidades identificados; áreas de acción |
| `accionesSugeridas[]` | `lineaId`, `programa`, `actuacion`, `ambito` | + `activoDeLinea` (activo que fundamenta la actuación) |
| Bonus de confianza | Sin bonus salutogénico | +0.03 si ≥ 2 activos y ≥ 1 oportunidad en analisisAccionable |
| Función de compatibilidad heredada | `salidaDesdePropuestaHeredada()` no existía | Añadida: integra propuestas ya aplicadas al sistema modular |

---

## 4. Compatibilidades mantenidas

Las siguientes funciones del HTML monolito se usan **sin modificación** y siguen funcionando con la salida del motor v2.0:

| Función | Ubicación aprox. | Por qué sigue funcionando |
|---------|-----------------|--------------------------|
| `renderizarPropuestaIA()` | HTML l.26543 | Lee `propuestaEPVSA[]` por índice. Los campos nuevos son ignorados. |
| `aceptarPropuesta()` | HTML l.10515 | Lee `lineaId`, `relevancia`, `justificacion`, `objetivos[]`, `programas[]`. Todos preservados. |
| `convertirPropuestaASeleccion()` | HTML l.11362 | Itera `propuestaEPVSA[]` por `lineaId`. Sin dependencia de campos nuevos. |
| `aplicarPropuestaACheckboxes()` | HTML l.10588 | Usa `seleccionNormalizada[]`. Estructura sin cambios. |
| `_generarPropuestaLocal()` | HTML l.26092 | Sigue siendo la fuente de `propuestaEPVSA[]`. El motor la envuelve, no la reemplaza. |

### Contratos preservados en `SalidaMotor`

```
{
  datos: {
    lineasPropuestas[]:      // propuestaEPVSA[] enriquecido (retrocompat. total)
    seleccionNormalizada[]:  // sin cambios
    justificacionGlobal:     // string (formato cambia, pero sigue siendo string)
    accionesSugeridas[]:     // + activoDeLinea (campo adicional, no rompe lectores)
    analisisBase:            // analisisPrevio o analisisActual (sin cambios)
  },
  gradoConfianza:            // 0–0.93
  estadoRevisionHumana:      // siempre 'pendiente' en ejecución nueva
  trazabilidadId:            // string
  motorId:                   // 'motor_plan_accion'
  motorVersion:              // '2.0'
}
```

---

## 5. Pendientes de implementación (fases siguientes)

| Tarea | Impacto | Prioridad |
|-------|---------|-----------|
| Crear `construirAnalisisAccionable()` nativa en index.html | Motor usaría datos más ricos (no derivados) | Alta |
| Actualizar `adaptarSalidaMotorPlanAFormatoUI()` en index.html | Leer activos y oportunidades de `analisisAccionable` | Media |
| motorSintesisPerfil v3: generar `window.analisisAccionable` | Activa el flujo nativo automáticamente | Alta (pipeline) |
| Renombrado interno de variables `determinantes` → `indicadoresEAS` | Coherencia de código (no afecta UI) | Baja |

---

*Motor implementado en `ia/motores/motorPlanAccion.js` — iteración 9*
*Documento generado: 2026-03-14*

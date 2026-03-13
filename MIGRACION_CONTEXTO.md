# MIGRACIÓN DE CONTEXTO — COMPÁS Iteración 2
> Estado global mínimo + contexto territorial centralizado.
> Fecha: 2026-03-12. No se ha modificado lógica del monolito.

---

## 1. Estructuras de estado que existen ahora

### 1.1 Sistema heredado (intacto en COMPAS.html, sin modificar)

| Variable | Tipo | Línea HTML | Descripción |
|---|---|---|---|
| `datosMunicipioActual` | objeto Firebase completo | 4206 | Fuente primaria de datos del municipio |
| `planLocalSalud` | `{ municipio, perfil, planAccion, agenda, cuadroMandos }` | 4213 | Compilador de fases |
| `window.COMPAS` | namespace global | 4242 | Bridge principal del sistema |
| `window.COMPAS.state` | estado operativo del plan | 4243 | Selección EPVSA, planAccion, etc. |
| `window.COMPAS.prioridades` | namespace de prioridades | 4247 | Unifica tematicas, epvsa, relas, fusion |
| `window.COMPAS.mapa` | grafo del plan | 4252 | Generado por `planMapa_generarGrafo()` |
| `estrategiaActual` | string | 4263 | Estrategia activa hardcodeada |
| `accionesAgenda` | array de actuaciones | global | Agenda anual activa |
| `referenciasEAS` | objeto referencias | global | Referencias Andalucía/Granada |
| `window.analisisActual` | objeto análisis v2 | derivado | Generado por `analizarDatosMunicipio()` |
| `window.analisisActualV3` | objeto análisis v3 | derivado | Generado por motor v3 IIFE |

### 1.2 Sistema modular nuevo (core/estadoGlobal.js)

| Campo | Tipo | Fuente | Descripción |
|---|---|---|---|
| `ambitoTerritorialActivo` | `{ key, nombre, tipo, estrategia }` | contextoTerritorial | Ámbito activo normalizado |
| `planTerritorialActivo` | objeto | bridge COMPAS.state | Plan activo (bridge, no reemplaza planLocalSalud) |
| `usuario` | null (placeholder) | — | Reservado para autenticación futura |
| `configuracionSistema` | objeto | COMPAS_VERSION + estrategiaActual | Metadatos de configuración |
| `vistaActiva` | número (1-6) | DOM (.fase.activa) | Fase activa actual |

**Acceso al estado modular:**
```js
// Desde módulos ES (import)
import { get, getEstado, subscribe } from './core/estadoGlobal.js';

// Desde código heredado (sin imports, via window)
window.COMPAS.__estadoGlobal.get('ambitoTerritorialActivo');
window.COMPAS.__estadoGlobal.config.anioInicioImplantacion;  // → 2026
```

---

## 2. Cómo se obtiene el ámbito activo

### Antes de esta iteración (único método):
```js
// Dependencia directa del DOM — imposible usar fuera de contexto UI
document.getElementById('municipio').value  // → 'padul'
getMunicipioActual()  // wrapper del DOM (función heredada, l.~7584)
```

### Después de esta iteración (tres métodos, por orden de preferencia):

**Método 1 — Modular (recomendado para código nuevo):**
```js
import { getAmbitoActivo } from './core/contextoTerritorial.js';
const ambito = getAmbitoActivo();
// → { key: 'padul', nombre: 'Padul', tipo: 'municipio', estrategia: 'es-andalucia-epvsa' }
```

**Método 2 — Bridge desde código heredado (sin imports):**
```js
window.COMPAS.__contextoTerritorial.getAmbitoActivo();
window.COMPAS.__ambitoActivo;  // sincronizado automáticamente
```

**Método 3 — Heredado (sigue funcionando, no eliminado):**
```js
getMunicipioActual()           // → 'padul' (string, sin enriquecer)
document.getElementById('municipio').value  // → 'padul'
```

### Cadena de actualización del ámbito:

```
Usuario cambia #municipio selector
        │
        ├── Listener 1 (heredado, HTML l.13159):
        │       actualizarMunicipio()
        │         → resetearPlanLocal()
        │         → cargarReferenciasEAS()
        │         → cargarDatosMunicipioFirebase()
        │         → cargarParticipacionCiudadana()
        │         → verificarYGenerarAnalisisAutomatico() [setTimeout 1000ms]
        │
        └── Listener 2 (NUEVO, core/contextoTerritorial.js):
                setAmbitoActivo({ key, nombre, tipo, estrategia })
                  → window.COMPAS.__ambitoActivo actualizado
                  → estadoGlobal notifica suscriptores
```

Los dos listeners son **independientes y no interferentes**. El Listener 2 solo sincroniza el estado modular; nunca llama a `actualizarMunicipio()`.

---

## 3. Qué sigue dependiendo del sistema heredado

### No modificado en esta iteración:

| Componente | Estado | Razón |
|---|---|---|
| `actualizarMunicipio()` | **Intacto** | Función pivote con 15+ efectos secundarios — no tocar |
| `getMunicipioActual()` | **Intacto** | Sigue leyendo del DOM; compatibilidad total |
| `datosMunicipioActual` | **Intacto** | Fuente primaria de datos Firebase — no mover |
| `planLocalSalud` | **Intacto** | Compilador de fases — no mover |
| `accionesAgenda` | **Intacto** | Gestión de agenda anual — no mover |
| `estrategiaActual` | **Intacto** | Variable `var` en HTML — se lee pero no se reemplaza |
| `resetearPlanLocal()` | **Intacto** | Sigue reseteando `planLocalSalud` y `window.COMPAS.state` |
| Priorización compleja | **Intacto** | Motor v2, v3, VRELAS, EPVSA — fuera de alcance |
| Evaluación Fase 6 | **Intacto** | `eval_actualizarFase6()` y family — fuera de alcance |
| Motores IA | **Intacto** | ANALYTIC_CONFIG, COMPAS_EXPERT_SYSTEM — fuera de alcance |
| Generación documental | **Intacto** | PLS, Plan, Perfil — fuera de alcance |
| Firebase (todas las rutas) | **Intacto** | No se ha encapsulado — pendiente iteración 3 |

### Dependencias DOM que siguen sin eliminar:

| Dependencia | Función heredada | Módulo futuro |
|---|---|---|
| `document.getElementById('municipio').value` | `getMunicipioActual()` | `core/ambito.js` (iter. futura) |
| Lectura de checkboxes EPVSA | `obtenerSeleccionActual()` | `dominio/plan/PlanTerritorial.js` |
| Lectura de inputs determinantes | `guardarDeterminantes()` | `dominio/diagnostico/` |
| `.fase.activa[data-fase]` | `verificarAccesoFase6()` | `ui/fases/` |

---

## 4. Hardcodes de primer nivel resueltos

### En `core/estadoGlobal.js` (código nuevo — sin tocar el monolito):

| Constante exportada | Valor | Equivalente heredado | Línea HTML |
|---|---|---|---|
| `ESTRATEGIA_POR_DEFECTO` | `'es-andalucia-epvsa'` | `var estrategiaActual = 'es-andalucia-epvsa'` | 4263 |
| `ANIO_INICIO_IMPLANTACION` | `2026` | `año: 2026` (en `planLocalSalud.agenda`) | 4229 |
| `ANIO_FIN_PLAN` | `2030` | `['2026','2027','2028','2029','2030']` (en `renderTimeline`) | 13101 |
| `DURACION_PLAN` | `5` | (implícito, no existía como constante) | — |

**Importante:** los valores hardcodeados del monolito HTML siguen presentes y activos. Estas constantes son la versión modular de esos valores — el código nuevo las usa en lugar de strings literales. La eliminación en el monolito ocurrirá en iteraciones futuras cuando se extraigan las funciones que los usan.

### En `core/contextoTerritorial.js` (código nuevo):

| Regla formalizada | Descripción | Estado heredado |
|---|---|---|
| `_derivarTipo('mancomunidad-*') → 'mancomunidad'` | Tipo territorial desde prefijo de clave | Implícito — todos los territorios se trataban igual |
| `_derivarTipo('granada-*') → 'distrito_municipal'` | Distritos urbanos de Granada capital | Implícito — sin distinción explícita |
| `_derivarTipo(resto) → 'municipio'` | Municipios estándar | Implícito |
| `PREFIJOS_TIPO` | Array configurable de reglas de prefijo | No existía como constante |

---

## 5. API expuesta en window.COMPAS (puentes)

Para que el código heredado pueda acceder a la funcionalidad modular sin necesitar imports ES:

```js
window.COMPAS.__ambitoActivo
// → { key, nombre, tipo, estrategia } del territorio activo
// → null si no hay territorio seleccionado

window.COMPAS.__estadoGlobal.get('ambitoTerritorialActivo')
window.COMPAS.__estadoGlobal.get('configuracionSistema')
window.COMPAS.__estadoGlobal.get('vistaActiva')
window.COMPAS.__estadoGlobal.config.anioInicioImplantacion  // 2026
window.COMPAS.__estadoGlobal.config.anioFinPlan             // 2030
window.COMPAS.__estadoGlobal.constantes.ESTRATEGIA_POR_DEFECTO
window.COMPAS.__estadoGlobal.subscribe('ambitoTerritorialActivo', fn)

window.COMPAS.__contextoTerritorial.getAmbitoActivo()
window.COMPAS.__contextoTerritorial.hayAmbitoActivo()
window.COMPAS.__contextoTerritorial.getTipoTerritorio()
window.COMPAS.__contextoTerritorial.getTerritoriosDisponibles()  // array enriquecido con tipo
window.COMPAS.__contextoTerritorial.getTerritoriosAgrupados()    // { municipio:[], mancomunidad:[], distrito_municipal:[] }
```

---

## 6. Criterios de aceptación verificados

| Criterio | Estado |
|---|---|
| La app sigue arrancando | ✅ COMPAS.html intacto (solo se añadieron módulos) |
| window.COMPAS sigue funcionando | ✅ Heredado intacto + nuevos campos `__*` añadidos |
| Existe fuente de verdad mínima | ✅ `core/estadoGlobal.js` con 5 campos estructurales |
| Ámbito activo sin depender del DOM | ✅ `getAmbitoActivo()` con 3 niveles de resolución |
| actualizarMunicipio() sigue funcionando | ✅ No modificada, listener aditivo no interfiere |
| No refactorización masiva | ✅ Cero cambios en el monolito HTML |

---

## 7. Qué queda pendiente para iteraciones futuras

### Iteración 3 — Persistencia Firebase:
- `persistencia/firebase/paths.js` — centralizar las 18 rutas Firebase dispersas
- `persistencia/firebase/FirebaseAdapter.js` — wrapper sobre el SDK existente
- Mover `cargarDatosMunicipioFirebase()` y `guardarPlanEnFirebase()` fuera del monolito

### Iteración 4 — Dominio / Plan:
- Resolver el estado dual del plan (`planLocalSalud.planAccion.seleccion` vs `window.COMPAS.state.planAccion.seleccion`)
- Extraer `PlanTerritorial.js` y `AgendaAnual.js`
- Reemplazar indexación por posición en ESTRUCTURA_EPVSA por indexación por código semántico

### Iteración 5 — Ámbito completo:
- Crear `core/ambito.js` que envuelva `actualizarMunicipio()` completamente
- Cancelar los `setTimeout` no cancelables del cambio de municipio
- Limpiar todos los listeners Firebase huérfanos al cambiar de ámbito

### Hardcodes pendientes de eliminar del monolito:
- `var estrategiaActual = 'es-andalucia-epvsa'` (l.4263) — reemplazar por import de `ESTRATEGIA_POR_DEFECTO`
- `año: 2026` en `planLocalSalud.agenda` (l.4229) — reemplazar por import de `ANIO_INICIO_IMPLANTACION`
- `['2026','2027','2028','2029','2030']` en `renderTimeline()` (l.13101) — derivar de las constantes
- Credenciales Firebase hardcodeadas (l.4188-4195) — mover a config externo

# README_BOOTSTRAP — COMPÁS Arranque Modular
> Iteración 1 — Arquitectura base. Fecha: 2026-03-12.

---

## 1. Cómo arranca ahora la aplicación

```
Abrir COMPAS.html en el navegador
        │
        ▼
1. <head>: librerías CDN (Firebase compat, Chart.js, JSZip, Mammoth, QRCode, PapaParse)
        │
        ▼
2. <body>: HTML completo renderizado (30.000+ líneas inline)
        │
        ▼
3. <script> inline principal (l.4095–29854):
   · Firebase initializeApp()
   · window.COMPAS = { state: {} }     ← namespace global creado
   · window.COMPAS.prioridades = ...
   · window.COMPAS.mapa = null
   · ANALYTIC_CONFIG, COMPAS_EXPERT_SYSTEM
   · ESTRATEGIAS_SALUD, TERRITORIOS, MUNICIPIOS
   · Todas las funciones globales (~150 funciones)
   · Todos los event listeners (select municipio, botones, etc.)
        │
        ▼
4. <script type="module" src="./core/main.js"></script>  ← NUEVO (l.29862)
   · Los módulos ES son diferidos; se ejecutan DESPUÉS de los scripts clásicos
   · En este punto window.COMPAS ya existe y está poblado
   · main.js verifica el bridge, añade metadatos de arranque modular
   · Exporta COMPAS para uso futuro de módulos ES
        │
        ▼
5. Aplicación lista
   · window.COMPAS.__modular === true
   · window.COMPAS.__bootstrapVersion === '1.0.0'
   · Toda la lógica sigue funcionando exactamente igual que antes
```

---

## 2. Qué parte ya está modularizada

| Archivo | Estado | Descripción |
|---|---|---|
| `COMPAS.html` | **Activo** | HTML principal (ex-monolito), con script tag añadido |
| `core/main.js` | **Modular** | Bootstrap mínimo, puente de compatibilidad, exporta `COMPAS` |

Solo el punto de entrada está modularizado. **No se ha movido ninguna lógica de negocio.**

---

## 3. Estructura de carpetas creada

```
Desktop/                             ← Raíz del proyecto
├── COMPAS.html                      ← index.html de la aplicación (activo)
├── COMPAS_vNext_20260312_1529.html  ← Backup con timestamp
├── core/
│   ├── main.js                      ← CREADO — Bootstrap modular (iteración 1)
│   └── PENDIENTE.md                 ← Módulos pendientes: estadoGlobal, ambito, eventos
├── dominio/
│   └── PENDIENTE.md                 ← Módulos pendientes: PlanTerritorial, AgendaAnual, etc.
├── persistencia/
│   └── PENDIENTE.md                 ← Módulos pendientes: FirebaseAdapter, paths, repos
├── ia/
│   └── PENDIENTE.md                 ← Módulos pendientes: MotorExperto, GeneradorAcciones
├── ui/
│   └── PENDIENTE.md                 ← Módulos pendientes: fases, modales, componentes
└── util/
    └── PENDIENTE.md                 ← Módulos pendientes: fecha, exportacion, sincronizacion
```

---

## 4. Qué sigue todavía heredado (todo lo demás)

Todo el código de negocio permanece **intacto en el bloque `<script>` inline de COMPAS.html**.
No se ha movido nada de lo siguiente:

| Bloque | Líneas aprox. | Módulo futuro |
|---|---|---|
| Firebase initializeApp + credenciales | 4095–4200 | `core/main.js` + `persistencia/firebase/FirebaseAdapter.js` |
| Variables de estado global | 4200–4260 | `core/estadoGlobal.js` |
| ANALYTIC_CONFIG + COMPAS_EXPERT_SYSTEM | 4220–4530 | `ia/MotorExperto.js` |
| ESTRATEGIAS_SALUD + TERRITORIOS | 4255–4530 | `core/ambito.js` |
| Cuadro de mandos integral (50 indicadores) | 4715–4895 | `dominio/diagnostico/Indicador.js` |
| Carga datos municipio Firebase | 4895–5200 | `persistencia/firebase/PlanRepository.js` |
| Estructura determinantes EAS | 5200–5505 | `dominio/diagnostico/` |
| Panel de carga de datos | 5505–7060 | `persistencia/csv/CSVImporter.js` |
| actualizarMunicipio() — función pivote | 7770–7930 | `core/ambito.js` |
| Generación de perfil e informe HTML | 8108–8465 | `ui/fases/Fase2_Diagnostico.js` |
| ESTRUCTURA_EPVSA (~6.700 líneas) | 8700–15450 | `dominio/plan/` |
| Logos institucionales base64 (~300KB) | 15460–16000 | `ui/` (assets) |
| Votaciones ciudadanas EPVSA + VRELAS | 15800–22900 | `persistencia/participacion/` |
| Motor v2 salutogénico | 24000–26620 | `ia/MotorExperto.js` |
| Motor v3 IIFE | 26620–27504 | `ia/MotorExperto.js` |
| Monitor IBSE | 27555–28200 | `dominio/diagnostico/IBSE.js` |
| Evaluación Fase 6 | 28200–28700 | `dominio/evaluacion/Evaluacion.js` |
| Seguimiento anual | 29335–29640 | `dominio/seguimiento/` |
| Mapa del plan | 29640–29854 | `dominio/plan/PlanTerritorial.js` |

---

## 5. window.COMPAS — cómo se preserva

**Antes de esta iteración:**
```js
// Inicializado en el <script> inline del HTML (l.4242):
if (!window.COMPAS) { window.COMPAS = { state: {} }; }
if (!window.COMPAS.prioridades) { window.COMPAS.prioridades = {...}; }
if (!window.COMPAS.mapa) { window.COMPAS.mapa = null; }
```

**Después de esta iteración:**
El código heredado sigue corriendo primero (scripts clásicos = no diferidos).
`core/main.js` se ejecuta después y:
1. Verifica que `window.COMPAS` existe (salvaguarda defensiva, no sobreescribe)
2. Añade `window.COMPAS.__modular = true` — marca de arranque modular
3. Exporta `COMPAS` como export named y default para uso futuro en módulos ES

El namespace `window.COMPAS` sigue siendo exactamente el mismo objeto.
Todas las funciones heredadas que leen/escriben `window.COMPAS.state`, `window.COMPAS.prioridades` y `window.COMPAS.mapa` siguen funcionando sin cambios.

---

## 6. Criterios de aceptación verificados

| Criterio | Estado |
|---|---|
| La app sigue arrancando | ✅ Código heredado intacto |
| Existe la estructura de carpetas base | ✅ core/ dominio/ persistencia/ ia/ ui/ util/ |
| Existe core/main.js | ✅ Bootstrap mínimo con bridge |
| index.html arranca vía main.js | ✅ `<script type="module" src="./core/main.js"></script>` antes de `</body>` |
| window.COMPAS sigue existiendo | ✅ Preservado; main.js solo añade metadatos `__modular` |
| No se ha producido refactorización masiva | ✅ Solo añadido 1 script tag; 0 lógica de negocio movida |

---

## 7. Próximos pasos recomendados (Iteración 2)

Según el orden de la Fase B de `ARQUITECTURA_OBJETIVO.md`:

1. **`util/fecha.js`** + **`util/exportacion.js`** — funciones puras sin dependencias de estado
2. **`dominio/priorizacion/Priorizacion.js`** — lógica pura sin UI ni Firebase
3. **`persistencia/firebase/paths.js`** + **`FirebaseAdapter.js`** — centralizar las 18 rutas Firebase

No extraer aún: motor experto, plan de acción, agendas, evaluación, IBSE.

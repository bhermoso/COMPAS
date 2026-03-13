# LISTA DE HARDCODING — COMPÁS
> Valores hardcodeados identificados en el monolito. Todos son candidatos a externalizar.
> Fecha: 2026-03-12. Solo lectura — no se modifica código.

---

## H01 — CREDENCIALES FIREBASE

**Severidad: ALTA — Estas credenciales están en el HTML distribuido a los usuarios finales.**

| Campo | Valor | Línea |
|---|---|---|
| `apiKey` | `AIzaSyCdAivJATiX76xuOJAMc4Yt7sLq-3GDuDw` | 4188 |
| `authDomain` | `itaca-3ba7b.firebaseapp.com` | 4189 |
| `databaseURL` | `https://itaca-3ba7b-default-rtdb.europe-west1.firebasedatabase.app` | 4190 |
| `projectId` | `itaca-3ba7b` | 4191 |
| `storageBucket` | `itaca-3ba7b.firebasestorage.app` | 4192 |
| `messagingSenderId` | `891982060410` | 4193 |
| `appId` | `1:891982060410:web:cd954a8602eb89ebccd4c3` | 4194 |

**Destino objetivo:** Archivo de configuración externo `config.js` (excluido de distribución o protegido por Firebase Rules).

---

## H02 — ESTRATEGIA ACTIVA

| Valor | Línea | Contexto |
|---|---|---|
| `'es-andalucia-epvsa'` | 4263 | `var estrategiaActual` — estrategia por defecto |

El sistema está diseñado para múltiples estrategias (`ESTRATEGIAS_SALUD` admite varias claves) pero en la práctica solo existe una estrategia definida. La promesa multi-estrategia no está cumplida.

**Destino objetivo:** Parámetro de inicialización configurable.

---

## H03 — LISTA DE TERRITORIOS (duplicada)

Existen **dos listas paralelas** del mismo conjunto de ~85 territorios mantenidas por separado:

### H03a — `TERRITORIOS['es-andalucia-epvsa'].items` (líneas 4294–4381)

Array de objetos con estructura `{ id, nombre, tipo }` para los ~83 municipios del Distrito Granada-Metropolitano más 2 mancomunidades.

### H03b — `const MUNICIPIOS` (líneas 4915–5002)

Mapa `{ id: { nombre, tieneInforme } }` con los mismos territorios. La mayoría tienen `tieneInforme: false`. Solo excepción:

| Municipio | Campo | Valor | Motivo |
|---|---|---|---|
| `padul` | `tieneInforme` | `true` | Único municipio con informe de situación precargado |

**Problema:** Ambas listas deben mantenerse sincronizadas manualmente. `MUNICIPIOS.tieneInforme` nunca se actualiza dinámicamente desde Firebase.

**Destino objetivo:** Una única fuente de verdad en Firebase (`estrategias/{est}/territorios`) con metadatos dinámicos.

---

## H04 — AÑOS HARDCODEADOS

| Valor | Línea | Contexto |
|---|---|---|
| `2026` | 4229 | `planLocalSalud.agenda.año` — año por defecto de la agenda |
| `2026` | 4669 | `resetearPlanLocal()` — reset del año de agenda |
| `'2026'` | 12488 | `trasladarActuacionAAgenda()` — año pre-rellenado en modal de nueva acción |
| `['2026','2027','2028','2029','2030']` | 13101 | `renderTimeline()` — años fijos del timeline |
| `'2026'` | ~11570 | `ACTUACIONES_PADUL_2026` — datos de ejemplo |
| `EPVSA 2024-2030` | múltiple | Referencia normativa en textos del plan |

**Destino objetivo:** Constante `PLAN_ANIO_INICIO` + `PLAN_ANIO_FIN` derivadas de la configuración de la estrategia activa.

---

## H05 — CONSTANTES ANALÍTICAS DEL MOTOR EXPERTO

### H05a — `ANALYTIC_CONFIG` (l.4220) — 10 dimensiones del SFA v2

| Dimensión | Peso | Línea |
|---|---|---|
| epidemiológico | `0.22` | 4224 |
| ciudadano | `0.20` | 4225 |
| inequidad | `0.18` | 4226 |
| *(+7 dimensiones más)* | *(suma 1.0)* | 4224–4233 |
| umbral prioridad **alta** | `0.65` | 4236 |
| umbral prioridad **media** | `0.40` | 4236 |
| umbral prioridad **baja** | `0.20` | 4236 |
| floor inequidad crítica (`sfa_min`) | `0.72` | 4239 |
| floor problema epi grave (`sfa_min`) | `0.65` | 4240 |

### H05b — `COMPAS_PESOS_SFA` (l.~26620) — 6 dimensiones del motor v3

| Dimensión | Línea |
|---|---|
| epi, ciudadano, inequidad, evidencia, impacto, convergencia | ~26620 |

**Problema:** Las 10 dimensiones del motor v2 y las 6 del motor v3 **no son comparables**. Son dos sistemas de pesos independientes sin fuente de verdad unificada.

**Destino objetivo:** Una única constante `PESOS_SFA` con dimensiones canónicas, consumida por ambos motores.

---

## H06 — CONSTANTES TOTALES DE DOMINIO

| Constante | Valor | Línea | Significado |
|---|---|---|---|
| `TOTAL_DETERMINANTES_EPVSA` | `55` | 4111 | Total de determinantes EPVSA en la estrategia |
| `TOTAL_INDICADORES_MANDOS` | `50` | 4112 | Total de indicadores del cuadro de mandos APQ |
| Base participantes = peso pleno | `100` | 24386 | `pesoN = Math.min(1, nPart/100)` en `ejecutarMotorExpertoCOMPAS()` |
| Umbral diferencia determinantes | `0.05` (5%) | 24606 | Umbral de diferencia significativa en `analizarDatosMunicipio()` |
| Conflicto significativo ranking | `≥5 posiciones` | ~10896 | `generarSeccionMetodologiaPriorizacion()` |
| Pesos fusión epi/ciudadano | `0.70` / `0.30` | ~18860 | `COMPAS_ejecutarFusion()` — pesos por defecto |
| Ponderación ISS: CI | `40%` | 28223 | `eval_calcularISS()` (inferido, sin constante declarada) |
| Ponderación ISS: CD | `40%` | 28223 | `eval_calcularISS()` (inferido, sin constante declarada) |
| Ponderación ISS: CB | `20%` | 28223 | `eval_calcularISS()` (inferido, sin constante declarada) |

**Nota:** Las ponderaciones del ISS (40/40/20) **no están declaradas como constantes**. Están embebidas en la lógica de `eval_calcularISS()`.

---

## H07 — TEXTOS INSTITUCIONALES FIJOS

| Tipo | Valor | Línea | Contexto |
|---|---|---|---|
| Organización | `'Servicio Andaluz de Salud / Distrito Sanitario Granada-Metropolitano'` | 4102 | `COMPAS_VERSION.organizacion` |
| Autor | `'B. Hermoso'` | 4101 | `COMPAS_VERSION.autor` |
| Distrito en perfil | `'Distrito sanitario Granada-Metropolitano'` | 8139 | `generarPerfilDesdeFirebase()` — hardcoded inline |
| Referencia normativa 1 | `'EPVSA 2024-2030'` | múltiple | Textos del plan generados |
| Referencia normativa 2 | `'Plan de Salud de Andalucía 2020-2030'` | múltiple | Textos del marco estratégico |

**Destino objetivo:** Sección de configuración institucional en `COMPAS_VERSION` o parámetros del objeto de estrategia.

---

## H08 — COLORES HARDCODEADOS (duplicados)

### H08a — Colores de líneas EPVSA (duplicados en ≥3 lugares)

| Línea EPVSA | Color | Aparece en |
|---|---|---|
| LE1 | `#0074c8` (azul) | l.12591 (`crearTarjetaAccion`), l.29686 (`planMapa_generarGrafo`), otros |
| LE2 | `#10b981` (verde) | ídem |
| LE3 | `#f59e0b` (ámbar) | ídem |
| LE4 | `#dc143c` (rojo) | ídem |

**Problema:** La fuente canónica existe (`ESTRUCTURA_EPVSA[i].color`) pero no se usa consistentemente. Las copias hardcodeadas pueden desincronizarse.

### H08b — Paleta COMPÁS en CSS global

| Variable CSS | Valor | Línea | Uso |
|---|---|---|---|
| `--compas-blue` / azul principal | `#0074c8` | CSS inline | Franja signature, botones primarios |
| `--compas-green` | `#94d40b` | CSS inline | Acentos, badges positivos |
| `--compas-cyan` | `#00acd9` | CSS inline | Elementos secundarios |

---

## H09 — LOGOS INSTITUCIONALES BASE64

**~300KB totales embebidos como constantes globales en el HTML.**

| Constante | Línea | Tamaño estimado |
|---|---|---|
| `LOGO_CONSEJERIA_B64` | 15460 | ~200KB base64 |
| `LOGO_DISTRITO_B64` | 15766 | ~50KB base64 |
| `LOGO_RELAS_B64` | 15836 | ~30KB base64 |
| `LOGO_VIOLENCIA_B64` | 15985 | ~20KB base64 |

**Problema:** Inflan el HTML principal (~300KB de datos que no son lógica). Se inyectan en cada documento generado, duplicando el dato en memoria. Ralentizan la carga inicial.

**Destino objetivo:** Archivos de imagen externos referenciados por URL; o separados en un módulo `assets.js` cargado bajo demanda.

---

## H10 — RUTAS FIREBASE (strings hardcodeados)

Todas las rutas Firebase están construidas por concatenación de strings en las funciones que las usan. No existe un repositorio centralizado de rutas.

| Patrón de ruta | Funciones que lo usan |
|---|---|
| `estrategias/${est}/municipios/${mun}` | `cargarDatosMunicipioFirebase`, `actualizarEstadosCarga`, `borrarDatosMunicipio` |
| `estrategias/${est}/municipios/${mun}/determinantes` | `guardarDeterminantes`, `cargarDeterminantes` |
| `estrategias/${est}/municipios/${mun}/planAccion` | `guardarPlanEnFirebase`, `cargarPlanGuardado` |
| `estrategias/${est}/municipios/${mun}/agendas` | `initAgendas`, `guardarAgendasFirebase` |
| `estrategias/${est}/municipios/${mun}/seguimiento/${anio}` | `seguimiento_generarSolicitudes`, `seguimiento_cargarPanel` |
| `estrategias/${est}/municipios/${mun}/grupoMotor` | `cargarMiembros`, `añadirMiembro`, `eliminarMiembro` |
| `estrategias/${est}/municipios/${mun}/hojaRuta` | `inicializarHojaRuta`, `actHito` |
| `estrategias/${est}/municipios/${mun}/ibseDatos` | `_cargarIBSEFirebase`, `ibse_cargarCSV`, `calcularIBSE` |
| `estrategias/${est}/municipios/${mun}/analisisIA` | `verificarYGenerarAnalisisAutomatico` |
| `estrategias/${est}/municipios/${mun}/propuestaIA` | `generarPropuestaIA` |
| `estrategias/${est}/municipios/${mun}/participacionCiudadana` | `guardarResultadosVotacion` |
| `estrategias/${est}/municipios/${mun}/decisionPriorizacion` | `guardarDecisionPriorizacion`, `cargarDecisionPriorizacion` |
| `estrategias/${est}/municipios/${mun}/estudiosComplementarios` | `_cargarEstudiosFirebase` |
| `estrategias/${est}/municipios/${mun}/relas` | `COMPAS_cargarPrioridadesFirebase` |
| `votaciones/${mun}/${ses}/respuestas` | `iniciarVotacion`, `enviarVoto` |
| `votaciones_relas/${mun}/${ses}/respuestas` | `vrelas_iniciarSesion`, `vrelas_enviarVoto` |
| `ibse_respuestas/${mun}` | `ibseMonitor_abrir`, `_cargarIBSEFirebase`, `calcularIBSE` |
| `ibse_monitor/${mun}` | `ibseMonitor_abrir` (fallback legacy), `_cargarIBSEFirebase` |
| `referencias` | `cargarReferenciasEAS`, `borrarReferencias` |

**Destino objetivo:** Objeto `FIREBASE_PATHS` centralizado en `persistencia/firebase/paths.js`, con funciones `getPath(tipo, { est, mun, anio, ses })`.

---

## H11 — DATOS DE EJEMPLO ESPECÍFICOS DE UN MUNICIPIO

| Constante | Línea | Descripción | Estado |
|---|---|---|---|
| `ACTUACIONES_PADUL_2026` | ~11570 | Array de actuaciones de ejemplo del municipio de Padul para 2026 | **Código muerto** — no se usa en ningún flujo de producción visible |

**Problema:** Datos de un municipio concreto hardcodeados como constante global, inflan el bundle.

---

## H12 — CAMPO DE ESTADO HARDCODEADO

| Campo | Valor | Línea | Descripción |
|---|---|---|---|
| `MUNICIPIOS.padul.tieneInforme` | `true` | 4984 | Único municipio marcado como "tiene informe" en el mapa `MUNICIPIOS` |
| Todos los demás | `tieneInforme: false` | 4915–5002 | Campo nunca actualizado dinámicamente desde Firebase |

---

## Resumen cuantitativo

| Categoría | Nº items | Severidad máxima |
|---|---|---|
| Credenciales Firebase | 7 | ALTA |
| Estrategia activa | 1 | Media |
| Territorios duplicados | 2 listas (~85 territorios c/u) | Media |
| Años hardcodeados | 6 | Baja |
| Constantes analíticas motor | 14 | Media |
| Constantes totales dominio | 9 | Media |
| Textos institucionales | 5 | Baja |
| Colores duplicados | 4 colores × 3 lugares | Baja |
| Logos base64 | 4 constantes (~300KB) | Media |
| Rutas Firebase | 18 patrones dispersos | Media |
| Datos de ejemplo municipio | 1 constante (código muerto) | Baja |
| Campos de estado estáticos | 1 campo (`tieneInforme`) | Baja |

**Total: ~70 puntos de hardcoding identificados.**

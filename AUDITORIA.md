# Auditoría y plan de cierre

Fecha: 24 de septiembre de 2026, zona America/Los_Angeles.

El proyecto tiene implementada la estructura del MVP descrito en README: OAuth de GitHub, repositorios, filtro de commits por rama y fechas, generación con IA y streaming, exportación y un historial. Ambos builds pasan. Todavía no está preparado para un lanzamiento público: hay fallos de autorización, renderizado inseguro y problemas de consistencia y persistencia.

## Actualización tras las correcciones (25 de septiembre de 2026)

El diagnóstico original de abajo se conserva como referencia histórica. Los cambios
locales posteriores corrigen autenticación/autorización, Markdown, dependencias,
RLS versionado, guardado recuperable, paginación, cancelación y cuotas. Se añadieron
lint, pruebas automatizadas y CI. La interfaz ya incluye exportación de historial,
reconexión de GitHub y comprobaciones móviles. Consultar README y docs/RELEASE.md
para los contratos y límites actuales.

Verificación: builds de ambos proyectos, lint y tipos; suites de backend y frontend;
escenarios Playwright en escritorio/móvil; PostgreSQL 17 temporal con RLS, grants,
reservas, cuotas e idempotencia. npm audit sin vulnerabilidades reportadas al actualizar.

**Sigue pendiente la operación remota:** el proyecto Supabase encontrado está
INACTIVE. No se aplicó la migración remota ni se verificó OAuth → generación →
guardado en hosting. No se considera cerrado el lanzamiento hasta completar la
lista de verificación de docs/RELEASE.md en el entorno destino.

## Alcance y evidencia

Se revisaron todos los archivos de aplicación, SQL, manifiestos, configuración y documentación del repositorio, además de los cambios locales existentes. Se consultaron los lockfiles mediante npm audit. Los archivos de entorno se comprobaron únicamente para determinar si las variables tenían valor, sin incluir sus valores en el informe.

| Comprobación | Resultado |
| --- | --- |
| Backend: `npm run build` | Correcto |
| Frontend: `npm run build` | Correcto, incluidas comprobaciones de tipos |
| Frontend: `CI=1 npm run lint < /dev/null` | Falla: pide configurar ESLint |
| Backend: ESLint | El script existe, pero no hay configuración ni dependencia local de ESLint |
| Pruebas automatizadas versionadas | No hay suites ni scripts de test |
| `npm audit --omit=dev`, frontend | 5 paquetes señalados: 2 críticos, 2 altos y 1 moderado |
| `npm audit --omit=dev`, backend | 9 paquetes señalados: 3 altos, 5 moderados y 1 bajo |
| HTTP local sin autenticación, servicios ficticios | GET y DELETE de historial aceptados con 200; generación aceptada con 201 |
| Generación con Supabase deshabilitado y modelo ficticio | Emite `saved: true` sin guardar |
| Renderizado de Markdown manipulado | Conserva un atributo `onmouseover` inyectado en un enlace y protocolos de URL inseguros |
| Stream que termina sin evento `done` | El cliente lo acepta como una terminación normal |
| Variables esperadas de entorno | Todas tienen algún valor; esto no verifica su validez |

Las pruebas HTTP utilizaron los controladores reales, el ValidationPipe y servicios aislados: no leyeron ni borraron datos reales, ni consumieron OpenAI. La prueba de Markdown inspeccionó HTML renderizado; no ejecutó JavaScript en un navegador. Los recuentos de npm son paquetes afectados, incluidos transitivos, no vulnerabilidades demostradas en cada ruta del producto.

No se verificó el flujo real OAuth → GitHub → OpenAI → Supabase, la configuración remota de la base de datos, un despliegue existente ni la interfaz en navegador. No se modificó código de aplicación. Los cambios locales previos en backend y `.vscode/settings.json` se conservaron.

## Bloqueos de lanzamiento

### P0. Autenticación y aislamiento de usuarios

Archivos: `backend/src/history/history.controller.ts:15`, `backend/src/history/history.service.ts:31`, `backend/src/changelog/changelog.controller.ts:17`, `frontend/lib/api.ts:70`.

El historial confía en el `userId` enviado por query. No valida sesión ni token. Con un identificador ajeno se puede solicitar su historial; los IDs de registros devueltos también permiten pedir su borrado. El filtro por `user_id` no protege cuando el solicitante elige ese valor. La generación tampoco requiere token y permite asignar el resultado a cualquier `userId` del body. El redirect del layout solo protege la navegación visual.

Pendiente: autenticar en el servidor todas las rutas privadas, obtener la identidad de una credencial verificada y retirar `userId` como autoridad del cliente. Verificar acceso al repositorio al generar. Añadir límites por usuario/IP y de concurrencia para impedir consumo indiscriminado de IA. CORS no sustituye la autenticación.

Cierre: una petición sin identidad válida devuelve 401; un usuario no puede leer, borrar ni crear registros para otro; exceder la cuota se rechaza antes de invocar al proveedor de IA.

### P0. Markdown inseguro

Archivo: `frontend/components/Markdown.tsx:11`.

El renderer concatena enlaces en HTML y los inserta con `dangerouslySetInnerHTML`. Escapa algunos caracteres de texto, pero no las comillas de los atributos ni valida los protocolos. Se reprodujo la inyección de un atributo de evento mediante una URL manipulada. El contenido generado por IA y los mensajes de commits deben tratarse como datos no confiables. El token de GitHub también está disponible en la sesión del cliente, lo que aumenta el impacto de un XSS.

Pendiente: renderer que construya elementos seguros, control de protocolos de enlaces y sanitización si se permite HTML. Añadir casos de regresión para atributos y enlaces peligrosos.

Cierre: Markdown manipulado no produce atributos de evento ni URLs ejecutables.

### P1. Seguridad del esquema de Supabase

Archivo: `backend/supabase-schema.sql:17`.

RLS está comentado; el script no restringe permisos de acceso directo. El backend usa una clave privilegiada que omite RLS. La exposición directa real depende de grants, esquemas expuestos y configuración remota, que no se comprobaron.

Pendiente: versionar una migración que habilite RLS y deje explícitos los permisos necesarios para el acceso desde el backend; verificar denegación de acceso directo no autorizado. La autorización del backend sigue siendo necesaria aunque se habilite RLS.

Referencia: [seguridad de la Data API de Supabase](https://supabase.com/docs/guides/api/securing-your-api).

### P1. Dependencias con avisos de seguridad

Archivos: ambos `package.json` y `package-lock.json`.

El frontend fija Next.js 14.2.15. npm señala `next`, `next-auth`, `nanoid`, `postcss` y `uuid`. En backend señala paquetes de NestJS y transitivos como `multer`, `lodash`, `qs`, `body-parser` y `file-type`. Algunas alertas afectan funcionalidades que este proyecto no usa; requieren evaluación de aplicabilidad, además de actualización.

Pendiente: actualizar a versiones corregidas compatibles, revisar las migraciones necesarias y repetir build, pruebas y auditoría. Fijar una versión de Node compartida por desarrollo, CI y despliegue. Evitar una actualización mayor automática sin verificar compatibilidad.

El [aviso oficial de Next.js](https://nextjs.org/blog/security-update-2025-12-11) ya documenta correcciones posteriores a 14.2.15 para App Router. Es una referencia histórica; la versión destino debe cubrir también los avisos posteriores del registro.

## Correcciones funcionales del MVP

### P1. Guardado fiable y recuperable

Archivos: `backend/src/changelog/changelog.service.ts:62`, `backend/src/changelog/changelog.controller.ts:34`, `frontend/lib/api.ts:142`.

Si Supabase no está configurado, `save()` retorna sin guardar. Si devuelve un error de inserción, solo se registra en logs. El controlador anuncia `saved: true` en ambos casos y el cliente ni siquiera utiliza ese campo.

Pendiente: distinguir generación completada de guardado completado, devolver ID y estado reales, conservar el contenido cuando falle la persistencia y permitir reintentar solo el guardado sin volver a generar ni duplicar registros. Validar configuración requerida al iniciar.

Cierre: cada éxito de guardado tiene un registro recuperable; errores de base de datos son visibles y recuperables.

### P1. Los filtros y commits pueden quedar desincronizados

Archivo: `frontend/app/(app)/generate/GenerateClient.tsx:68` y `:162`.

Después de cargar commits, cambiar rama o fechas no invalida los commits cargados. Generar usa los mensajes anteriores con los metadatos nuevos. También se permite generar mientras se recargan commits y una respuesta tardía puede actualizar la pantalla después de cambiar de repositorio. Durante el streaming se puede cambiar de repositorio, mezclando la salida con el nombre usado al descargar.

Pendiente: asociar cada resultado a una selección inmutable, invalidar commits al modificar filtros y cancelar o ignorar solicitudes obsoletas. Bloquear generación hasta tener datos de la selección actual. Validar orden de fechas y explicar la zona horaria.

Cierre: repositorio, rama, fechas, commits, resultado e historial siempre corresponden a la misma solicitud.

### P1. Paginación de GitHub

Archivo: `backend/src/github/github.service.ts:53` y `:75`.

Solo se pide la primera página de 100 repositorios y 100 commits. Los repositorios adicionales no aparecen y un rango grande produce un changelog incompleto sin avisar.

Pendiente: paginar repositorios y commits; aplicar un límite explícito de producto y señalar truncamientos. Para rangos extensos, controlar presupuesto de entrada y procesar por lotes si se incluyen completos. El historial tampoco tiene paginación explícita.

Cierre: probar cuentas y rangos con más de 100 elementos; ninguna omisión debe ser silenciosa.

### P1. Streaming, cancelación y límites de IA

Archivos: `frontend/lib/api.ts:123`, `frontend/app/(app)/generate/GenerateClient.tsx:92`, `backend/src/changelog/changelog.controller.ts:29`, `backend/src/changelog/changelog.service.ts:43`.

El cliente acepta EOF sin evento final. Existe un AbortController, pero no un botón de cancelar ni limpieza al desmontar. El backend no propaga la desconexión al proveedor. No hay límites explícitos de salida del modelo, cuota de usuario, presupuesto de tokens de entrada ni máximo de elementos del DTO. El límite HTTP del framework no equivale a un presupuesto de IA.

Pendiente: exigir una finalización explícita, marcar resultados incompletos, cancelar en ambos extremos, establecer límites de entrada/salida, tiempo máximo y consumo. Registrar duración, errores y uso sin volcar tokens ni contenido privado.

Cierre: cortar la conexión no se presenta como éxito ni deja una generación innecesaria consumiendo recursos.

### P1. Pérdida de información al construir el prompt

Archivo: `backend/src/changelog/changelog.service.ts:104`.

Solo se envía la primera línea de cada commit. Un `BREAKING CHANGE:` en el cuerpo desaparece aunque el producto prometa identificar cambios incompatibles. No se incluyen diffs ni PRs: la precisión depende de los mensajes disponibles. El DTO rechaza mensajes de más de 2000 caracteres, mientras GitHub puede devolverlos y el frontend los envía completos.

Pendiente: conservar información significativa del cuerpo dentro de un presupuesto, tratar mensajes como datos y evaluar ejemplos de features, fixes, merges y breaking changes. Explicar o manejar mensajes demasiado largos. No prometer información que no se proporcionó al modelo.

## Calidad de producto y operación

| Prioridad | Pendiente | Criterio de cierre |
| --- | --- | --- |
| P1 | Pruebas y CI | Tests de aislamiento entre usuarios, persistencia fallida, streaming cortado, cambios de filtros y paginación; CI ejecuta lint, tipos, pruebas y builds |
| P1 | Validación real de integraciones | OAuth, repo público y privado, generación, historial tras recargar, exportación y borrado completan un flujo en un entorno de prueba |
| P1 | Despliegue verificable | Configurar frontend/backend, callback OAuth, HTTPS, CORS y variables; añadir health check, logs útiles y procedimiento de rollback; probar streaming a través del hosting |
| P2 | Historial utilizable | Copiar y descargar resultados ya guardados, paginar y manejar borrados simultáneos sin restaurar registros obsoletos por rollback optimista |
| P2 | Estados de interfaz | Diferenciar carga de repositorios, lista vacía, ningún commit, sesión vencida y error; dar acciones de reintento o reconexión |
| P2 | Accesibilidad y móvil | Etiquetas en botones de solo icono y búsqueda, `aria-expanded` en historial, navegación por teclado y comprobación del header en pantallas pequeñas |
| P2 | Exportación | Manejar rechazo del portapapeles; verificar pegado real en Slack/Notion, cuyo soporte actual es copia de texto y conversión básica, no publicación integrada |
| P2 | Documentación | Actualizar autenticación de API, límites, configuración y resolución de errores; corregir cierre sobrante de bloque Markdown del README |

No hay evidencia en el repo para afirmar que falta crear las cuentas externas: las variables están rellenas. Sí falta demostrar que la configuración y el esquema remotos funcionan. Tampoco la ausencia de archivos de Railway/Vercel demuestra que no exista un despliegue configurado en sus paneles.

## Orden recomendado para terminar

1. Cerrar autenticación, aislamiento y Markdown inseguro; asegurar el esquema y actualizar dependencias.
2. Corregir guardado, coherencia de filtros, paginación, streaming y presupuesto de IA.
3. Añadir las pruebas anteriores, configurar lint y automatizar las comprobaciones en CI.
4. Completar estados de UX y exportación; verificar escritorio y móvil.
5. Probar integraciones reales y desplegar con una verificación completa del flujo.

El MVP se considera terminado cuando todos los bloqueos P0/P1 están cerrados y existe evidencia del flujo real completo en el entorno desplegado. Integraciones directas con Slack/Notion, GitHub Releases, facturación, equipos, webhooks, editor avanzado o más proveedores de IA son ampliaciones posibles; no son necesarias para cumplir el alcance actual del README.

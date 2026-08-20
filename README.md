# Vocali — Servicio de transcripción de audio

Prueba técnica para Vocali. Es un servicio en la nube donde un usuario registrado puede subir audios para transcribirlos, dictar en directo por micrófono, ver su historial y descargarse las transcripciones.

- **Frontend:** `https://vocali-transcription-service.vercel.app/`
- **API:** `https://x9ebodyg12.execute-api.eu-west-1.amazonaws.com`

---

## Índice

1. [Qué está hecho](#qué-está-hecho)
2. [Stack](#stack)
3. [Cómo funciona por dentro](#cómo-funciona-por-dentro)
4. [Levantarlo en local](#levantarlo-en-local)
5. [Por qué hice las cosas así](#por-qué-hice-las-cosas-así)
6. [Tests](#tests)
7. [CI/CD](#cicd)
8. [Mejoras pendientes](#mejoras-pendientes)

---

## Qué está hecho

Los siete puntos del enunciado funcionan:

| Requisito                          | Cómo lo he resuelto                      |
| ---------------------------------- | ---------------------------------------- |
| Registro                           | Cognito con verificación por email       |
| Autenticación                      | SRP, la contraseña no sale del navegador |
| Cerrar sesión                      |                                          |
| Transcribir fichero (hasta 20 MB)  | Subida directa a S3 con URL prefirmada   |
| Transcribir en tiempo real         | WebSocket con token efímero              |
| Historial paginado (10 por página) | Cursor sobre DynamoDB                    |
| Descargar transcripciones          | URL prefirmada con `Content-Disposition` |

---

## Stack

**Backend:** Node 20 + TypeScript, Serverless Framework v4, Lambda, API Gateway, DynamoDB, S3, Cognito, SSM Parameter Store, Speechmatics y Jest.

**Frontend:** Nuxt 4 + TypeScript como SPA, Tailwind v4, `amazon-cognito-identity-js`, Vitest y Cypress.

**Despliegue:** GitHub Actions con OIDC contra AWS para el backend, y Vercel para el frontend.

---

## Cómo funciona por dentro

### El flujo de una transcripción

```
1. POST /transcriptions      → crea el registro en PENDING y devuelve una URL firmada
2. PUT a S3 (desde el navegador) → el audio NO pasa por la Lambda
3. Evento de S3              → dispara onAudioUploaded, PENDING → PROCESSING
4. Speechmatics              → audio a texto
5. Texto a S3 + COMPLETED    → se guarda la ruta del .txt
6. GET /transcriptions/{id}  → URL firmada para descargarlo
```

Los pasos 1, 2 y 6 son síncronos: el usuario está esperando. Del 3 al 5 pasan solos, en segundo plano, y el usuario ve el estado cambiar en la lista.

### Backend

He montado el backend con arquitectura hexagonal:

```
src/
├── domain/                    # No depende de nada externo
│   ├── entities/              # Transcription, con su máquina de estados
│   ├── ports/                 # Interfaces: Repository, Storage, SpeechToText
│   └── errors/                # DomainError con un código semántico
├── application/
│   └── use-cases/             # La lógica de negocio, solo habla con puertos
└── infrastructure/
    ├── adapters/              # DynamoDB, S3, Speechmatics
    ├── lambda/                # Handlers HTTP y de eventos
    └── container.ts           # Aquí se cablea todo
```

La idea es que ni el dominio ni la aplicación sepan que existe AWS. Los casos de uso reciben interfaces por constructor, así que para testearlos no hace falta ni red ni credenciales: los 27 tests del backend tardan poco más de un segundo.

### La máquina de estados

```
PENDING ──→ PROCESSING ──→ COMPLETED
   │             │
   └─────────────┴────────→ FAILED
```

Si intentas una transición que no está permitida, salta un `InvalidTransitionError`. `COMPLETED` y `FAILED` son finales, de ahí no se sale.

### DynamoDB

Tabla única con esta forma de claves:

| Campo | Valor                              |
| ----- | ---------------------------------- |
| `PK`  | `USER#<sub>`                       |
| `SK`  | `TRANSCRIPTION#<createdAt>#<uuid>` |

Meter el `createdAt` en la clave de ordenación me permite sacar el historial ordenado por fecha sin necesidad de índices secundarios. Para paginar uso el `LastEvaluatedKey` codificado en base64url, que viaja al frontend como un cursor opaco.

### Frontend

```
app/
├── pages/          # Nuxt genera el router a partir de aquí
├── composables/    # useAuth, useApi, useRealtime, usePagination
├── components/     # StatusBadge, UploadCard
├── middleware/     # auth.global.ts, protege todo por defecto
└── types/          # El contrato de la API, tipado
```

---

## Levantarlo en local

Necesitas Node 20+, una cuenta de AWS con `aws configure` hecho, y una API key de Speechmatics.

### Backend

```bash
cd backend
npm install

# Guardar el secreto en SSM
aws ssm put-parameter \
  --name "/vocali/dev/speechmatics-api-key" \
  --value "<tu-api-key>" \
  --type SecureString

# Desplegar
$env:SPEECHMATICS_API_KEY = "<tu-api-key>"
npx serverless deploy
```

Al terminar te da los endpoints y los outputs de CloudFormation, donde están el `UserPoolId`, el `UserPoolClientId` y el nombre del bucket.

### Frontend

```bash
cd frontend
npm install
```

Creas un `.env` con lo que te ha devuelto el deploy:

```
NUXT_PUBLIC_API_BASE_URL=https://<api-id>.execute-api.eu-west-1.amazonaws.com
NUXT_PUBLIC_COGNITO_USER_POOL_ID=<user-pool-id>
NUXT_PUBLIC_COGNITO_CLIENT_ID=<client-id>
```

Y `npm run dev`.

---

## Por qué hice las cosas así

### URLs prefirmadas de S3

API Gateway limita a 10 MB por petición y el enunciado pide 20 MB, así que el audio no podía pasar por la Lambda. El backend firma una URL y el navegador sube directo a S3. La firma limita método, ruta exacta, caducidad y ContentLength. Para descargar, añado ResponseContentDisposition para forzar la descarga en vez de abrir el fichero.

### El texto va a S3, no a DynamoDB

DynamoDB limita cada ítem a 400 KB. Una transcripción larga se podría acercar, así que guardo el texto en S3 y en DynamoDB solo la referencia. Además sale más barato por byte.

### El tamaño se valida en tres sitios

1. **En el navegador**, mirando `file.size` antes de llamar. Es una cortesía: te ahorras una petición.
2. **En el caso de uso**, que lanza `FileTooLargeError`. Da un error limpio y temprano.
3. **En S3**, que rechaza el `PUT` si los bytes no cuadran con el `ContentLength` firmado.

Lo importante: el `contentLength` que manda el cliente es un dato **declarado, no medido**. Solo la tercera capa impide de verdad que alguien mienta.

### El token efímero para el dictado

Para transcribir en directo, el navegador tiene que hablar por WebSocket con Speechmatics. Poner mi API key en el frontend habría sido regalarla: se ve abriendo las DevTools.

Así que hice un endpoint que devuelve un token con **60 segundos de vida**, suficiente para abrir la conexión. Una vez abierta, el WebSocket sigue funcionando aunque el token caduque.

### Cómo traduzco los errores del dominio a HTTP

Cada `DomainError` lleva un `code` semántico, y un mapeador central en la capa de infraestructura lo convierte a HTTP. El dominio no sabe que existe HTTP:

| Código           | HTTP | Cuándo pasa                            |
| ---------------- | ---- | -------------------------------------- |
| `NOT_FOUND`      | 404  | No existe                              |
| `FORBIDDEN`      | 403  | Es de otro usuario                     |
| `NOT_READY`      | 409  | Existe pero todavía no está transcrita |
| `FILE_TOO_LARGE` | 413  | Pasa de 20 MB                          |

Dos detalles: uso 409 en vez de 404 cuando aún se está procesando porque el recurso existe y el frontend puede distinguir "aún no está lista" de "no existe". Y compruebo primero la propiedad y luego el estado, para no confirmar la existencia de recursos de otros usuarios.

### La Lambda de eventos se traga los errores a propósito

`ProcessAudioTranscription` captura cualquier fallo, marca la transcripción como `FAILED` con el motivo y no relanza. Al principio sí lo hacía, pero las invocaciones asíncronas de Lambda se reintentan dos veces más y cada reintento fallaría igual al intentar pasar de `FAILED` a `PROCESSING`. El estado `FAILED` con su `errorMessage` ya es la gestión del error: el usuario lo ve en la lista.

### SPA en vez de SSR

Puse `ssr: false` porque toda la app está detrás de login (no hay nada que indexar) y depende de APIs del navegador: `localStorage`, `crypto`, `getUserMedia` y `WebSocket`. Con SSR habría tenido que envolver medio código en comprobaciones de entorno. Si hubiera una landing pública, Nuxt permite activar SSR solo para esas rutas con `routeRules`.

### Autenticación

Uso `amazon-cognito-identity-js` con SRP: la contraseña nunca viaja al servidor. Mando el ID token, no el access token, porque el authorizer valida el `aud` contra el Client ID y solo el ID token lo lleva.

El middleware de rutas protege todo por defecto y las excepciones (login, registro, confirmación) están declaradas explícitamente. Es comodidad de UX: la seguridad de verdad la pone el authorizer de Cognito en API Gateway.

### Los secretos en SSM

La API key de Speechmatics está en SSM como `SecureString` en vez de Secrets Manager: es un valor pequeño, sin rotación y el tier estándar de SSM es gratis.

**Trade-off**: lo resuelvo en _deploy-time_ con `${env:SPEECHMATICS_API_KEY}`, no en runtime. Simplifica el código, pero el valor acaba en las variables de entorno de las Lambdas y el pipeline tiene que conocerlo. Leerlo de SSM al arrancar sería más limpio, a cambio de latencia en arranque en frío y permisos IAM extra.

### OIDC en vez de claves de acceso en el CI

GitHub Actions se autentica contra AWS con OpenID Connect: GitHub emite un token firmado, AWS valida la firma y devuelve credenciales temporales. **No hay ninguna credencial permanente guardada en el repo.**

La política de confianza restringe el acceso al `sub` exacto del repositorio usando el formato basado en IDs numéricos, que es inmutable aunque cambien los nombres.

### Serverless Framework y no Terraform

El enunciado dejaba elegir. Terraform es más genérico y multi-cloud, pero me habría llevado bastante más configuración para lo mismo: empaquetado, permisos IAM, integración con API Gateway. Con Serverless Framework declarar una Lambda con su endpoint son cuatro líneas.

Si la infraestructura tuviera recursos no serverless o hubiera que soportar varios clouds, elegiría Terraform.

---

## Tests

| Capa     | Runner  | Tests | Qué cubre                                       |
| -------- | ------- | ----- | ----------------------------------------------- |
| Backend  | Jest    | 27    | Casos de uso y máquina de estados (~97% líneas) |
| Frontend | Vitest  | 7     | Componentes y lógica de paginación              |
| E2E      | Cypress | 11    | Flujos completos                                |

```bash
cd backend && npm run test:coverage
cd frontend && npm run test        # Vitest
cd frontend && npm run cy:run      # Cypress, con npm run dev levantado
```

### Qué he decidido probar y qué no

En el **backend** cubro los casos de uso y la máquina de estados. Los adaptadores no los testeo: necesitarían AWS de verdad y acabaría midiendo el SDK, no mi código. Por eso el coverage apunta solo a domain/ y application/.

En el **frontend** pruebo el StatusBadge y usePagination, que es lo más fácil de romper. Los estilos decorativos no los toco.

En los **E2E**, el login va **contra Cognito de verdad** porque es el flujo más crítico. El resto **intercepta la API** con `cy.intercept()`: no gasto cuota de Speechmatics, los tests son deterministas y puedo forzar estados difíciles de reproducir con backend real.

### Sobre usar Vitest y no Jest en el frontend

El enunciado pide Jest y en el backend lo uso. En el frontend me pasé a **Vitest**, que es el runner que Nuxt integra de forma oficial y tiene prácticamente la misma API. Montar Jest sobre Nuxt implica bastante configuración extra (transformar los SFC, resolver alias, los auto-imports) e ir a contracorriente del framework. Me pareció que la decisión razonable era usar la herramienta que el framework recomienda.

---

## CI/CD

```
push a main o feat/**
        │
        ├─→ Backend: lint → typecheck → tests con cobertura
        │        └─→ [solo en main] Deploy a AWS vía OIDC
        │
        └─→ Frontend: Vitest → Cypress
```

Para el análisis estático uso ESLint con `--max-warnings=0`, o sea que cualquier warning tumba el build. Si vas a tener un linter en el CI, que sirva de algo. Las reglas que más me importan: `no-explicit-any` como error (el enunciado valora el tipado) y `no-console` permitiendo solo `error` y `warn`, que en Lambda son logging legítimo.

Los jobs de backend y frontend van en paralelo porque son cosas independientes. El deploy solo depende del de backend: que fallen los tests del frontend no debería impedir desplegar la API.

El frontend lo despliega Vercel, conectado al repo por webhook.

---

## Mejoras pendientes

**Guardar transcripciones en tiempo real en el historial.** El dictado muestra el texto y puedes copiarlo, pero no entra en el historial. La entidad ya contempla `source: "REALTIME"`, faltaría un endpoint para persistirlas.

**TTL para registros PENDING huérfanos.** Si el `PUT` a S3 falla después de crear el registro, esa transcripción se queda en `PENDING` para siempre. Lo suyo sería un TTL en DynamoDB o un job que marque como fallidas las que lleven mucho tiempo sin audio.

**Actualización por WebSocket en vez de polling.** Cada 5 segundos mientras haya algo sin terminar, y se para solo cuando no queda nada pendiente. Con WebSocket quedaría más elegante, pero no compensaba para esta prueba.

**`findById` hace un `Query` con `FilterExpression`.** El filtro se aplica después de leer, así que un usuario con 500 transcripciones leería las 500 para devolver una. Se arreglaría con un GSI.

**Los emails los manda Cognito por defecto.** Están limitados a 50 al día y se van a spam con facilidad. En producción lo integraría con SES sobre un dominio verificado.

**Política IAM de despliegue más acotada.** Usa `PowerUserAccess` + `IAMFullAccess`. En un proyecto real lo acotaría, y restringiría el `sub` de la política de confianza solo a `main`.

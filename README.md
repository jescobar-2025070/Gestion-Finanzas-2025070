# Finanzas Personales

Plataforma web de **gestión de finanzas personales por periodos**.

## Información general

- **Nombre del proyecto:** Finanzas Personales.
- **Descripción:** Aplicación web que permite a un usuario registrar, organizar y analizar sus ingresos, gastos, presupuestos, redistribuciones, excedentes y objetivos financieros dentro de periodos definidos por él mismo. Incluye un módulo administrativo para gestionar usuarios y configuración técnica.
- **Objetivo:** Desarrollar un MVP funcional, testeable, mantenible y auditable. La administración está estrictamente separada de la información financiera personal (el `ADMIN` no puede consultar las finanzas de los usuarios).
- **Problema que resuelve:** Permitir que una persona administre manualmente sus finanzas personales, obtenga información organizada y reciba recomendaciones básicas, sin realizar operaciones financieras externas.
- **Estado actual del desarrollo:** En desarrollo incremental.
- **Etapa actual:** Etapa 1.
- **Alcance de la etapa:** Estructura general del sistema, backend y frontend separados, registro de usuarios, inicio de sesión, cierre de sesión, autenticación con JWT en cookie HttpOnly, roles (`USR`/`ADMIN`), autorización por roles, protección de endpoints y rutas, validaciones, manejo centralizado de errores, migraciones, variables de entorno, pruebas y documentación.

## Tecnologías

| Área | Tecnología |
| --- | --- |
| Frontend | Angular 22, TypeScript 6, pnpm |
| Backend | Node.js 22, TypeScript 6, Express 4, pnpm |
| Base de datos | PostgreSQL 18 |
| Acceso a base de datos | `pg` (node-postgres) con patrón Repository y migraciones SQL versionadas |
| Hashing de contraseñas | `bcryptjs` |
| Autenticación | JWT (`jsonwebtoken`) transportado en cookie HttpOnly |
| Validaciones | Validadores propios en el backend (carpeta `validators/`) |
| Seguridad HTTP | `helmet`, `cors` (con credenciales) |
| Pruebas backend | `node:test`, `supertest`, `tsx` |
| Pruebas frontend | `vitest` (configurado por Angular CLI) |
| Control de versiones | Git |

## Arquitectura

### Arquitectura general (cliente-servidor)

```text
┌──────────────────────┐
│      Angular         │
│      Frontend        │
└──────────┬───────────┘
           │
           │ HTTP/REST + cookie
           ▼
┌──────────────────────┐
│       Node.js        │
│      TypeScript      │
│       REST API       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│     PostgreSQL       │
└──────────────────────┘
```

### Backend

Separación por responsabilidades:

```text
Controller → Service → Repository → PostgreSQL
```

Con middleware de:
- **Authentication:** verifica el JWT de la cookie HttpOnly (o `Authorization: Bearer`), carga el usuario de base de datos y adjunta `req.user`.
- **Authorization:** restringe endpoints por rol (`requireRole`).
- **Validation:** valida el cuerpo de la petición antes de llegar al controller.
- **Error Handling:** responde en el formato de error estándar y nunca expone stack traces.

### Frontend

- **Core:** servicios de API, servicio de autenticación (estado con signals), guards y interceptors.
- **Shared:** componentes reutilizables (navbar).
- **Features:** módulos funcionales (auth, dashboard, admin). Las rutas se cargan con *lazy loading*.

### Autenticación

- El login genera un JWT firmado con `JWT_SECRET`, que incluye `sub` (id de usuario), `email` y `roles`.
- El JWT se envía en una cookie `HttpOnly` (`SameSite=Lax`). En producción la cookie es `Secure` (requiere HTTPS).
- El frontend **no** almacena el token: al iniciar restaura la sesión consultando `GET /auth/me` y las peticiones envían la cookie automáticamente (`withCredentials: true`).

### Autorización por roles

- Roles definidos: `ADMIN` y `USR` (tabla `roles`, sembrados por migración).
- Todo usuario registrado públicamente recibe el rol `USR`; nunca puede elegir `ADMIN`.
- La autorización se valida siempre en el backend; la protección de rutas del frontend no es una medida de seguridad.

## Estructura del proyecto

```text
finanzas/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuración (env, base de datos, transacciones)
│   │   ├── controllers/     # Capa HTTP (auth, roles)
│   │   ├── dto/
│   │   │   ├── requests/    # Contratos de entrada (auth)
│   │   │   └── responses/   # Contratos de salida (auth, roles)
│   │   ├── entities/        # Modelos de dominio (usuario, rol, etc.)
│   │   ├── errors/          # AppError y catálogo de códigos de error
│   │   ├── middleware/      # authenticate, authorize, validate, error-handler
│   │   ├── repositories/    # Persistencia exclusivamente
│   │   ├── routes/          # Definición de rutas REST
│   │   ├── services/        # Lógica de negocio (auth, users, roles)
│   │   ├── validators/      # Validadores de entrada
│   │   ├── mappers/         # Conversión entidad → DTO de salida
│   │   ├── utils/           # JWT, hashing de contraseñas, cookies, migraciones
│   │   ├── types/           # Extensiones de tipos (Express Request.user)
│   │   ├── app.ts           # Construcción de la aplicación Express
│   │   └── server.ts        # Punto de entrada del servidor
│   ├── migrations/          # Migraciones SQL versionadas
│   ├── scripts/             # migrate.ts, seed.ts
│   ├── tests/               # Pruebas de la Etapa 1
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
├── frontend/
│   └── src/
│       └── app/
│           ├── core/
│           │   ├── auth/          # AuthService y modelos
│           │   ├── guards/        # authGuard, adminGuard
│           │   ├── interceptors/  # credenciales, errores de autenticación
│           │   └── services/      # ApiService
│           ├── shared/
│           │   └── components/    # navbar
│           ├── features/
│           │   ├── auth/          # páginas login y registro
│           │   ├── dashboard/     # dashboard (protegido, placeholder)
│           │   └── admin/         # panel admin (solo ADMIN, placeholder)
│           ├── app.routes.ts
│           ├── app.config.ts
│           └── app.ts
├── README.md
├── ERRORES_Y_SOLUCIONES.md
└── .gitignore
```

## Instalación

### Requisitos previos

- Node.js ≥ 22
- pnpm ≥ 11 (gestor de paquetes)
- PostgreSQL ≥ 14 (probado con 18)
- Git

### 1. Obtención del proyecto

```bash
git clone <url-del-repositorio>
cd finanzas
```

### 2. Backend

```bash
cd backend
pnpm install
```

Configuración de variables de entorno:

```bash
cp .env.example .env
# Edita .env con los valores reales (base de datos, secreto JWT, etc.)
```

Configuración de la base de datos (desde PostgreSQL):

```sql
CREATE DATABASE finanzas_dev;
CREATE DATABASE finanzas_test;   -- solo necesaria para pruebas
```

Ejecución de migraciones:

```bash
pnpm migrate
```

Creación del administrador inicial (opcional):

```bash
pnpm seed
```

Inicio del backend:

```bash
pnpm dev        # modo desarrollo con recarga automática
pnpm build      # compilación a dist/
pnpm start      # ejecuta el build compilado
```

### 3. Frontend

```bash
cd frontend
pnpm install
pnpm start      # servidor de desarrollo en http://localhost:4200
```

> El frontend apunta al backend en `http://localhost:3000/api/v1` (configurable en `src/app/core/config/environment.ts`).

### 4. Pruebas

```bash
# Backend (requiere la base finanzas_test creada y .env.test configurado)
cd backend
cp .env.test.example .env.test   # ajusta la cadena de conexión
pnpm test
```

## Variables de entorno

### Backend (`.env`)

| Variable | Propósito | Ejemplo | Obligatoria |
| --- | --- | --- | --- |
| `NODE_ENV` | Entorno de ejecución (`development`, `test`, `production`) | `development` | Sí |
| `PORT` | Puerto HTTP del backend | `3000` | No (default `3000`) |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | `postgresql://usuario:pass@localhost:5432/finanzas_dev` | Sí |
| `JWT_SECRET` | Secreto para firmar los JWT | `valor-largo-y-aleatorio` | Sí |
| `JWT_EXPIRES_IN` | Duración del token (formato `jsonwebtoken`) | `1h` | No |
| `COOKIE_NAME` | Nombre de la cookie HttpOnly | `finanzas_auth` | No |
| `COOKIE_SECURE` | Cookie `Secure` (true solo en HTTPS) | `false` | No |
| `CORS_ORIGIN` | Orígenes permitidos (separados por coma) | `http://localhost:4200` | No |
| `BCRYPT_ROUNDS` | Coste del hash de contraseñas | `12` | No |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciales del admin para el seed | `admin@finanzas.local` / `Cambiar123` | Solo para seed |

**Nunca coloques secretos reales en `.env.example` ni en el repositorio.** El archivo `.env` está en `.gitignore`.

### Frontend

- `src/app/core/config/environment.ts` → `apiUrl` (URL base de la API). Por defecto `http://localhost:3000/api/v1`.

## Funcionalidades

Estado de la Etapa 1:

- [x] Estructura del sistema (`/backend` + `/frontend`).
- [x] Registro de usuarios (público, rol `USR`).
- [x] Inicio de sesión (JWT en cookie HttpOnly).
- [x] Cierre de sesión.
- [x] Autenticación JWT (generación, firma, expiración y validación).
- [x] Autorización por roles (`USR`/`ADMIN`).
- [x] Protección de endpoints (backend).
- [x] Protección de rutas frontend (guards).
- [x] Validaciones en backend y frontend.
- [x] Manejo de errores centralizado.
- [x] Pruebas backend.
- [ ] Módulos de negocio (periodos, movimientos, presupuestos, objetivos, informes, etc.) — etapas posteriores.
- [ ] Administración de usuarios (CRUD admin) — etapa posterior.

## API

Base: `http://localhost:3000/api/v1`

### POST `/auth/register`

Registra un usuario público con rol `USR`.

- **Autenticación:** no requerida.
- **Request:**
  ```json
  { "email": "usuario@correo.com", "password": "Contrasena123" }
  ```
- **Response 201:**
  ```json
  {
    "user": {
      "id": "uuid",
      "email": "usuario@correo.com",
      "isActive": true,
      "roles": ["USR"],
      "createdAt": "2026-08-13T00:00:00.000Z"
    }
  }
  ```
- **Errores:**
  - `422 VALIDATION_ERROR` — datos inválidos (correo mal formado, contraseña débil, campos faltantes).
  - `409 EMAIL_ALREADY_REGISTERED` — el correo ya está registrado.
  - `400 INVALID_REQUEST` — JSON inválido.
  - `500 INTERNAL_ERROR` — error inesperado.

### POST `/auth/login`

Inicia sesión y establece la cookie HttpOnly con el JWT.

- **Autenticación:** no requerida.
- **Request:**
  ```json
  { "email": "usuario@correo.com", "password": "Contrasena123" }
  ```
- **Response 200:** igual al body de registro (usuario autenticado). Incluye `Set-Cookie: finanzas_auth=...; HttpOnly; SameSite=Lax`.
- **Errores:**
  - `422 VALIDATION_ERROR` — datos inválidos.
  - `401 INVALID_CREDENTIALS` — correo inexistente o contraseña incorrecta (mensaje genérico, no revela si el correo existe).
  - `403 ACCOUNT_DISABLED` — cuenta desactivada (después de validar la contraseña).

### POST `/auth/logout`

Cierra sesión y elimina la cookie.

- **Autenticación:** requerida.
- **Response 204:** sin cuerpo.

### GET `/auth/me`

Devuelve la sesión del usuario autenticado.

- **Autenticación:** requerida.
- **Response 200:**
  ```json
  { "user": { "id": "uuid", "email": "...", "isActive": true, "roles": ["USR"], "createdAt": "..." } }
  ```
- **Errores:**
  - `401 UNAUTHORIZED` — sin token.
  - `401 TOKEN_INVALID` — token inválido o sesión inexistente.
  - `401 TOKEN_EXPIRED` — token expirado.

### GET `/roles`

Lista los roles del sistema. **Rol requerido:** `ADMIN`.

- **Response 200:**
  ```json
  { "roles": [{ "id": "uuid", "name": "ADMIN" }, { "id": "uuid", "name": "USR" }] }
  ```
- **Errores:** `401 UNAUTHORIZED`, `403 FORBIDDEN`.

### Formato estándar de error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos proporcionados no son válidos.",
    "details": { "errors": { "email": "..." } }
  }
}
```

## Pruebas

### Backend

- **Framework:** `node:test` + `supertest` + `tsx`, contra una base de datos `finanzas_test`.
- **Ejecución:**
  ```bash
  cd backend
  cp .env.test.example .env.test
  pnpm test
  ```
- **Cobertura (23 casos):**

| Área | Escenarios |
| --- | --- |
| Registro | registro exitoso (rol USR), correo inválido, contraseña corta, contraseña sin letra/número, campos faltantes, correo duplicado, normalización de espacios |
| Login | login exitoso con cookie HttpOnly, credenciales incorrectas, correo inexistente, datos inválidos, cuenta desactivada, generación del JWT verificada vía `/auth/me`, logout |
| Autenticación | `/auth/me` con token válido, sin token, token inválido, token expirado, token con otro secreto |
| Roles | ADMIN puede listar roles, USR recibe 403, sin token 401, registro no permite asignar ADMIN |

### Frontend

- `vitest` configurado por Angular CLI. `pnpm test` en `frontend/`.
- Estado actual: sin casos adicionales en esta etapa (los flujos críticos se prueban en el backend, que es la autoridad de seguridad).

## Seguridad

- Contraseñas con hash seguro (`bcrypt`, coste configurable).
- JWT firmado con secreto mediante variables de entorno; expiración configurable.
- Cookie `HttpOnly` (el JavaScript del cliente no puede leer el token); `Secure` en producción.
- El frontend nunca confía en el cliente para autorización: el backend valida el rol y la propiedad de los recursos.
- Validación de entradas en el backend (el frontend vuelve a validar, pero el backend es la autoridad).
- CORS configurado con orígenes explícitos y `credentials: true`.
- Manejo seguro de errores: sin stack traces ni información interna hacia el cliente.
- Los datos financieros del `ADMIN` están aislados: el ADMIN no tiene endpoints para consultar finanzas de usuarios (regla de negocio y de seguridad).
- El registro público asigna siempre `USR`; nunca permite `ADMIN`.

## Estado del proyecto

```text
Etapa actual: Etapa 1

Implementado:
- Estructura del sistema (backend + frontend).
- Registro, login y logout.
- Autenticación JWT en cookie HttpOnly.
- Roles USR/ADMIN y autorización por rol.
- Protección de endpoints y rutas.
- Validaciones y manejo de errores.
- Migraciones, seed de roles y administrador.
- Pruebas backend (23 casos).
- Documentación (README.md, ERRORES_Y_SOLUCIONES.md).

Pendiente:
- Endpoints de administración de usuarios (GET/POST/PATCH/DELETE /users, roles, reset-password, status).
- Autenticación de refresh tokens (tabla creada, endpoint pendiente).
- Endpoints de forgot/reset password.

Próxima etapa:
- Módulos de negocio: periodos, categorías, movimientos, presupuestos, objetivos, informes y dashboard.
- Administración de usuarios desde el panel ADMIN.
```

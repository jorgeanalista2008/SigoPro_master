# SaaS Multi-Tenant de Contabilidad y Control Fiscal (Venezuela) - Backend 🚀

Este repositorio contiene la estructura base, backend y motor de base de datos para un SaaS B2B multi-tenant diseñado para el control contable y fiscal en Venezuela (declaraciones de IVA, ISLR, retenciones y archivos de exportación de texto para el SENIAT).

El backend está desarrollado utilizando **NestJS (TypeScript)**, **Prisma ORM (v7.x)**, y **PostgreSQL**, con documentación interactiva completamente tipada usando **Swagger**.

---

## 🛠️ Stack Tecnológico

- **Framework principal**: [NestJS](https://nestjs.com/) (TypeScript)
- **Base de Datos**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/) (v7.8) configurado con `@prisma/adapter-pg` y `pg` nativo.
- **Autenticación**: Passport + JWT (JsonWebToken) + Hashing con `bcrypt`.
- **Validación de Datos**: `class-validator` y `class-transformer` a nivel global.
- **Documentación de API**: Swagger UI (`@nestjs/swagger`) disponible en el endpoint `/api/docs`.

---

## 🏗️ Estructura del Modelo de Datos (Multi-Tenant & RBAC)

La base de datos relacional en PostgreSQL está modelada bajo las siguientes premisas:
1. **Tenant (Suscriptor B2B)**: Representa al cliente que paga la membresía del SaaS (la firma contable o empresa matriz). Controla la vigencia de su suscripción (`expiresAt`), el plan (`BASIC`, `PREMIUM`, `ENTERPRISE`) y el estado de la cuenta (`ACTIVE`, `SUSPENDED`, `INACTIVE`).
2. **Company (Empresas)**: Un Tenant puede registrar una o múltiples empresas (sus clientes contables) para llevar sus operaciones fiscales.
3. **User (Usuarios)**: Los usuarios pertenecen a un Tenant y tienen un Rol asignado.
4. **Roles y Permisos (RBAC)**: Permisos granulares del sistema (ej. `txt:generate`, `retention:create`) asociados a los roles a través de una relación de muchos a muchos (`RolePermission`).
5. **Menú Dinámico (`Menu` y `MenuItem`)**: Estructura jerárquica (expansores y enlaces) asociada a los permisos. Si el usuario no tiene permisos para ver un módulo, el endpoint no lo devuelve.
6. **Auditoría de Consumo (`UsageLog`)**: Tabla indizada por `tenant_id` para computar la facturación mensual basada en volumen (ej. cantidad de retenciones de IVA emitidas).

---

## 🔒 Arquitectura de Seguridad y Roles

- **Aislamiento de Tenants (IDOR Protection)**: El payload del JWT encapsula de forma segura los atributos `tenant_id` y `user_id`. El backend los extrae directamente del token validado por `JwtStrategy`, evitando que se pasen por parámetro y eliminando ataques de alteración de IDs.
- **Filtro Estricto de Roles (RBAC)**: Protegido por el guard personalizado `PermissionsGuard` y el decorador `@RequirePermissions(...)` a nivel de controlador.
- **Acceso Administrativo (Super Admin)**: Rutas administrativas protegidas por el guard `SuperAdminGuard` que valida que el usuario sea el administrador del sistema (`isSuperAdmin: true`).
- **Sanitización de Inputs (Mass Assignment Protection)**: NestJS descarta campos no registrados en los DTOs usando la configuración global de `ValidationPipe`.

---

## ⚙️ Configuración y Despliegue Local

### 1. Variables de Entorno (`.env`)
Asegúrate de configurar tu archivo `.env` en la raíz del proyecto. El archivo generado contiene los siguientes valores por defecto:

```env
DATABASE_URL="postgresql://postgres:Jf18759339@localhost:5432/contabilidad_db?schema=public"
JWT_SECRET="super-secret-key-venezuela-saas-2026"
JWT_EXPIRATION="24h"
```

### 2. Base de Datos (Migraciones y Semilla)
Prisma 7 utiliza `prisma.config.ts` para leer la conexión. Genera las tablas y puebla los datos iniciales ejecutando:

```bash
# Ejecutar migraciones e inicializar base de datos
npx prisma migrate dev --name init

# Poblar datos semilla (Seed)
npx prisma db seed
```

### 3. Ejecución del Servidor
```bash
# Instalar dependencias (si no lo has hecho)
npm install

# Iniciar servidor en modo desarrollo (con hot-reload)
npm run start:dev

# Compilar para producción
npm run build
```

---

## 📖 Documentación de API e Interactive Testing

Una vez que el servidor esté encendido, navega a:
👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

### Cuentas Sembradas para Pruebas (Base de Datos):

| Usuario / Rol | Correo Electrónico | Contraseña | Super Admin | Tenant Asociado | Escenario Contratación |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Super Administrador** | `admin@demo.com` | `AdminPass123!` | **Sí** | CC Venezolano | Control de todos los Tenants |
| **Contador Senior** | `contador@demo.com` | `Contador123!` | No | CC Venezolano | Membresía activa por 1 año |
| **Auxiliar Contable** | `auxiliar@demo.com` | `Auxiliar123!` | No | CC Venezolano | Permisos reducidos de visualización |
| **Dueño de Ferretería** | `tornillo@demo.com` | `Tornillo123!` | No | Ferretería El Tornillo | Membresía activa por 6 meses |
| **Suscripción Vencida** | `caducado@demo.com` | `Caducado123!` | No | Inversiones El Caducado | **Vencido hace 5 días** (Bloqueo fiscal) |
| **Vencimiento Próximo** | `vencimiento@demo.com` | `Vencimiento123!` | No | Bodega El Vencimiento | **Vence en 3 días** (Alerta de cobro) |
| **Suscripción Suspendida**| `bloqueado@demo.com` | `Bloqueado123!` | No | Constructora El Bloqueado | **Suspendida manualmente** |
| **Cliente Enterprise** | `antigravity@demo.com` | `Antigravity123!` | No | Tecnología Antigravity | Membresía activa / Alto volumen de uso |

---

## 🔗 Módulos y Endpoints Disponibles

La API expone los siguientes endpoints (todos bajo el prefijo global `/api`):

### 🔑 Autenticación (`/auth`)
* `POST /login`: Inicia sesión y obtiene el token de acceso JWT conteniendo los metadatos de Tenant y permisos planos.

### 🗺️ Menú Dinámico (`/menu`)
* `GET /`: Obtiene el árbol estructurado del menú filtrado dinámicamente según los permisos del JWT actual.

### 👑 Gestión de Tenants (`/tenants`) - *Solo Super Admin*
* `POST /`: Registra un nuevo Tenant e inicializa automáticamente sus roles base y su cuenta de usuario administrador.
* `GET /`: Retorna el listado de todos los tenants con conteo de usuarios y empresas.
* `GET /:id`: Retorna detalles específicos de facturación y entidades asociadas de un Tenant.
* `PATCH /:id`: Modifica el plan, estado (`ACTIVE`, `SUSPENDED`) o la fecha de expiración.
* `DELETE /:id`: Elimina de forma permanente el tenant y sus dependencias (cascada).

### 👑 Super Administrador - Consultas Globales (`/super-admin`) - *Solo Super Admin*
* `GET /tenants`: Retorna el listado global de todos los tenants del sistema.
* `GET /companies`: Lista todas las empresas contables registradas en el SaaS (cualquier tenant).
* `GET /users`: Lista todos los usuarios registrados en la plataforma, indicando su empresa y rol representativo.
* `GET /stats`: Muestra métricas agregadas del sistema (total tenants, empresas, usuarios y asientos de diario asentados).

### 🏢 Empresas Contables (`/companies`) - *Tenant Space*
* `POST /`: Registra una empresa contable asignada a tu Tenant (Requiere permiso `company:write` y valida RIF venezolano).
* `GET /`: Lista las empresas del Tenant actual (Requiere permiso `company:read`).
* `GET /:id`: Detalles de una empresa (Requiere `company:read` y valida aislamiento de tenant).
* `PATCH /:id`: Modifica datos o estado de la empresa (Requiere `company:write`).
* `DELETE /:id`: Elimina la empresa (Requiere `company:write`).

### 👥 Gestión de Usuarios (`/users`) - *Tenant Space*
* `POST /`: Crea una cuenta de usuario (Contador, Auxiliar) asignándole un rol del tenant y validando contraseña robusta (Requiere `user:write`).
* `GET /`: Lista todos los usuarios de tu equipo (Requiere `user:read`).
* `GET /:id`: Obtiene el detalle de un usuario (Requiere `user:read`).
* `PATCH /:id`: Modifica datos, contraseñas, estados o roles del usuario (Requiere `user:write`).
* `DELETE /:id`: Elimina un usuario (Requiere `user:write`, protegido contra auto-eliminación).

### 🛡️ Roles y Permisos (`/roles`) - *Tenant Space*
* `GET /`: Lista los roles locales del tenant con sus permisos inyectados (Requiere `role:read`).
* `GET /permissions`: Devuelve el catálogo global de permisos del sistema contable (Requiere `role:read`).
* `POST /`: Registra un nuevo rol personalizado dentro del tenant y asocia su lista de permisos (Requiere `role:write`).
* `PATCH /:id`: Actualiza el nombre o la lista de permisos de un rol (Requiere `role:write`).
* `DELETE /:id`: Elimina un rol personalizado del tenant, validando que no esté asignado a ningún usuario (Requiere `role:write`).

### 📊 Plan de Cuentas Contables (`/companies/:companyId/accounts`) - *Tenant Space*
* `POST /`: Registra una nueva cuenta contable para la empresa (Requiere `accounting:write` y valida formato numérico).
* `POST /import-default`: Importa de manera automática la estructura estándar de cuentas de Venezuela (VEN-NIF) (Requiere `accounting:write`).
* `GET /`: Lista las cuentas de la empresa (Requiere `accounting:read`, acepta query `?format=tree` o `list`).
* `GET /:id`: Detalles de una cuenta contable específica (Requiere `accounting:read`).
* `PATCH /:id`: Modifica el nombre o la configuración transaccional de la cuenta (Requiere `accounting:write`).
* `DELETE /:id`: Elimina una cuenta contable (solo si no posee sub-cuentas) (Requiere `accounting:write`).

### ✍️ Asientos Contables (`/companies/:companyId/journal-entries`) - *Tenant Space*
* `POST /`: Registra un nuevo asiento contable general (Requiere `accounting:write`, valida partida doble e incrementa el número correlativo).
* `GET /`: Lista todos los asientos de diario con sus líneas contables asociadas (Requiere `accounting:read`).
* `GET /:id`: Obtiene el detalle completo de un asiento y sus movimientos al Debe/Haber (Requiere `accounting:read`).

### 🇻🇪 Control Fiscal e Impuestos (`/companies/:companyId`) - *Tenant Space*
* `POST /tax-documents`: Registra un documento fiscal de Compra o Venta. Calcula IVA (16%/8%), aplica retenciones IVA (75%/100%) y de ISLR (Decreto 1808), e inserta automáticamente el asiento por partida doble (Requiere `invoice:write`).
* `GET /fiscal-books/compras`: Consulta el Libro de Compras oficial de la empresa para un mes/año (Requiere `invoice:read`).
* `GET /fiscal-books/ventas`: Consulta el Libro de Ventas oficial de la empresa para un mes/año (Requiere `invoice:read`).

---

## 💡 Guía de Integración con Next.js (Frontend)

### 1. Consumo del Menú en tu Sidebar
El endpoint `GET /api/menu` (protegido por JWT) devuelve un árbol jerárquico filtrado según los permisos del usuario. Puedes mapearlo en tu plantilla Next.js usando la propiedad `icon` para asociar íconos dinámicos de librerías como *Lucide Icons*:

**Respuesta JSON del Menu (Ejemplo):**
```json
[
  {
    "id": "item-uuid-1",
    "title": "Panel General",
    "path": "/dashboard",
    "icon": "layout-dashboard",
    "children": []
  },
  {
    "id": "item-uuid-2",
    "title": "Retenciones SENIAT",
    "path": null,
    "icon": "percent",
    "children": [
      {
        "id": "item-uuid-3",
        "title": "Retenciones IVA",
        "path": "/retenciones/iva",
        "icon": "receipt",
        "children": []
      }
    ]
  }
]
```

### 2. Uso Seguro del Payload JWT
El token JWT incluye los campos `tenant_id` y `user_id`. Guarda este token en una Cookie segura (HttpOnly) o en la sesión de NextAuth. El backend resolverá automáticamente la pertenencia de las empresas y facturas usando el contexto del token, evitando que el front tenga que pasar IDs vulnerables en los cuerpos de las peticiones.

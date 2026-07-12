# SigoPro: SaaS Multi-Tenant de Contabilidad y Control Fiscal (Venezuela) 🇻🇪🚀

**SigoPro** es una plataforma SaaS B2B robusta y modular diseñada para firmas de contadores y empresas en Venezuela. El sistema permite llevar la contabilidad general (Libros de Diario, Mayor y Balanza de Comprobación) y cumplir con las obligaciones fiscales venezolanas (Retenciones de IVA, Retenciones de ISLR bajo el Decreto 1808 y generación de archivos TXT listos para declarar ante el SENIAT).

---

## 🏗️ Arquitectura y Estructura del Monorepo

El proyecto está estructurado como un monorepo dividido en dos componentes principales:

```text
SigoPro_master/
├── backend/            # API REST construida con NestJS, Prisma y PostgreSQL
└── frontend/           # Interfaz de Usuario (SPA) construida con Next.js y React
```

### 1. Backend (NestJS) - Organización Modular Reestructurada
Reorganizamos el código del backend en capas lógicas estrictas para delimitar alcances y responsabilidades:
*   **`core/`**: Núcleo de control de la plataforma. Contiene el módulo de administración global de inquilinos (`tenant`), el gestor dinámico de menús (`menu-builder`) y de permisos (`permission-builder`).
*   **`identity/`**: Capa de autenticación y control de accesos basada en roles (RBAC - JWT Strategy, Roles y Permisos, Gestión de usuarios).
*   **`tenant-scoped/`**: Recursos propios de la firma de contadores (administración de sub-empresas o clientes de la firma).
*   **`company-scoped/`**: Operaciones contables y fiscales diarias de cada sub-empresa (`accounting` para plan de cuentas y asientos, `fiscal` para retenciones de impuestos e informes oficiales, y `reports` para libros legales).
*   **`shared/`**: Recursos comunes como el inyector dinámico de Prisma, interceptores de auditoría global (`AuditLog`), almacenamiento local asíncrono (`AsyncLocalStorage`) y el módulo de internacionalización (`i18n`).

### 2. Frontend (Next.js & React)
Construido sobre una plantilla administrativa moderna y premium basada en **MUI (Material UI)** y **React**:
*   **Aislamiento de Rutas por CASL:** Validación de permisos a nivel de cliente para habilitar o deshabilitar pestañas y vistas según el rol del usuario.
*   **Consumo de Menú Dinámico:** El menú lateral se genera dinámicamente consultando el backend, adaptándose en tiempo real a los privilegios del usuario autenticado.

---

## 🌐 Dualidad de Lenguaje (i18n)

SigoPro soporta de forma nativa e integrada la traducción al **Español** e **Inglés**, priorizando el español:

*   **Cliente (Frontend):** Se configuró el español por defecto con archivos JSON localizados (`es.json`), y se integró un conmutador binario (Español / Inglés) limpio en la barra superior.
*   **Servidor (Backend):** Implementamos un Exception Filter global (`I18nExceptionFilter`) y un middleware de contexto. El backend intercepta automáticamente todas las excepciones de NestJS (recursos no encontrados, duplicados, datos inválidos o accesos denegados) y las traduce según la cabecera `Accept-Language` enviada por el navegador.

---

## 🔒 Aislamiento Multi-Tenant de Datos

La aplicación utiliza un esquema de aislamiento lógico transparente de base de datos basado en **`AsyncLocalStorage` (CLS - Contextual Local Storage)** y **Prisma Query Extensions**:

1.  **Captura automática:** Un middleware global extrae la información del token JWT (`tenantId`, `userId`, `isSuperAdmin`, `lang`) de forma segura en cada petición HTTP y la almacena en un hilo de contexto en memoria.
2.  **Inyección transparente:** Al utilizar el cliente extendido de Prisma (`this.prisma.tenantClient`), el ORM inyecta de forma automática e invisible los filtros `tenantId` (y `companyId` en tablas de transacciones contables), eliminando cualquier riesgo de fuga cruzada de datos (IDOR) y simplificando el desarrollo del backend.
3.  **Bypass de Super Administrador:** Los Super Admins de la plataforma (Tenant Raíz) omiten automáticamente este aislamiento lógico y el `PermissionsGuard` para gestionar libremente todo el sistema.

---

## ⚙️ Configuración y Despliegue Local

### Requisitos Previos
*   Node.js (v18 o superior)
*   PostgreSQL
*   Git

### Paso 1: Configurar el Backend
1.  Ingresa a la carpeta del backend:
    ```bash
    cd backend
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Crea y configura tu archivo de variables de entorno `.env` en la raíz de `backend`:
    ```env
    DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/contabilidad_db?schema=public"
    JWT_SECRET="super-secret-key-venezuela-saas-2026"
    JWT_EXPIRATION="24h"
    ```
4.  Aplica las migraciones de base de datos y ejecuta el cargador semilla (seeder):
    ```bash
    npx prisma migrate dev --name init
    npx prisma db seed
    ```
5.  Inicia el servidor backend en modo desarrollo:
    ```bash
    npm run start:dev
    ```
    *La documentación Swagger estará disponible en: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)*

---

### Paso 2: Configurar el Frontend
1.  Ingresa a la carpeta del frontend:
    ```bash
    cd ../frontend
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Crea un archivo `.env` en la raíz de `frontend` configurando el endpoint del backend:
    ```env
    NEXT_PUBLIC_API_URL="http://localhost:3000/api"
    ```
4.  Inicia el servidor de Next.js:
    ```bash
    npm run dev
    ```
    *La aplicación web estará disponible en: [http://localhost:4000](http://localhost:4000)*

---

## 🔑 Credenciales Sembradas para Pruebas (Seeder)

Al ejecutar el seeder de base de datos se cargan los siguientes usuarios para probar diferentes flujos del sistema:

### 🏢 Inquilino Raíz (Plataforma)
*   **Super Administrador:**
    *   **Email:** `admin@demo.com`
    *   **Password:** `AdminPass123!`
    *   **Alcance:** Control total global de todos los inquilinos, creación de menús, edición de iconos y mantenimiento de catálogos de permisos.

### 🏢 Inquilino Cliente 1 (Firma Contable)
*   **Firma Admin:**
    *   **Email:** `firma1@demo.com`
    *   **Password:** `FirmaPass123!`
    *   **Alcance:** Administrador local del Tenant `Consorcio Contable Venezolano, C.A.`. Puede gestionar usuarios locales y crear sub-empresas.
*   **Contador Asistente 1:**
    *   **Email:** `contador@demo.com`
    *   **Password:** `Contador123!`
    *   **Alcance:** Empleado con permisos de lectura/escritura en facturas, retenciones y libros contables de su firma.
*   **Contador Asistente 2:**
    *   **Email:** `auxiliar@demo.com`
    *   **Password:** `Auxiliar123!`

### 🛡️ Otros Tenants de Escenarios Especiales (Administradores de Firma)
*   **Ferretería El Tornillo, C.A.** (Plan BASIC Activo): `tornillo@demo.com` / `Tornillo123!`
*   **Inversiones El Caducado, C.A.** (Suscripción Vencida/Expirada): `caducado@demo.com` / `Caducado123!`
*   **Bodega El Vencimiento, C.A.** (Vence en menos de 3 días): `vencimiento@demo.com` / `Vencimiento123!`
*   **Constructora El Bloqueado, C.A.** (Suscripción Suspendida): `bloqueado@demo.com` / `Bloqueado123!`
*   **Tecnología Avanzada Antigravity** (Plan ENTERPRISE Activo): `antigravity@demo.com` / `Antigravity123!`

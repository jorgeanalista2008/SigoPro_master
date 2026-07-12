import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Start seeding database...');

  // 1. Clear existing data in correct order to avoid foreign key violations
  await prisma.usageLog.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.menuItemPermission.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.menu.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.tenant.deleteMany({});
  await prisma.permission.deleteMany({});

  console.log('🧹 Cleaned existing tables');

  // 2. Create Permissions
  const permissionsData = [
    { name: 'tenant:read', description: 'Ver datos del tenant' },
    { name: 'tenant:write', description: 'Editar datos del tenant' },
    { name: 'company:read', description: 'Ver empresas registradas' },
    { name: 'company:write', description: 'Crear o editar empresas' },
    { name: 'user:read', description: 'Ver usuarios del tenant' },
    { name: 'user:write', description: 'Crear o editar usuarios' },
    { name: 'role:read', description: 'Ver roles y permisos' },
    { name: 'role:write', description: 'Configurar roles y asignar permisos' },
    { name: 'invoice:read', description: 'Consultar facturación' },
    { name: 'invoice:write', description: 'Registrar facturas' },
    { name: 'retention:read', description: 'Ver retenciones de IVA e ISLR' },
    { name: 'retention:create', description: 'Crear retenciones de IVA e ISLR' },
    { name: 'retention:delete', description: 'Eliminar o anular retenciones' },
    { name: 'txt:generate', description: 'Generar archivos TXT del SENIAT para declaraciones' },
    { name: 'accounting:read', description: 'Ver plan de cuentas y asientos contables' },
    { name: 'accounting:write', description: 'Crear o editar cuentas y registrar asientos' },
  ];

  const permissions: Record<string, any> = {};
  for (const perm of permissionsData) {
    permissions[perm.name] = await prisma.permission.create({
      data: perm,
    });
  }
  console.log(`✅ Created ${permissionsData.length} permissions`);

  // 3. Create Sidebar Menu
  const sidebarMenu = await prisma.menu.create({
    data: {
      name: 'Sidebar Principal',
      description: 'Menú lateral principal para el panel de control del usuario',
    },
  });
  console.log('✅ Created main sidebar menu');

  // 4. Create Menu Items
  // Dashboard (Public / No permissions needed)
  const dashboardMenu = await prisma.menuItem.create({
    data: {
      title: 'Panel General',
      path: '/dashboard',
      icon: 'layout-dashboard',
      order: 1,
      menuId: sidebarMenu.id,
    },
  });

  // Empresas (company:read)
  const companiesMenu = await prisma.menuItem.create({
    data: {
      title: 'Mis Empresas',
      path: '/empresas',
      icon: 'building',
      order: 2,
      menuId: sidebarMenu.id,
      permissions: {
        create: [
          { permissionId: permissions['company:read'].id },
        ],
      },
    },
  });

  // Facturas (invoice:read)
  const invoicesMenu = await prisma.menuItem.create({
    data: {
      title: 'Facturación',
      path: '/facturacion',
      icon: 'file-text',
      order: 3,
      menuId: sidebarMenu.id,
      permissions: {
        create: [
          { permissionId: permissions['invoice:read'].id },
        ],
      },
    },
  });

  // Retenciones (Parent Group - no direct permissions, but holds children)
  const retentionsParent = await prisma.menuItem.create({
    data: {
      title: 'Retenciones SENIAT',
      path: null, // Just a parent expander
      icon: 'percent',
      order: 4,
      menuId: sidebarMenu.id,
    },
  });

  // Retenciones IVA (retention:read)
  const retentionIvaMenu = await prisma.menuItem.create({
    data: {
      title: 'Retenciones IVA',
      path: '/retenciones/iva',
      icon: 'receipt',
      order: 1,
      menuId: sidebarMenu.id,
      parentId: retentionsParent.id,
      permissions: {
        create: [
          { permissionId: permissions['retention:read'].id },
        ],
      },
    },
  });

  // Retenciones ISLR (retention:read)
  const retentionIslrMenu = await prisma.menuItem.create({
    data: {
      title: 'Retenciones ISLR',
      path: '/retenciones/islr',
      icon: 'receipt-2',
      order: 2,
      menuId: sidebarMenu.id,
      parentId: retentionsParent.id,
      permissions: {
        create: [
          { permissionId: permissions['retention:read'].id },
        ],
      },
    },
  });

  // Generador TXT (txt:generate)
  const generatorTxtMenu = await prisma.menuItem.create({
    data: {
      title: 'Generación TXT',
      path: '/retenciones/generar-txt',
      icon: 'file-code',
      order: 3,
      menuId: sidebarMenu.id,
      parentId: retentionsParent.id,
      permissions: {
        create: [
          { permissionId: permissions['txt:generate'].id },
        ],
      },
    },
  });

  // Contabilidad (Parent Group - order 5)
  const accountingParent = await prisma.menuItem.create({
    data: {
      title: 'Contabilidad',
      path: null,
      icon: 'book',
      order: 5,
      menuId: sidebarMenu.id,
    },
  });

  // Plan de Cuentas (accounting:read)
  await prisma.menuItem.create({
    data: {
      title: 'Plan de Cuentas',
      path: '/contabilidad/cuentas',
      icon: 'list-numbers',
      order: 1,
      menuId: sidebarMenu.id,
      parentId: accountingParent.id,
      permissions: {
        create: [
          { permissionId: permissions['accounting:read'].id },
        ],
      },
    },
  });

  // Asientos Diarios (accounting:read)
  await prisma.menuItem.create({
    data: {
      title: 'Asientos Diarios',
      path: '/contabilidad/asientos',
      icon: 'file-spreadsheet',
      order: 2,
      menuId: sidebarMenu.id,
      parentId: accountingParent.id,
      permissions: {
        create: [
          { permissionId: permissions['accounting:read'].id },
        ],
      },
    },
  });

  // Reportes (Parent Group - order 6)
  const reportsParent = await prisma.menuItem.create({
    data: {
      title: 'Reportes Financieros',
      path: null,
      icon: 'chart-bar',
      order: 6,
      menuId: sidebarMenu.id,
    },
  });

  // Libro Diario (accounting:read)
  await prisma.menuItem.create({
    data: {
      title: 'Libro Diario',
      path: '/reportes/diario',
      icon: 'file-text',
      order: 1,
      menuId: sidebarMenu.id,
      parentId: reportsParent.id,
      permissions: {
        create: [
          { permissionId: permissions['accounting:read'].id },
        ],
      },
    },
  });

  // Libro Mayor (accounting:read)
  await prisma.menuItem.create({
    data: {
      title: 'Libro Mayor',
      path: '/reportes/mayor',
      icon: 'book',
      order: 2,
      menuId: sidebarMenu.id,
      parentId: reportsParent.id,
      permissions: {
        create: [
          { permissionId: permissions['accounting:read'].id },
        ],
      },
    },
  });

  // Balanza de Comprobación (accounting:read)
  await prisma.menuItem.create({
    data: {
      title: 'Balanza de Comprobación',
      path: '/reportes/balanza',
      icon: 'scale',
      order: 3,
      menuId: sidebarMenu.id,
      parentId: reportsParent.id,
      permissions: {
        create: [
          { permissionId: permissions['accounting:read'].id },
        ],
      },
    },
  });

  // Configuración (Parent Group - holds settings)
  const settingsParent = await prisma.menuItem.create({
    data: {
      title: 'Configuración',
      path: null,
      icon: 'settings',
      order: 7,
      menuId: sidebarMenu.id,
    },
  });

  // Mi Perfil (Public settings)
  const profileMenu = await prisma.menuItem.create({
    data: {
      title: 'Mi Perfil',
      path: '/configuracion/perfil',
      icon: 'user',
      order: 1,
      menuId: sidebarMenu.id,
      parentId: settingsParent.id,
    },
  });

  // Usuarios (user:read)
  const usersMenu = await prisma.menuItem.create({
    data: {
      title: 'Gestión de Usuarios',
      path: '/configuracion/usuarios',
      icon: 'users',
      order: 2,
      menuId: sidebarMenu.id,
      parentId: settingsParent.id,
      permissions: {
        create: [
          { permissionId: permissions['user:read'].id },
        ],
      },
    },
  });

  // Roles (role:read)
  const rolesMenu = await prisma.menuItem.create({
    data: {
      title: 'Roles y Permisos',
      path: '/configuracion/roles',
      icon: 'shield-check',
      order: 3,
      menuId: sidebarMenu.id,
      parentId: settingsParent.id,
      permissions: {
        create: [
          { permissionId: permissions['role:read'].id },
        ],
      },
    },
  });

  console.log('✅ Created menu items tree with permission mappings');

  // 5. Create Root Tenant (SaaS Owner)
  const rootTenant = await prisma.tenant.create({
    data: {
      id: 'SaaS_Owner',
      name: 'SigoPro Plataforma (SaaS Owner)',
      rif: 'J-00000000-0',
      plan: 'ROOT',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Created Root Tenant: ${rootTenant.name} (${rootTenant.id})`);

  const saltRounds = 10;

  // Create Super Admin Role for Root Tenant
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Administrador',
      tenantId: rootTenant.id,
      permissions: {
        create: Object.keys(permissions).map((key) => ({
          permissionId: permissions[key].id,
        })),
      },
    },
  });

  // Create Super Admin User under Root Tenant
  const superAdminUser = await prisma.user.create({
    data: {
      name: 'Jorge Analista (Super Admin)',
      email: 'admin@demo.com',
      password: await bcrypt.hash('AdminPass123!', saltRounds),
      tenantId: rootTenant.id,
      roleId: superAdminRole.id,
      status: 'ACTIVE',
      isSuperAdmin: true,
    },
  });
  console.log(`✅ Created Super Admin User: ${superAdminUser.email} (password: AdminPass123!)`);

  // 6. Create Default Client Tenant 1
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Consorcio Contable Venezolano, C.A.',
      rif: 'J-40012345-6',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      expiresAt: oneYearFromNow,
    },
  });
  console.log(`✅ Created Client Tenant 1: ${tenant.name} (${tenant.rif})`);

  // 7. Create Default Roles for the Client Tenant
  const adminRole = await prisma.role.create({
    data: {
      name: 'Administrador de Firma',
      tenantId: tenant.id,
      permissions: {
        create: Object.keys(permissions).map((key) => ({
          permissionId: permissions[key].id,
        })),
      },
    },
  });

  const contadorRole = await prisma.role.create({
    data: {
      name: 'Contador Asistente',
      tenantId: tenant.id,
      permissions: {
        create: [
          { permissionId: permissions['company:read'].id },
          { permissionId: permissions['invoice:read'].id },
          { permissionId: permissions['invoice:write'].id },
          { permissionId: permissions['retention:read'].id },
          { permissionId: permissions['retention:create'].id },
          { permissionId: permissions['txt:generate'].id },
          { permissionId: permissions['accounting:read'].id },
          { permissionId: permissions['accounting:write'].id },
        ],
      },
    },
  });
  console.log('✅ Created Client Tenant Roles (Administrador de Firma, Contador Asistente)');

  // 8. Create Default Company under Client Tenant
  const company = await prisma.company.create({
    data: {
      name: 'Inversiones Polar, C.A.',
      rif: 'J-30065432-1',
      tenantId: tenant.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Created Company: ${company.name} (${company.rif})`);

  // 9. Create Default Users under Client Tenant
  const adminFirmaUser = await prisma.user.create({
    data: {
      name: 'Jorge Flores (Firma Admin)',
      email: 'firma1@demo.com',
      password: await bcrypt.hash('FirmaPass123!', saltRounds),
      tenantId: tenant.id,
      roleId: adminRole.id,
      status: 'ACTIVE',
      isSuperAdmin: false,
    },
  });

  const contadorUser = await prisma.user.create({
    data: {
      name: 'Carlos Mendoza (Contador)',
      email: 'contador@demo.com',
      password: await bcrypt.hash('Contador123!', saltRounds),
      tenantId: tenant.id,
      roleId: contadorRole.id,
      status: 'ACTIVE',
    },
  });

  const auxiliarUser = await prisma.user.create({
    data: {
      name: 'María Delgado (Auxiliar)',
      email: 'auxiliar@demo.com',
      password: await bcrypt.hash('Auxiliar123!', saltRounds),
      tenantId: tenant.id,
      roleId: contadorRole.id,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created Users for Tenant 1:');
  console.log(`   - Firma Admin: ${adminFirmaUser.email} (password: FirmaPass123!)`);
  console.log(`   - Contador Asistente: ${contadorUser.email} (password: Contador123!)`);
  console.log(`   - Auxiliar: ${auxiliarUser.email} (password: Auxiliar123!)`);

  // --- SEEDING SECOND TENANT ---
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Ferretería El Tornillo, C.A.',
      rif: 'J-50098765-4',
      plan: 'BASIC',
      status: 'ACTIVE',
      expiresAt: sixMonthsFromNow,
    },
  });
  console.log(`✅ Created Second Tenant: ${tenant2.name} (${tenant2.rif})`);

  const adminRoleTenant2 = await prisma.role.create({
    data: {
      name: 'Administrador de Firma',
      tenantId: tenant2.id,
      permissions: {
        create: Object.keys(permissions).map((key) => ({
          permissionId: permissions[key].id,
        })),
      },
    },
  });

  const companyTenant2 = await prisma.company.create({
    data: {
      name: 'Distribuidora El Tornillo, C.A.',
      rif: 'J-50098765-5',
      tenantId: tenant2.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Created Company for Tenant 2: ${companyTenant2.name} (${companyTenant2.rif})`);

  const adminUserTenant2 = await prisma.user.create({
    data: {
      name: 'Pedro Pérez (Tornillo Owner)',
      email: 'tornillo@demo.com',
      password: await bcrypt.hash('Tornillo123!', saltRounds),
      tenantId: tenant2.id,
      roleId: adminRoleTenant2.id,
      status: 'ACTIVE',
      isSuperAdmin: false,
    },
  });
  console.log(`   - Owner Tenant 2: ${adminUserTenant2.email} (password: Tornillo123!)`);

  // --- SEEDING THIRD TENANT (EXPIRED) ---
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const tenant3 = await prisma.tenant.create({
    data: {
      name: 'Inversiones El Caducado, C.A.',
      rif: 'J-60011122-3',
      plan: 'BASIC',
      status: 'ACTIVE',
      expiresAt: fiveDaysAgo,
    },
  });
  console.log(`✅ Created Expired Tenant: ${tenant3.name} (${tenant3.rif})`);

  const adminRoleTenant3 = await prisma.role.create({
    data: {
      name: 'Administrador de Firma',
      tenantId: tenant3.id,
      permissions: {
        create: Object.keys(permissions).map((key) => ({
          permissionId: permissions[key].id,
        })),
      },
    },
  });

  const companyTenant3 = await prisma.company.create({
    data: {
      name: 'Comercializadora El Pasado, C.A.',
      rif: 'J-60011122-4',
      tenantId: tenant3.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Created Company for Tenant 3: ${companyTenant3.name}`);

  const adminUserTenant3 = await prisma.user.create({
    data: {
      name: 'Carlos Expired (Owner)',
      email: 'caducado@demo.com',
      password: await bcrypt.hash('Caducado123!', saltRounds),
      tenantId: tenant3.id,
      roleId: adminRoleTenant3.id,
      status: 'ACTIVE',
      isSuperAdmin: false,
    },
  });
  console.log(`   - Owner Tenant 3: ${adminUserTenant3.email} (password: Caducado123!)`);


  // --- SEEDING FOURTH TENANT (EXPIRING SOON) ---
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const tenant4 = await prisma.tenant.create({
    data: {
      name: 'Bodega El Vencimiento, C.A.',
      rif: 'J-70022233-4',
      plan: 'PREMIUM',
      status: 'ACTIVE',
      expiresAt: threeDaysFromNow,
    },
  });
  console.log(`✅ Created Expiring Soon Tenant: ${tenant4.name} (${tenant4.rif})`);

  const adminRoleTenant4 = await prisma.role.create({
    data: {
      name: 'Administrador de Firma',
      tenantId: tenant4.id,
      permissions: {
        create: Object.keys(permissions).map((key) => ({
          permissionId: permissions[key].id,
        })),
      },
    },
  });

  const companyTenant4 = await prisma.company.create({
    data: {
      name: 'Víveres La Esquina, C.A.',
      rif: 'J-70022233-5',
      tenantId: tenant4.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Created Company for Tenant 4: ${companyTenant4.name}`);

  const adminUserTenant4 = await prisma.user.create({
    data: {
      name: 'Juan Soon (Owner)',
      email: 'vencimiento@demo.com',
      password: await bcrypt.hash('Vencimiento123!', saltRounds),
      tenantId: tenant4.id,
      roleId: adminRoleTenant4.id,
      status: 'ACTIVE',
      isSuperAdmin: false,
    },
  });
  console.log(`   - Owner Tenant 4: ${adminUserTenant4.email} (password: Vencimiento123!)`);


  // --- SEEDING FIFTH TENANT (SUSPENDED) ---
  const tenant5 = await prisma.tenant.create({
    data: {
      name: 'Constructora El Bloqueado, C.A.',
      rif: 'J-80033344-5',
      plan: 'ENTERPRISE',
      status: 'SUSPENDED',
      expiresAt: oneYearFromNow,
    },
  });
  console.log(`✅ Created Suspended Tenant: ${tenant5.name} (${tenant5.rif})`);

  const adminRoleTenant5 = await prisma.role.create({
    data: {
      name: 'Administrador de Firma',
      tenantId: tenant5.id,
      permissions: {
        create: Object.keys(permissions).map((key) => ({
          permissionId: permissions[key].id,
        })),
      },
    },
  });

  const companyTenant5 = await prisma.company.create({
    data: {
      name: 'Obras y Proyectos Caracas, C.A.',
      rif: 'J-80033344-6',
      tenantId: tenant5.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Created Company for Tenant 5: ${companyTenant5.name}`);

  const adminUserTenant5 = await prisma.user.create({
    data: {
      name: 'Pedro Blocked (Owner)',
      email: 'bloqueado@demo.com',
      password: await bcrypt.hash('Bloqueado123!', saltRounds),
      tenantId: tenant5.id,
      roleId: adminRoleTenant5.id,
      status: 'ACTIVE',
      isSuperAdmin: false,
    },
  });
  console.log(`   - Owner Tenant 5: ${adminUserTenant5.email} (password: Bloqueado123!)`);


  // --- SEEDING SIXTH TENANT (HEALTHY ENTERPRISE) ---
  const eightMonthsFromNow = new Date();
  eightMonthsFromNow.setMonth(eightMonthsFromNow.getMonth() + 8);

  const tenant6 = await prisma.tenant.create({
    data: {
      name: 'Tecnología Avanzada Antigravity, C.A.',
      rif: 'J-90044455-6',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      expiresAt: eightMonthsFromNow,
    },
  });
  console.log(`✅ Created Healthy Tenant: ${tenant6.name} (${tenant6.rif})`);

  const adminRoleTenant6 = await prisma.role.create({
    data: {
      name: 'Administrador de Firma',
      tenantId: tenant6.id,
      permissions: {
        create: Object.keys(permissions).map((key) => ({
          permissionId: permissions[key].id,
        })),
      },
    },
  });

  const companyTenant6 = await prisma.company.create({
    data: {
      name: 'Antigravity Dev Studio, C.A.',
      rif: 'J-90044455-7',
      tenantId: tenant6.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Created Company for Tenant 6: ${companyTenant6.name}`);

  const adminUserTenant6 = await prisma.user.create({
    data: {
      name: 'Alan Turing (Owner)',
      email: 'antigravity@demo.com',
      password: await bcrypt.hash('Antigravity123!', saltRounds),
      tenantId: tenant6.id,
      roleId: adminRoleTenant6.id,
      status: 'ACTIVE',
      isSuperAdmin: false,
    },
  });
  console.log(`   - Owner Tenant 6: ${adminUserTenant6.email} (password: Antigravity123!)`);

  // 9. Seed Usage Logs
  await prisma.usageLog.createMany({
    data: [
      { tenantId: tenant.id, action: 'EMISION_RETENCION', quantity: 15 },
      { tenantId: tenant.id, action: 'GENERACION_TXT', quantity: 3 },
      { tenantId: tenant.id, action: 'CONSULTA_EMPRESAS', quantity: 45 },
      { tenantId: tenant2.id, action: 'EMISION_RETENCION', quantity: 8 },
      { tenantId: tenant3.id, action: 'CONSULTA_EMPRESAS', quantity: 2 },
      { tenantId: tenant4.id, action: 'EMISION_RETENCION', quantity: 12 },
      { tenantId: tenant6.id, action: 'EMISION_RETENCION', quantity: 120 },
      { tenantId: tenant6.id, action: 'GENERACION_TXT', quantity: 25 },
    ],
  });
  console.log('✅ Created sample usage metrics logs for all tenants');
  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

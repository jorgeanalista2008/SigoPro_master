import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  async findAllTenants() {
    const tenants = await this.prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            companies: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      createdAt: tenant.createdAt,
      usersCount: tenant._count.users,
      companiesCount: tenant._count.companies,
    }));
  }

  async findAllCompanies() {
    const companies = await this.prisma.company.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { tenant: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    return companies.map((company) => ({
      id: company.id,
      name: company.name,
      rif: company.rif,
      status: company.status,
      createdAt: company.createdAt,
      tenant: {
        id: company.tenant.id,
        name: company.tenant.name,
      },
    }));
  }

  async findAllUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { tenant: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      isSuperAdmin: user.isSuperAdmin,
      createdAt: user.createdAt,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
      },
      role: user.role
        ? {
            id: user.role.id,
            name: user.role.name,
          }
        : null,
    }));
  }

  async getSystemStats() {
    const [tenantsCount, companiesCount, usersCount, entriesCount] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.company.count(),
      this.prisma.user.count(),
      this.prisma.journalEntry.count(),
    ]);

    return {
      tenantsCount,
      companiesCount,
      usersCount,
      entriesCount,
    };
  }
}

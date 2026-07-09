import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto, tenantId: string) {
    const { name, rif, status } = createCompanyDto;

    // Check if a company with this RIF is already registered globally (since RIF is unique in Venezuela)
    const existingCompany = await this.prisma.company.findUnique({
      where: { rif },
    });
    if (existingCompany) {
      throw new ConflictException(`Ya existe una empresa registrada con el RIF ${rif}`);
    }

    return this.prisma.company.create({
      data: {
        name,
        rif,
        status: status || 'ACTIVE',
        tenantId, // Ensure it is linked to the authenticated user's tenant
      },
    });
  }

  async findAll(tenantId: string) {
    // Only return companies that belong to the user's tenant
    return this.prisma.company.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    // Enforce tenant isolation by querying by both ID and tenantId
    const company = await this.prisma.company.findFirst({
      where: { id, tenantId },
    });

    if (!company) {
      // Return 404 to prevent enumeration attacks across tenants
      throw new NotFoundException(`Empresa con ID ${id} no encontrada en tu cuenta.`);
    }

    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, tenantId: string) {
    // Ensure the company exists and belongs to this tenant first
    const company = await this.findOne(id, tenantId);

    // If changing the RIF, ensure it's not already registered by another company
    if (updateCompanyDto.rif && updateCompanyDto.rif !== company.rif) {
      const existingCompany = await this.prisma.company.findUnique({
        where: { rif: updateCompanyDto.rif },
      });
      if (existingCompany) {
        throw new ConflictException(
          `Ya existe otra empresa registrada con el RIF ${updateCompanyDto.rif}`,
        );
      }
    }

    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
  }

  async remove(id: string, tenantId: string) {
    // Ensure the company exists and belongs to this tenant first
    await this.findOne(id, tenantId);

    await this.prisma.company.delete({
      where: { id },
    });

    return { message: `Empresa con ID ${id} eliminada con éxito.` };
  }
}

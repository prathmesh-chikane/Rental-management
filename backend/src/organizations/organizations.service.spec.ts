import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service.js';
import { getModelToken } from '@nestjs/mongoose';

const mockOrganizationModel = {};

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: getModelToken('Organization'), useValue: mockOrganizationModel },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

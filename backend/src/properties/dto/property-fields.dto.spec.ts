import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePropertyDto } from './create-property.dto.js';
import { UpdatePropertyDto } from './update-property.dto.js';
import { SyncUnitsDto } from '../../Units/dto/sync-units.dto.js';

const retainedPropertyFields = {
  constructionYear: 2000,
  reraNumber: 'ABC123',
  landmark: 'Near the park',
  carpetArea: 850,
  totalFloors: 10,
  managerName: 'Asha Patil',
  managerPhone: '9876543210',
  description: 'A property near the city center.',
};

const removedPropertyFields = {
  ownership: 'Self Owned',
  addressLine: '1 Main Street',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411001',
  mapLink: 'https://maps.example.com/property',
  unitTypes: ['2 BHK'],
  furnishing: 'Semi-Furnished',
  depositMonths: 2,
  maintenance: 1000,
  rentDueDay: 5,
  rentIncrement: 5,
  lockInMonths: 6,
  parking: 'Four-Wheeler',
  tenantPreference: 'Family Only',
  documents: ['Ownership / Sale Deed'],
  unitList: [{ unitNumber: 'A-101' }],
};

describe('Property DTO fields', () => {
  it('accepts the retained property fields when creating a property', async () => {
    const dto = plainToInstance(CreatePropertyDto, {
      name: 'Greenfield Heights',
      location: 'Pune',
      ...retainedPropertyFields,
    });

    await expect(
      validate(dto, { whitelist: true, forbidNonWhitelisted: true }),
    ).resolves.toEqual([]);
  });

  it('accepts the retained property fields when updating a property', async () => {
    const dto = plainToInstance(UpdatePropertyDto, retainedPropertyFields);

    await expect(
      validate(dto, { whitelist: true, forbidNonWhitelisted: true }),
    ).resolves.toEqual([]);
  });

  it('rejects fields that no longer belong to a Property document', async () => {
    const createErrors = await validate(
      plainToInstance(CreatePropertyDto, {
        name: 'Greenfield Heights',
        location: 'Pune',
        ...removedPropertyFields,
      }),
      { whitelist: true, forbidNonWhitelisted: true },
    );
    const updateErrors = await validate(
      plainToInstance(UpdatePropertyDto, removedPropertyFields),
      { whitelist: true, forbidNonWhitelisted: true },
    );

    expect(createErrors.map((error) => error.property)).toEqual(
      expect.arrayContaining(Object.keys(removedPropertyFields)),
    );
    expect(updateErrors.map((error) => error.property)).toEqual(
      expect.arrayContaining(Object.keys(removedPropertyFields)),
    );
  });

  it('accepts per-unit rent and deposit in the Units API payload', async () => {
    const dto = plainToInstance(SyncUnitsDto, {
      units: [
        {
          unitNumber: 'Flat 101',
          wing: 'A',
          floor: 2,
          type: '2BHK',
          rentAmount: 1500000,
          depositAmount: 2000000,
          status: 'vacant',
        },
      ],
    });

    await expect(
      validate(dto, { whitelist: true, forbidNonWhitelisted: true }),
    ).resolves.toEqual([]);
  });

  it('normalizes legacy title-case unit statuses before validation', async () => {
    const dto = plainToInstance(SyncUnitsDto, {
      units: [
        {
          unitNumber: 'Flat 101',
          rentAmount: 1500000,
          depositAmount: 2000000,
          status: 'Vacant',
        },
      ],
    });

    await expect(
      validate(dto, { whitelist: true, forbidNonWhitelisted: true }),
    ).resolves.toEqual([]);
    expect(dto.units[0].status).toBe('vacant');
  });
});

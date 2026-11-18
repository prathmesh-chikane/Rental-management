import { IsMongoId } from 'class-validator';

// Body of  POST /properties/:propertyId/units/:unitNumber/assign  (and /release)
export class AssignUnitDto {
    @IsMongoId()
    tenantId: string;
}

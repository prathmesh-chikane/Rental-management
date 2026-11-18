import { Transform, Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsIn,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import { UNIT_STATUSES } from '../Unit.schema.js';
import type { UnitStatus } from '../Unit.schema.js';

// One unit sent by the frontend form
export class UnitItemDto {
    // Letters, numbers, single spaces, - and /. Example: Flat 101, A-101, SHOP-1
    @IsString()
    @MaxLength(20)
    @Matches(/^(?!.* {2})[A-Za-z0-9][A-Za-z0-9 /-]*$/, {
        message: 'Unit number can contain only letters, numbers, single spaces, - and /',
    })
    unitNumber: string;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    wing?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    floor?: number;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    type?: string;

    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toLowerCase() : value,
    )
    @IsIn(UNIT_STATUSES)
    status: UnitStatus;

    @IsNumber()
    @Min(0)
    rentAmount: number;

    @IsNumber()
    @Min(0)
    depositAmount: number;
}

// The full list of units of one property
export class SyncUnitsDto {
    @IsArray()
    @ArrayMaxSize(2000, { message: 'A property can have at most 2000 units' })
    @ValidateNested({ each: true })
    @Type(() => UnitItemDto)
    units: UnitItemDto[];
}
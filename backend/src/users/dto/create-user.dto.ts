import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
} from 'class-validator';

export class CreateUserDto {
    // User चे नाव
    @IsString()
    @IsNotEmpty()
    name: string;

    // Valid email आवश्यक
    @IsEmail()
    @IsNotEmpty()
    email: string;

    // Password कमीत कमी 8 characters
    @IsString()
    @MinLength(8)
    password: string;
}
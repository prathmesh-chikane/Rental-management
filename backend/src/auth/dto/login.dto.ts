
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
} from 'class-validator';

export class LoginDto {
    // Email validation
    @IsEmail()
    @IsNotEmpty()
    email: string;

    // Password validation
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;
}

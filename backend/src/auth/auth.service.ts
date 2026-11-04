
import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import {
    User,
    UserDocument,
} from '../users/schemas/user.schema.js';

import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,

        private readonly jwtService: JwtService,
    ) { }

    async login(loginDto: LoginDto) {
        // 1. Email वरून User शोधणे
        const user = await this.userModel
            .findOne({
                email: loginDto.email.toLowerCase().trim(),
            })
            .select('+password')
            .exec();

        // 2. User अस्तित्वात आहे का?
        if (!user) {
            throw new UnauthorizedException(
                'Invalid email or password',
            );
        }

        // 3. Account Active आहे का?
        if (!user.isActive) {
            throw new UnauthorizedException(
                'Your account is inactive',
            );
        }

        // 4. Password verify करणे
        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException(
                'Invalid email or password',
            );
        }

        // 5. JWT Payload तयार करणे
        const payload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
            organizationId: user.organizationId?.toString() ?? null,
        };

        // 6. JWT Token तयार करणे
        const accessToken = await this.jwtService.signAsync(
            payload,
        );

        // 7. Safe response
        return {
            success: true,
            message: 'Login successful',
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
            },
        };
    }
}

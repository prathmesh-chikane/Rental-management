import {
    Injectable,
    ConflictException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import {
    User,
    UserDocument,
} from './schemas/user.schema.js';

import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UsersService {
    constructor(
        // MongoDB मधील User Model inject करणे
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
    ) { }

    // नवीन Tenant तयार करणे
    async create(createUserDto: CreateUserDto) {
        // 1. Email आधीपासून आहे का तपासणे
        const existingUser = await this.userModel
            .findOne({ email: createUserDto.email })
            .exec();

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        // 2. Password Hash करणे
        const hashedPassword = await bcrypt.hash(
            createUserDto.password,
            12,
        );

        // 3. नवीन User तयार करणे
        const newUser = new this.userModel({
            name: createUserDto.name,
            email: createUserDto.email,
            password: hashedPassword,

            // Public registration मधून फक्त Tenant तयार होईल
            role: 'tenant',

            // Tenant ला Organization पुढील invitation/assignment मधून जोडू
            organizationId: null,

            isActive: true,
        });

        // 4. MongoDB मध्ये Save करणे
        const savedUser = await newUser.save();

        // MongoDB मधून आलेला User object
        const userResponse = savedUser.toObject();

        // Password response मधून exclude करणे
        const { password, ...safeUser } = userResponse;

        return {
            message: 'Tenant registered successfully',
            user: safeUser,
        };
    }
}
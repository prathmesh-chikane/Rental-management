import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './schemas/user.schema.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [
    // MongoDB मध्ये User Schema register करणे
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],

  // REST API Controller register करणे
  controllers: [UsersController],

  // Business Logic Service register करणे
  providers: [UsersService],

  // दुसऱ्या Modules मध्ये User Model आणि Service वापरण्यासाठी
  exports: [MongooseModule, UsersService],
})
export class UsersModule { }
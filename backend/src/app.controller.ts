import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Controller()
export class AppController {
  constructor(
    @InjectConnection()
    private readonly connection: mongoose.Connection,
  ) { }

  @Get('health')
  checkHealth() {
    const connected = this.connection.readyState === 1;

    return {
      success: connected,
      message: connected
        ? 'MongoDB connected successfully!'
        : 'MongoDB is not connected',
      database: this.connection.name,
      status: connected ? 'Connected' : 'Disconnected',
    };
  }
}

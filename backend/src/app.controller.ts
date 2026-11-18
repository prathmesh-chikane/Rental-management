import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Controller()
export class AppController {
  constructor(
    @InjectConnection()
    private readonly connection: mongoose.Connection,
  ) {}

  @Get()
  getRoot() {
    return this.checkHealth();
  }

  @Get('health')
  checkHealth() {
    const isDbConnected = this.connection.readyState === 1;

    return {
      success: true,
      backend: 'Connected',
      database: isDbConnected ? 'Connected' : 'Disconnected',
      databaseName: this.connection.name || 'rental_management_db',
      message: isDbConnected
        ? 'Backend and MongoDB connected successfully!'
        : 'Backend is running, but MongoDB is not connected',
      status: isDbConnected ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { getConnectionToken } from '@nestjs/mongoose';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockConnection = {
      readyState: 1,
      name: 'rental_management_db',
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return connected status', () => {
      const result = appController.checkHealth();
      expect(result.status).toBe('Connected');
      expect(result.success).toBe(true);
    });
  });
});

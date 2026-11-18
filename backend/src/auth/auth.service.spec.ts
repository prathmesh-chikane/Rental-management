import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';





import { AuthService } from './auth.service.js';
import { JwtService } from '@nestjs/jwt';

const mockUserModel = {};
const mockJwtService = { sign: vi.fn(), verify: vi.fn() };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'UserModel', useValue: mockUserModel },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

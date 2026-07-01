import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health/db')
  async checkDb() {
    const usersCount = await this.prisma.user.count();

    return {
      status: 'ok',
      database: 'connected',
      usersCount,
    };
  }
}
import { Injectable } from '@nestjs/common';
import { userPublicSelect } from '../common/selects/prisma.select';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  return this.prisma.user.create({
    data,
    select: userPublicSelect,
  });
}

 
}
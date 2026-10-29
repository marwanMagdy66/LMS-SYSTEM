import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './DTO/create-user.dto.js';
import * as argon2 from 'argon2';
import { UpdateUserDto } from './DTO/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  //find all users
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  //create user
  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const passwordHash = await argon2.hash(createUserDto.password);
    return this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  //find user by id
  async findUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  
  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findUserById(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    if (updateUserDto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: updateUserDto.phone },
      });

      if (existingPhone && existingPhone.id !== id) {
        throw new ConflictException('Phone number already exists');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }


  //delete user
  async deleteUser(id: string) {
    await this.findUserById(id);

    return this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }
}

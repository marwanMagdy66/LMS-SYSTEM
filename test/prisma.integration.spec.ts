
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Prisma PostgreSQL connection', () => {
  const prisma = new PrismaService();

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should execute a query successfully', async () => {
    const result = await prisma.$queryRaw<{ result: number }[]>`
      SELECT 1 AS result
    `;

    expect(Number(result[0].result)).toBe(1);
  });
});

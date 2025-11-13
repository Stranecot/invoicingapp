import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Re-export Prisma types for convenience
export * from '@prisma/client';

// Export utility functions
export {
  generateInvitationToken,
  generateInvitationExpiry,
  isInvitationExpired,
} from './utils/token';

// Export plan limits
export * from './plan-limits';

// Export tax rates configuration
export * from './tax-rates';

// Export VAT service
export * from './vat-service';

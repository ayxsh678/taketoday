import { PrismaClient } from "@prisma/client";
import { appConfig } from "@lib/config/app";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (appConfig.databaseUrl && appConfig.databaseUrl !== "") {
  // Only set global prisma in non-production environments to prevent issues with hot reloading
  if (!appConfig.isDevelopment) {
    globalThis.prisma = prisma;
  }
}
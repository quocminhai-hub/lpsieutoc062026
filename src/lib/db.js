import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

let prisma;

if (process.env.NODE_ENV === 'production') {
  const sqlite = new Database('dev.db');
  const adapter = new PrismaBetterSqlite3(sqlite);
  prisma = new PrismaClient({ adapter });
} else {
  if (!global.prisma) {
    const sqlite = new Database('dev.db');
    const adapter = new PrismaBetterSqlite3(sqlite);
    global.prisma = new PrismaClient({ adapter });
  }
  prisma = global.prisma;
}

export default prisma;


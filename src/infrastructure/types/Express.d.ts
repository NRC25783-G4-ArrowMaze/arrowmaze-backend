import { type UserRole } from '../domain/entities/Account';

declare global {
  namespace Express {
    interface Request {
      accountId?: string;
      userRole?: UserRole; // 🚀 Inyección fuertemente tipada para controladores posteriores
    }
  }
}
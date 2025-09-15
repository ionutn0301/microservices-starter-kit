import { randomBytes, createHash } from 'crypto';

export const generateRandomToken = (length: number = 32): string => {
  return randomBytes(length).toString('hex');
};

export const generateRandomString = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const hashString = (input: string, algorithm: string = 'sha256'): string => {
  return createHash(algorithm).update(input).digest('hex');
};

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};

export const generateSKU = (productName: string, categoryId: string): string => {
  const nameCode = productName.substring(0, 3).toUpperCase();
  const categoryCode = categoryId.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${nameCode}-${categoryCode}-${random}`;
}; 
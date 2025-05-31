import crypto from 'crypto';
import { NextRequest } from 'next/server';

// Константы для безопасности
export const SECURITY_CONSTANTS = {
  MAX_REQUEST_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_REQUEST: 10,
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 часа
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 минут
  BCRYPT_ROUNDS: 14,
  MIN_PASSWORD_LENGTH: 6,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 минут
} as const;

// Генерация безопасных токенов
export class TokenGenerator {
  // Генерация случайного токена
  static generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Генерация UUID v4
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  // Генерация токена для сброса пароля
  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  // Генерация токена для верификации email
  static generateEmailVerificationToken(): string {
    return crypto.randomBytes(16).toString('base64url');
  }

  // Генерация CSRF токена
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  // Проверка валидности токена по времени
  static isTokenExpired(createdAt: Date, expiryMs = SECURITY_CONSTANTS.TOKEN_EXPIRY): boolean {
    return Date.now() - createdAt.getTime() > expiryMs;
  }
}

// Хеширование и проверка паролей
export class PasswordSecurity {
  // Хеширование пароля с солью
  static async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(password, SECURITY_CONSTANTS.BCRYPT_ROUNDS);
  }

  // Проверка пароля
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, hash);
  }

  // Проверка силы пароля
  static checkPasswordStrength(password: string): {
    score: number; // 0-4
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    // Длина
    if (password.length >= 8) score++;
    else feedback.push('Минимум 8 символов');

    // Буквы в разных регистрах
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    else feedback.push('Используйте буквы в разных регистрах');

    // Цифры
    if (/\d/.test(password)) score++;
    else feedback.push('Добавьте цифры');

    // Специальные символы
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    else feedback.push('Добавьте специальные символы');

    // Проверка на распространенные пароли
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      score = 0;
      feedback.push('Используйте менее распространенный пароль');
    }

    return {
      score,
      feedback,
      isStrong: score >= 3,
    };
  }

  // Генерация безопасного пароля
  static generateSecurePassword(length = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return password;
  }
}

// Защита от атак
export class AttackProtection {
  // Защита от SQL Injection
  static detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
      /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /((\%27)|(\'))union/i,
      /exec(\s|\+)+(s|x)p\w+/i,
      /script\b.*?>/i,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // Защита от XSS
  static detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /vbscript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
      /onclick\s*=/i,
      /onmouseover\s*=/i,
      /expression\s*\(/i,
      /data:text\/html/i,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  // Защита от Path Traversal
  static detectPathTraversal(path: string): boolean {
    const traversalPatterns = [
      /\.\.\//,
      /\.\.\\/,
      /%2e%2e%2f/i,
      /%2e%2e%5c/i,
      /\.\.%2f/i,
      /\.\.%5c/i,
    ];

    return traversalPatterns.some(pattern => pattern.test(path));
  }

  // Защита от Command Injection
  static detectCommandInjection(input: string): boolean {
    const commandPatterns = [
      /[;&|`$(){}[\]]/,
      /\b(cat|ls|pwd|whoami|id|uname|ps|kill|rm|mv|cp|chmod|chown)\b/i,
      /\b(wget|curl|nc|netcat|telnet|ssh|ftp)\b/i,
    ];

    return commandPatterns.some(pattern => pattern.test(input));
  }

  // Комплексная проверка безопасности
  static validateUserInput(input: string): {
    isSecure: boolean;
    threats: string[];
  } {
    const threats: string[] = [];

    if (this.detectSQLInjection(input)) {
      threats.push('SQL Injection');
    }

    if (this.detectXSS(input)) {
      threats.push('XSS');
    }

    if (this.detectPathTraversal(input)) {
      threats.push('Path Traversal');
    }

    if (this.detectCommandInjection(input)) {
      threats.push('Command Injection');
    }

    return {
      isSecure: threats.length === 0,
      threats,
    };
  }
}

// Извлечение IP адреса с учетом прокси
export class IPUtils {
  static getClientIP(request: NextRequest): string {
    // Проверяем заголовки в порядке приоритета
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'x-forwarded',
      'x-cluster-client-ip',
      'forwarded-for',
      'forwarded',
    ];

    for (const header of headers) {
      const value = request.headers.get(header);
      if (value) {
        // X-Forwarded-For может содержать несколько IP через запятую
        const ip = value.split(',')[0].trim();
        if (this.isValidIP(ip)) {
          return ip;
        }
      }
    }

    // Fallback на localhost
    return '127.0.0.1';
  }

  // Проверка валидности IP адреса
  static isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  // Проверка, является ли IP приватным
  static isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/,
    ];

    return privateRanges.some(range => range.test(ip));
  }

  // Получение информации о местоположении IP (заглушка)
  static async getIPLocation(ip: string): Promise<{
    country?: string;
    city?: string;
    region?: string;
  } | null> {
    // В реальном приложении здесь может быть интеграция с сервисом геолокации
    // например, IPinfo, MaxMind, или другим
    
    if (this.isPrivateIP(ip)) {
      return { country: 'Local', city: 'Local', region: 'Local' };
    }

    // Заглушка для примера
    return null;
  }
}

// Безопасная работа с файлами
export class FileSecurityUtils {
  // Разрешенные MIME типы для изображений
  static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
  ];

  // Проверка MIME типа файла
  static isAllowedImageType(mimeType: string): boolean {
    return this.ALLOWED_IMAGE_TYPES.includes(mimeType.toLowerCase());
  }

  // Проверка расширения файла
  static isAllowedImageExtension(filename: string): boolean {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return allowedExtensions.includes(extension);
  }

  // Генерация безопасного имени файла
  static generateSafeFilename(originalName: string, userId?: string): string {
    // Удаляем опасные символы
    const safeName = originalName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.+/g, '.')
      .replace(/_+/g, '_')
      .toLowerCase();

    // Добавляем timestamp и userId для уникальности
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const userPrefix = userId ? `${userId.slice(0, 8)}_` : '';
    
    const extension = safeName.substring(safeName.lastIndexOf('.'));
    const nameWithoutExt = safeName.substring(0, safeName.lastIndexOf('.'));
    
    return `${userPrefix}${timestamp}_${randomSuffix}_${nameWithoutExt}${extension}`;
  }

  // Проверка magic bytes файла
  static checkFileMagicBytes(buffer: ArrayBuffer, expectedType: string): boolean {
    const uint8Array = new Uint8Array(buffer);
    
    const signatures = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
    };

    const signature = signatures[expectedType as keyof typeof signatures];
    if (!signature) return false;

    return signature.every((byte, index) => uint8Array[index] === byte);
  }
}

// Система блокировки пользователей
export class UserLockoutManager {
  private static attempts = new Map<string, { count: number; lockedUntil?: number }>();

  // Записать неудачную попытку входа
  static recordFailedAttempt(identifier: string): void {
    const current = this.attempts.get(identifier) || { count: 0 };
    current.count++;
    
    if (current.count >= SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
      current.lockedUntil = Date.now() + SECURITY_CONSTANTS.LOCKOUT_DURATION;
    }
    
    this.attempts.set(identifier, current);
  }

  // Сбросить счетчик попыток при успешном входе
  static resetAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  // Проверить, заблокирован ли пользователь
  static isLocked(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    
    if (!record?.lockedUntil) return false;
    
    if (Date.now() > record.lockedUntil) {
      // Блокировка истекла
      this.attempts.delete(identifier);
      return false;
    }
    
    return true;
  }

  // Получить время до разблокировки
  static getTimeUntilUnlock(identifier: string): number {
    const record = this.attempts.get(identifier);
    
    if (!record?.lockedUntil) return 0;
    
    return Math.max(0, record.lockedUntil - Date.now());
  }

  // Очистка старых записей
  static cleanup(): void {
    const now = Date.now();
    
    Array.from(this.attempts.entries()).forEach(([identifier, record]) => {
      if (record.lockedUntil && now > record.lockedUntil) {
        this.attempts.delete(identifier);
      }
    });
  }
}

// Регулярная очистка старых записей
setInterval(() => {
  UserLockoutManager.cleanup();
}, 5 * 60 * 1000); // Каждые 5 минут

// Хелперы для безопасности заголовков
export class SecurityHeaders {
  // Получить заголовки CSP
  static getCSPHeader(nonce?: string): string {
    const policies = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${nonce ? `'nonce-${nonce}'` : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    return policies.join('; ');
  }

  // Получить все безопасные заголовки
  static getSecurityHeaders(nonce?: string): Record<string, string> {
    return {
      'Content-Security-Policy': this.getCSPHeader(nonce),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };
  }
}

// Утилиты для санитизации
export class SanitizationUtils {
  // Экранирование HTML
  static escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Очистка от невидимых символов
  static removeInvisibleChars(str: string): string {
    return str.replace(/[\u200B-\u200D\uFEFF]/g, '');
  }

  // Нормализация Unicode
  static normalizeUnicode(str: string): string {
    return str.normalize('NFC');
  }

  // Очистка номера телефона
  static sanitizePhoneNumber(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  // Очистка URL
  static sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      
      // Разрешаем только HTTP и HTTPS
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
      
      return parsed.toString();
    } catch {
      return '';
    }
  }
}
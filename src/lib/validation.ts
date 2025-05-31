import { z } from 'zod';

// Общие валидаторы
const createSanitizedStringSchema = (minLength = 1, maxLength = 5000) => 
  z.string()
    .min(minLength, `Минимум ${minLength} символов`)
    .max(maxLength, `Максимум ${maxLength} символов`)
    .transform(str => str.trim()) // Удаляем пробелы по краям
    .refine(str => str.length >= minLength, `После удаления пробелов минимум ${minLength} символов`)
    .refine(str => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(str), 
      'Недопустимые теги script')
    .refine(str => !/(javascript:|data:text\/html|vbscript:|onload=|onerror=)/i.test(str), 
      'Недопустимый контент');

const emailSchema = z.string()
  .email('Некорректный email адрес')
  .max(320, 'Email слишком длинный') // RFC 5321 ограничение
  .transform(str => str.toLowerCase().trim())
  .refine(email => {
    // Дополнительные проверки email
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    
    const [local, domain] = parts;
    
    // Проверка локальной части
    if (local.length > 64) return false; // RFC 5321
    if (local.startsWith('.') || local.endsWith('.')) return false;
    if (local.includes('..')) return false;
    
    // Проверка домена
    if (domain.length > 253) return false; // RFC 5321
    if (domain.includes('..')) return false;
    if (!domain.includes('.')) return false;
    
    return true;
  }, 'Недопустимый формат email');

const passwordSchema = z.string()
  .min(6, 'Пароль должен содержать минимум 6 символов')
  .max(128, 'Пароль слишком длинный')
  .refine(password => {
    // Проверка на наличие хотя бы одной буквы и одной цифры
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLetter && hasNumber;
  }, 'Пароль должен содержать хотя бы одну букву и одну цифру')
  .refine(password => {
    // Проверка на отсутствие опасных символов
    const dangerousChars = /<|>|"|'|`|&|;|\|/;
    return !dangerousChars.test(password);
  }, 'Пароль содержит недопустимые символы');

// Валидация base64 изображений
const base64ImageSchema = z.string()
  .refine(str => str.startsWith('data:image/'), 'Должно быть base64 изображение')
  .refine(str => {
    // Проверяем поддерживаемые MIME типы
    const supportedTypes = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/webp'];
    return supportedTypes.some(type => str.startsWith(type));
  }, 'Неподдерживаемый тип изображения')
  .refine(str => {
    try {
      // Проверяем, что base64 можно декодировать
      const base64Part = str.split(',')[1];
      if (!base64Part) return false;
      
      // Проверяем валидность base64
      const decoded = atob(base64Part);
      return decoded.length > 0;
    } catch {
      return false;
    }
  }, 'Некорректный base64')
  .refine(str => {
    // Проверяем размер после декодирования
    try {
      const base64Part = str.split(',')[1];
      const decoded = atob(base64Part);
      const sizeInBytes = decoded.length;
      const maxSize = 10 * 1024 * 1024; // 10MB
      return sizeInBytes <= maxSize;
    } catch {
      return false;
    }
  }, 'Изображение слишком большое после декодирования (максимум 10MB)');

// Пользователь
export const UserRegistrationSchema = z.object({
  name: createSanitizedStringSchema(2, 100)
    .refine(name => /^[a-zA-Zа-яА-ЯёЁ\s\-']+$/.test(name), 
      'Имя может содержать только буквы, пробелы, дефисы и апострофы'),
  
  email: emailSchema,
  
  password: passwordSchema,
}).strict(); // Запрещаем дополнительные поля

export const UserLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Пароль обязателен').max(128),
}).strict();

export const UserUpdateSchema = z.object({
  name: createSanitizedStringSchema(2, 100)
    .refine(name => /^[a-zA-Zа-яА-ЯёЁ\s\-']+$/.test(name), 
      'Имя может содержать только буквы, пробелы, дефисы и апострофы')
    .optional(),
  
  email: emailSchema.optional(),
  
  // Другие поля профиля
  bio: createSanitizedStringSchema(0, 500).optional(),
  website: z.string().url('Некорректный URL').optional().or(z.literal('')),
}).strict();

// Книги
export const BookTypeSchema = z.enum([
  'romantic', 'family', 'friendship', 'child', 'travel'
], {
  errorMap: () => ({ message: 'Недопустимый тип книги' })
});

export const BookAnswerSchema = z.record(
  z.string().min(1, 'Ключ вопроса не может быть пустым'),
  createSanitizedStringSchema(1, 5000)
).refine(answers => {
  // Проверяем, что есть хотя бы один ответ
  return Object.keys(answers).length > 0;
}, 'Необходимо ответить хотя бы на один вопрос')
.refine(answers => {
  // Ограничиваем количество вопросов
  return Object.keys(answers).length <= 50;
}, 'Слишком много вопросов (максимум 50)');

export const ImageUploadSchema = z.object({
  name: z.string()
    .min(1, 'Имя файла обязательно')
    .max(255, 'Имя файла слишком длинное')
    .refine(name => {
      // Проверяем расширение файла
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const extension = name.toLowerCase().substring(name.lastIndexOf('.'));
      return allowedExtensions.includes(extension);
    }, 'Недопустимое расширение файла')
    .refine(name => {
      // Проверяем на опасные символы в имени файла
      const dangerousChars = /[<>:"|?*\x00-\x1f]/;
      return !dangerousChars.test(name);
    }, 'Недопустимые символы в имени файла'),
  
  base64: base64ImageSchema,
  
  size: z.number()
    .min(1, 'Размер файла должен быть больше 0')
    .max(10 * 1024 * 1024, 'Файл слишком большой (максимум 10MB)'),
  
  dimensions: z.object({
    width: z.number()
      .min(50, 'Ширина изображения минимум 50px')
      .max(8000, 'Ширина изображения максимум 8000px'),
    height: z.number()
      .min(50, 'Высота изображения минимум 50px')
      .max(8000, 'Высота изображения максимум 8000px'),
  }).refine(dimensions => {
    // Проверяем соотношение сторон
    const aspectRatio = Math.max(dimensions.width, dimensions.height) / 
                       Math.min(dimensions.width, dimensions.height);
    return aspectRatio <= 10;
  }, 'Неподходящее соотношение сторон изображения'),
  
  compressed: z.boolean().optional().default(false),
}).strict();

export const GenerateBookSchema = z.object({
  bookType: BookTypeSchema,
  answers: BookAnswerSchema,
  images: z.array(ImageUploadSchema)
    .max(8, 'Максимум 8 изображений')
    .optional()
    .default([]),
}).strict()
.refine(data => {
  // Проверяем общий размер всех изображений
  const totalSize = data.images.reduce((sum, img) => sum + img.size, 0);
  const maxTotalSize = 40 * 1024 * 1024; // 40MB
  return totalSize <= maxTotalSize;
}, 'Общий размер изображений превышает 40MB');

// API endpoints валидация
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).max(1000).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).strict();

// Валидация ID
export const IdSchema = z.string()
  .min(1, 'ID обязателен')
  .max(100, 'ID слишком длинный')
  .refine(id => /^[a-zA-Z0-9_-]+$/.test(id), 'ID содержит недопустимые символы');

// Безопасная валидация поисковых запросов
export const SearchQuerySchema = z.object({
  q: createSanitizedStringSchema(1, 100)
    .refine(query => {
      // Проверяем на SQL injection попытки
      const sqlKeywords = /(union|select|insert|update|delete|drop|create|alter|exec|execute|script)/i;
      return !sqlKeywords.test(query);
    }, 'Недопустимые символы в поисковом запросе'),
  
  category: z.enum(['all', 'romantic', 'family', 'friendship', 'child', 'travel']).default('all'),
  
  ...PaginationSchema.shape,
}).strict();

// Валидация отчетов об ошибках
export const ErrorReportSchema = z.object({
  type: z.string().max(50).optional(),
  message: createSanitizedStringSchema(1, 1000),
  stack: z.string().max(5000).optional(),
  componentStack: z.string().max(5000).optional(),
  timestamp: z.string().datetime('Некорректный формат времени'),
  userAgent: z.string().max(500),
  url: z.string().url('Некорректный URL').max(2000),
  additionalInfo: z.record(z.unknown()).optional(),
}).strict();

// Функция валидации с улучшенной обработкой ошибок
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  customErrorMessage?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Собираем все ошибки валидации
      const errors = error.errors.map(err => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      });
      
      const message = customErrorMessage || 
        `Ошибка валидации: ${errors.join('; ')}`;
      
      console.error('❌ Validation error:', {
        errors: error.errors,
        data: typeof data === 'object' ? Object.keys(data as object) : data,
      });
      
      throw new ValidationError(message, error.errors);
    }
    throw error;
  }
}

// Кастомный класс ошибки валидации
export class ValidationError extends Error {
  public readonly issues: z.ZodIssue[];
  
  constructor(message: string, issues: z.ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }
  
  // Получить ошибки по полям
  getFieldErrors(): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {};
    
    this.issues.forEach(issue => {
      const field = issue.path.join('.');
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(issue.message);
    });
    
    return fieldErrors;
  }
  
  // Получить первую ошибку для поля
  getFirstError(field: string): string | undefined {
    const errors = this.getFieldErrors()[field];
    return errors?.[0];
  }
}

// Утилиты для работы с валидацией
export const ValidationUtils = {
  // Проверка, является ли ошибка ошибкой валидации
  isValidationError(error: unknown): error is ValidationError {
    return error instanceof ValidationError;
  },
  
  // Санитизация HTML
  sanitizeHtml(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },
  
  // Проверка на SQL injection
  isSqlInjection(input: string): boolean {
    const sqlPattern = /(union|select|insert|update|delete|drop|create|alter|exec|execute|script|declare|char|nchar|varchar|nvarchar|sysobjects|syscolumns|information_schema)/i;
    return sqlPattern.test(input);
  },
  
  // Проверка на XSS
  isXSS(input: string): boolean {
    const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|javascript:|data:text\/html|vbscript:|onload=|onerror=|onclick=|onmouseover=|onfocus=|onblur=/i;
    return xssPattern.test(input);
  },
  
  // Валидация файлового пути
  isValidFilePath(path: string): boolean {
    // Запрещаем path traversal атаки
    const dangerousPatterns = /(\.\.\/|\.\.\\|\/\.\.|\\\.\.)/;
    return !dangerousPatterns.test(path);
  },
  
  // Нормализация пробелов
  normalizeWhitespace(input: string): string {
    return input.replace(/\s+/g, ' ').trim();
  },
};

// Экспорт типов
export type UserRegistration = z.infer<typeof UserRegistrationSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type GenerateBookRequest = z.infer<typeof GenerateBookSchema>;
export type ImageUpload = z.infer<typeof ImageUploadSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type ErrorReport = z.infer<typeof ErrorReportSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
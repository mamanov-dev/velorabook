import { z } from 'zod';

// Пользователь
export const UserRegistrationSchema = z.object({
  name: z.string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(50, 'Имя не может быть длиннее 50 символов'),
  email: z.string()
    .email('Некорректный email адрес')
    .max(100, 'Email слишком длинный'),
  password: z.string()
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .max(100, 'Пароль слишком длинный'),
});

export const UserLoginSchema = z.object({
  email: z.string().email('Некорректный email адрес'),
  password: z.string().min(1, 'Пароль обязателен'),
});

// Книги
export const BookTypeSchema = z.enum([
  'romantic', 'family', 'friendship', 'child', 'travel'
]);

export const GenerateBookSchema = z.object({
  bookType: BookTypeSchema,
  answers: z.record(z.string().min(1).max(5000)),
  images: z.array(z.object({
    name: z.string().min(1).max(255),
    base64: z.string(),
    size: z.number().min(1).max(10 * 1024 * 1024),
    dimensions: z.object({
      width: z.number().min(1),
      height: z.number().min(1),
    }),
  })).max(8).optional().default([]),
});

// Validation функция
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors[0].message;
      throw new Error(`Ошибка валидации: ${message}`);
    }
    throw error;
  }
}

// Типы
export type UserRegistration = z.infer<typeof UserRegistrationSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type GenerateBookRequest = z.infer<typeof GenerateBookSchema>;
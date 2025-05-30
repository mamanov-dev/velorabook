'use server';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Явное получение API ключа
const apiKey = process.env.OPENAI_API_KEY || '';

// Добавляем отладочную информацию
console.log('🔑 OpenAI API ключ:', apiKey ? 'Установлен (длина: ' + apiKey.length + ')' : 'НЕ УСТАНОВЛЕН');

// Более надежная инициализация
let openai: OpenAI;
try {
  openai = new OpenAI({
    apiKey: apiKey,
  });
  console.log('✅ OpenAI API клиент инициализирован успешно');
} catch (error) {
  console.error('❌ Ошибка инициализации OpenAI API клиента:', error);
  openai = new OpenAI({
    apiKey: 'dummy-key'  // Фиктивный ключ для предотвращения ошибок
  });
}

interface ImageData {
  name: string;
  base64: string;
  size: number;
  dimensions: { width: number; height: number };
  compressed?: boolean;
}

interface GeneratedBook {
  title: string;
  chapters: Array<{
    number: number;
    title: string;
    content: string;
    epigraph?: string;
  }>;
  totalChapters: number;
  estimatedReadTime: number;
  author?: string;
  dedicatedTo?: string;
  bookType: string;
  createdAt: string;
  images?: Array<{
    url: string;
    caption?: string;
    description?: string;
    originalName?: string;
    size?: number;
  }>;
  metadata: {
    bookType: string;
    generatedAt: string;
    wordCount: number;
    imagesCount: number;
    imageAnalysis?: string[];
  };
}

interface RequestBody {
  bookType: string;
  answers: Record<string, string>;
  images?: ImageData[];
}

// Максимальное время генерации
const GENERATION_TIMEOUT = 180000; // 3 минуты для объемных книг

export async function POST(request: NextRequest) {
  try {
    const { bookType, answers, images = [] } = await request.json();
    
    console.log('🔍 API вызван с параметрами:', {
      bookType,
      answersCount: Object.keys(answers).length,
      imagesCount: images.length,
      apiKeyExists: !!process.env.OPENAI_API_KEY
    });

    if (!bookType || !answers) {
      return NextResponse.json(
        { success: false, error: 'Не указан тип книги или ответы' },
        { status: 400 }
      );
    }

    // Создаем Promise с таймаутом
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout'));
      }, GENERATION_TIMEOUT);
    });

    // Создаем Promise для генерации
    const generatePromise = generateBook(bookType, answers, images);

    // Используем Promise.race для ограничения времени выполнения
    const result = await Promise.race([generatePromise, timeoutPromise]);
    
    console.log('✅ Генерация книги успешно завершена');
    return NextResponse.json({ success: true, book: result });
  } catch (error) {
    console.error('❌ Ошибка генерации книги:', error);
    
    let errorMessage = 'Произошла неизвестная ошибка при генерации книги';
    let statusCode = 500;
    
    if (error instanceof Error) {
      console.error('❌ Детали ошибки:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.message === 'Timeout') {
        errorMessage = 'Время генерации истекло. Попробуйте еще раз.';
        statusCode = 408; // Request Timeout
      } else if (error.message.includes('API key')) {
        errorMessage = 'Ошибка конфигурации API. Обратитесь к администратору. API ключ не найден или недействителен.';
        statusCode = 500;
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Превышен лимит запросов. Попробуйте через несколько минут.';
        statusCode = 429; // Too Many Requests
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}

async function generateBook(bookType: string, answers: Record<string, string>, images: any[]) {
  console.log('🔄 Начинаем генерацию книги...');
  console.log('📊 Параметры:', { 
    bookType, 
    answersKeys: Object.keys(answers),
    imagesCount: images.length
  });
  
  const prompt = generateEnhancedPrompt(bookType, answers, images, []);
  
  try {
    console.log('🤖 Отправляем запрос в OpenAI API...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Ты талантливый писатель персональных книг. Создавай объемные, эмоциональные истории на русском языке.

КРИТИЧЕСКИ ВАЖНО:
- Создавай ПОЛНУЮ книгу с ВСЕМИ главами за один ответ
- Каждая глава должна быть 600-900 слов
- Общий объем: 4000-6000 слов
- Используй яркий, образный язык с деталями
- Включай диалоги и эмоциональные сцены

СТРУКТУРА:
НАЗВАНИЕ КНИГИ: [название]

ГЛАВА 1: [название]
[полное содержание 600-900 слов]

ГЛАВА 2: [название] 
[полное содержание 600-900 слов]

...продолжить все главы...

ОБЯЗАТЕЛЬНО создай ВСЕ главы полностью!`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 12000, // ✅ Увеличено с 4000 до 12000
      temperature: 0.8,
    });

    console.log('✅ Ответ от OpenAI API получен успешно');
    
    // ✅ НОВОЕ: Логируем информацию о токенах
    if (completion.usage) {
      console.log('🔢 Использование токенов:', {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens
      });
    }
    
    const generatedContent = completion.choices[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('Не удалось сгенерировать книгу - пустой ответ от API');
    }

    // ✅ НОВОЕ: Проверяем полноту ответа
    const wordCount = generatedContent.split(' ').length;
    console.log(`📝 Сгенерировано слов: ${wordCount}`);
    
    if (wordCount < 2000) {
      console.warn('⚠️ Сгенерированный контент слишком короткий, попробуем повторить...');
      
      // Повторный запрос с упрощенным промптом
      const retryCompletion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `Создай полную персональную книгу на русском языке. ВАЖНО: создай ВСЕ главы полностью, каждая глава должна быть 600-800 слов.`
          },
          {
            role: "user",
            content: `${prompt}\n\nОБЯЗАТЕЛЬНО: Создай полную книгу со всеми главами! Не останавливайся на середине!`
          }
        ],
        max_tokens: 14000,
        temperature: 0.7,
      });
      
      const retryContent = retryCompletion.choices[0]?.message?.content;
      if (retryContent && retryContent.split(' ').length > wordCount) {
        console.log('✅ Повторная генерация успешна');
        return structureEnhancedBook(retryContent, bookType, images, []);
      }
    }

    return structureEnhancedBook(generatedContent, bookType, images, []);
  } catch (error) {
    console.error('❌ Ошибка при вызове OpenAI API:', error);
    throw error;
  }
}

function generateEnhancedPrompt(
  bookType: string, 
  answers: Record<string, string>, 
  images: ImageData[], 
  imageAnalysis: string[]
): string {
  
  // Создаем описание изображений
  let imageSection = '';
  if (images.length > 0) {
    imageSection = `\n\nФОТО: ${images.length} изображений для включения в текст`;
  }

  // Собираем ключевую информацию в сжатом виде
  const keyAnswers = Object.entries(answers)
    .filter(([key, value]) => value && value.length > 10)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  switch (bookType) {
    case 'romantic':
      return `
Создай романтическую книгу с 6 главами (600-900 слов каждая):
1. Знакомство и первые впечатления
2. Развитие отношений 
3. Яркие счастливые моменты
4. Особенности отношений и традиции
5. Преодоление трудностей и рост
6. Благодарность и планы на будущее

ИНФОРМАЦИЯ:
${keyAnswers}
${imageSection}

Пиши эмоционально, с деталями и диалогами. ОБЯЗАТЕЛЬНО создай ВСЕ 6 глав полностью!
      `;

    case 'family':
      return `
Создай семейную книгу с 5 главами (700-1000 слов каждая):
1. Корни и создание семьи
2. Дом и традиции
3. Яркие события и воспоминания
4. Сила семьи и поддержка
5. Ценности и наследие

ИНФОРМАЦИЯ:
${keyAnswers}
${imageSection}

Пиши тепло и душевно. ОБЯЗАТЕЛЬНО создай ВСЕ 5 глав полностью!
      `;

    case 'friendship':
      return `
Создай книгу о дружбе с 5 главами (600-800 слов каждая):
1. Начало дружбы
2. Совместные приключения  
3. Смех и веселье
4. Поддержка и понимание
5. Благодарность и будущее

ИНФОРМАЦИЯ:
${keyAnswers}
${imageSection}

Пиши дружелюбно с юмором. ОБЯЗАТЕЛЬНО создай ВСЕ 5 глав полностью!
      `;

    case 'child':
      return `
Создай детскую книгу с 4 главами (600-800 слов каждая):
1. Ожидание и рождение
2. Первые открытия и рост
3. Характер и особенности
4. Любовь и пожелания

ИНФОРМАЦИЯ:
${keyAnswers}
${imageSection}

Пиши нежно и трогательно. ОБЯЗАТЕЛЬНО создай ВСЕ 4 главы полностью!
      `;

    case 'travel':
      return `
Создай книгу путешествий с 5 главами (600-800 слов каждая):
1. Планы и начало пути
2. Первые впечатления
3. Открытия и приключения
4. Трудности и преодоление
5. Итоги и планы

ИНФОРМАЦИЯ:
${keyAnswers}
${imageSection}

Пиши живо и увлекательно. ОБЯЗАТЕЛЬНО создай ВСЕ 5 глав полностью!
      `;

    default:
      return `Создай персональную книгу на основе: ${keyAnswers}`;
  }
}

// ✅ ИСПРАВЛЕНО: Заменил matchAll() на совместимую версию
function structureEnhancedBook(
  content: string, 
  bookType: string, 
  images: ImageData[],
  imageAnalysis: string[]
): GeneratedBook {
  
  console.log('Структурируем сгенерированную книгу...');
  console.log('📝 Общий объем контента:', content.length, 'символов');
  console.log('📝 Количество слов:', content.split(' ').length);
  
  // Извлекаем название книги
  const titleMatch = content.match(/НАЗВАНИЕ КНИГИ:\s*(.+)/i);
  const bookTitle = titleMatch ? titleMatch[1].trim() : getDefaultBookTitle(bookType);
  
  // ✅ ИСПРАВЛЕНО: Убрал флаг 's' и заменил matchAll() на exec()
  let chapters: string[] = [];
  
  // Сначала пробуем разбить по "ГЛАВА X:" без флага 's'
  const chapterPattern = /ГЛАВА\s+\d+:\s*([\s\S]+?)(?=ГЛАВА\s+\d+:|$)/gi;
  let match;
  while ((match = chapterPattern.exec(content)) !== null) {
    if (match[0] && match[0].trim().length > 100) {
      chapters.push(match[0].trim());
    }
  }
  
  // Если не получилось, пробуем по номерам "1.", "2." и т.д.
  if (chapters.length <= 1) {
    console.log('🔄 Пробуем альтернативное разбиение...');
    const numberPattern = /(\d+\.\s*[\s\S]+?)(?=\d+\.\s*|$)/gi;
    chapters = [];
    
    let numberMatch;
    while ((numberMatch = numberPattern.exec(content)) !== null) {
      if (numberMatch[0] && numberMatch[0].trim().length > 100) {
        chapters.push(numberMatch[0].trim());
      }
    }
  }
  
  // Если и это не сработало, разбиваем по двойным переносам и группируем
  if (chapters.length <= 1) {
    console.log('🔄 Используем группировку абзацев...');
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
    const targetChapters = getTargetChapterCount(bookType);
    const paragraphsPerChapter = Math.ceil(paragraphs.length / targetChapters);
    
    chapters = [];
    for (let i = 0; i < paragraphs.length; i += paragraphsPerChapter) {
      const chapterContent = paragraphs.slice(i, i + paragraphsPerChapter).join('\n\n');
      if (chapterContent.trim().length > 100) {
        chapters.push(chapterContent);
      }
    }
  }

  console.log('📖 Найдено глав:', chapters.length);

  const structuredChapters = chapters.map((chapter, index) => {
    // Очищаем содержимое главы
    let cleanContent = chapter.trim();
    
    // Удаляем название книги если оно попало в главу
    cleanContent = cleanContent.replace(/НАЗВАНИЕ КНИГИ:.*$/gim, '').trim();
    
    // Извлекаем заголовок главы
    const titlePattern = /^(?:ГЛАВА\s+\d+:\s*)?(.+?)(?:\n\n|\n)/;
    const titleMatch = cleanContent.match(titlePattern);
    let chapterTitle = titleMatch ? titleMatch[1].trim() : getDefaultChapterTitle(bookType, index + 1);
    
    // Убираем заголовок из содержимого если он был найден
    if (titleMatch && titleMatch[1]) {
      cleanContent = cleanContent.replace(titlePattern, '').trim();
    }
    
    // Очищаем заголовок от лишних символов
    chapterTitle = chapterTitle.replace(/^["\-\s\d\.]+|["\-\s]+$/g, '');
    
    // Если содержимого мало, пытаемся взять больше
    if (cleanContent.length < 200 && index < chapters.length - 1) {
      cleanContent = chapter.trim();
    }

    console.log(`📄 Глава ${index + 1}: "${chapterTitle}" (${cleanContent.split(' ').length} слов)`);

    return {
      number: index + 1,
      title: chapterTitle,
      content: cleanContent
    };
  });

  const finalWordCount = content.split(' ').length;
  console.log('📊 Финальная статистика:', {
    chapters: structuredChapters.length,
    totalWords: finalWordCount,
    averageWordsPerChapter: Math.round(finalWordCount / structuredChapters.length)
  });

  const finalBook: GeneratedBook = {
    title: bookTitle,
    chapters: structuredChapters,
    totalChapters: structuredChapters.length,
    estimatedReadTime: Math.ceil(finalWordCount / 150), // 150 слов в минуту для вдумчивого чтения
    author: "VeloraBook AI",
    dedicatedTo: getDedicationText(bookType),
    bookType,
    createdAt: new Date().toISOString(),
    images: images.length > 0 ? images.map((img, index) => ({
      url: img.base64,
      caption: `Фотография ${index + 1}`,
      description: imageAnalysis[index] || 'Особенный момент из вашей истории',
      originalName: img.name,
      size: img.size
    })) : undefined,
    metadata: {
      bookType,
      generatedAt: new Date().toISOString(),
      wordCount: finalWordCount,
      imagesCount: images.length,
      imageAnalysis: imageAnalysis.length > 0 ? imageAnalysis : undefined
    }
  };
  
  console.log('✅ Структурирование завершено');
  
  return finalBook;
}

// Помощники
function getTargetChapterCount(bookType: string): number {
  switch (bookType) {
    case 'romantic': return 6;
    case 'family': return 5;
    case 'friendship': return 5;
    case 'child': return 4;
    case 'travel': return 5;
    default: return 5;
  }
}

function getDefaultBookTitle(bookType: string): string {
  switch (bookType) {
    case 'romantic':
      return 'Наша История Любви';
    case 'family':
      return 'Семейная Хроника';
    case 'friendship':
      return 'Книга Нашей Дружбы';
    case 'child':
      return 'Мой Маленький Ангел';
    case 'travel':
      return 'Дневник Путешественника';
    default:
      return 'Персональная Книга';
  }
}

function getDedicationText(bookType: string): string {
  switch (bookType) {
    case 'romantic':
      return 'Моей единственной и неповторимой любви';
    case 'family':
      return 'Моей дорогой семье - самому ценному в жизни';
    case 'friendship':
      return 'Моему самому верному и дорогому другу';
    case 'child':
      return 'Моему самому дорогому сокровищу на свете';
    case 'travel':
      return 'Всем, кто разделил со мной эти удивительные моменты';
    default:
      return 'Тому, кто делает мою жизнь особенной';
  }
}

function getDefaultChapterTitle(bookType: string, chapterNumber: number): string {
  const titles = {
    romantic: [
      'Встреча двух сердец',
      'Первые шаги любви', 
      'Мозаика счастливых моментов',
      'В объятиях повседневности',
      'Испытание на прочность',
      'Мечты на двоих',
      'Вечная любовь'
    ],
    family: [
      'Корни и начала',
      'Дом, где живет любовь',
      'Калейдоскоп воспоминаний', 
      'Сила единства',
      'Мудрость поколений',
      'Благодарность и мечты'
    ],
    friendship: [
      'Как зародилась наша дружба',
      'Приключения и открытия',
      'Смех сквозь годы',
      'Сила настоящей дружбы',
      'Друзья навсегда'
    ],
    child: [
      'Ожидание чуда',
      'Маленькие большие открытия',
      'Мир глазами ребенка',
      'Моменты счастья',
      'Послание в будущее'
    ],
    travel: [
      'Зов дороги',
      'Первые шаги в новом мире',
      'Погружение в приключение',
      'Испытания в пути',
      'Дорога домой'
    ]
  };

  const typeChapters = titles[bookType as keyof typeof titles] || [`Глава ${chapterNumber}`];
  return typeChapters[chapterNumber - 1] || `Глава ${chapterNumber}`;
}
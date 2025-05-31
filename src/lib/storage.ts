import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

export interface UploadResult {
  url: string;
  fileName: string;
  size: number;
  dimensions: { width: number; height: number };
}

export class StorageService {
  static async uploadImage(
    file: Buffer,
    fileName: string,
    mimeType: string,
    userId: string
  ): Promise<UploadResult> {
    try {
      // Обрабатываем изображение
      const image = sharp(file);
      const metadata = await image.metadata();
      
      const optimizedImage = await image
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Генерируем уникальное имя
      const uniqueFileName = `${userId}/${Date.now()}-${fileName}`;
      
      // Загружаем в R2
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: uniqueFileName,
        Body: optimizedImage,
        ContentType: mimeType,
      });

      await r2Client.send(command);
      
      const url = `${process.env.R2_ENDPOINT}/${BUCKET_NAME}/${uniqueFileName}`;

      return {
        url,
        fileName: uniqueFileName,
        size: optimizedImage.length,
        dimensions: {
          width: metadata.width || 0,
          height: metadata.height || 0,
        },
      };
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      throw new Error('Не удалось загрузить изображение');
    }
  }
}
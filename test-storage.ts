import 'dotenv/config'                     // подхватит .env
import { existsSync, readFileSync } from 'fs'
import { StorageService } from './src/lib/storage'

async function main() {
  try {
    if (!existsSync('test.jpg')) {
      console.log('ℹ️  Положите test.jpg рядом с репозиторием')
      return
    }

    console.log('📤 Загружаем test.jpg …')
    const buffer = readFileSync('test.jpg')

    const res = await StorageService.uploadImage(
      buffer,
      'test.jpg',
      'image/jpeg',
      'test-user',
    )

    console.log('✅ Загрузка прошла успешно!')
    console.table(res)
    console.log('🌐 Откройте URL в браузере:', res.url)
  } catch (e: any) {
    console.error('❌ Ошибка storage:', e.message ?? e)
  }
}
main()

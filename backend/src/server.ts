import { buildApp } from './app.js'

// Создаем и настраиваем экземпляр Fastify, подключая плагины и маршруты из app.ts.
const app = await buildApp()

// Определяем параметры запуска HTTP-сервера. Переменные окружения позволяют менять их без перекомпиляции.
const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '0.0.0.0'

// Функция корректного завершения работы приложения при получении сигнала ОС (Ctrl+C или остановка контейнера).
const close = async () => {
  app.log.info('Shutting down...')
  // Fastify аккуратно завершает все активные запросы и вызывает onClose-хуки (например, отключает Prisma).
  await app.close()
  process.exit(0)
}
// Подписываемся на стандартные сигналы завершения процесса и вызываем graceful shutdown.
process.on('SIGINT', close)
process.on('SIGTERM', close)

// Запускаем HTTP-сервер. Fastify сам обработает входящие запросы и будет логировать события.
await app.listen({ port, host })
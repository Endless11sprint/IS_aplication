import fp from 'fastify-plugin'
import { PrismaClient } from '../generated/prisma/client.js'

// Расширяем типизацию Fastify: после регистрации плагина у экземпляра появится свойство prisma.
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

// Fastify-плагин, который создаёт один экземпляр PrismaClient и подключает его ко всему приложению.
export default fp(async (app) => {
  const prisma = new PrismaClient()
  // decorate делает prisma доступным как app.prisma во всех маршрутах и хукax.
  app.decorate('prisma', prisma)

  // Хук onClose вызывает $disconnect, когда сервер останавливается, чтобы закрыть соединение с БД.
  app.addHook('onClose', async (inst) => {
    await inst.prisma.$disconnect()
  })
})
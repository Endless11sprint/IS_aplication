import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import prismaPlugin from './plugins/prisma.js'
import { 
  ValidationProblem, 
  CreateDeviceSchema, 
  CreateAuditorySchema, 
  CreateBookingSchema 
} from './types.js'

export async function buildApp() {
  const app = Fastify({
    logger: true,
    schemaErrorFormatter: (errors, dataVar) => new ValidationProblem('Ошибка валидации', errors, dataVar)
  }).withTypeProvider<TypeBoxTypeProvider>()

  await app.register(helmet)
  await app.register(cors, { origin: true })
  await app.register(prismaPlugin)

  // --- DEVICES ---
  app.get('/api/devices', async () => app.prisma.device.findMany())
  
  app.post('/api/devices', { schema: { body: CreateDeviceSchema } }, async (req, reply) => {
    const device = await app.prisma.device.create({ data: req.body })
    return reply.code(201).send(device)
  })

  app.delete('/api/devices/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.device.delete({ where: { id } })
    return reply.code(204).send()
  })

  // --- AUDITORIES ---
  app.get('/api/auditories', async () => app.prisma.auditory.findMany())

  app.post('/api/auditories', { schema: { body: CreateAuditorySchema } }, async (req, reply) => {
    const auditory = await app.prisma.auditory.create({ data: req.body })
    return reply.code(201).send(auditory)
  })

  app.delete('/api/auditories/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.auditory.delete({ where: { id } })
    return reply.code(204).send()
  })

  // --- BOOKINGS ---
  app.get('/api/bookings', async () => {
    return app.prisma.booking.findMany({ 
      include: { device: true, auditory: true },
      orderBy: { startTime: 'desc' }
    })
  })

  app.post('/api/bookings', { schema: { body: CreateBookingSchema } }, async (req, reply) => {
    const { deviceId, auditoryId, endTime } = req.body
    const now = new Date()
    const endAt = new Date(endTime)

    if (endAt <= now) {
      return reply.code(400).send({ detail: 'Время окончания должно быть в будущем' })
    }

    // Валидация: не занята ли эта аудитория кем-то еще прямо сейчас
    const activeBooking = await app.prisma.booking.findFirst({
      where: {
        auditoryId,
        endTime: { gt: now }
      }
    })

    if (activeBooking) {
      return reply.code(409).send({ 
        detail: `Аудитория занята до ${activeBooking.endTime.toLocaleTimeString()}` 
      })
    }

    const booking = await app.prisma.booking.create({
      data: { deviceId, auditoryId, endTime: endAt },
      include: { device: true, auditory: true }
    })
    return reply.code(201).send(booking)
  })

  app.delete('/api/bookings/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.booking.delete({ where: { id } })
    return reply.code(204).send()
  })

  return app
}
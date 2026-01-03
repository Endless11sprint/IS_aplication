import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import prismaPlugin from './plugins/prisma.js'
import { 
  ValidationProblem, 
  CreateDeviceSchema, 
  CreateAuditorySchema, 
  CreateBookingSchema,
  UpdateDeviceSchema,
  UpdateAuditorySchema,
  UpdateBookingSchema 
} from './types.js'

export async function buildApp() {
  const app = Fastify({
    logger: true,
    schemaErrorFormatter: (errors, dataVar) => new ValidationProblem('Ошибка валидации', errors, dataVar)
  }).withTypeProvider<TypeBoxTypeProvider>()

  await app.register(helmet)
  await app.register(cors, {
  origin: true,
  methods: '*',
  allowedHeaders: ['*'],
})
  await app.register(prismaPlugin)

  // --- DEVICES ---
  app.get('/api/devices', async () => app.prisma.device.findMany())
  
  app.post('/api/devices', { schema: { body: CreateDeviceSchema } }, async (req, reply) => {
    const device = await app.prisma.device.create({ data: req.body })
    return reply.code(201).send(device)
  })

  app.put('/api/devices/:id', { schema: { body: UpdateDeviceSchema } }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const updated = await app.prisma.device.update({ where: { id }, data: req.body })
    return updated
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

  app.put('/api/auditories/:id', { schema: { body: UpdateAuditorySchema } }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const updated = await app.prisma.auditory.update({ where: { id }, data: req.body })
    return updated
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

  app.put('/api/bookings/:id', { schema: { body: UpdateBookingSchema } }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { deviceId, auditoryId, endTime } = req.body
    const now = new Date()
    let newEndAt: Date | undefined
    if (endTime) {
      newEndAt = new Date(endTime)
      if (newEndAt <= now) {
        return reply.code(400).send({ detail: 'Время окончания должно быть в будущем' })
      }
    }

    const booking = await app.prisma.booking.findUnique({
      where: { id },
      include: { device: true, auditory: true }
    })
    if (!booking) {
      return reply.code(404).send({ detail: 'Бронирование не найдено' })
    }

    const targetAuditoryId = auditoryId || booking.auditoryId
    const targetEndAt = newEndAt || booking.endTime

    if (auditoryId || endTime) {
      const conflicting = await app.prisma.booking.findFirst({
        where: {
          auditoryId: targetAuditoryId,
          endTime: { gt: now },
          id: { not: id }
        }
      })
      if (conflicting) {
        return reply.code(409).send({ 
          detail: `Аудитория занята до ${conflicting.endTime.toLocaleTimeString()}` 
        })
      }
    }

    const data: any = {}
    if (deviceId) data.deviceId = deviceId
    if (auditoryId) data.auditoryId = auditoryId
    if (newEndAt) data.endTime = newEndAt

    const updated = await app.prisma.booking.update({
      where: { id },
      data,
      include: { device: true, auditory: true }
    })
    return updated
  })

  app.delete('/api/bookings/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.booking.delete({ where: { id } })
    return reply.code(204).send()
  })

  return app
}
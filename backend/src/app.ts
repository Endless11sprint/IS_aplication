import Fastify, { type FastifyError } from 'fastify'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import { STATUS_CODES } from 'node:http'
import prismaPlugin from './plugins/prisma.js'
import { Type as T } from 'typebox'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { 
  ValidationProblem, 
  ProblemDetails, 
  Health,
  DeviceSchema,
  AuditorySchema,
  BookingSchema,
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
    trustProxy: true,
    schemaErrorFormatter(errors, dataVar) {
      const msg = errors.map((e) => e.message).filter(Boolean).join('; ') || 'Ошибка валидации'
      return new ValidationProblem(msg, errors, dataVar)
    }
  }).withTypeProvider<TypeBoxTypeProvider>()

  await app.register(helmet)
  await app.register(cors, { origin: true })
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    enableDraftSpec: true,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true
    },
    errorResponseBuilder(request, ctx) {
      const seconds = Math.ceil(ctx.ttl / 1000)
      return {
        type: 'about:blank',
        title: 'Too Many Requests',
        status: 429,
        detail: `Rate limit exceeded. Retry in ${seconds} seconds.`,
        instance: request.url
      } satisfies ProblemDetails
    }
  })
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Room Assets API',
        version: '1.0.0',
        description: 'API for managing devices, auditories, and bookings. Совместим с RFC 9457.'
      },
      servers: [{ url: 'http://localhost' }],
      tags: [
        { name: 'Devices', description: 'Маршруты для управления устройствами' },
        { name: 'Auditories', description: 'Маршруты для управления аудиториями' },
        { name: 'Bookings', description: 'Маршруты для управления бронированиями' },
        { name: 'System', description: 'Служебные эндпоинты' }
      ]
    }
  })
  await app.register(prismaPlugin)

  app.setErrorHandler<FastifyError | ValidationProblem>((err, req, reply) => {
    const status = typeof err.statusCode === 'number' ? err.statusCode : 500
    const isValidation = err instanceof ValidationProblem
    const problem = {
      type: 'about:blank',
      title: STATUS_CODES[status] ?? 'Error',
      status,
      detail: err.message || 'Unexpected error',
      instance: req.url,
      ...(isValidation ? { errorsText: err.message } : {})
    }
    reply.code(status).type('application/problem+json').send(problem)
  })

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).type('application/problem+json').send({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: `Route ${request.method} ${request.url} not found`,
      instance: request.url
    } satisfies ProblemDetails)
  })

  // --- DEVICES ---
  app.get('/api/devices', {
    schema: {
      operationId: 'listDevices',
      tags: ['Devices'],
      summary: 'Возвращает список устройств',
      description: 'Получаем все устройства.',
      response: {
        200: {
          description: 'Список устройств',
          content: { 'application/json': { schema: T.Array(DeviceSchema) } }
        },
        429: {
          description: 'Too Many Requests',
          headers: {
            'retry-after': { schema: T.Integer({ minimum: 0 }) }
          },
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        }
      }
    }
  }, async () => app.prisma.device.findMany())
  
  app.post('/api/devices', { 
    schema: { 
      body: CreateDeviceSchema,
      operationId: 'createDevice',
      tags: ['Devices'],
      summary: 'Создает новое устройство',
      description: 'Добавляет устройство в базу.',
      response: {
        201: {
          description: 'Созданное устройство',
          content: { 'application/json': { schema: DeviceSchema } }
        },
        400: {
          description: 'Bad Request',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        429: {
          description: 'Too Many Requests',
          headers: {
            'retry-after': { schema: T.Integer({ minimum: 0 }) }
          },
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        }
      }
    } 
  }, async (req, reply) => {
    const device = await app.prisma.device.create({ data: req.body })
    return reply.code(201).send(device)
  })

  app.put('/api/devices/:id', { 
    schema: { 
      body: UpdateDeviceSchema,
      params: T.Object({ id: T.String() }),
      operationId: 'updateDevice',
      tags: ['Devices'],
      summary: 'Обновляет устройство',
      description: 'Изменяет данные устройства по ID.',
      response: {
        200: {
          description: 'Обновленное устройство',
          content: { 'application/json': { schema: DeviceSchema } }
        },
        400: {
          description: 'Bad Request',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        404: {
          description: 'Not Found',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        429: {
          description: 'Too Many Requests',
          headers: {
            'retry-after': { schema: T.Integer({ minimum: 0 }) }
          },
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        }
      }
    } 
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const updated = await app.prisma.device.update({ where: { id }, data: req.body })
    return updated
  })

  app.delete('/api/devices/:id', {
    schema: {
      params: T.Object({ id: T.String() }),
      operationId: 'deleteDevice',
      tags: ['Devices'],
      summary: 'Удаляет устройство',
      description: 'Удаляет устройство по ID.',
      response: {
        204: {
          description: 'No Content'
        },
        404: {
          description: 'Not Found',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        429: {
          description: 'Too Many Requests',
          headers: {
            'retry-after': { schema: T.Integer({ minimum: 0 }) }
          },
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        }
      }
    }
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.device.delete({ where: { id } })
    return reply.code(204).send()
  })

  // --- AUDITORIES ---
  app.get('/api/auditories', {
    schema: {
      operationId: 'listAuditories',
      tags: ['Auditories'],
      summary: 'Возвращает список аудиторий',
      description: 'Получаем все аудитории.',
      response: {
        200: {
          description: 'Список аудиторий',
          content: { 'application/json': { schema: T.Array(AuditorySchema) } }
        },
        429: {
          description: 'Too Many Requests',
          headers: {
            'retry-after': { schema: T.Integer({ minimum: 0 }) }
          },
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        }
      }
    }
  }, async () => app.prisma.auditory.findMany())

  app.post('/api/auditories', { 
    schema: { 
      body: CreateAuditorySchema,
      operationId: 'createAuditory',
      tags: ['Auditories'],
      summary: 'Создает новую аудиторию',
      description: 'Добавляет аудиторию в базу.',
      response: {
        201: {
          description: 'Созданная аудитория',
          content: { 'application/json': { schema: AuditorySchema } }
        },
        400: {
          description: 'Bad Request',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        429: {
          description: 'Too Many Requests',
          headers: {
            'retry-after': { schema: T.Integer({ minimum: 0 }) }
          },
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        }
      }
    } 
  }, async (req, reply) => {
    const auditory = await app.prisma.auditory.create({ data: req.body })
    return reply.code(201).send(auditory)
  })

  app.put('/api/auditories/:id', { 
    schema: { 
      body: UpdateAuditorySchema,
      params: T.Object({ id: T.String() }),
      operationId: 'updateAuditory',
      tags: ['Auditories'],
      summary: 'Обновляет аудиторию',
      description: 'Изменяет данные аудитории по ID.',
      response: {
        200: {
          description: 'Обновленная аудитория',
          content: { 'application/json': { schema: AuditorySchema } }
        },
        400: {
          description: 'Bad Request',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        404: {
          description: 'Not Found',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        429: {
          description: 'Too Many Requests',
          headers: {
            'retry-after': { schema: T.Integer({ minimum: 0 }) }
          },
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        }
      }
    } 
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const updated = await app.prisma.auditory.update({ where: { id }, data: req.body })
    return updated
  })

  app.delete('/api/auditories/:id', {
    schema: {
      params: T.Object({ id: T.String() }),
      operationId: 'deleteAuditory',
      tags: ['Auditories'],
      summary: 'Удаляет аудиторию',
      description: 'Удаляет аудиторию по ID.',
      response: {
        204: {
          description: 'No Content'
        },
        404: {
          description: 'Not Found',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        429: {
          description: 'Too Many Requests',
          headers: {
            'retry-after': { schema: T.Integer({ minimum: 0 }) }
          },
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        }
      }
    }
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.auditory.delete({ where: { id } })
    return reply.code(204).send()
  })

  // --- BOOKINGS ---
  app.get('/api/bookings', {
    schema: {
      operationId: 'listBookings',
      tags: ['Bookings'],
      summary: 'Возвращает список бронирований',
      description: 'Получаем все бронирования с устройствами и аудиториями, отсортированные по startTime desc.',
      response: {
        200: {
          description: 'Список бронирований',
          content: { 'application/json': { schema: T.Array(BookingSchema) } }
        },
        429: {
          description: 'Too Many Requests',
          headers: {
            'retry-after': { schema: T.Integer({ minimum: 0 }) }
          },
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        }
      }
    }
  }, async () => {
    return app.prisma.booking.findMany({ 
      include: { device: true, auditory: true },
      orderBy: { startTime: 'desc' }
    })
  })

  app.post('/api/bookings', { 
    schema: { 
      body: CreateBookingSchema,
      operationId: 'createBooking',
      tags: ['Bookings'],
      summary: 'Создает новое бронирование',
      description: 'Добавляет бронирование с проверкой на конфликт.',
      response: {
        201: {
          description: 'Созданное бронирование',
          content: { 'application/json': { schema: BookingSchema } }
        },
        400: {
          description: 'Bad Request',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        409: {
          description: 'Conflict',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        429: {
          description: 'Too Many Requests',
          headers: {
            'retry-after': { schema: T.Integer({ minimum: 0 }) }
          },
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        }
      }
    } 
  }, async (req, reply) => {
    const { deviceId, auditoryId, endTime } = req.body
    const now = new Date()
    const endAt = new Date(endTime)

    if (endAt <= now) {
      return reply.code(400).type('application/problem+json').send({
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: 'Время окончания должно быть в будущем',
        instance: req.url
      } satisfies ProblemDetails)
    }

    const activeBooking = await app.prisma.booking.findFirst({
      where: {
        auditoryId,
        endTime: { gt: now }
      }
    })

    if (activeBooking) {
      return reply.code(409).type('application/problem+json').send({
        type: 'about:blank',
        title: 'Conflict',
        status: 409,
        detail: `Аудитория занята до ${activeBooking.endTime.toLocaleTimeString()}`,
        instance: req.url
      } satisfies ProblemDetails)
    }

    const booking = await app.prisma.booking.create({
      data: { deviceId, auditoryId, endTime: endAt },
      include: { device: true, auditory: true }
    })
    return reply.code(201).send(booking)
  })

  app.put('/api/bookings/:id', { 
    schema: { 
      body: UpdateBookingSchema,
      params: T.Object({ id: T.String() }),
      operationId: 'updateBooking',
      tags: ['Bookings'],
      summary: 'Обновляет бронирование',
      description: 'Изменяет данные бронирования по ID, с проверкой на конфликт.',
      response: {
        200: {
          description: 'Обновленное бронирование',
          content: { 'application/json': { schema: BookingSchema } }
        },
        400: {
          description: 'Bad Request',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        404: {
          description: 'Not Found',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        409: {
          description: 'Conflict',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        429: {
          description: 'Too Many Requests',
          headers: {
            'retry-after': { schema: T.Integer({ minimum: 0 }) }
          },
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        }
      }
    } 
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { deviceId, auditoryId, endTime } = req.body
    const now = new Date()
    let newEndAt: Date | undefined
    if (endTime) {
      newEndAt = new Date(endTime)
      if (newEndAt <= now) {
        return reply.code(400).type('application/problem+json').send({
          type: 'about:blank',
          title: 'Bad Request',
          status: 400,
          detail: 'Время окончания должно быть в будущем',
          instance: req.url
        } satisfies ProblemDetails)
      }
    }

    const booking = await app.prisma.booking.findUnique({
      where: { id },
      include: { device: true, auditory: true }
    })
    if (!booking) {
      return reply.code(404).type('application/problem+json').send({
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: 'Бронирование не найдено',
        instance: req.url
      } satisfies ProblemDetails)
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
        return reply.code(409).type('application/problem+json').send({
          type: 'about:blank',
          title: 'Conflict',
          status: 409,
          detail: `Аудитория занята до ${conflicting.endTime.toLocaleTimeString()}`,
          instance: req.url
        } satisfies ProblemDetails)
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

  app.delete('/api/bookings/:id', {
    schema: {
      params: T.Object({ id: T.String() }),
      operationId: 'deleteBooking',
      tags: ['Bookings'],
      summary: 'Удаляет бронирование',
      description: 'Удаляет бронирование по ID.',
      response: {
        204: {
          description: 'No Content'
        },
        404: {
          description: 'Not Found',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        429: {
          description: 'Too Many Requests',
          headers: {
            'retry-after': { schema: T.Integer({ minimum: 0 }) }
          },
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        }
      }
    }
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.booking.delete({ where: { id } })
    return reply.code(204).send()
  })

  app.get('/api/health', {
    schema: {
      operationId: 'health',
      tags: ['System'],
      summary: 'Health/Readiness',
      description: 'Проверяет, что процесс жив и база данных отвечает.',
      response: {
        200: {
          description: 'Ready',
          content: { 'application/json': { schema: Health } }
        },
        503: {
          description: 'Temporarily unavailable',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        429: {
          description: 'Too Many Requests',
          headers: {
            'retry-after': { schema: T.Integer({ minimum: 0 }) }
          },
          content: { 'application/problem+json': { schema: ProblemDetails } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/problem+json': { schema: ProblemDetails } }
        }
      }
    }
  }, async (_req, reply) => {
    try {
      await app.prisma.$queryRaw`SELECT 1`
      return { ok: true } as Health
    } catch {
      reply.code(503).type('application/problem+json').send({
        type: 'https://example.com/problems/dependency-unavailable',
        title: 'Service Unavailable',
        status: 503,
        detail: 'Database ping failed',
        instance: '/api/health'
      } satisfies ProblemDetails)
    }
  })

  app.get('/openapi.json', {
    schema: { hide: true }
  }, async (_req, reply) => {
    reply.type('application/json').send(app.swagger())
  })

  return app
}
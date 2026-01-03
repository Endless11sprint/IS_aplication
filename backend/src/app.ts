import Fastify, { type FastifyError } from 'fastify'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import { STATUS_CODES } from 'node:http'
import prismaPlugin from './plugins/prisma.js'
import { Type as T } from 'typebox'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { ValidationProblem, ProblemDetails, User, Health, Device, CreateDevice } from './types.js'

export async function buildApp() {
  const app = Fastify({
    logger: true,
    trustProxy: true,
    schemaErrorFormatter(errors, dataVar) {
      const msg = errors.map((e) => e.message).filter(Boolean).join('; ') || 'Validation failed'
      return new ValidationProblem(msg, errors, dataVar)
    }
  }).withTypeProvider<TypeBoxTypeProvider>()

  await app.register(helmet)
  await app.register(cors, {
    origin: true,
    methods: '*',
    allowedHeaders: ['*'],
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
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
      info: { title: 'Rooms API', version: '1.0.0' },
      servers: [{ url: 'http://localhost:3000' }]
    }
  })

  await app.register(prismaPlugin)

  app.setErrorHandler<FastifyError | ValidationProblem>((err, req, reply) => {
    const status = typeof err.statusCode === 'number' ? err.statusCode : 500
    const problem = {
      type: 'about:blank',
      title: STATUS_CODES[status] ?? 'Error',
      status,
      detail: err.message || 'Unexpected error',
      instance: req.url
    }
    reply.code(status).type('application/problem+json').send(problem)
  })

  // --- API Routes: Users ---
  app.get('/api/users', async () => {
    return app.prisma.user.findMany({ select: { id: true, email: true } })
  })

  // --- API Routes: Devices ---
  app.get('/api/devices', async () => {
    return app.prisma.device.findMany()
  })

  app.post('/api/devices', async (req, reply) => {
    const { name } = req.body as { name: string }
    const device = await app.prisma.device.create({ data: { name } })
    reply.code(201)
    return device
  })

  app.put('/api/devices/:id', async (req) => {
    const { id } = req.params as { id: string }
    const { name } = req.body as { name: string }
    return app.prisma.device.update({ where: { id }, data: { name } })
  })

  app.delete('/api/devices/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.device.delete({ where: { id } })
    reply.code(204).send()
  })

  // --- API Routes: Auditories ---
  app.get('/api/auditories', async () => {
    return app.prisma.auditory.findMany()
  })

  app.post('/api/auditories', async (req, reply) => {
    const { name, capacity } = req.body as { name: string, capacity: number }
    const auditory = await app.prisma.auditory.create({
      data: { name, capacity: Number(capacity) }
    })
    reply.code(201)
    return auditory
  })

  app.put('/api/auditories/:id', async (req) => {
    const { id } = req.params as { id: string }
    const { name, capacity } = req.body as { name: string, capacity: number }
    return app.prisma.auditory.update({
      where: { id },
      data: { name, capacity: Number(capacity) }
    })
  })

  app.delete('/api/auditories/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.auditory.delete({ where: { id } })
    reply.code(204).send()
  })

  // --- System ---
  app.get('/api/health', async (_req, reply) => {
    try {
      await app.prisma.$queryRaw`SELECT 1`
      return { ok: true }
    } catch {
      reply.code(503).send({ detail: 'Database unreachable' })
    }
  })

  return app
}
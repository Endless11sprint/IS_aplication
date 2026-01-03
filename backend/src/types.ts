import type { FastifyError, FastifySchemaValidationError } from 'fastify'
import type { SchemaErrorDataVar } from 'fastify/types/schema.js'
import { Type as T, type Static } from 'typebox'

// Этот модуль собирает переиспользуемые типы и схемы, которые нужны маршрутам Fastify и плагинам.

/**
 * Обёртка над стандартной ошибкой Fastify для случаев, когда схема запроса не проходит валидацию.
 */
export class ValidationProblem extends Error implements FastifyError {
  public readonly name = 'ValidationError'
  public readonly code = 'FST_ERR_VALIDATION'
  public readonly statusCode = 400
  public readonly validation: FastifySchemaValidationError[]
  public readonly validationContext: SchemaErrorDataVar

  constructor(
    message: string,
    errs: FastifySchemaValidationError[],
    ctx: SchemaErrorDataVar,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.validation = errs
    this.validationContext = ctx
  }
}

// Схема ответа в формате RFC 7807 (Problem Details)
export const ProblemDetails = T.Object(
  {
    type: T.String({ description: 'URI с подробным описанием ошибки' }),
    title: T.String({ description: 'Короткое резюме проблемы' }),
    status: T.Integer({ minimum: 100, maximum: 599 }),
    detail: T.Optional(T.String()),
    instance: T.Optional(T.String()),
    errorsText: T.Optional(T.String())
  },
  { additionalProperties: true }
)
export type ProblemDetails = Static<typeof ProblemDetails>

// --- Сущность: Пользователь ---
export const User = T.Object({
  id: T.String({ description: 'ID пользователя' }),
  email: T.String({ format: 'email', description: 'Электронная почта' })
})
export type User = Static<typeof User>

// --- Сущность: Устройство ---
export const Device = T.Object({
  id: T.String(),
  name: T.String({ minLength: 1 }),
})
export type Device = Static<typeof Device>

export const CreateDevice = T.Object({
  name: T.String({ minLength: 1 })
})
export type CreateDevice = Static<typeof CreateDevice>

// --- Сущность: Аудитория ---
export const Auditory = T.Object({
  id: T.String(),
  name: T.String({ minLength: 1, description: 'Название или номер аудитории' }),
  capacity: T.Integer({ minimum: 0, description: 'Вместимость человек' })
})
export type Auditory = Static<typeof Auditory>

export const CreateAuditory = T.Object({
  name: T.String({ minLength: 1 }),
  capacity: T.Integer({ minimum: 0, default: 0 })
})
export type CreateAuditory = Static<typeof CreateAuditory>

// --- Системные типы ---
export const Health = T.Object({
  ok: T.Boolean({ description: 'Флаг готовности сервиса' })
})
export type Health = Static<typeof Health>
import type { FastifyError, FastifySchemaValidationError } from 'fastify'
import type { SchemaErrorDataVar } from 'fastify/types/schema.js'
import { Type as T, type Static } from 'typebox'

// Этот модуль собирает переиспользуемые типы и схемы, которые нужны маршрутам Fastify и плагинам.
// Комментарии поясняют не только назначение сущностей, но и связи между Fastify, TypeBox и Prisma.

/**
 * Обёртка над стандартной ошибкой Fastify для случаев, когда схема запроса не проходит валидацию.
 * Мы расширяем Error, чтобы получить сообщение и stack trace, и одновременно реализуем FastifyError,
 * чтобы Fastify понимал код ошибки и корректно возвращал ответ клиенту.
 */
export class ValidationProblem extends Error implements FastifyError {
  public readonly name = 'ValidationError'
  public readonly code = 'FST_ERR_VALIDATION'
  public readonly statusCode = 400
  public readonly validation: FastifySchemaValidationError[]
  public readonly validationContext: SchemaErrorDataVar

  /**
   * @param message Сообщение об ошибке, которое увидит клиент.
   * @param errs Подробные сведения о том, какие поля не прошли проверку схемы.
   * @param ctx Контекст (какая часть запроса проверялась: body, params и т.д.), полезно для логирования.
   * @param options Стандартные опции конструктора Error (причина ошибки, управление stack trace и т.д.).
   */
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

// Схема ответа в формате RFC 7807 (Problem Details) — единый JSON-формат для сообщений об ошибках.
export const ProblemDetails = T.Object(
  {
    type: T.String({
      description: 'URI с подробным описанием ошибки (по умолчанию about:blank)'
    }),
    title: T.String({
      description: 'Короткое человекочитаемое резюме проблемы'
    }),
    status: T.Integer({
      minimum: 100,
      maximum: 599,
      description: 'HTTP-статус, с которым был отправлен ответ'
    }),
    detail: T.Optional(
      T.String({
        description: 'Дополнительные сведения о том, что пошло не так'
      })
    ),
    instance: T.Optional(
      T.String({
        description: 'URI запроса, в котором возникла проблема (если полезно для клиента)'
      })
    ),
    // Поле errorsText даёт краткое текстовое представление всех ошибок валидации, если они есть.
    errorsText: T.Optional(
      T.String({
        description: 'Сводное описание всех ошибок, собранных валидацией Fastify'
      })
    )
  },
  { additionalProperties: true }
)

export type ProblemDetails = Static<typeof ProblemDetails>

// Схема и тип пользователя, которые используются и в валидаторах, и в ответах API.
export const User = T.Object({
  id: T.String({ description: 'Уникальный идентификатор пользователя (UUID или аналогичный формат)' }),
  email: T.String({
    format: 'email',
    description: 'Адрес электронной почты, используется как логин и для отправки уведомлений'
  })
})
export type User = Static<typeof User>

// Минимальная схема для health-check запроса: позволяет внешним сервисам понять, что backend жив.
export const Health = T.Object({
  ok: T.Boolean({
    description: 'Флаг готовности сервиса: true означает, что Fastify и его зависимости работают'
  })
})
export type Health = Static<typeof Health>
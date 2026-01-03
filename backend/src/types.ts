import { Type as T, type Static } from 'typebox'
import type { FastifyError, FastifySchemaValidationError } from 'fastify'
import type { SchemaErrorDataVar } from 'fastify/types/schema.js'

export class ValidationProblem extends Error implements FastifyError {
  public readonly name = 'ValidationError'
  public readonly code = 'FST_ERR_VALIDATION'
  public readonly statusCode = 400
  public readonly validation: FastifySchemaValidationError[]
  public readonly validationContext: SchemaErrorDataVar

  constructor(message: string, errs: any, ctx: any) {
    super(message)
    this.validation = errs
    this.validationContext = ctx
  }
}

// Схемы для устройств
export const DeviceSchema = T.Object({
  id: T.String(),
  name: T.String()
})
export const CreateDeviceSchema = T.Object({
  name: T.String({ minLength: 1 })
})

// Схемы для аудиторий
export const AuditorySchema = T.Object({
  id: T.String(),
  name: T.String(),
  capacity: T.Integer()
})
export const CreateAuditorySchema = T.Object({
  name: T.String({ minLength: 1 }),
  capacity: T.Integer({ minimum: 1 })
})

// Схемы для бронирования
export const BookingSchema = T.Object({
  id: T.String(),
  deviceId: T.String(),
  auditoryId: T.String(),
  startTime: T.String(),
  endTime: T.String(),
  device: T.Optional(DeviceSchema),
  auditory: T.Optional(AuditorySchema)
})
export const CreateBookingSchema = T.Object({
  deviceId: T.String(),
  auditoryId: T.String(),
  endTime: T.String()
})

export type Device = Static<typeof DeviceSchema>
export type Auditory = Static<typeof AuditorySchema>
export type Booking = Static<typeof BookingSchema>
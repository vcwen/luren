import { HttpHeader, HttpStatusCode } from '../../src'
import { HttpError } from '../../src/lib/HttpError'
describe('HttpError', () => {
  describe('constructor', () => {
    it('should create the HttpError instance', () => {
      const he = new HttpError(HttpStatusCode.UNAUTHORIZED, 'Unauthorized', {
        headers: { [HttpHeader.WWW_Authenticate]: 'Bearer' }
      })
      expect(he).toBeInstanceOf(HttpError)
    })
  })
  describe('getRawHeader', () => {
    it('should get the header', () => {
      const he = new HttpError(HttpStatusCode.UNAUTHORIZED, 'Unauthorized', {
        headers: { [HttpHeader.WWW_Authenticate]: 'Bearer' }
      })
      expect(he.getRawHeader()).toEqual({ 'WWW-Authenticate': 'Bearer' })
    })
  })
  describe('getBody', () => {
    it('should get the body', () => {
      const he = new HttpError(HttpStatusCode.UNAUTHORIZED, 'Unauthorized', {
        headers: { [HttpHeader.WWW_Authenticate]: 'Bearer' }
      })
      expect(he.getBody()).toEqual({ code: 401, message: 'Unauthorized' })
    })
    it('should get the  body with user defined error code ', () => {
      const he = new HttpError(HttpStatusCode.CONFLICT, 'duplicated data', { code: 1100 })
      expect(he.getBody()).toEqual({ code: 1100, message: 'duplicated data' })
    })
  })
  describe('toHttpError', () => {
    it('should convert error to http error', () => {
      const error = HttpError.toHttpError(new Error('foo and bar'))
      expect(error).toBeInstanceOf(HttpError)
      expect(error.getBody()).toEqual({ code: 500, message: 'foo and bar' })
    })
    it('should throw when convert data rather than error', () => {
      expect(() => HttpError.toHttpError(new Date() as any)).toThrowError('only error can be converted to http error')
    })
  })
  describe('Preset errors', () => {
    it('should have correct status code', () => {
      expect(HttpError.proxyAuthRequired().status).toBe(HttpStatusCode.PROXY_AUTH_REQUIRED)
      expect(HttpError.rangeNotSatisfiable().status).toBe(HttpStatusCode.RANGE_NOT_SATISFIABLE)
      expect(HttpError.resourceGone().status).toBe(HttpStatusCode.RESOURCE_GONE)
      expect(HttpError.serverUnavailable().status).toBe(HttpStatusCode.SERVER_UNAVAILABLE)
      expect(HttpError.teapot().status).toBe(HttpStatusCode.TEAPOT)
      expect(HttpError.tooManyRequests().status).toBe(HttpStatusCode.TOO_MANY_REQUESTS)
      expect(HttpError.unauthorized().status).toBe(HttpStatusCode.UNAUTHORIZED)
      expect(HttpError.unsupportedMediaType().status).toBe(HttpStatusCode.UNSUPPORTED_MEDIA_TYPE)
      expect(HttpError.uriTooLong().status).toBe(HttpStatusCode.URI_TOO_LONG)
      expect(HttpError.locked().status).toBe(HttpStatusCode.LOCKED)
      expect(HttpError.badData().status).toBe(HttpStatusCode.BAD_DATA)
      expect(HttpError.badGateway().status).toBe(HttpStatusCode.BAD_GATEWAY)
      expect(HttpError.badImplementation().status).toBe(HttpStatusCode.BAD_IMPLEMENTATION)
      expect(HttpError.badRequest().status).toBe(HttpStatusCode.BAD_REQUEST)
      expect(HttpError.clientTimeout().status).toBe(HttpStatusCode.CLIENT_TIMEOUT)
      expect(HttpError.conflict().status).toBe(HttpStatusCode.CONFLICT)
      expect(HttpError.entityTooLarge().status).toBe(HttpStatusCode.ENTITY_TOO_LARGE)
      expect(HttpError.expectationFailed().status).toBe(HttpStatusCode.EXPECTATION_FAILED)
      expect(HttpError.failedDependency().status).toBe(HttpStatusCode.FAILED_DEPENDENCY)
      expect(HttpError.forbidden().status).toBe(HttpStatusCode.FORBIDDEN)
      expect(HttpError.gatewayTimeout().status).toBe(HttpStatusCode.GATEWAY_TIMEOUT)
      expect(HttpError.illegal().status).toBe(HttpStatusCode.ILLEGAL)
      expect(HttpError.internal().status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
      expect(HttpError.lengthRequired().status).toBe(HttpStatusCode.LENGTH_REQUIRED)
      expect(HttpError.methodNotAllowed().status).toBe(HttpStatusCode.METHOD_NOT_ALLOWED)
      expect(HttpError.notAcceptable().status).toBe(HttpStatusCode.NOT_ACCEPTABLE)
      expect(HttpError.notFound().status).toBe(HttpStatusCode.NOT_FOUND)
      expect(HttpError.notImplemented().status).toBe(HttpStatusCode.NOT_IMPLEMENTED)
      expect(HttpError.paymentRequired().status).toBe(HttpStatusCode.PAYMENT_REQUIRED)
      expect(HttpError.preconditionFailed().status).toBe(HttpStatusCode.PRECONDITION_FAILED)
      expect(HttpError.preconditionRequired().status).toBe(HttpStatusCode.PRECONDITION_REQUIRED)
    })
  })
})

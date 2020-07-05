import { HttpHeader, HttpStatusCode } from '../../src'
import { HttpException } from '../../src'
describe('HttpError', () => {
  describe('constructor', () => {
    it('should create the HttpError instance', () => {
      const he = new HttpException(HttpStatusCode.UNAUTHORIZED, 'Unauthorized', {
        headers: { [HttpHeader.WWW_Authenticate]: 'Bearer' }
      })
      expect(he).toBeInstanceOf(HttpException)
    })
  })
  describe('getRawHeader', () => {
    it('should get the header', () => {
      const he = new HttpException(HttpStatusCode.UNAUTHORIZED, 'Unauthorized', {
        headers: { [HttpHeader.WWW_Authenticate]: 'Bearer' }
      })
      expect(he.getRawHeader()).toEqual({ 'WWW-Authenticate': 'Bearer' })
    })
  })
  describe('getBody', () => {
    it('should get the body', () => {
      const he = new HttpException(HttpStatusCode.UNAUTHORIZED, 'Unauthorized', {
        headers: { [HttpHeader.WWW_Authenticate]: 'Bearer' }
      })
      expect(he.getBody()).toEqual({ code: 401, message: 'Unauthorized' })
    })
    it('should get the  body with user defined error code ', () => {
      const he = new HttpException(HttpStatusCode.CONFLICT, 'duplicated data', { code: 1100 })
      expect(he.getBody()).toEqual({ code: 1100, message: 'duplicated data' })
    })
  })
  describe('toHttpError', () => {
    it('should convert error to http error', () => {
      const error = HttpException.toHttpException(new Error('foo and bar'))
      expect(error).toBeInstanceOf(HttpException)
      expect(error.getBody()).toEqual({ code: 500, message: 'foo and bar' })
    })
    it('should throw when convert data rather than error', () => {
      expect(() => HttpException.toHttpException(new Date() as any)).toThrowError(
        'only error can be converted to http error'
      )
    })
  })
  describe('Preset errors', () => {
    it('should have correct status code', () => {
      expect(HttpException.proxyAuthRequired().status).toBe(HttpStatusCode.PROXY_AUTH_REQUIRED)
      expect(HttpException.rangeNotSatisfiable().status).toBe(HttpStatusCode.RANGE_NOT_SATISFIABLE)
      expect(HttpException.resourceGone().status).toBe(HttpStatusCode.RESOURCE_GONE)
      expect(HttpException.serverUnavailable().status).toBe(HttpStatusCode.SERVER_UNAVAILABLE)
      expect(HttpException.teapot().status).toBe(HttpStatusCode.TEAPOT)
      expect(HttpException.tooManyRequests().status).toBe(HttpStatusCode.TOO_MANY_REQUESTS)
      expect(HttpException.unauthorized().status).toBe(HttpStatusCode.UNAUTHORIZED)
      expect(HttpException.unsupportedMediaType().status).toBe(HttpStatusCode.UNSUPPORTED_MEDIA_TYPE)
      expect(HttpException.uriTooLong().status).toBe(HttpStatusCode.URI_TOO_LONG)
      expect(HttpException.locked().status).toBe(HttpStatusCode.LOCKED)
      expect(HttpException.badData().status).toBe(HttpStatusCode.BAD_DATA)
      expect(HttpException.badGateway().status).toBe(HttpStatusCode.BAD_GATEWAY)
      expect(HttpException.badImplementation().status).toBe(HttpStatusCode.BAD_IMPLEMENTATION)
      expect(HttpException.badRequest().status).toBe(HttpStatusCode.BAD_REQUEST)
      expect(HttpException.clientTimeout().status).toBe(HttpStatusCode.CLIENT_TIMEOUT)
      expect(HttpException.conflict().status).toBe(HttpStatusCode.CONFLICT)
      expect(HttpException.entityTooLarge().status).toBe(HttpStatusCode.ENTITY_TOO_LARGE)
      expect(HttpException.expectationFailed().status).toBe(HttpStatusCode.EXPECTATION_FAILED)
      expect(HttpException.failedDependency().status).toBe(HttpStatusCode.FAILED_DEPENDENCY)
      expect(HttpException.forbidden().status).toBe(HttpStatusCode.FORBIDDEN)
      expect(HttpException.gatewayTimeout().status).toBe(HttpStatusCode.GATEWAY_TIMEOUT)
      expect(HttpException.illegal().status).toBe(HttpStatusCode.ILLEGAL)
      expect(HttpException.internal().status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
      expect(HttpException.lengthRequired().status).toBe(HttpStatusCode.LENGTH_REQUIRED)
      expect(HttpException.methodNotAllowed().status).toBe(HttpStatusCode.METHOD_NOT_ALLOWED)
      expect(HttpException.notAcceptable().status).toBe(HttpStatusCode.NOT_ACCEPTABLE)
      expect(HttpException.notFound().status).toBe(HttpStatusCode.NOT_FOUND)
      expect(HttpException.notImplemented().status).toBe(HttpStatusCode.NOT_IMPLEMENTED)
      expect(HttpException.paymentRequired().status).toBe(HttpStatusCode.PAYMENT_REQUIRED)
      expect(HttpException.preconditionFailed().status).toBe(HttpStatusCode.PRECONDITION_FAILED)
      expect(HttpException.preconditionRequired().status).toBe(HttpStatusCode.PRECONDITION_REQUIRED)
    })
  })
})

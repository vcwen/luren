import 'reflect-metadata'
import { MetadataKey } from '../../src/constants/MetadataKey'
import { Controller } from '../../src/decorators/Controller'
describe('Controller', () => {
  it('should invoke directly when param is constructor', () => {
    @Controller()
    class TestController {}
    const metadata = Reflect.getMetadata(MetadataKey.CONTROLLER, TestController.prototype)
    expect(metadata).toEqual(expect.objectContaining({ name: 'Test', path: '/tests', prefix: '' }))
  })

  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    @Controller({ name: 'MyName', prefix: '/api', desc: 'This is a testing controller' })
    class Test {}
    const controller = Reflect.getMetadata(MetadataKey.CONTROLLER, Test.prototype)
    expect(controller).toEqual({
      name: 'MyName',
      path: '/my-names',
      prefix: '/api',
      desc: 'This is a testing controller'
    })
  })
  it('should be able to define custom plural', () => {
    // tslint:disable-next-line:max-classes-per-file
    @Controller({ plural: 'redapples' })
    class Test {}
    const controller = Reflect.getMetadata(MetadataKey.CONTROLLER, Test.prototype)
    expect(controller).toEqual({ name: 'Test', path: '/redapples', prefix: '' })
  })
})

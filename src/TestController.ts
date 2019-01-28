import { Controller, Param, Result, Route } from './decorators'

@Controller()
export class TestController<T> {
  @Route()
  @Result({ type: { name: 'string' }, strict: true })
  public test(@Param() name: T, @Param({ type: 'number', name: 'rank', required: true }) rank: number) {
    return `hello ${name}, your rank is ${rank + 1}`
  }
}

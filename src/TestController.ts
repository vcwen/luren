import { Controller, Param, Route } from './decorators'

@Controller()
export class TestController {
  @Route()
  public test(
    @Param({ name: 'name' }) name: string,
    @Param({ type: 'number', name: 'rank', required: true }) rank: number
  ) {
    return `hello ${name}, your rank is ${rank + 1}`
  }
}

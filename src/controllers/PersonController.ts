import { Param, Route } from '../decorators'
import { Controller } from '../decorators/Controller'
@Controller()
export class PersonController {
  @Route({ path: '/greeting' })
  public greeting(@Param({ name: 'name' }) name: string) {
    return 'Hello ' + name
  }
}

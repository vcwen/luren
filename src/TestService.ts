import { injectable } from 'inversify'

@injectable()
export class TestService {
  public test!: string
  public greeting() {
    // tslint:disable-next-line:no-console
    console.log('greeting........>>>>>')
  }
}

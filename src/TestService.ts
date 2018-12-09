import { Inject, Injectable } from './decorators/Inverify'

@Injectable('TestService')
export class TestService {
  @Inject('')
  public test!: string
  public greeting() {
    // tslint:disable-next-line:no-console
    console.log('greeting........>>>>>')
  }
}

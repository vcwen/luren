import { Container } from 'inversify'
import 'reflect-metadata'
const container = new Container({ skipBaseClassChecks: true })
export const getContainer = () => {
  return container
}

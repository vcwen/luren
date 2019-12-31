import { Container } from 'inversify'
import 'reflect-metadata'
export const container = new Container({ skipBaseClassChecks: true })
export const getContainer = () => {
  return container
}
export default container

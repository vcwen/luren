import { Luren } from './Luren'

const server = new Luren()
// server.getRouter().get('/test', async (ctx) => {
//   ctx.body = 'hello world'
// })

// tslint:disable-next-line:no-magic-numbers
server.start(3000)

import fs from 'fs'
import bodyParser = require('koa-bodyparser')
import { Prop, Schema } from 'luren-schema'
import Path from 'path'
import request from 'supertest'
import { HttpMethod, HttpStatusCode, redirect } from '../src'
import { ParamSource } from '../src/constants/ParamSource'
import { Action, Controller, Param, Response, UseMiddleware } from '../src/decorators'
import { IncomingFile } from '../src/lib/IncomingFile'
import { StreamResponse } from '../src/lib/StreamResponse'
import { Luren } from '../src/Luren'

@Schema()
class Person {
  @Prop({ required: true })
  public name!: string
  @Prop({ type: 'number', required: true })
  public age!: number
}

@Controller({ prefix: '/api' })
// tslint:disable-next-line:max-classes-per-file
export default class PersonController {
  @Action()
  @Response({ type: Person })
  public hello(@Param({ name: 'name', in: ParamSource.QUERY }) name: string) {
    return { name: name || 'vc', age: 15 }
  }
  @Action({ method: HttpMethod.POST, path: '/something' })
  @Response({ type: ['string'] })
  public doSomething(@Param({ name: 'name', in: ParamSource.BODY, required: true }) name: string) {
    return ['ok', name]
  }
  @Action({ path: '/redirect' })
  public redirect() {
    // tslint:disable-next-line: no-magic-numbers
    return redirect('http://localhost/redirect', 301)
  }
  @Action({ method: HttpMethod.PUT })
  @Response({ type: { criteria: 'object', skip: 'number?' } })
  @UseMiddleware(bodyParser() as any)
  public hog(
    @Param({ name: 'filter', in: 'body', type: { criteria: 'object', skip: 'number?', limit: 'number?' }, root: true })
    filter: object
  ) {
    // tslint:disable-next-line: no-magic-numbers
    return filter
  }
  @Action()
  @Response({ type: { criteria: 'object', skip: 'number?' } })
  public wrong() {
    // tslint:disable-next-line: no-magic-numbers
    return { name: 'vc' }
  }
  @Action({ method: HttpMethod.POST })
  @Response({ type: { status: 'string' } })
  public upload(@Param({ name: 'avatar', in: 'body', type: 'file' }) avatar: IncomingFile) {
    // tslint:disable-next-line: no-magic-numbers
    if (avatar.size === 61626) {
      return { status: 'success' }
    } else {
      throw new Error('invalid file')
    }
  }
  @Action()
  @Response({ type: 'stream' })
  public download() {
    const rs = fs.createReadStream(Path.resolve(__dirname, './files/avatar.jpg'))
    return new StreamResponse(rs, { filename: 'image.jpg', mime: 'image/jpg' })
  }
}

jest.unmock('@koa/router')
describe('Luren', () => {
  it('should deal the request', async () => {
    const luren = new Luren()
    luren.register(PersonController)
    const server = luren.listen(3001)
    try {
      const res = await request(server).get('/api/people/hello?name=vincent').expect(200)
      expect(res.body).toEqual({ name: 'vincent', age: 15 })
    } finally {
      server.close()
    }
  })
  it('should able handle array', async () => {
    const luren = new Luren()
    const ctrl = new PersonController()
    luren.register(ctrl)
    const server = luren.listen(3001)
    try {
      const res = await request(server).post('/api/people/something').send({ name: 'Red' }).expect(200)
      expect(res.body).toEqual(['ok', 'Red'])
    } finally {
      server.close()
    }
  })
  it('should redirect', async () => {
    const luren = new Luren()
    const ctrl = new PersonController()
    luren.register(ctrl)
    const server = luren.listen(3001)
    try {
      await request(server).get('/api/people/redirect').expect(HttpStatusCode.MOVED_PERMANENTLY)
    } finally {
      server.close()
    }
  })
  it('should transform the response', async () => {
    const luren = new Luren()
    const ctrl = new PersonController()
    luren.register(ctrl)
    const server = luren.listen(3001)
    try {
      const res = await request(server)
        .put('/api/people/hog')
        .send({ criteria: { name: 'vc' }, skip: 0, limit: 10 })
        .expect(HttpStatusCode.OK)
      expect(res.body).toEqual({ criteria: { name: 'vc' }, skip: 0 })
    } finally {
      server.close()
    }
  })
  it('should return the original the response', async () => {
    const luren = new Luren({ enableResponseConversion: false })
    const ctrl = new PersonController()
    luren.register(ctrl)
    const server = luren.listen(3001)
    try {
      const res = await request(server)
        .put('/api/people/hog')
        .send({ criteria: { name: 'vc' }, skip: 0, limit: 10 })
        .expect(HttpStatusCode.OK)
      expect(res.body).toEqual({ criteria: { name: 'vc' }, skip: 0, limit: 10 })
    } finally {
      server.close()
    }
  })
  it('should error if response is wrong', async () => {
    const luren = new Luren()
    const ctrl = new PersonController()
    luren.register(ctrl)
    const p = new Promise((resolve) => {
      luren.on('error', (err, ctx) => {
        expect(err).toBeInstanceOf(Error)
        if (ctx) {
          expect(ctx.url).toBe('/api/people/wrong')
        }
        resolve()
      })
    })
    const server = await luren.listen(3001)
    try {
      await request(server)
        .get('/api/people/wrong')
        .expect('Content-Type', 'text/plain')
        .expect(HttpStatusCode.INTERNAL_SERVER_ERROR)
    } finally {
      server.close()
    }
    return p
  })
  it('should parse the file param', async () => {
    const luren = new Luren()
    const ctrl = new PersonController()
    luren.register(ctrl)
    const server = await luren.listen(3001)
    try {
      await request(server)
        .post('/api/people/upload')
        .field('name', 'my awesome avatar')
        .attach('avatar', Path.resolve(__dirname, 'files/avatar.jpg'))
        .expect(HttpStatusCode.OK)
    } finally {
      server.close()
    }
  })
  it('should download the file ', async () => {
    const luren = new Luren()
    const ctrl = new PersonController()
    luren.register(ctrl)
    const server = luren.listen(3001)
    try {
      const res = await request(server)
        .get('/api/people/download')
        .expect('content-disposition', 'attachment; filename="image.jpg"')
        .expect(HttpStatusCode.OK)
      // tslint:disable-next-line: no-magic-numbers
      expect(res.body.length).toBe(61626)
    } finally {
      server.close()
    }
  })
})

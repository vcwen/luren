import nodepath from 'path'
export default function(options: any) {
  const prefix = options.prefix || ''
  const router = {
    routes: {},
    get(path: string, action: any) {
      this.routes['get:' + nodepath.join('/', prefix, path)] = { method: 'get', action }
    },
    put(path: string, action: any) {
      this.routes['put:' + nodepath.join('/', prefix, path)] = { method: 'put', action }
    },
    post(path: string, action: any) {
      this.routes['post:' + nodepath.join('/', prefix, path)] = { method: 'post', action }
    },
    delete(path: string, action: any) {
      this.routes['delete:' + nodepath.join('/', prefix, path)] = { method: 'delete', action }
    }
  } as any
  return router
}

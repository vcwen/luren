import Path from 'path'
export default function(options: any) {
  const prefix = (options && options.prefix) || ''
  const router = {
    routes: {},
    get(path: string, action: any) {
      this.routes['get:' + Path.join('/', prefix, path)] = { method: 'get', action }
    },
    put(path: string, action: any) {
      this.routes['put:' + Path.join('/', prefix, path)] = { method: 'put', action }
    },
    post(path: string, action: any) {
      this.routes['post:' + Path.join('/', prefix, path)] = { method: 'post', action }
    },
    delete(path: string, action: any) {
      this.routes['delete:' + Path.join('/', prefix, path)] = { method: 'delete', action }
    }
  } as any
  return router
}

import { Context, Next } from 'koa'

export interface IMiddleware {
  execute(ctx: Context, next: Next): Promise<any>
  toRawMiddleware(): (ctx: Context, next: Next) => Promise<any>
}

export abstract class Middleware implements IMiddleware {
  public abstract async execute(ctx: Context, next: Next): Promise<any>
  public toRawMiddleware() {
    return async (ctx: Context, next: Next) => {
      return this.execute(ctx, next)
    }
  }
  public static fromRawMiddleware(rawMiddleware: (ctx: Context, next: Next) => any) {
    // tslint:disable-next-line: max-classes-per-file
    return new (class extends Middleware {
      public execute(ctx: Context, next: Next): Promise<any> {
        return rawMiddleware(ctx, next)
      }
    })()
  }
}

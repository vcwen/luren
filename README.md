# Luren

[![npm version](https://badge.fury.io/js/luren.svg)](https://badge.fury.io/js/luren)
[![Dependencies Status](https://david-dm.org/vcwen/luren.svg)](https://david-dm.org/vcwen/luren)
[![Build Status](https://travis-ci.org/vcwen/luren.svg?branch=master)](https://travis-ci.org/vcwen/luren)
[![Coverage Status](https://coveralls.io/repos/github/vcwen/luren/badge.svg?branch=develop)](https://coveralls.io/github/vcwen/luren?branch=develop)

Luren是基于[Koa](https://koajs.com/)一个简单web框架，可以快速方便的生成RESTFUL风格的API，提供依赖注入[InversifyJS](http://inversify.io/)和RESTFUL API的文档[Swagger](https://swagger.io/)的支持.Luren是基于Decorator来设置Controller的，所以ts中必须开启decorator支持。Luren在启动时会自动加载工作目录下的`boot`, `middleware`,`controllers`,`models`四个目录下的ts/js文件。

```typescript
src
├── boot
├── controllers
├── middlewares
├── models

```

## Controller

Controller提供API的组件，也是Luren中最重要的一个组件，一个controller即代表一个资源，controller中包含多个action，即资源相关的API。下面的controller会生成一个`POST /api/v1/demos/foo`的API， 当接受请求时会检查相应的参数，如header，query，body等然后处理之后传递给相应的action函数，在action函数返回结果之后，会将结果根据Response类型进行处理然后返回。

```typescript
@injectable()
@Controller({ prefix: '/api', version: 'v1' })
export default class DemoController {

  @Action({ method: HttpMethod.POST, path: '/foo' })
  @Response({ type: 'string' })
  public async foo( @InBody('name','string', true) name: string) {
  	return `Hello ${name}`
  }

```

## Middleware
Middleware是一个普通函数或者继承Processor或实现IProcessor接口的对象

```typescript
async function handle(ctx: Context, next: INext) {
  // do something
  await next()
}
class Authorization extends Processor<boolean> {
  public async process(@InQuery('name') name: string) {
    return name === 'foo'
  }
}

```

## Models

通过luren-schema对model类进行注解，可在其他地方直接引用该类型， 同时可以链接到相应的DataSource。

```typescriopt
@Collection({datasource: 'mongodb', database: 'demo' })
@Schema()
export default class User {
  @Prop()
  public firstName: string
  @Prop()
  public lastName: string
  @Prop({type: 'number', required: true})
  public age: number
}

```

## Boot

boot文件下包含需要随应用一起启动的内容， 文件以文件名的顺序加载。

## 依赖注入

Luren支持使用[InversifyJS](http://inversify.io/)来加载controller

```typescript
@injectable()
@Controller({ prefix: '/api', version: 'v1' })
export default class DemoController {
  @Action({ path: '/foo' })
  @Response({ type: Person })
  public async bar(@InQuery('name') name: string) {
    return null
  }

  // create server with inversify container
  const server = new Luren({ container })
```

#### Swagger

luren-swagger可以作为插件加载，会根据controller的注解自动生成Swagger文档。

```typescript
const server = new Luren({ container })
const swagger = new Swagger({
  info: { title: 'demo', version: '1.0' },
  servers: [{ url: '/', description: 'demo api' }]
})
server.plugin(swagger.pluginify())
```

## 代码示例

```typescript
import jwt from 'jsonwebtoken'
import _ from 'lodash'
import { APITokenAuthentication, Luren } from 'luren'
import { Swagger } from 'luren-swagger'
import dataSource from './dataSource'
import container from './inversify'

// create server with inversify container
const server = new Luren({ container })
// set work directory
server.setWorkDirectory(__dirname)
// set data source
server.setDefaultDataSource(dataSource)
// authentication
server.setDefaultAuthentication(
  new APITokenAuthentication({
    key: 'Authorization',
    source: 'header',
    async validate(accessToken: string) {
      const data = jwt.verify(accessToken, 'jwt-key')
      return data ? true : false
    }
  })
)
// serve files
server.serve('/public', { root: '/', maxage: 30 * 24 * 60 * 60 * 1000, defer: true })

// setup swagger plugin
const swagger = new Swagger({
  info: { title: 'demo', version: '1.0' },
  servers: [{ url: '/', description: 'demo api' }]
})
server.plugin(swagger.pluginify())

// start server
server.listen(3000).then(async () => {
  logger.info('Server started')
}er.info('Server started')
})

```

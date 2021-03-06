# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.3.4](https://github.com/vcwen/luren/compare/v0.3.3...v0.3.4) (2020-09-17)


### Bug Fixes

* **middleware:** fix FilterMiddleware decorator ([95ff85f](https://github.com/vcwen/luren/commit/95ff85f2077579d041173a50eae6597635eb9e4d))

### [0.3.3](https://github.com/vcwen/luren/compare/v0.3.2...v0.3.3) (2020-09-17)


### Bug Fixes

* **middleware:** fix auth decorators ([80739b0](https://github.com/vcwen/luren/commit/80739b0ba51f5a51b39197ad791937794bfbd0f3))

### [0.3.2](https://github.com/vcwen/luren/compare/v0.2.7...v0.3.2) (2020-09-17)


### Features

* **router:** add rebuild routes method ([845258f](https://github.com/vcwen/luren/commit/845258fc50bb5f7d01ff9e2373bb6005a6fa4039))
* **router:** remove @koa/router, define new router & middleware ([fe44240](https://github.com/vcwen/luren/commit/fe442404124b3f5ab1fe2780eb8259498013056a))


### Bug Fixes

* **action:** action path order ([94763c1](https://github.com/vcwen/luren/commit/94763c13ab2257120ef726adb0dc0c6a8443df42))
* **module-context:** fix controller path ([2f8690d](https://github.com/vcwen/luren/commit/2f8690df7322b3048cdd73a9a39d5816b417e03d))
* **param:** fix nil value for root param ([0fb0b0f](https://github.com/vcwen/luren/commit/0fb0b0f694662406a1f9817feb7a3e839cf5d69e))
* **param:** fix param parse ([263f842](https://github.com/vcwen/luren/commit/263f842c900daa87e6005361d7bfb5b126a0bd28))

### [0.3.1](https://github.com/vcwen/luren/compare/v0.3.0...v0.3.1) (2020-09-17)


### Features

* **router:** add rebuild routes method ([845258f](https://github.com/vcwen/luren/commit/845258fc50bb5f7d01ff9e2373bb6005a6fa4039))

## [0.3.0](https://github.com/vcwen/luren/compare/v0.2.11...v0.3.0) (2020-09-17)


### Features

* **router:** remove @koa/router, define new router & middleware ([fe44240](https://github.com/vcwen/luren/commit/fe442404124b3f5ab1fe2780eb8259498013056a))


### Bug Fixes

* **param:** fix param parse ([263f842](https://github.com/vcwen/luren/commit/263f842c900daa87e6005361d7bfb5b126a0bd28))

### [0.2.11](https://github.com/vcwen/luren/compare/v0.2.10...v0.2.11) (2020-09-14)

### [0.2.10](https://github.com/vcwen/luren/compare/v0.2.9...v0.2.10) (2020-09-11)


### Bug Fixes

* **action:** action path order ([94763c1](https://github.com/vcwen/luren/commit/94763c13ab2257120ef726adb0dc0c6a8443df42))

### [0.2.9](https://github.com/vcwen/luren/compare/v0.2.8...v0.2.9) (2020-09-09)


### Bug Fixes

* **param:** fix nil value for root param ([0fb0b0f](https://github.com/vcwen/luren/commit/0fb0b0f694662406a1f9817feb7a3e839cf5d69e))

### [0.2.8](https://github.com/vcwen/luren/compare/v0.2.7...v0.2.8) (2020-09-09)


### Bug Fixes

* **module-context:** fix controller path ([2f8690d](https://github.com/vcwen/luren/commit/2f8690df7322b3048cdd73a9a39d5816b417e03d))

### [0.2.7](https://github.com/vcwen/luren/compare/v0.2.6...v0.2.7) (2020-08-27)


### Bug Fixes

* **action:** actions of subclass should override parent class's ([825cae3](https://github.com/vcwen/luren/commit/825cae371ffbaef42dca3e3dc4667de0e6298cda))

### [0.2.6](https://github.com/vcwen/luren/compare/v0.2.5...v0.2.6) (2020-08-16)


### Features

* **action:** throw an error when action has the same method & path ([5ce4090](https://github.com/vcwen/luren/commit/5ce4090928802e7fd61eb3024cc98b1adb29691b))
* **generic-type:** add default type ([4cc8d0c](https://github.com/vcwen/luren/commit/4cc8d0ccde2a9b986a8b5c5ada70da61bf6eb496))

### [0.2.5](https://github.com/vcwen/luren/compare/v0.2.4...v0.2.5) (2020-08-16)

### [0.2.4](https://github.com/vcwen/luren/compare/v0.2.3...v0.2.4) (2020-08-02)


### Features

* **controller:** add basic controller ([6260d8f](https://github.com/vcwen/luren/commit/6260d8f52f70ca69798bb578f5291f9e3120a694))


### Bug Fixes

* **exportation:** export class ([c423b39](https://github.com/vcwen/luren/commit/c423b3989abdd708d22ac82f4832f93af42581af))

### [0.2.3](https://github.com/vcwen/luren/compare/v0.2.2...v0.2.3) (2020-07-22)


### Features

* **basic-controller:** add basic controller & tempalte params ([532b6a8](https://github.com/vcwen/luren/commit/532b6a8da00dde3d39ee25869c35486c395ba433))


### Bug Fixes

* **action:** fix the order of actions, it will affect the router ([014173d](https://github.com/vcwen/luren/commit/014173dc59b259b471721b086dc69de6012b72f9))

### [0.2.2](https://github.com/vcwen/luren/compare/v0.2.1...v0.2.2) (2020-07-05)


### Features

* **guard:** add include & exclude options ([78c7a37](https://github.com/vcwen/luren/commit/78c7a3710ce852d9d545532e8ed58ba53515df9b))


### Bug Fixes

* **authenticator:** descriptor: type  -> authenticationType ([94ffc02](https://github.com/vcwen/luren/commit/94ffc02b0d072a99a10bd0214b94833e8eb3d59b))

### [0.2.1](https://github.com/vcwen/luren/compare/v0.2.0...v0.2.1) (2020-07-05)


### Features

* **guard:** guard instead of authenticator ([3018ea9](https://github.com/vcwen/luren/commit/3018ea9aa7609f43d0ff05898103c83fbc1e3795))

## [0.2.0](https://github.com/vcwen/luren/compare/v0.1.10...v0.2.0) (2020-06-28)


### Features

* **app:** rewrite controller & action & middleware ([0000004](https://github.com/vcwen/luren/commit/000000490a9a141ae3f6f6989b7b100b7e01f9d4))

### [0.1.10](https://github.com/vcwen/luren/compare/v0.1.9...v0.1.10) (2020-04-15)


### Bug Fixes

* **utils.ts:** fix glob extensions ([81f5fef](https://github.com/vcwen/luren/commit/81f5fef7a5083a8b21f391611b9a73f3be9ceed4))

### [0.1.9](https://github.com/vcwen/luren/compare/v0.1.8...v0.1.9) (2020-04-15)


### Features

* **example:** validate example in js schema ([3f4e4f5](https://github.com/vcwen/luren/commit/3f4e4f577aa513d1ddb4b846db654f3db1f1054c))


### Bug Fixes

* **luren:** remove unused imports ([4edfa04](https://github.com/vcwen/luren/commit/4edfa040f057754132b39fda7c84c0498ebe488e))

### [0.1.8](https://github.com/vcwen/luren/compare/v0.1.7...v0.1.8) (2020-01-07)


### Features

* **http_error:** create HttpError to replace boom ([2a0a20f](https://github.com/vcwen/luren/commit/2a0a20fbfed2b3e40b706b5979e5db9eb097013e))

### [0.1.7](https://github.com/vcwen/luren/compare/v0.1.6...v0.1.7) (2019-12-31)

### [0.1.6](https://github.com/vcwen/luren/compare/v0.1.5...v0.1.6) (2019-12-30)

### [0.1.5](https://github.com/vcwen/luren/compare/v0.1.4...v0.1.5) (2019-12-27)


### Bug Fixes

* **luren:** fix getControllers() ([ff3f879](https://github.com/vcwen/luren/commit/ff3f87956595e34701190775005d0809253eba30))

### [0.1.4](https://github.com/vcwen/luren/compare/v0.1.3...v0.1.4) (2019-12-27)


### Features

* **action:** add Hidden decorator ([0f45a87](https://github.com/vcwen/luren/commit/0f45a87425685aafefb7efe42297f7b435b45f06))
* **authentication:** add http authentication type ([71a535e](https://github.com/vcwen/luren/commit/71a535e928618b32dbe736a19319581d182fb590))
* **inversify:** integrate inversify ([d3c54c3](https://github.com/vcwen/luren/commit/d3c54c374c8a1988bb222c38b8869e1316b0dad7))


### Bug Fixes

* **utils.ts:** fix importModules, break -> continue , not breaking the loop ([5bed198](https://github.com/vcwen/luren/commit/5bed198b226f0d3ebc2d5c2098776fca6a994b43))

### [0.1.3](https://github.com/vcwen/luren/compare/v0.1.0...v0.1.3) (2019-12-16)


### Features

* **param & response:** add example option ([965b77b](https://github.com/vcwen/luren/commit/965b77bff72301f326ee74a7bcefac540588c2a2))


### Bug Fixes

* **helper.ts:** serialize error response only if error data is available ([87fba5c](https://github.com/vcwen/luren/commit/87fba5c434abb5260ce6c450b2bcd6339ba9c9e4))
* **luren.ts:** check controller only if it's a function ([eb5efad](https://github.com/vcwen/luren/commit/eb5efad458a1853b317db666ade90af80b209b54))

### [0.1.2](https://github.com/vcwen/luren/compare/v0.1.0...v0.1.2) (2019-12-11)


### Features

* **param & response:** add example option ([965b77b](https://github.com/vcwen/luren/commit/965b77bff72301f326ee74a7bcefac540588c2a2))

<a name="0.1.0"></a>
# [0.1.0](https://github.com/vcwen/luren/compare/v0.0.38...v0.1.0) (2019-11-22)


### Bug Fixes

* **Luren.ts:** import middleware ([70d12ba](https://github.com/vcwen/luren/commit/70d12ba))


### Features

* **Response:** add response header options ([a681355](https://github.com/vcwen/luren/commit/a681355))



<a name="0.0.37"></a>
## [0.0.37](https://github.com/vcwen/luren/compare/v0.0.36...v0.0.37) (2019-08-16)


### Bug Fixes

* **DataTypes:** fix validation ([8224bb1](https://github.com/vcwen/luren/commit/8224bb1))



<a name="0.0.36"></a>
## [0.0.36](https://github.com/vcwen/luren/compare/v0.0.34...v0.0.36) (2019-08-15)


### Bug Fixes

* **helper:** fix conflicts ([6fef723](https://github.com/vcwen/luren/commit/6fef723))


### Features

* **all:** upgrade luren-schema ([3ee66c8](https://github.com/vcwen/luren/commit/3ee66c8))



<a name="0.0.34"></a>
## [0.0.34](https://github.com/vcwen/luren/compare/v0.0.30...v0.0.34) (2019-07-19)


### Bug Fixes

* **Luren:** constructor ([0a5df0e](https://github.com/vcwen/luren/commit/0a5df0e))



<a name="0.0.19"></a>
## [0.0.19](https://github.com/vcwen/luren/compare/v0.0.18...v0.0.19) (2019-06-16)


### Bug Fixes

* **Luren:** fix controllers ([4d3221d](https://github.com/vcwen/luren/commit/4d3221d))



<a name="0.0.18"></a>
## [0.0.18](https://github.com/vcwen/luren/compare/v0.0.17...v0.0.18) (2019-06-16)


### Bug Fixes

* **Luren:** middlewareOptions optional ([da9b94f](https://github.com/vcwen/luren/commit/da9b94f))


<a name="0.0.16"></a>
## [0.0.16](https://github.com/vcwen/luren/compare/v0.0.14...v0.0.16) (2019-06-10)


### Bug Fixes

* **helper.ts:** fix parsing request params ([24a7a6a](https://github.com/vcwen/luren/commit/24a7a6a))
* **package.json:** fix peerDep ([aee31b8](https://github.com/vcwen/luren/commit/aee31b8))

<a name="0.0.14"></a>
## [0.0.14](https://github.com/vcwen/luren/compare/v0.0.13...v0.0.14) (2019-06-06)


### Bug Fixes

* **middleware:** only load function middleware ([87d4465](https://github.com/vcwen/luren/commit/87d4465))


<a name="0.0.11"></a>
## 0.0.11 (2019-05-30)


### Bug Fixes

* **acl:** bugfix ([12d0fdc](https://github.com/vcwen/luren/commit/12d0fdc))
* **all:** fix issues ([20dd6c8](https://github.com/vcwen/luren/commit/20dd6c8))
* **boot:** load boot files when initializing ([17ed6ee](https://github.com/vcwen/luren/commit/17ed6ee))
* **constants:** export ServiceIndentifier ([5ba93b0](https://github.com/vcwen/luren/commit/5ba93b0))
* **Controller.ts:** fix InjectableController ([14b4bee](https://github.com/vcwen/luren/commit/14b4bee))
* **Controller.ts:** fix version ([a56926b](https://github.com/vcwen/luren/commit/a56926b))
* **datasource:** interface ([17e1b4b](https://github.com/vcwen/luren/commit/17e1b4b))
* **datasource:** save model constructor ([769d3fe](https://github.com/vcwen/luren/commit/769d3fe))
* **debug:** add types def ([20a499e](https://github.com/vcwen/luren/commit/20a499e))
* **export:** export datasource ([8587f11](https://github.com/vcwen/luren/commit/8587f11))
* **export:** export from luren-schema ([42fd24e](https://github.com/vcwen/luren/commit/42fd24e))
* **helper:** remove unused import ([a9512ea](https://github.com/vcwen/luren/commit/a9512ea))
* **index.ts:** set json type for 'file' & 'stream' ([f3740a6](https://github.com/vcwen/luren/commit/f3740a6))
* **lib:** export module ([5423992](https://github.com/vcwen/luren/commit/5423992))
* **luren:** fix bugs ([5a1e79a](https://github.com/vcwen/luren/commit/5a1e79a))
* **luren:** prefix ([0dd6782](https://github.com/vcwen/luren/commit/0dd6782))
* **Luren.ts:** not exit when import empty module ([9d8f767](https://github.com/vcwen/luren/commit/9d8f767))
* **metadatakey:** export MetadataKey constants ([f14d5c6](https://github.com/vcwen/luren/commit/f14d5c6))
* **middleware:** fix middleware ([df02978](https://github.com/vcwen/luren/commit/df02978))
* **param:** func return type ([af61340](https://github.com/vcwen/luren/commit/af61340))
* **param:** make param name required & and mime type for file ([20db686](https://github.com/vcwen/luren/commit/20db686))
* **param:** typo ([432a505](https://github.com/vcwen/luren/commit/432a505))
* **Param.ts:** remove isFile prop ([8f14f28](https://github.com/vcwen/luren/commit/8f14f28))
* **query_executor:** fix getSchema ([7e8c638](https://github.com/vcwen/luren/commit/7e8c638))
* **response:** not validate when reponse is null ([e286df3](https://github.com/vcwen/luren/commit/e286df3))
* **response:** transform ([286cda0](https://github.com/vcwen/luren/commit/286cda0))
* **Response:** remove isStream prop ([91ba9ac](https://github.com/vcwen/luren/commit/91ba9ac))
* **result:** throw error when reponse is not in valid format ([a7a593e](https://github.com/vcwen/luren/commit/a7a593e))
* **route:** add deprecated property ([5a65fb9](https://github.com/vcwen/luren/commit/5a65fb9))
* **route:** fix routes metadata ([207fc2f](https://github.com/vcwen/luren/commit/207fc2f))
* **schema:** add jsonType ([0cbee5d](https://github.com/vcwen/luren/commit/0cbee5d))
* **schema:** fix prop metadata definition ([05de096](https://github.com/vcwen/luren/commit/05de096))
* **schema:** update exports from luren-schema ([157aebc](https://github.com/vcwen/luren/commit/157aebc))
* **schema:** using user defined name when transform ([9c5a2fa](https://github.com/vcwen/luren/commit/9c5a2fa))
* **spell:** fix spell ([2228e3d](https://github.com/vcwen/luren/commit/2228e3d))
* **type:** fix datasource type ([41a6c48](https://github.com/vcwen/luren/commit/41a6c48))
* **typo:** fix typo ([38b7192](https://github.com/vcwen/luren/commit/38b7192))
* **typo:** typo ([18cddf0](https://github.com/vcwen/luren/commit/18cddf0))
* **utils:** export convertSimpleSchema ([cf737f6](https://github.com/vcwen/luren/commit/cf737f6))


### Features

* **datasource:** add datasource ([72af785](https://github.com/vcwen/luren/commit/72af785))
* **model:** add model loader ([3045ae7](https://github.com/vcwen/luren/commit/3045ae7))
* **param:** add new param type 'file' ([c679716](https://github.com/vcwen/luren/commit/c679716))
* **prop:** add default attribute ([93e6dde](https://github.com/vcwen/luren/commit/93e6dde))
* **prop:** add private property ([8f819e7](https://github.com/vcwen/luren/commit/8f819e7))
* **response:** read schema from model class ([c1c089e](https://github.com/vcwen/luren/commit/c1c089e))



<a name="0.0.5"></a>
## 0.0.5 (2019-03-06)


### Bug Fixes

* **boot:** load boot files when initializing ([17ed6ee](https://github.com/vcwen/luren/commit/17ed6ee))

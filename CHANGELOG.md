# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.0.17"></a>
## [0.0.17](https://github.com/vcwen/luren/compare/v0.0.16...v0.0.17) (2019-06-13)



<a name="0.0.16"></a>
## [0.0.16](https://github.com/vcwen/luren/compare/v0.0.14...v0.0.16) (2019-06-10)


### Bug Fixes

* **helper.ts:** fix parsing request params ([24a7a6a](https://github.com/vcwen/luren/commit/24a7a6a))
* **package.json:** fix peerDep ([aee31b8](https://github.com/vcwen/luren/commit/aee31b8))



<a name="0.0.15"></a>
## [0.0.15](https://github.com/vcwen/luren/compare/v0.0.14...v0.0.15) (2019-06-06)



<a name="0.0.14"></a>
## [0.0.14](https://github.com/vcwen/luren/compare/v0.0.13...v0.0.14) (2019-06-06)


### Bug Fixes

* **middleware:** only load function middleware ([87d4465](https://github.com/vcwen/luren/commit/87d4465))



<a name="0.0.13"></a>
## [0.0.13](https://github.com/vcwen/luren/compare/v0.0.11...v0.0.13) (2019-05-31)



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

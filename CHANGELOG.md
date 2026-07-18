# Changelog

All notable changes to this project will be documented in this file.

## [0.12.1](https://github.com/inference-gateway/typescript-sdk/compare/v0.12.0...v0.12.1) (2026-07-18)

### ♻️ Improvements

* **examples:** adopt PascalCase enums and bump sdk to 0.12.0 ([#153](https://github.com/inference-gateway/typescript-sdk/issues/153)) ([46bfacd](https://github.com/inference-gateway/typescript-sdk/commit/46bfacdf46255e9459f35b512847808a3d4bb84f))

## [0.12.0](https://github.com/inference-gateway/typescript-sdk/compare/v0.11.0...v0.12.0) (2026-07-18)

### ✨ Features

* add llamacpp provider support ([#151](https://github.com/inference-gateway/typescript-sdk/issues/151)) ([480a5df](https://github.com/inference-gateway/typescript-sdk/commit/480a5dfac652e29974653dde194c1a11d256c2bd))

### 👷 CI

* **claude:** centralize claude.yml via reusable workflow ([#145](https://github.com/inference-gateway/typescript-sdk/issues/145)) ([8c5b5db](https://github.com/inference-gateway/typescript-sdk/commit/8c5b5db164c482042ed2d48090bf7ed850093d6c))
* **deps-dev:** bump the npm group with 4 updates ([#143](https://github.com/inference-gateway/typescript-sdk/issues/143)) ([193f693](https://github.com/inference-gateway/typescript-sdk/commit/193f693f2691bdd995f93fa27117a4936b18f492))
* **deps-dev:** bump the npm group with 4 updates (revert typescript to ^6.0.3) ([#148](https://github.com/inference-gateway/typescript-sdk/issues/148)) ([7eb3cc1](https://github.com/inference-gateway/typescript-sdk/commit/7eb3cc15c9b1b312939e7cfdd0f5059f9925c550))
* **deps:** bump actions/setup-node in the github-actions group ([#147](https://github.com/inference-gateway/typescript-sdk/issues/147)) ([e8e63cb](https://github.com/inference-gateway/typescript-sdk/commit/e8e63cbe7f1b33caec1895d8ac85a8340a16f343))
* **deps:** bump inference-gateway/.github/.github/workflows/claude.yml ([#142](https://github.com/inference-gateway/typescript-sdk/issues/142)) ([e26de89](https://github.com/inference-gateway/typescript-sdk/commit/e26de89eb0c0c48b102966ef46863d10125dfce9))
* **infer:** centralize infer.yml via reusable workflow ([#140](https://github.com/inference-gateway/typescript-sdk/issues/140)) ([a611a54](https://github.com/inference-gateway/typescript-sdk/commit/a611a5463ec13a4ba37d3c22f4e53277af3b95ea))
* **infer:** centralize infer.yml via reusable workflow ([#141](https://github.com/inference-gateway/typescript-sdk/issues/141)) ([f308645](https://github.com/inference-gateway/typescript-sdk/commit/f3086457648dc587601168d86beb3f4a9facf756))
* **release:** update semantic release and plugins to latest versions with local installation ([1a70b70](https://github.com/inference-gateway/typescript-sdk/commit/1a70b70435e27763f657dd3d3389a25ffeeaf9c6))
* restrict default workflow token permissions to contents: read ([#139](https://github.com/inference-gateway/typescript-sdk/issues/139)) ([2285723](https://github.com/inference-gateway/typescript-sdk/commit/2285723cc1d952480dc5ee7e5f738e8603e70dc7))

### 🔧 Miscellaneous

* **deps:** bump claude-code 2.1.177 -> 2.1.197, claude-code-action v1.0.161 -> v1.0.165 ([#133](https://github.com/inference-gateway/typescript-sdk/issues/133)) ([c217b4f](https://github.com/inference-gateway/typescript-sdk/commit/c217b4f08a2b790ad7a07c00f5a7d538625a6124))
* **deps:** bump claude-code 2.1.197 -> 2.1.201 ([#134](https://github.com/inference-gateway/typescript-sdk/issues/134)) ([212450d](https://github.com/inference-gateway/typescript-sdk/commit/212450ddc748a4e48e14c6aec0006cafe4f4dd13))
* **deps:** bump claude-code-action v1.0.168 -> v1.0.169 ([#144](https://github.com/inference-gateway/typescript-sdk/issues/144)) ([78500f4](https://github.com/inference-gateway/typescript-sdk/commit/78500f480e01db830f7e120d01fe16c39fa1ebfc))
* **deps:** bump infer CLI v0.130.1 -> v0.133.0, infer-action v0.24.0 -> v0.26.0 ([#135](https://github.com/inference-gateway/typescript-sdk/issues/135)) ([a1b5f3e](https://github.com/inference-gateway/typescript-sdk/commit/a1b5f3ea27de9181d076ffd31512f908ca3297b2))
* **deps:** bump infer CLI v0.133.0 -> v0.133.1, infer-action v0.26.0 -> v0.27.1 ([#136](https://github.com/inference-gateway/typescript-sdk/issues/136)) ([6d09b1d](https://github.com/inference-gateway/typescript-sdk/commit/6d09b1d5ee522b1d2560c0ea00df5f41f7b169c3))
* **deps:** bump infer CLI v0.133.1 -> v0.137.0, infer-action v0.27.1 -> v0.29.0 ([#137](https://github.com/inference-gateway/typescript-sdk/issues/137)) ([3fedb5a](https://github.com/inference-gateway/typescript-sdk/commit/3fedb5ad09eb99edbb041e2cea60a31b4a9dc3e0))
* **deps:** bump infer CLI v0.137.0 -> v0.138.0, infer-action v0.29.0 -> v0.30.1 ([#138](https://github.com/inference-gateway/typescript-sdk/issues/138)) ([5ab09cb](https://github.com/inference-gateway/typescript-sdk/commit/5ab09cbc7472b7ec2018336ef73c7ffd3a723684))
* **deps:** bump infer CLI v0.138.0 -> v0.141.0 ([#146](https://github.com/inference-gateway/typescript-sdk/issues/146)) ([87703a0](https://github.com/inference-gateway/typescript-sdk/commit/87703a051899636cb53ddd443791fbd3894e087b))
* **deps:** bump infer CLI v0.141.0 -> v0.147.1 ([#149](https://github.com/inference-gateway/typescript-sdk/issues/149)) ([96f6705](https://github.com/inference-gateway/typescript-sdk/commit/96f6705866de9c8a7b9d33c9ba4ba5ce949f8cd3))
* **release:** update GitHub App credentials to use RELEASER_APP_ID and RELEASER_APP_PRIVATE_KEY ([c0b5235](https://github.com/inference-gateway/typescript-sdk/commit/c0b52352ecb10e51ac9473621e1bcb40a6f471d0))
* remove deprecated configuration and shortcut files ([b44f38a](https://github.com/inference-gateway/typescript-sdk/commit/b44f38a1f7d55507f58e94951e11f419e5776ba5))

## [0.11.0](https://github.com/inference-gateway/typescript-sdk/compare/v0.10.0...v0.11.0) (2026-07-05)

## [0.10.0](https://github.com/inference-gateway/typescript-sdk/compare/v0.9.0...v0.10.0) (2026-06-21)

### ✨ Features

* regenerate SDK types for new chat completion params ([#120](https://github.com/inference-gateway/typescript-sdk/issues/120)) ([c58046c](https://github.com/inference-gateway/typescript-sdk/commit/c58046c4571b62712962b517fe8b140d021d0ec6)), closes [inference-gateway/schemas#71](https://github.com/inference-gateway/schemas/issues/71)

### 🐛 Bug Fixes

* **deps:** bump @babel/core to 7.29.7 for CVE-2026-49356 ([#116](https://github.com/inference-gateway/typescript-sdk/issues/116)) ([e18d472](https://github.com/inference-gateway/typescript-sdk/commit/e18d4725f7da37660c8640b205b42228adba2438))
* **examples:** remove clear-text logging of session id ([#115](https://github.com/inference-gateway/typescript-sdk/issues/115)) ([7a71b6f](https://github.com/inference-gateway/typescript-sdk/commit/7a71b6fa77a53d166cdc31e9e315331c013c9fe1))

### 👷 CI

* **deps-dev:** bump the npm group with 3 updates ([#119](https://github.com/inference-gateway/typescript-sdk/issues/119)) ([9b5c51a](https://github.com/inference-gateway/typescript-sdk/commit/9b5c51ae67be93d46a711a0b3bbea5df6b64c14a))
* **deps:** bump esbuild and tsx in /examples/chat ([#97](https://github.com/inference-gateway/typescript-sdk/issues/97)) ([e5d7c9b](https://github.com/inference-gateway/typescript-sdk/commit/e5d7c9b37ff0d70b58ddc5de57955beebc023bd5))
* **deps:** bump form-data in /examples/mcp/agents/kubernetes ([#112](https://github.com/inference-gateway/typescript-sdk/issues/112)) ([7d38cf6](https://github.com/inference-gateway/typescript-sdk/commit/7d38cf60d52350cf3e6e20f444cd3058af52d9bd))
* **deps:** bump form-data in /examples/mcp/agents/marketing ([#108](https://github.com/inference-gateway/typescript-sdk/issues/108)) ([b2f3774](https://github.com/inference-gateway/typescript-sdk/commit/b2f377429fc11a9b764a47378a2d3e6b02b62dd7))
* **deps:** bump form-data in /examples/mcp/agents/nextjs ([#111](https://github.com/inference-gateway/typescript-sdk/issues/111)) ([dcbe1fe](https://github.com/inference-gateway/typescript-sdk/commit/dcbe1feaa241447c261516860e00a78876341386))
* **deps:** bump form-data in /examples/mcp/agents/vite ([#110](https://github.com/inference-gateway/typescript-sdk/issues/110)) ([9a319bb](https://github.com/inference-gateway/typescript-sdk/commit/9a319bb6719cceacae8c5d844193a85b93aa071f))
* **deps:** bump form-data in /examples/mcp/mcp-servers/brave-search ([#107](https://github.com/inference-gateway/typescript-sdk/issues/107)) ([365aec4](https://github.com/inference-gateway/typescript-sdk/commit/365aec450406e61d050fc719a8d867e2ff16e279))
* **deps:** bump form-data in /examples/mcp/mcp-servers/web-search ([#103](https://github.com/inference-gateway/typescript-sdk/issues/103)) ([8235222](https://github.com/inference-gateway/typescript-sdk/commit/82352225a46d0fb4c3c890a1b1385ab1e5375606))
* **deps:** bump hono in /examples/mcp/mcp-servers/brave-search ([#109](https://github.com/inference-gateway/typescript-sdk/issues/109)) ([2f7a95f](https://github.com/inference-gateway/typescript-sdk/commit/2f7a95f3a9fd9d6407a6f199ef17cf8a796be422))
* **deps:** bump hono in /examples/mcp/mcp-servers/context7 ([#105](https://github.com/inference-gateway/typescript-sdk/issues/105)) ([5e43d6b](https://github.com/inference-gateway/typescript-sdk/commit/5e43d6b049798364b35278e945a3cbdf9f64c4d6))
* **deps:** bump hono in /examples/mcp/mcp-servers/filesystem ([#106](https://github.com/inference-gateway/typescript-sdk/issues/106)) ([0712cb5](https://github.com/inference-gateway/typescript-sdk/commit/0712cb5782105043943afa723ff7ad7821ffcc14))
* **deps:** bump hono in /examples/mcp/mcp-servers/memory ([#104](https://github.com/inference-gateway/typescript-sdk/issues/104)) ([295bf65](https://github.com/inference-gateway/typescript-sdk/commit/295bf65ceecf9c1c01511ef909c99ffbf108e88b))
* **deps:** bump hono in /examples/mcp/mcp-servers/npm ([#101](https://github.com/inference-gateway/typescript-sdk/issues/101)) ([a993ed7](https://github.com/inference-gateway/typescript-sdk/commit/a993ed76c10f4259c850ea820f92f08f6698b6f6))
* **deps:** bump hono in /examples/mcp/mcp-servers/web-search ([#102](https://github.com/inference-gateway/typescript-sdk/issues/102)) ([ed09d9b](https://github.com/inference-gateway/typescript-sdk/commit/ed09d9ba0146e57073e88f37851d6aeb28c2a38d))
* **deps:** bump the github-actions group with 2 updates ([#118](https://github.com/inference-gateway/typescript-sdk/issues/118)) ([b979433](https://github.com/inference-gateway/typescript-sdk/commit/b9794333edec1e3fddf370ca31fe8bb11ae1bde4))
* **deps:** bump undici in /examples/mcp/mcp-servers/web-search ([#123](https://github.com/inference-gateway/typescript-sdk/issues/123)) ([4227d26](https://github.com/inference-gateway/typescript-sdk/commit/4227d268f3681034cc0e5a7533a10d601d75caa6))
* **deps:** upgrade actions/checkout from v6.0.3 to v7.0.0 across workflows ([97c353d](https://github.com/inference-gateway/typescript-sdk/commit/97c353d4d252557c12d29a3828dbe418b514b5fb))
* **infer:** centralize infer.yml + sync .infer config ([#122](https://github.com/inference-gateway/typescript-sdk/issues/122)) ([2adfe4e](https://github.com/inference-gateway/typescript-sdk/commit/2adfe4e11da58e5f698189c5b777d0f97e3e0ba3))
* update CI workflow to include permissions ([b248777](https://github.com/inference-gateway/typescript-sdk/commit/b248777aeb73a6f6cabe4322116aea564b30415d))

### 🔧 Miscellaneous

* **deps:** bump claude-code 2.1.161 -> 2.1.170, claude-code-action v1.0.135 -> v1.0.142 ([#98](https://github.com/inference-gateway/typescript-sdk/issues/98)) ([1e4d837](https://github.com/inference-gateway/typescript-sdk/commit/1e4d837895dc2ff8cee2700bf758bbb2081529de))
* **deps:** bump claude-code 2.1.170 -> 2.1.177, claude-code-action v1.0.142 -> v1.0.150 ([#100](https://github.com/inference-gateway/typescript-sdk/issues/100)) ([0e5b40b](https://github.com/inference-gateway/typescript-sdk/commit/0e5b40b7f683dcaae676dc84a1d2a2ff555cd11c))
* **deps:** bump claude-code-action v1.0.150 -> v1.0.152 ([#121](https://github.com/inference-gateway/typescript-sdk/issues/121)) ([a2382e7](https://github.com/inference-gateway/typescript-sdk/commit/a2382e7d2b352c6314cff835dc3fdf4c8530e5be))
* **deps:** bump infer CLI v0.121.0 -> v0.121.1, infer-action v0.12.1 -> v0.13.1 ([#99](https://github.com/inference-gateway/typescript-sdk/issues/99)) ([ded81af](https://github.com/inference-gateway/typescript-sdk/commit/ded81afaae1b18b97ccf500f30dc641c661627ac))
* **deps:** bump infer CLI v0.121.1 -> v0.122.2, infer-action v0.15.1 -> v0.15.4 ([#124](https://github.com/inference-gateway/typescript-sdk/issues/124)) ([55d6243](https://github.com/inference-gateway/typescript-sdk/commit/55d62436aff7b9dcc3a57bf2fa9508435017f245))
* **deps:** bump infer-action v0.13.1 -> v0.15.1 ([#113](https://github.com/inference-gateway/typescript-sdk/issues/113)) ([fefdf1e](https://github.com/inference-gateway/typescript-sdk/commit/fefdf1e8e76dcd412c662641f137c5ce97c41f34))
* **deps:** override js-yaml to ^4.2.0 (CVE-2026-53550) ([#114](https://github.com/inference-gateway/typescript-sdk/issues/114)) ([d18bd27](https://github.com/inference-gateway/typescript-sdk/commit/d18bd276ecefa32772f06093b643f16dcaf630f6))
* **deps:** update schema version and codex version in manifest files ([697be50](https://github.com/inference-gateway/typescript-sdk/commit/697be50cdf54791aa4e516587802286e4b6aa854))

## [0.9.0](https://github.com/inference-gateway/typescript-sdk/compare/v0.8.6...v0.9.0) (2026-06-11)

### ✨ Features

* add minimax provider to SDK types ([#96](https://github.com/inference-gateway/typescript-sdk/issues/96)) ([b7ce35e](https://github.com/inference-gateway/typescript-sdk/commit/b7ce35e5cd6e8e5091f04e17c214bf77dce98ce5))

### ♻️ Improvements

* add ESLint flat config with type-checked rules ([#49](https://github.com/inference-gateway/typescript-sdk/issues/49)) ([1d2151f](https://github.com/inference-gateway/typescript-sdk/commit/1d2151f2f351adde738ed6c80d4a62cd7d910271))

### 👷 CI

* centralize claude.yml via reusable workflow ([#33](https://github.com/inference-gateway/typescript-sdk/issues/33)) ([71965a5](https://github.com/inference-gateway/typescript-sdk/commit/71965a53cec0cfe1b286275532f7ce8929c7f174))
* centralize claude.yml via reusable workflow ([#34](https://github.com/inference-gateway/typescript-sdk/issues/34)) ([bdfa682](https://github.com/inference-gateway/typescript-sdk/commit/bdfa68229ba5910a8bae67d3013224786050460a))
* centralize claude.yml via reusable workflow ([#35](https://github.com/inference-gateway/typescript-sdk/issues/35)) ([1c1b2f7](https://github.com/inference-gateway/typescript-sdk/commit/1c1b2f749873646f78cf23c5685dcecfe88f14a0))
* centralize claude.yml via reusable workflow ([#92](https://github.com/inference-gateway/typescript-sdk/issues/92)) ([ecec0d2](https://github.com/inference-gateway/typescript-sdk/commit/ecec0d2ec187efb04b5b485368db0703db93fc54))
* centralize infer.yml + bump infer CLI and sync .infer config ([#38](https://github.com/inference-gateway/typescript-sdk/issues/38)) ([eccc913](https://github.com/inference-gateway/typescript-sdk/commit/eccc91341d242519fba517f1c44d0763b8326cd8))
* centralize infer.yml + sync .infer config ([#37](https://github.com/inference-gateway/typescript-sdk/issues/37)) ([a2af52c](https://github.com/inference-gateway/typescript-sdk/commit/a2af52c71596b69ba5a1c0ece9cf0b4d4381fc3f))
* centralize infer.yml via reusable workflow ([#36](https://github.com/inference-gateway/typescript-sdk/issues/36)) ([7bf024f](https://github.com/inference-gateway/typescript-sdk/commit/7bf024f4a91f4960f2bd776b02e1ac052cd1b2bb))
* **claude:** change effort to max ([533eba3](https://github.com/inference-gateway/typescript-sdk/commit/533eba3c50bd2cbcee562f4cbe0bc9811563eee7))
* **claude:** download all maintainer skill assets ([dddbe70](https://github.com/inference-gateway/typescript-sdk/commit/dddbe70ede84ea00300cbb55c9f368e26530f100))
* **claude:** remove system prompt - use default community maintained prompt ([b11e845](https://github.com/inference-gateway/typescript-sdk/commit/b11e845d5813eb32298910c4f2aefd060d5cd23a))
* **claude:** standardize workflow + task-based branch prefix ([ef332b5](https://github.com/inference-gateway/typescript-sdk/commit/ef332b5cf8a0dbc700a2973752c8e8a07a0bea16))
* **deps-dev:** bump @types/node from 25.9.1 to 25.9.2 in the npm group ([#52](https://github.com/inference-gateway/typescript-sdk/issues/52)) ([00efec7](https://github.com/inference-gateway/typescript-sdk/commit/00efec7d27c94d416fa5dbb5e25ad3aecdc11b40))
* **deps-dev:** bump minimatch in /examples/mcp/mcp-servers/context7 ([#79](https://github.com/inference-gateway/typescript-sdk/issues/79)) ([9b5d9f3](https://github.com/inference-gateway/typescript-sdk/commit/9b5d9f393c87f8cfd932c18a866d92f4452b273c))
* **deps-dev:** bump picomatch in /examples/mcp/mcp-servers/context7 ([#80](https://github.com/inference-gateway/typescript-sdk/issues/80)) ([1149808](https://github.com/inference-gateway/typescript-sdk/commit/1149808f0c24d0d7e3b61cac8928407e3ace177a))
* **deps-dev:** Bump the npm group with 3 updates ([#44](https://github.com/inference-gateway/typescript-sdk/issues/44)) ([08ee040](https://github.com/inference-gateway/typescript-sdk/commit/08ee04021ba436a6647272a9abc606f83603f3ac))
* **deps-dev:** Bump the npm group with 4 updates ([#32](https://github.com/inference-gateway/typescript-sdk/issues/32)) ([ac9591a](https://github.com/inference-gateway/typescript-sdk/commit/ac9591a14b2c97567237ea9bec221fa69569f62d))
* **deps-dev:** bump the npm group with 4 updates ([#95](https://github.com/inference-gateway/typescript-sdk/issues/95)) ([848d1d1](https://github.com/inference-gateway/typescript-sdk/commit/848d1d1d8d0955d8e097161f8b44aab0c07a4b3e))
* **deps:** bump @modelcontextprotocol/sdk ([#61](https://github.com/inference-gateway/typescript-sdk/issues/61)) ([82245a7](https://github.com/inference-gateway/typescript-sdk/commit/82245a738819358ba9a3f92a34aed5effa2d986a))
* **deps:** bump @modelcontextprotocol/sdk ([#63](https://github.com/inference-gateway/typescript-sdk/issues/63)) ([af7624c](https://github.com/inference-gateway/typescript-sdk/commit/af7624c40123c857b5ed0c1c4af5cdbfe9f8196d))
* **deps:** bump @modelcontextprotocol/sdk ([#70](https://github.com/inference-gateway/typescript-sdk/issues/70)) ([dbea371](https://github.com/inference-gateway/typescript-sdk/commit/dbea3718257f813b30b6ff63e8b6f8b1c1ceb526))
* **deps:** bump @modelcontextprotocol/sdk ([#76](https://github.com/inference-gateway/typescript-sdk/issues/76)) ([f7c55b1](https://github.com/inference-gateway/typescript-sdk/commit/f7c55b110ce656df3aa23e415731156ad81788b0))
* **deps:** bump @modelcontextprotocol/sdk ([#82](https://github.com/inference-gateway/typescript-sdk/issues/82)) ([be95d0d](https://github.com/inference-gateway/typescript-sdk/commit/be95d0d5f2457789825597fd0e624f23cafa8419))
* **deps:** bump @modelcontextprotocol/sdk ([#86](https://github.com/inference-gateway/typescript-sdk/issues/86)) ([aece286](https://github.com/inference-gateway/typescript-sdk/commit/aece28641105da4da976b1645f03b0903f7038da))
* **deps:** bump ajv in /examples/mcp/mcp-servers/brave-search ([#87](https://github.com/inference-gateway/typescript-sdk/issues/87)) ([12a718c](https://github.com/inference-gateway/typescript-sdk/commit/12a718c7a377e6fc8e116122fa5ee531f0d0f1bf))
* **deps:** bump ajv in /examples/mcp/mcp-servers/context7 ([#81](https://github.com/inference-gateway/typescript-sdk/issues/81)) ([4118f8e](https://github.com/inference-gateway/typescript-sdk/commit/4118f8e49ee13802f3d66127960642396cd58e8c))
* **deps:** bump ajv in /examples/mcp/mcp-servers/filesystem ([#75](https://github.com/inference-gateway/typescript-sdk/issues/75)) ([295c78e](https://github.com/inference-gateway/typescript-sdk/commit/295c78ec4862878a5888405d7872c78e5f869711))
* **deps:** bump ajv in /examples/mcp/mcp-servers/memory ([#69](https://github.com/inference-gateway/typescript-sdk/issues/69)) ([2aaa514](https://github.com/inference-gateway/typescript-sdk/commit/2aaa51444ab0730a7e61b9320bf284c72dd5c792))
* **deps:** bump ajv in /examples/mcp/mcp-servers/npm ([#66](https://github.com/inference-gateway/typescript-sdk/issues/66)) ([0674e7d](https://github.com/inference-gateway/typescript-sdk/commit/0674e7d0821c508b0be6577578075a3288499332))
* **deps:** bump ajv in /examples/mcp/mcp-servers/web-search ([#59](https://github.com/inference-gateway/typescript-sdk/issues/59)) ([fbe6fd0](https://github.com/inference-gateway/typescript-sdk/commit/fbe6fd0c31dae307aa87a5366fbc39d972538ce1))
* **deps:** bump axios from 1.9.0 to 1.16.0 in /examples/mcp/agents/nextjs ([#89](https://github.com/inference-gateway/typescript-sdk/issues/89)) ([8321e8a](https://github.com/inference-gateway/typescript-sdk/commit/8321e8acd7bf53ba6f744ae774738f763ca873b1))
* **deps:** bump axios from 1.9.0 to 1.16.0 in /examples/mcp/agents/vite ([#88](https://github.com/inference-gateway/typescript-sdk/issues/88)) ([efdfc8f](https://github.com/inference-gateway/typescript-sdk/commit/efdfc8f9ee07d17f47439304c908bf7c5cfd8e6f))
* **deps:** bump axios in /examples/mcp/agents/kubernetes ([#91](https://github.com/inference-gateway/typescript-sdk/issues/91)) ([72aac29](https://github.com/inference-gateway/typescript-sdk/commit/72aac296c4024baa41b22d7a2444da26234089c4))
* **deps:** bump axios in /examples/mcp/agents/marketing ([#90](https://github.com/inference-gateway/typescript-sdk/issues/90)) ([7512377](https://github.com/inference-gateway/typescript-sdk/commit/751237742f3d3427f9ba1f0f66937a58cc9cdeb1))
* **deps:** bump axios in /examples/mcp/mcp-servers/brave-search ([#83](https://github.com/inference-gateway/typescript-sdk/issues/83)) ([e8af66a](https://github.com/inference-gateway/typescript-sdk/commit/e8af66a70affe6219471a15bd087ad1e09af9138))
* **deps:** bump axios in /examples/mcp/mcp-servers/web-search ([#57](https://github.com/inference-gateway/typescript-sdk/issues/57)) ([0bc6b6f](https://github.com/inference-gateway/typescript-sdk/commit/0bc6b6f0aa89f6a8b1032c690e48f90d6af0a819))
* **deps:** bump inference-gateway/.github/.github/workflows/claude.yml ([#53](https://github.com/inference-gateway/typescript-sdk/issues/53)) ([1b23649](https://github.com/inference-gateway/typescript-sdk/commit/1b236494135726ec950de7a4b20c2ffc06f40155))
* **deps:** bump path-to-regexp and express ([#68](https://github.com/inference-gateway/typescript-sdk/issues/68)) ([23501d3](https://github.com/inference-gateway/typescript-sdk/commit/23501d356fb862befbb2cf633301f02a4cfd1b2f))
* **deps:** bump path-to-regexp and express ([#72](https://github.com/inference-gateway/typescript-sdk/issues/72)) ([cb75ea0](https://github.com/inference-gateway/typescript-sdk/commit/cb75ea0994660fac4ade1810813b13c5a5ffe87b))
* **deps:** bump path-to-regexp and express ([#74](https://github.com/inference-gateway/typescript-sdk/issues/74)) ([999e0e9](https://github.com/inference-gateway/typescript-sdk/commit/999e0e948317b0b93803a91135548a4e389d160e))
* **deps:** bump path-to-regexp and express ([#78](https://github.com/inference-gateway/typescript-sdk/issues/78)) ([d8ce1e5](https://github.com/inference-gateway/typescript-sdk/commit/d8ce1e5720ecffa0d9af58ddac6d12ce23a49044))
* **deps:** bump path-to-regexp and express ([#85](https://github.com/inference-gateway/typescript-sdk/issues/85)) ([1d14153](https://github.com/inference-gateway/typescript-sdk/commit/1d1415323798b4ca4ba4e72f6bbbe5be223ab0b9))
* **deps:** bump path-to-regexp in /examples/mcp/mcp-servers/web-search ([#64](https://github.com/inference-gateway/typescript-sdk/issues/64)) ([3fe65c7](https://github.com/inference-gateway/typescript-sdk/commit/3fe65c7fa4000421a46ea00a64c048adfe7584ca))
* **deps:** bump qs and express in /examples/mcp/mcp-servers/brave-search ([#84](https://github.com/inference-gateway/typescript-sdk/issues/84)) ([2b31db4](https://github.com/inference-gateway/typescript-sdk/commit/2b31db4eb25eec270fa371e4a702b21208c30736))
* **deps:** bump qs and express in /examples/mcp/mcp-servers/context7 ([#77](https://github.com/inference-gateway/typescript-sdk/issues/77)) ([232d848](https://github.com/inference-gateway/typescript-sdk/commit/232d848124ed056ead243f2fdf06456aca0c15be))
* **deps:** bump qs and express in /examples/mcp/mcp-servers/filesystem ([#73](https://github.com/inference-gateway/typescript-sdk/issues/73)) ([426f668](https://github.com/inference-gateway/typescript-sdk/commit/426f668540782e19fba7f0558051953603bcf6f0))
* **deps:** bump qs and express in /examples/mcp/mcp-servers/memory ([#67](https://github.com/inference-gateway/typescript-sdk/issues/67)) ([017f7f7](https://github.com/inference-gateway/typescript-sdk/commit/017f7f7493de39e634efb2a0871199a988bc50b0))
* **deps:** bump qs and express in /examples/mcp/mcp-servers/npm ([#62](https://github.com/inference-gateway/typescript-sdk/issues/62)) ([007fef6](https://github.com/inference-gateway/typescript-sdk/commit/007fef6a0ba34d058b650544bc9d7db27082f69b))
* **deps:** bump qs and express in /examples/mcp/mcp-servers/web-search ([#56](https://github.com/inference-gateway/typescript-sdk/issues/56)) ([663061c](https://github.com/inference-gateway/typescript-sdk/commit/663061c1e272808f6fec1d214e7739a9aa51784c))
* **deps:** bump the github-actions group with 2 updates ([#43](https://github.com/inference-gateway/typescript-sdk/issues/43)) ([293dc36](https://github.com/inference-gateway/typescript-sdk/commit/293dc3613c26b6c244e121be0778fecb79c84a61))
* **deps:** bump undici in /examples/mcp/mcp-servers/web-search ([#60](https://github.com/inference-gateway/typescript-sdk/issues/60)) ([d5998ac](https://github.com/inference-gateway/typescript-sdk/commit/d5998ace283b6410a2bf70f9132e757c0c8dea3c))
* **infer:** centralize infer.yml + bump infer CLI and sync .infer config ([#39](https://github.com/inference-gateway/typescript-sdk/issues/39)) ([bc04b7f](https://github.com/inference-gateway/typescript-sdk/commit/bc04b7f595676855d362d778f8070aac036b2b7f))

### 🔧 Miscellaneous

* **deps:** bump claude-code 2.1.148 -> 2.1.158 ([#41](https://github.com/inference-gateway/typescript-sdk/issues/41)) ([c80272b](https://github.com/inference-gateway/typescript-sdk/commit/c80272b0ca911a4049bfb860bf27d4f8cf30bf56))
* **deps:** bump claude-code 2.1.158 -> 2.1.161 ([#55](https://github.com/inference-gateway/typescript-sdk/issues/55)) ([312653f](https://github.com/inference-gateway/typescript-sdk/commit/312653f5bc470a778518e16c54e37db4cf70cf84))
* **deps:** bump codex 0.133.0 -> 0.135.0 ([#46](https://github.com/inference-gateway/typescript-sdk/issues/46)) ([c12d9a9](https://github.com/inference-gateway/typescript-sdk/commit/c12d9a96f07a9a8af7910fb80a1d48fee6155bcf))
* **deps:** bump infer CLI v0.117.0 -> v0.117.1, infer-action v0.9.1 -> v0.11.1 ([#40](https://github.com/inference-gateway/typescript-sdk/issues/40)) ([b6cd6fa](https://github.com/inference-gateway/typescript-sdk/commit/b6cd6fa8cb6c651798986aca90da842f10cd5f26))
* **deps:** bump infer CLI v0.117.1 -> v0.119.0, infer-action v0.11.2 -> v0.11.4 ([#47](https://github.com/inference-gateway/typescript-sdk/issues/47)) ([c1f6a90](https://github.com/inference-gateway/typescript-sdk/commit/c1f6a9043233e34bedd42e76db470c7eb8a1f8fe))
* **deps:** bump infer CLI v0.119.0 -> v0.120.0, infer-action v0.11.4 -> v0.11.6 ([#48](https://github.com/inference-gateway/typescript-sdk/issues/48)) ([3358644](https://github.com/inference-gateway/typescript-sdk/commit/335864412ba442a4a87c4663ea063213ec926700))
* **deps:** bump infer CLI v0.120.0 -> v0.120.1, infer-action v0.11.6 -> v0.11.7 ([#51](https://github.com/inference-gateway/typescript-sdk/issues/51)) ([a54f6a2](https://github.com/inference-gateway/typescript-sdk/commit/a54f6a2bd6ad27770c3107ebe92f87c545f9f05d))
* **deps:** bump infer CLI v0.120.1 -> v0.121.0 ([#65](https://github.com/inference-gateway/typescript-sdk/issues/65)) ([18aefec](https://github.com/inference-gateway/typescript-sdk/commit/18aefec2efc684d1810b757b1396f7190fc64bc4))
* **deps:** bump infer-action v0.11.1 -> v0.11.2 ([#45](https://github.com/inference-gateway/typescript-sdk/issues/45)) ([7369747](https://github.com/inference-gateway/typescript-sdk/commit/73697473bf8bdce9584db2ea3861cad7fa3d5b1d))
* **deps:** bump infer-action v0.11.7 -> v0.12.1 ([#93](https://github.com/inference-gateway/typescript-sdk/issues/93)) ([712145b](https://github.com/inference-gateway/typescript-sdk/commit/712145b5c03d9164c1d31a34f3338b8226f8ea3c))
* **flox:** add missing manifest.lock file ([f867d0b](https://github.com/inference-gateway/typescript-sdk/commit/f867d0b89355039d0098308b266aa575a9d5ff45))

### ✅ Miscellaneous

* report coverage baseline with npm run test:coverage ([#30](https://github.com/inference-gateway/typescript-sdk/issues/30)) ([#54](https://github.com/inference-gateway/typescript-sdk/issues/54)) ([0784c02](https://github.com/inference-gateway/typescript-sdk/commit/0784c02d6469ca908602593bfcb201dfe022c97e))

## [0.8.6](https://github.com/inference-gateway/typescript-sdk/compare/v0.8.5...v0.8.6) (2026-05-26)

### ♻️ Improvements

* Remove outdated issue templates for bug reports, feature requests, and refactor requests ([8934605](https://github.com/inference-gateway/typescript-sdk/commit/89346056578177492d65b0db138266b2d3d16e63))

### 👷 CI

* **claude:** Add maintainer skill ([1deee78](https://github.com/inference-gateway/typescript-sdk/commit/1deee789df1136f81861ed80b76f261a14f7e6b9))
* **dependabot:** Add dependabot to help with dependecies upgrades ([800d358](https://github.com/inference-gateway/typescript-sdk/commit/800d3580d06e72835f1168bdb1ed868dfe224508))
* **deps-dev:** Bump the npm group with 5 updates ([#29](https://github.com/inference-gateway/typescript-sdk/issues/29)) ([9d639f0](https://github.com/inference-gateway/typescript-sdk/commit/9d639f094140c062928bd896eefd60d115c7ab8d))
* **deps:** Bump anthropics/claude-code-action  v1.0.131 -> v1.0.133 ([d8069f9](https://github.com/inference-gateway/typescript-sdk/commit/d8069f97030409fc55f728a4565ee1647bd9f02f))
* **deps:** Bump anthropics/claude-code-action ([#26](https://github.com/inference-gateway/typescript-sdk/issues/26)) ([6161706](https://github.com/inference-gateway/typescript-sdk/commit/6161706bda6c851f7db3308ac801e61f61a1a2ed))
* **deps:** Bump anthropics/claude-code-action in the github-actions group ([#28](https://github.com/inference-gateway/typescript-sdk/issues/28)) ([be1d398](https://github.com/inference-gateway/typescript-sdk/commit/be1d3980c28a92cd9d37e532c92da125d9825f92))
* **deps:** Update Claude Code Action to version 1.0.131 ([fe97f4c](https://github.com/inference-gateway/typescript-sdk/commit/fe97f4ce6b43d26abddc87e33c641cfbd221a971))
* **deps:** Update claude-code-action to version 1.0.130 ([fa966dc](https://github.com/inference-gateway/typescript-sdk/commit/fa966dc61e7648129b0b444f5613c1fe622535f8))
* Enable display report for Claude Code action ([c16adf1](https://github.com/inference-gateway/typescript-sdk/commit/c16adf1a63181332758e1b644bae76767407bf35))
* Remove conventional-changelog-cli from semantic release installation ([fa16a49](https://github.com/inference-gateway/typescript-sdk/commit/fa16a49c40635781ef94d8171793bd004d05a274))
* Update task installation method to use arduino/setup-task action ([9a3ddc8](https://github.com/inference-gateway/typescript-sdk/commit/9a3ddc8b2f13704a3432afc08286e00982ab3dde))

### 🔧 Miscellaneous

* **deps:** Bump dev dependecies ([2f15643](https://github.com/inference-gateway/typescript-sdk/commit/2f156433b5ef35d6554e3c795a9a8dc93b6e496a))
* **deps:** Bump dev dependecies ([c3f1722](https://github.com/inference-gateway/typescript-sdk/commit/c3f1722a70c6af4f46bc605250eb2c27af50ce35))
* **deps:** Bump dev dependecies ([57e6727](https://github.com/inference-gateway/typescript-sdk/commit/57e672795d6daa581ebfd11b24774d288b077098))
* **deps:** Bump dev dependencies ([b082dde](https://github.com/inference-gateway/typescript-sdk/commit/b082ddeca7556b7551a1955e85805d75ad6a7b74))
* **deps:** Update claude-code version to ^2.1.141 and infer flake to v0.109.8 ([483ced8](https://github.com/inference-gateway/typescript-sdk/commit/483ced8f3c6e4bd88fb55777b2dee8112635c88a))
* **deps:** Update claude-code version to 2.1.141 and infer.flake to v0.109.11 ([237c6f2](https://github.com/inference-gateway/typescript-sdk/commit/237c6f2f8117364eecd104550cd3ce804e3b2881))
* **docs:** Generate AGENTS.md file ([023f3bf](https://github.com/inference-gateway/typescript-sdk/commit/023f3bf5046a38244073fa6da8811c38b75d6e2c))
* **docs:** Generate CLAUDE.md file ([2ce5947](https://github.com/inference-gateway/typescript-sdk/commit/2ce594796516206606fa5ff62fd438ed89c03806))
* **docs:** Remove AGENTS.md and CLAUDE.md ([0b317ce](https://github.com/inference-gateway/typescript-sdk/commit/0b317ce6b40fd71a2663bee6b46a0165a47f7b29))
* **flox:** Bump schema version ([e83fb95](https://github.com/inference-gateway/typescript-sdk/commit/e83fb957cea41b13fbde60edefdfa550370026f9))
* **license:** Update license to Apache 2.0 ([e5b1a43](https://github.com/inference-gateway/typescript-sdk/commit/e5b1a43925a03a6272bec3da6dbfe36a25e4bde4))
* Remove redundant comments ([4b967b9](https://github.com/inference-gateway/typescript-sdk/commit/4b967b9ebabc113f59f9262881c4488384b22ad2))
* Replace em dashes with normal dashes ([c03cc17](https://github.com/inference-gateway/typescript-sdk/commit/c03cc176cd85a9ad8c53e94cc2d338ba788e1778))
* Update create-github-app-token action to v3.2.0 ([4a34c40](https://github.com/inference-gateway/typescript-sdk/commit/4a34c406fd5a57bfd5db14d0572b82a9d8158645))

### 📦 Miscellaneous

* **deps-dev:** Bump the npm group with 5 updates ([#27](https://github.com/inference-gateway/typescript-sdk/issues/27)) ([39603e9](https://github.com/inference-gateway/typescript-sdk/commit/39603e934008713d763ff52a131ec455af10e6ae))

## [0.8.5](https://github.com/inference-gateway/typescript-sdk/compare/v0.8.4...v0.8.5) (2026-05-07)

### 🔧 Miscellaneous

* **openapi:** Sync vendored openapi.yaml with schemas@97599d4 ([#25](https://github.com/inference-gateway/typescript-sdk/issues/25)) ([0975a85](https://github.com/inference-gateway/typescript-sdk/commit/0975a85f33a612f5c5a3d57c769a12e199690a31)), closes [#24](https://github.com/inference-gateway/typescript-sdk/issues/24)

## [0.8.4](https://github.com/inference-gateway/typescript-sdk/compare/v0.8.3...v0.8.4) (2026-05-07)

### ♻️ Improvements

* Rename all instances of deepseek-reasoner to deepseek-v4-pro ([cab55cc](https://github.com/inference-gateway/typescript-sdk/commit/cab55cc743d3a421efa1779ff576cbf4b6e70ca4))
* Simplify conditions for triggering Claude Code and update system prompt instructions ([a20d49d](https://github.com/inference-gateway/typescript-sdk/commit/a20d49d008966f2e1c979cbf9e7bb2684b8fd4e4))
* Update branch prefix quotes and enhance system prompt instructions in Claude Code workflow ([0c9b393](https://github.com/inference-gateway/typescript-sdk/commit/0c9b3939ef6a6f223d7f646bbf6780ebbe980aab))

## [0.8.3](https://github.com/inference-gateway/typescript-sdk/compare/v0.8.2...v0.8.3) (2026-05-06)

### 👷 CI

* Drop NPM_TOKEN fallback now that Trusted Publishing is live ([005af68](https://github.com/inference-gateway/typescript-sdk/commit/005af68af7eedadefcf28b8dfd305ff7d5f751ac))

## [0.8.2](https://github.com/inference-gateway/typescript-sdk/compare/v0.8.1...v0.8.2) (2026-05-06)

### 👷 CI

* Grant id-token write permission for npm Trusted Publishing ([36b2e88](https://github.com/inference-gateway/typescript-sdk/commit/36b2e881313b4b5d73ba6479eb5c7e664d4dd291))

## [0.8.1](https://github.com/inference-gateway/typescript-sdk/compare/v0.8.0...v0.8.1) (2026-05-06)

### 🐛 Bug Fixes

* Exclude test files from published npm tarball ([56a3f5e](https://github.com/inference-gateway/typescript-sdk/commit/56a3f5e2caeb15baa034e1b35d04f92a56ca96f2)), closes [package.json#files](https://github.com/inference-gateway/package.json/issues/files)

## [0.8.0](https://github.com/inference-gateway/typescript-sdk/compare/v0.7.3...v0.8.0) (2026-05-06)

### ✨ Features

* Adopt latest OpenAPI spec and preserve tool-call extra_content ([193184c](https://github.com/inference-gateway/typescript-sdk/commit/193184c5d9513fc8681606da860c409655f9453f))
* **providers:** Add Google provider support ([#21](https://github.com/inference-gateway/typescript-sdk/issues/21)) ([a6381d7](https://github.com/inference-gateway/typescript-sdk/commit/a6381d7357d22f32434599e204955fff4db2e3e0)), closes [#19](https://github.com/inference-gateway/typescript-sdk/issues/19)

### ♻️ Improvements

* Rename all instances of deepseek-chat to deepseek-v4-flash ([465851e](https://github.com/inference-gateway/typescript-sdk/commit/465851e8f49fba153d1ded6add5d3511507ee50e))

### 👷 CI

* Add Claude Code GitHub Workflow ([#20](https://github.com/inference-gateway/typescript-sdk/issues/20)) ([83e61a0](https://github.com/inference-gateway/typescript-sdk/commit/83e61a01fb2fcfc63f06ea2fc1cebb6076285b17))
* Bump all actions to latest ([d23eef1](https://github.com/inference-gateway/typescript-sdk/commit/d23eef13fa6f4d015059b98bd90a75c4b8f3ddf7))

### 📚 Documentation

*  Add more examples how to use this sdk ([#16](https://github.com/inference-gateway/typescript-sdk/issues/16)) ([5bddd0b](https://github.com/inference-gateway/typescript-sdk/commit/5bddd0beb693e1ed3341f8c48511dd5e9045729d))
* Add CLAUDE.md for project guidance and development instructions ([47645bf](https://github.com/inference-gateway/typescript-sdk/commit/47645bfd0f9e0f5c0c83051acbdd52253318522d))

### 🔧 Miscellaneous

* Add .vscode to gitignore ([6e3117e](https://github.com/inference-gateway/typescript-sdk/commit/6e3117e0b6344747acc36ba21f747d10118560a2))
* Add issue templates ([769f017](https://github.com/inference-gateway/typescript-sdk/commit/769f017bf6810c687bc11795fbcb545ffaaaa446))
* Add project configuration and documentation ([f4bde02](https://github.com/inference-gateway/typescript-sdk/commit/f4bde02757e2d32512ec535e254217d3d81d76a0))
* Delete CLAUDE.md ([56bc06c](https://github.com/inference-gateway/typescript-sdk/commit/56bc06c85b061d6c7674173b60ab3dde6e0f9b69))
* **deps:** Bump all version to latest ([0d02bc5](https://github.com/inference-gateway/typescript-sdk/commit/0d02bc5045696a3046cb5460eeb1601b039accdb))
* **deps:** Install task runner for local env ([be7a77f](https://github.com/inference-gateway/typescript-sdk/commit/be7a77ffe5bcb05980a73604190661b2a079cb2e))
* **deps:** Update to their latest ([741971b](https://github.com/inference-gateway/typescript-sdk/commit/741971bd3d9f8a4ab80590b5c3b6a374dc292940))
* Download the latest oas ([9fcf5da](https://github.com/inference-gateway/typescript-sdk/commit/9fcf5da1b7cc12661e3222155c885fae77cb1931))
* Lock the versions of npm and node in package.json ([9690d75](https://github.com/inference-gateway/typescript-sdk/commit/9690d7501b8edd49bb30c9d0274247802c9bfde4))
* Remove deprecated lines from husky ([177d464](https://github.com/inference-gateway/typescript-sdk/commit/177d46459c9ffb190dbad41808e7f9ed207ed1e7))
* Replace devcontainer with Flox environment and streamline CI ([08c1eaf](https://github.com/inference-gateway/typescript-sdk/commit/08c1eaf3ac525153445ab2e1db5fc7b0c79c9457))
* Run task generate-types ([e01feff](https://github.com/inference-gateway/typescript-sdk/commit/e01feffba970085449bae28fcc49132f84e27ae8))
* Update GitHub Actions dependencies ([31006d8](https://github.com/inference-gateway/typescript-sdk/commit/31006d898f64d996d225818f3b93f38df644ae3f))

### 🎨 Miscellaneous

* Fix markdown lint errors across all documentation ([419062d](https://github.com/inference-gateway/typescript-sdk/commit/419062d726106aa84b88f805a75f3acb48582ca7))

## [0.7.3](https://github.com/inference-gateway/typescript-sdk/compare/v0.7.2...v0.7.3) (2025-06-01)

### ♻️ Improvements

* Enhance stream processing with abort signal support and increase default timeout ([#18](https://github.com/inference-gateway/typescript-sdk/issues/18)) ([3778138](https://github.com/inference-gateway/typescript-sdk/commit/377813851b6635ca7aafe2a5c9888b720736c9f5))

### 🔧 Miscellaneous

* Update MCP example README and remove unused example file ([99b34e7](https://github.com/inference-gateway/typescript-sdk/commit/99b34e70edf0c8aada1d0e0d0874481ea8381a79))

## [0.7.2](https://github.com/inference-gateway/typescript-sdk/compare/v0.7.1...v0.7.2) (2025-05-30)

### 📚 Documentation

* Add more examples how to use this SDK ([#15](https://github.com/inference-gateway/typescript-sdk/issues/15)) ([d771356](https://github.com/inference-gateway/typescript-sdk/commit/d771356657279e63a1c4aaac6fe8370a277f08f6))

### 🔧 Miscellaneous

* Add Docker-in-Docker feature to development container ([177e9f3](https://github.com/inference-gateway/typescript-sdk/commit/177e9f341c7b0fa84d975c754986c75fe98887c9))
* Remove MCP documentation references and update related instructions ([b33c08f](https://github.com/inference-gateway/typescript-sdk/commit/b33c08f2e1d1a9ae7e0c523f6f1733db86329d90))

## [0.7.1](https://github.com/inference-gateway/typescript-sdk/compare/v0.7.0...v0.7.1) (2025-05-27)

### 🐛 Bug Fixes

* Allow additional properties in input schema for components ([2216600](https://github.com/inference-gateway/typescript-sdk/commit/22166007ec2704884a4f7a2c816d1bb0a6a95efe))

### 🔧 Miscellaneous

* Enable GitHub Copilot and configure authentication ([e590786](https://github.com/inference-gateway/typescript-sdk/commit/e590786c2b3af5cb16ac7dda6dc7f9b0b7e7269c))

## [0.7.0](https://github.com/inference-gateway/typescript-sdk/compare/v0.6.2...v0.7.0) (2025-05-26)

### ✨ Features

* Implement MCP List Tools ([#13](https://github.com/inference-gateway/typescript-sdk/issues/13)) ([5c0a38c](https://github.com/inference-gateway/typescript-sdk/commit/5c0a38cbe825161c9d5dc1e15f59b31217aebb23))

## [0.6.2](https://github.com/inference-gateway/typescript-sdk/compare/v0.6.1...v0.6.2) (2025-04-30)

### ♻️ Improvements

* Process also groq reasoning models properly ([#12](https://github.com/inference-gateway/typescript-sdk/issues/12)) ([51ce3bb](https://github.com/inference-gateway/typescript-sdk/commit/51ce3bbbbdf03947bb7928e8edc413b977ea092a))

## [0.6.1](https://github.com/inference-gateway/typescript-sdk/compare/v0.6.0...v0.6.1) (2025-04-28)

### ♻️ Improvements

*  Remove redundant request option ([#11](https://github.com/inference-gateway/typescript-sdk/issues/11)) ([82e34e2](https://github.com/inference-gateway/typescript-sdk/commit/82e34e2ee9782fd224945bff1bd4daf2859a4f79))

## [0.6.0](https://github.com/inference-gateway/typescript-sdk/compare/v0.5.1...v0.6.0) (2025-04-28)

### ✨ Features

* Add usage metrics handling to streaming chat completions and update tests ([#10](https://github.com/inference-gateway/typescript-sdk/issues/10)) ([576ff71](https://github.com/inference-gateway/typescript-sdk/commit/576ff711140c9e357bea4ba572e92027297c428b))

## [0.5.1](https://github.com/inference-gateway/typescript-sdk/compare/v0.5.0...v0.5.1) (2025-04-27)

### 🐛 Bug Fixes

* Update FunctionParameters schema to enforce required properties and adjust ListModelsResponse structure ([#9](https://github.com/inference-gateway/typescript-sdk/issues/9)) ([ffa4709](https://github.com/inference-gateway/typescript-sdk/commit/ffa470907a11aca26dd29f63ca70d17954a67d17))

### 📚 Documentation

* Add required fields to Model schema and clean up application settings ([7338c28](https://github.com/inference-gateway/typescript-sdk/commit/7338c28c0b8dd67f2c0faefc758cc3344de5c9d6))

### 🔧 Miscellaneous

* **tests:** Format test ([9f121a7](https://github.com/inference-gateway/typescript-sdk/commit/9f121a742d33cd9fa2776dc5fdc5f229f898ccd0))

## [0.5.0](https://github.com/inference-gateway/typescript-sdk/compare/v0.4.1...v0.5.0) (2025-04-26)

### ✨ Features

* Add on reasoning event callback function handling in streaming chat completions ([#7](https://github.com/inference-gateway/typescript-sdk/issues/7)) ([200eb12](https://github.com/inference-gateway/typescript-sdk/commit/200eb12c5890f46d00e5c9cdaaf40a3a306b4315))

### 📦 Miscellaneous

* Add husky pre-commit hook ([#8](https://github.com/inference-gateway/typescript-sdk/issues/8)) ([5ad49a0](https://github.com/inference-gateway/typescript-sdk/commit/5ad49a083e7767a3b7293328c9cead0769324ff6))

## [0.4.1](https://github.com/inference-gateway/typescript-sdk/compare/v0.4.0...v0.4.1) (2025-04-25)

### ♻️ Improvements

* Simplify tool call handling in streaming chat completions ([#6](https://github.com/inference-gateway/typescript-sdk/issues/6)) ([f2d2a5a](https://github.com/inference-gateway/typescript-sdk/commit/f2d2a5a0743b0c1ef4930ef860949f486ee0d5fc))

## [0.4.0](https://github.com/inference-gateway/typescript-sdk/compare/v0.3.4...v0.4.0) (2025-03-31)

### ✨ Features

* Add reasoning_content to streaming deltas if they exists ([#5](https://github.com/inference-gateway/typescript-sdk/issues/5)) ([2a2c546](https://github.com/inference-gateway/typescript-sdk/commit/2a2c546fe50e35e2a0f8ef076c0251867b959e38))

## [0.4.0-rc.1](https://github.com/inference-gateway/typescript-sdk/compare/v0.3.5-rc.1...v0.4.0-rc.1) (2025-03-31)

### ✨ Features

* Add reasoning_content field to chunk message in OpenAPI specification ([4de08ed](https://github.com/inference-gateway/typescript-sdk/commit/4de08ed46f6078f77838bd9c4bae5e46eb12476c))

## [0.3.5-rc.1](https://github.com/inference-gateway/typescript-sdk/compare/v0.3.4...v0.3.5-rc.1) (2025-03-31)

### ♻️ Improvements

* Update type exports and add type generation task ([919679e](https://github.com/inference-gateway/typescript-sdk/commit/919679eac8142e25b5abcefd63ae00bc187f2a67))

### 🐛 Bug Fixes

* Correct regex pattern for release candidate branches in configuration ([33db013](https://github.com/inference-gateway/typescript-sdk/commit/33db013392c8a1a15cc5a3bebb0f4c6d58a73d41))
* Update release configuration to correctly match release candidate branches ([03d91e1](https://github.com/inference-gateway/typescript-sdk/commit/03d91e1d94d1fc11e50a535ba131ef2ca089653e))

### 🔧 Miscellaneous

* Remove unnecessary line from .gitattributes ([66407b4](https://github.com/inference-gateway/typescript-sdk/commit/66407b4cba0bf96af457dbb66818f48da3a4abda))
* Update .gitattributes to mark generated types as linguist-generated ([67f3d68](https://github.com/inference-gateway/typescript-sdk/commit/67f3d682ba1e131f9e416c45e097c76dfeec4bf6))

## [0.3.4](https://github.com/inference-gateway/typescript-sdk/compare/v0.3.3...v0.3.4) (2025-03-31)

### ♻️ Improvements

* Add optional fields for reasoning in Message interface ([#3](https://github.com/inference-gateway/typescript-sdk/issues/3)) ([9a4c1fd](https://github.com/inference-gateway/typescript-sdk/commit/9a4c1fdc50e6e6e3dd4ce53058d1164754fe8c9d))

## [0.3.3](https://github.com/inference-gateway/typescript-sdk/compare/v0.3.2...v0.3.3) (2025-03-31)

### 🐛 Bug Fixes

* Update release configuration to include version bumping of the package.json ([3667690](https://github.com/inference-gateway/typescript-sdk/commit/36676909a923bc29d398ad814f0518fcc12080aa))

## [0.3.2](https://github.com/inference-gateway/typescript-sdk/compare/v0.3.1...v0.3.2) (2025-03-31)

### 👷 CI

* Add npm ci step to install project dependencies in release workflow ([84791b1](https://github.com/inference-gateway/typescript-sdk/commit/84791b1e4c319f91798c456c783ded6e22da8f81))

## [0.3.1](https://github.com/inference-gateway/typescript-sdk/compare/v0.3.0...v0.3.1) (2025-03-31)

### ♻️ Improvements

* Make the SDK OpenAI compatible ([#2](https://github.com/inference-gateway/typescript-sdk/issues/2)) ([31657b3](https://github.com/inference-gateway/typescript-sdk/commit/31657b358f34ccc39acc5994248a95127f1ea46a))

### 👷 CI

* Update GitHub Actions release workflow to use GitHub App token and improve release handling ([14835e8](https://github.com/inference-gateway/typescript-sdk/commit/14835e8f9289314f34e711c02faf865ad9af6d66))
* Update release configuration for semantic-release plugins and rules to be consistent with other repos ([20bd3f8](https://github.com/inference-gateway/typescript-sdk/commit/20bd3f82c68d0b1ee1d07b4fa75eb67524db4fb8))

## [0.3.0](https://github.com/inference-gateway/typescript-sdk/compare/v0.2.0...v0.3.0) (2025-02-02)

### ✨ Features

* add streaming content functionality to InferenceGatewayClient and update README ([ba41d2d](https://github.com/inference-gateway/typescript-sdk/commit/ba41d2dc136b83372820af2aefa63969932e16f0))

### 📚 Documentation

* **fix:** Update examples in README.md ([4e972fc](https://github.com/inference-gateway/typescript-sdk/commit/4e972fc2c577f41b0b443f1c87cde7561717b577))
* Update OpenAPI spec - download it from Inference-gateway ([9816b15](https://github.com/inference-gateway/typescript-sdk/commit/9816b151db6b48b04723f93b988daf83239a09df))

## [0.2.0](https://github.com/inference-gateway/typescript-sdk/compare/v0.1.6...v0.2.0) (2025-01-28)

### ✨ Features

* add listModelsByProvider method and update README with new model listing features ([a8d7cd9](https://github.com/inference-gateway/typescript-sdk/commit/a8d7cd9e9332f6455271f4d8f2832631b46d2c3d))

### 📚 Documentation

* add Contributing section to README with reference to CONTRIBUTING.md ([322baae](https://github.com/inference-gateway/typescript-sdk/commit/322baae9110f270615597e647835ed22e4fdbc65))
* add CONTRIBUTING.md with guidelines for contributing to the project ([d36b08f](https://github.com/inference-gateway/typescript-sdk/commit/d36b08f1647500795d279dcd5612d5a81c9c4a74))
* **openapi:** Download the latest openapi spec from inference-gateway ([733ee1e](https://github.com/inference-gateway/typescript-sdk/commit/733ee1e57d9fc6669bb2ec0197db1c2c772a0283))

## [0.1.6](https://github.com/inference-gateway/typescript-sdk/compare/v0.1.5...v0.1.6) (2025-01-23)

### 🐛 Bug Fixes

* update main and types paths in package.json ([f1faad3](https://github.com/inference-gateway/typescript-sdk/commit/f1faad3e257891ae8f2a10729c396e1d30d1af96))

## [0.1.5](https://github.com/inference-gateway/typescript-sdk/compare/v0.1.4...v0.1.5) (2025-01-23)

### 🐛 Bug Fixes

* bump version to 0.1.4 in package.json ([437cbc1](https://github.com/inference-gateway/typescript-sdk/commit/437cbc100c970852eaa7ff07b89aa0907829b819))
* update release assets to include package.json and package-lock.json ([176b52f](https://github.com/inference-gateway/typescript-sdk/commit/176b52f352c577f34e0e6be05557348f573ec94e))

## [0.1.4](https://github.com/inference-gateway/typescript-sdk/compare/v0.1.3...v0.1.4) (2025-01-23)

### 🔧 Miscellaneous

* **release:** bump version to 0.1.2 in package.json ([ae64176](https://github.com/inference-gateway/typescript-sdk/commit/ae641767f3ba44edef0e9073d42421c2df05f36b))

## [0.1.3](https://github.com/inference-gateway/typescript-sdk/compare/v0.1.2...v0.1.3) (2025-01-23)

### 🐛 Bug Fixes

* Update release workflow environment variable and package.json repository URL format ([8ea1290](https://github.com/inference-gateway/typescript-sdk/commit/8ea1290ed6e2c122cbce7c311478e9814d09e36d))

## [0.1.2](https://github.com/inference-gateway/typescript-sdk/compare/v0.1.1...v0.1.2) (2025-01-23)

### 👷 CI

* Update permissions in release workflow for issues and pull requests ([ae1a835](https://github.com/inference-gateway/typescript-sdk/commit/ae1a83586b211a7b468fa2fc1b07f30eb02effb2))

## [0.1.1](https://github.com/inference-gateway/typescript-sdk/compare/v0.1.0...v0.1.1) (2025-01-23)

### ♻️ Improvements

* Refactor imports and update TypeScript configuration for improved module resolution and testing ([f74b6b1](https://github.com/inference-gateway/typescript-sdk/commit/f74b6b1dbc7371da01991ba832120c92b36d9c91))

### 🐛 Bug Fixes

* Update tag format in .releaserc.yaml and add npm plugin ([6e55661](https://github.com/inference-gateway/typescript-sdk/commit/6e5566147c05e5ace4306197cc5250cca0e5a948))

### 👷 CI

* Update Node.js version in CI workflow from 20.x to 22.x ([1ecf62a](https://github.com/inference-gateway/typescript-sdk/commit/1ecf62ab2af9787cbf9ca02fb84377d5c1a08255))
* Update Node.js version to 22.x and add global dependencies for semantic release ([0888fae](https://github.com/inference-gateway/typescript-sdk/commit/0888fae0c4a98a879808dc367e83e15d236dabab))

### 🔧 Miscellaneous

* Add @semantic-release/npm to Dockerfile and release workflow ([8b94e8c](https://github.com/inference-gateway/typescript-sdk/commit/8b94e8c59f705d3c7e79e29275854dbd1ad21010))
* Add job names to CI and release workflows ([e053535](https://github.com/inference-gateway/typescript-sdk/commit/e05353554c1eb62b7f0fd6b20ac8f8c75ec0685b))
* Bump OS version to the latest with updated version of NodeJS and NPM ([8739216](https://github.com/inference-gateway/typescript-sdk/commit/8739216acfbf26eba724fabf68103ed59cf73439))
* **release:** 0.1.1 [skip ci] ([1c340b4](https://github.com/inference-gateway/typescript-sdk/commit/1c340b47fedd8f78220dc49b08acb72ba7f760fe))
* **release:** bump version to 0.1.1 in package.json ([bd9fbb2](https://github.com/inference-gateway/typescript-sdk/commit/bd9fbb2346adcb89e6377a1212c3f9c257d25c0a))
* Standardize quotes in .releaserc.yaml configuration ([b4c4f5b](https://github.com/inference-gateway/typescript-sdk/commit/b4c4f5bb31721dac3355b70bf3e04398c0f8491b))

## [0.1.1](https://github.com/inference-gateway/typescript-sdk/compare/v0.1.0...0.1.1) (2025-01-23)

### ♻️ Improvements

* Refactor imports and update TypeScript configuration for improved module resolution and testing ([f74b6b1](https://github.com/inference-gateway/typescript-sdk/commit/f74b6b1dbc7371da01991ba832120c92b36d9c91))

### 👷 CI

* Update Node.js version in CI workflow from 20.x to 22.x ([1ecf62a](https://github.com/inference-gateway/typescript-sdk/commit/1ecf62ab2af9787cbf9ca02fb84377d5c1a08255))
* Update Node.js version to 22.x and add global dependencies for semantic release ([0888fae](https://github.com/inference-gateway/typescript-sdk/commit/0888fae0c4a98a879808dc367e83e15d236dabab))

### 🔧 Miscellaneous

* Bump OS version to the latest with updated version of NodeJS and NPM ([8739216](https://github.com/inference-gateway/typescript-sdk/commit/8739216acfbf26eba724fabf68103ed59cf73439))

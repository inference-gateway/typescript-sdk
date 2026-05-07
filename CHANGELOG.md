# Changelog

All notable changes to this project will be documented in this file.

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

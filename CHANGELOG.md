# Changelog

All notable changes to this project will be documented in this file.

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

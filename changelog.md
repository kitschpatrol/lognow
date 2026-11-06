# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.8] - 2026-11-01

### Changed

- Align browser object formatting with Node.js 26.11.1 `util.inspect`, including `SuppressedError` fields, detached `DataView`s, and function-valued getters.

### Maintenance

- Refresh pnpm, tsdown, Vitest, and Playwright, correct the contributor Node.js requirement to `^24.16.0 || >=26.3.0`, and remove obsolete release-age exemptions.
- Freeze time in child-logger context comparisons to eliminate flaky timestamp-dependent tests.

## [0.8.7] - 2026-10-28

### Fixed

- Accept console-like targets whose `trace` property is explicitly `undefined`, preserving debug forwarding and trace-to-debug fallback.

### Documentation

- Clarify the logging overview and simplify the Electron preload example.

## [0.8.6] - 2026-10-28

### Added

- Accept console-like targets without a `trace` method and route trace messages to `debug` in both pretty and JSON transports.

### Fixed

- Reject invalid `injectionHelper()` targets with a `TypeError` instead of silently using the default output target.

### Documentation

- Document accepted injection targets, optional trace support, forwarding of all log levels, and invalid-target errors.

### Maintenance

- Refresh shared-config, Playwright, tsdown, and pnpm, and replace prepare-time skill synchronization with pnpm workspace integration.
- Refresh CI and release actions, schedule dependency updates monthly, and make link checks ignore loopback URLs and empty inputs.

## [0.8.5] - 2026-10-06

### Changed

- **Breaking:** Drop Node.js 21, 23, and 25 from the declared supported runtime range.

### Documentation

- Document the precise supported Node.js range: `^20.19.0 || ^22.0.0 || ^24.0.0 || >=26.0.0`.

### Maintenance

- Refresh the safe-stable-stringify fork, error serialization, color, and wrapping dependencies.
- Refresh shared-config, test tooling, and pnpm; remove obsolete lint overrides and add contributor skill synchronization.
- Add scheduled dependency-update PR automation and correct stderr capture in the link-check workflow.

## [0.8.4] - 2026-09-21

### Fixed

- Recognize the default `log` proxy in `injectionHelper()` and return it unchanged, preserving its configured verbosity and logger behavior.

## [0.8.3] - 2026-09-20

### Changed

- **Breaking:** Raise the minimum supported Electron version from 39.8.5 to 39.8.10.

### Maintenance

- Update shared-config to 8.9 and simplify internal branches and test helpers to satisfy lint.

## [0.8.2] - 2026-09-17

### Fixed

- Timestamp each logging call once and share that timestamp across outputs, child loggers, metadata-only calls, and forwarded Electron logs.

### Documentation

- Document call-time timestamps and their consistency across log outputs.
- Explain why Lognow uses inspection and serialization forks for direct browser ESM imports.

## [0.8.1] - 2026-09-16

### Changed

- Restore declared support for Node.js 20.19+ while retaining Node.js 24.16+ as a contributor requirement.

### Fixed

- Enable default gzip compression during JSON log rotation even when no custom callbacks are configured.

### Documentation

- Explain that active logs remain uncompressed, rotation occurs on the first write after a date change, and files from earlier runs are not compressed retroactively.
- Document benchmark comparison, baseline regeneration, and Vitest 5 baseline-format requirements.

### Maintenance

- Refresh filename, color, wrapping, and Node type dependencies.
- Migrate tests and benchmark baselines to Vitest 5 and refresh pnpm, shared-config, and build tooling.
- Refresh release automation and publishing authentication, strengthen default-branch tag validation, and improve link-check sitemap discovery.

## [0.8.0] - 2026-07-27

### Added

- Detect Electron at runtime through standard `lognow` imports and let renderer logging fall back to console output when the preload bridge is absent.

### Changed

- **Breaking:** Require custom Electron main-process loggers to opt into renderer forwarding with `receiveRendererLogs: true`; the default singleton remains enabled.
- **Breaking:** Raise the declared Node.js minimum from 20.17.0 to 24.16.0.

### Removed

- **Breaking:** Remove `lognow/electron` in favor of `lognow`, and replace `lognow/electron/preload` with `lognow/electron-preload`.

### Fixed

- Fix direct browser ESM imports using ESM-compatible inspection and serialization forks and browser-compatible color dependencies.
- Select `console` when a browser's injected `process` shim lacks a writable stderr stream.

### Documentation

- Rewrite Electron setup and forwarding guidance for runtime detection, the new preload import, receiver opt-in, and missing-bridge behavior; refresh external links.

### Maintenance

- Generate standalone declarations with tsdown instead of dts-bundle-generator, preserve the self-contained browser bundle, and refresh build and release dependencies.
- Repair Playwright browser installation in CI, add scheduled repository and website link checking, and refresh workflow actions.

## [0.7.1] - 2026-07-16

### Changed

- **Breaking:** Raise the minimum supported Electron version from 39.7.0 to 39.8.5.

### Fixed

- Correct `getChildLogger()` generics to accept and return `ILogLayer<T>` with the same chain type.

### Maintenance

- Defer terminal-width measurement and resize-listener registration until first use.
- Refresh LogLayer, transports, shared-config, tsdown, and pnpm; update editor lint tasks and adjust internal metadata types and TypeScript strictness.

## [0.7.0] - 2026-07-14

### Changed

- Treat empty logger names as unset, omitting them from logger context and JSON output.

### Fixed

- Recognize a present but empty `ELECTRON_MAIN` environment variable when selecting the default logger name.
- Mark package initialization as side-effectful so bundlers preserve platform registration and Electron preload setup.

### Documentation

- Link complete Electron and TypeScript library template projects using Lognow.

### Maintenance

- Update LogLayer to 9.3 and refresh transport and filename dependencies.
- Adopt shared-config 8 and TypeScript 6, raise the contributor Node.js requirement to 24.16+, refresh CI, and expand regression coverage.

## [0.6.2] - 2026-05-16

### Fixed

- Accept generically typed LogLayer instances in `injectionHelper()` through `ILogLayer<unknown>`.

### Documentation

- Update contribution guidance, explain shared-config and mdat usage, and correct documentation links.

### Maintenance

- Refresh LogLayer, transport, and configuration-merging dependencies.
- Migrate to pnpm 11 and tsdown's dependency configuration, refresh CI and test tooling, and update cleanup and publishing scripts.

## [0.6.1] - 2026-04-06

### Maintenance

- Install Playwright Chromium in CI, make benchmark scripts terminate after one run, and update shared-config.

## [0.6.0] - 2026-04-02

### Changed

- Reduce logger creation and output overhead through cached terminal width, package names, singleton methods, and optimized formatting.
- Inspect structured entries directly for pretty or colorized JSON console output, preserving original value types without a JSON round trip.
- **Breaking:** Declare Electron 39.7.0 or newer as an optional peer requirement for Electron integration.

### Documentation

- Add direct browser-import examples for jsDelivr and unpkg.

### Maintenance

- Add repeatable performance benchmarks and committed baselines for logger creation, logging, transports, child loggers, and injection.
- Add Linux, macOS, and Windows CI for builds, linting, and tests, and refresh release and repository-metadata workflows.
- Refresh runtime inspection and configuration dependencies, build and test tooling, shared-config, and pnpm.

## [0.5.2] - 2026-02-26

### Fixed

- Ship a self-contained declaration bundle for `lognow/standalone` and include that export in package type validation.

## [0.5.1] - 2026-02-25

### Added

- Provide a bundled, minified browser ESM build through `lognow/standalone`, with jsDelivr and unpkg entry points.

### Fixed

- Include Node.js type definitions required by public stream and inspection type references.

## [0.5.0] - 2026-02-25

### Changed

- **Breaking:** Send default Node.js pretty and JSON console output to `process.stderr` instead of `process.stdout`.
- Distribute runtime libraries as installed dependencies instead of bundling them into the standard builds.
- Lower the declared Node.js minimum from 20.19.0 to 20.17.0 and declare contributor runtime requirements separately.

### Documentation

- Update Node output guidance for stderr and clarify ephemeral metadata, persistent context, and library logger injection.

### Maintenance

- Upgrade LogLayer to 9 and its companion packages, serialize-error to 13, and wrap-ansi to 10; refresh shared-config and contributor tooling.
- Generate bundled declarations with tsdown and validate built packages with Are the Types Wrong? and publint.

## [0.4.1] - 2025-12-23

### Maintenance

- Update LogLayer to 8.4 and refresh bundled transport and object-inspection dependencies.
- Refresh tsdown, Vitest, pnpm, and the development Electron version constraint.

## [0.4.0] - 2025-12-07

### Changed

- Preserve concrete logger types in `getChildLogger()` while adopting LogLayer 8.

### Documentation

- Clarify the distinction between valid JSON logs and reconstructing complex JavaScript values.

### Maintenance

- Refresh bundled transport and serialization dependencies and upgrade read-package-up to 12.
- Refresh build and test tooling and pnpm, and move shared-config hoisting settings into the workspace configuration.

## [0.3.2] - 2025-11-07

### Fixed

- Avoid `url.parse()` deprecation warnings from bundled package discovery by overriding normalize-package-data to 8.x.

### Maintenance

- Refresh shared-config, tsdown, and Vitest and update pnpm build-script approvals.

## [0.3.1] - 2025-11-05

### Maintenance

- Standardize Node and Electron main-process bundle filenames on `.js` and update their package exports.
- Update the bundled filenamify dependency to 7.0.1.

## [0.3.0] - 2025-11-04

### Added

- Support `~` home-directory expansion in log directories and configured log filenames.
- Expose `getJsonFileTransportDestinations()` to list active JSON log files after logging starts.

### Maintenance

- Refresh shared-config and Vitest, upgrade tsdown to 0.16, and align package exports with its Node and Electron build output.

## [0.2.2] - 2025-11-04

### Maintenance

- Update shared-config to 5.8 and remove the obsolete Puppeteer build approval.

## [0.2.1] - 2025-11-03

### Fixed

- Ship LogLayer as a production dependency so consumers can resolve the package's public LogLayer type references.

### Documentation

- Make the library logger-injection example accept an omitted logger argument.

## [0.2.0] - 2025-11-03

### Added

- Accept partial console and file transport configurations and export their config types, exposing JSON formatting options and controls for pretty-output time, level, and name prefixes.
- Accept `createLogger('name')` as shorthand for creating a named logger.
- Respect `NO_COLOR`, `FORCE_COLOR`, and `DEBUG` environment variables, with `FORCE_COLOR` taking precedence over `NO_COLOR`.

### Changed

- Deep-merge logger and singleton options so partial transport settings retain their defaults.

### Fixed

- Remove unsolicited diagnostic console output from the Electron preload.

### Documentation

- Correct npm installation guidance and clarify console, JSONL file, transport configuration, and environment-variable options.
- Expand quick-start examples and guides for log levels, errors, context versus metadata, multiple messages, custom directories, dual output, and library injection.

### Maintenance

- Upgrade LogLayer to 7.1 and refresh transport dependencies, add configuration merging with defu, and relax the development Electron version constraint.
- Generate TypeScript declarations with `tsc` separately from JavaScript bundling.
- Add Node and Chromium Vitest suites, suppress successful-test output, and work around a crashing TypeScript ESLint rule.
- Rename the internal Electron IPC channel to `lognow-electron-channel`.

## [0.1.0] - 2025-10-31

### Added

- Provide a LogLayer-based ESM library for Node.js 20.19+ and browsers, with the default `log` singleton, `createLogger()`, `setDefaultLogOptions()`, exported types, and `LogLayerModule`.
- Provide colored, timestamped console and stream logging with six log levels, verbose filtering, metadata, persistent context, object inspection, and error formatting.
- Support structured JSON console output and daily rotating JSONL files in platform-standard or custom directories, with separate message, context, metadata, and error fields.
- Support named child loggers through `getChildLogger()` and the exported `HierarchicalContextManager`, preserving ancestor names and inherited context.
- Provide `injectionHelper()` for existing LogLayer instances, console-like targets, and writable streams; passing `undefined` returns a silent mock logger.
- Support Electron through `lognow/electron` and `lognow/electron/preload`, forwarding serialized renderer logs into main-process logging.

### Documentation

- Add npm installation instructions and guides for configuration, file logging, Electron integration, and logger injection in libraries.

### Maintenance

- Establish TypeScript builds, shared lint configuration, npm publishing, and GitHub release automation.

[0.1.0]: https://github.com/kitschpatrol/lognow/releases/tag/v0.1.0
[0.2.0]: https://github.com/kitschpatrol/lognow/compare/v0.1.0...v0.2.0
[0.2.1]: https://github.com/kitschpatrol/lognow/compare/v0.2.0...v0.2.1
[0.2.2]: https://github.com/kitschpatrol/lognow/compare/v0.2.1...v0.2.2
[0.3.0]: https://github.com/kitschpatrol/lognow/compare/v0.2.2...v0.3.0
[0.3.1]: https://github.com/kitschpatrol/lognow/compare/v0.3.0...v0.3.1
[0.3.2]: https://github.com/kitschpatrol/lognow/compare/v0.3.1...v0.3.2
[0.4.0]: https://github.com/kitschpatrol/lognow/compare/v0.3.2...v0.4.0
[0.4.1]: https://github.com/kitschpatrol/lognow/compare/v0.4.0...v0.4.1
[0.5.0]: https://github.com/kitschpatrol/lognow/compare/v0.4.1...v0.5.0
[0.5.1]: https://github.com/kitschpatrol/lognow/compare/v0.5.0...v0.5.1
[0.5.2]: https://github.com/kitschpatrol/lognow/compare/v0.5.1...v0.5.2
[0.6.0]: https://github.com/kitschpatrol/lognow/compare/v0.5.2...v0.6.0
[0.6.1]: https://github.com/kitschpatrol/lognow/compare/v0.6.0...v0.6.1
[0.6.2]: https://github.com/kitschpatrol/lognow/compare/v0.6.1...v0.6.2
[0.7.0]: https://github.com/kitschpatrol/lognow/compare/v0.6.2...v0.7.0
[0.7.1]: https://github.com/kitschpatrol/lognow/compare/v0.7.0...v0.7.1
[0.8.0]: https://github.com/kitschpatrol/lognow/compare/v0.7.1...v0.8.0
[0.8.1]: https://github.com/kitschpatrol/lognow/compare/v0.8.0...v0.8.1
[0.8.2]: https://github.com/kitschpatrol/lognow/compare/v0.8.1...v0.8.2
[0.8.3]: https://github.com/kitschpatrol/lognow/compare/v0.8.2...v0.8.3
[0.8.4]: https://github.com/kitschpatrol/lognow/compare/v0.8.3...v0.8.4
[0.8.5]: https://github.com/kitschpatrol/lognow/compare/v0.8.4...v0.8.5
[0.8.6]: https://github.com/kitschpatrol/lognow/compare/v0.8.5...v0.8.6
[0.8.7]: https://github.com/kitschpatrol/lognow/compare/v0.8.6...v0.8.7
[0.8.8]: https://github.com/kitschpatrol/lognow/compare/v0.8.7...v0.8.8

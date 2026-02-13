> THIS IS A PUBLIC FORK, do not put anything related to other excalidraw projects here

# Excalidraw Monorepo

This is a monorepo containing the Excalidraw npm packages and example applications. This repository uses Yarn Workspaces for dependency management.

## Repository Structure

This monorepo is organized into the following packages:

### Core Packages (in `packages/`)

- **`@excalidraw/common`** - Shared utilities and constants used across all packages
- **`@excalidraw/math`** - Mathematical utilities for canvas operations and geometry
- **`@excalidraw/element`** - Core element types and element manipulation logic
- **`@excalidraw/excalidraw`** - Main Excalidraw React component and editor

### Applications

- **`app/`** - The standalone Excalidraw web application (hosted at excalidraw.com)
- **`examples/`** - Example integrations and usage demonstrations

### Package Dependencies

The packages have the following dependency hierarchy:

```
excalidraw (main package)
├── element
│   ├── math
│   └── common
└── common
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- Yarn 1.22.22 (managed via packageManager field)

### Setup

```bash
# Install dependencies
yarn install
```

### Regular development flow

In order to test new Excalidraw functionality, you will usually execute:

```bash
# Always run this before running start example
yarn rm:build

# Builds the packages and starts the example app
yarn start:example
```

Now that you've tested the new functionality, you might want to test it integrated directly with the app, to do that we're using yarn link to link the package and use our local build.

```bash
    yarn rm:build
    yarn build:packages

    # On this project
    cd ./packages/excalidraw && yarn link

    # On the other project you want to use it
    yarn link @excalidraw/excalidraw
```

To unlink and get back to using the registry build

```bash
    yarn unlink @excalidraw/excalidraw
    yarn install --force
```

Have you being satisfied with you code changes you might want to publish it on the registry, check out the release section on this doc.

### Available Scripts

#### Building

- `yarn build:packages` - Build all core packages in dependency order
- `yarn build:common` - Build @excalidraw/common
- `yarn build:math` - Build @excalidraw/math
- `yarn build:element` - Build @excalidraw/element
- `yarn build:excalidraw` - Build @excalidraw/excalidraw
- `yarn build:app` - Build the standalone Excalidraw application
- `yarn build` - Build everything (packages + app)

#### Development

- `yarn start` - Start the development server for the Excalidraw app (Not working, use start:example to test)
- `yarn start:example` - Build packages and start the example application

#### Testing

- `yarn test` - Run tests with Vitest
- `yarn test:all` - Run all tests (type checking, linting, unit tests)
- `yarn test:typecheck` - Run TypeScript type checking
- `yarn test:code` - Run ESLint
- `yarn test:coverage` - Generate test coverage report
- `yarn test:ui` - Open Vitest UI with coverage

#### Code Quality

- `yarn fix` - Auto-fix formatting and linting issues
- `yarn fix:code` - Auto-fix ESLint issues
- `yarn fix:other` - Auto-fix Prettier formatting

#### Cleaning

- `yarn rm:build` - Remove all build artifacts
- `yarn rm:node_modules` - Remove all node_modules
- `yarn clean-install` - Clean node_modules and reinstall

## Deployment & Publishing

### Package Release Process

The repository includes an automated release script that handles versioning, building, and publishing all packages to npm. You should not be releasing versions manually generally, here's how it works:

#### Releasing test version

Just throw your changes at staging, it will generate a test version based on your commits, it uses [semantic versioning](https://semver.org/) with [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) to determine how will the next version be computed.

It will generate a new version based of the current version on package.json, and it will append -test-<commit sha> to that version. you should be able to easily grab that and throw in your application.

#### Releasing Definitive version

Once you want to produce a new official version, merge it on production branch from master branch (please DON'T SQUASH) and it should read all commits to produce the new official version.

#### Release Commands

```bash
# Test release (default) - publishes with "test" tag and commit hash suffix
yarn release

# Next release - publishes with "next" tag and commit hash suffix
yarn release:next

# Latest stable release - requires version number
yarn release:latest --version=X.Y.Z
```

#### Detailed Release Usage

The release script (`scripts/release.js`) supports the following options:

**Test Release** (for development/testing):

```bash
yarn release
# or explicitly
yarn release --tag=test
```

- Publishes with `test` tag
- Version: `current-version-[commit-hash]`
- Use case: Testing package changes before official release

**Next Release** (for pre-release versions):

```bash
yarn release:next

# On CI/CD (skip interactive prompts)
yarn release --tag=next --non-interactive
```

- Publishes with `next` tag
- Version: `current-version-[commit-hash]`
- Use case: Beta/alpha releases, early access features

**Latest Release** (for stable versions):

```bash
yarn release:latest --version=0.19.0
```

- Publishes with `latest` tag
- Version: Must be explicitly specified
- Updates CHANGELOG.md automatically
- Prompts for git commit creation
- Use case: Official stable releases

#### What the Release Script Does

1. **Builds all packages** - Removes old build artifacts and builds fresh
2. **Updates versions** - Sets the same version across all packages and their internal dependencies
3. **Updates changelog** - (latest releases only) Automatically generates changelog entries
4. **Commits changes** - (latest releases only, optional) Creates a git commit with the changes
5. **Publishes to npm** - Publishes all packages with the specified tag

#### Release Options

- `--tag=<tag>` - `test` (default), `next`, or `latest`
- `--version=<version>` - Optional for test/next, required for latest (e.g., `0.19.0`)
- `--non-interactive` - Skip interactive prompts (useful for CI/CD)
- `--help` - Display help information

#### Interactive vs Non-Interactive Mode

By default, the release script runs in interactive mode and will prompt you to:

- Commit changes to git (latest releases only)
- Publish packages to npm

For CI/CD pipelines, use `--non-interactive` to automatically publish without prompts.

### Application Deployment

The `app` can be built for production:

```bash
# Build the app
yarn build:app

# Build for preview environments
yarn build:preview

# Build with Docker
yarn build:app:docker
```

## Package Structure

Each package in `packages/` follows this structure:

```
packages/
├── common/
│   ├── src/           # TypeScript source files
│   ├── dist/          # Compiled output (gitignored)
│   ├── package.json
│   └── tsconfig.json
├── math/
├── element/
└── excalidraw/
```

## Working with Packages

### Making Changes

1. Make your changes in the relevant package(s)
2. Run `yarn test:all` to ensure all tests pass
3. Build packages: `yarn build:packages`
4. Test in the example app: `yarn start:example`

### Publishing Changes

After merging changes to main:

```bash
# For stable release
yarn release:latest --version=0.20.0

# For pre-release
yarn release:next
```

The script will guide you through committing and publishing.

## Continuous Integration

The repository uses the following CI checks:

- Type checking (`yarn test:typecheck`)
- Linting (`yarn test:code`)
- Unit tests (`yarn test:app`)
- Code formatting (`yarn test:other`)

All checks must pass before merging.

## Notes

- All packages are published under the `@excalidraw` scope
- Packages maintain synchronized versions during releases
- The release script ensures consistent versioning across all internal dependencies
- Changes to any package require rebuilding dependent packages

# Copilot Instructions for QIST Platform

## Architecture Overview

This is a **self-contained serverless full-stack project** built on Juno, which runs on the Internet Computer Protocol (ICP).

- **Frontend**: Next.js 16 (App Router) with React 19, TypeScript, and Tailwind CSS 4
- **Backend**: Rust-based "Satellite" (`src/satellite/`) - a WebAssembly canister providing serverless functions, datastore, storage, and authentication
- **Platform**: Juno abstracts blockchain complexity, offering a complete serverless environment without DevOps or backend boilerplate

**Key concepts**:
- The Satellite is your entire backend bundled as a single WASM artifact that runs fully on-chain
- Everything (code, data, storage) runs under your ownership - Juno has zero access to your infrastructure
- One project = one repo = one container (monolithic deployment model)
- The Next.js frontend communicates with the Satellite via `@junobuild/core`

## Critical Workflows

### Development
```bash
npm run dev              # Start Next.js with Turbopack
juno emulator start      # Run local emulator (Skylab) with full production-like stack
```

The emulator provides:
- Full local development environment mirroring production
- Console UI at `http://localhost:5866/` for managing Satellites and testing features
- Support for authentication (Internet Identity), datastore, storage, and serverless functions
- Requires Docker or Podman to run

**Recommended workflow**: Run emulator in one terminal, `npm run dev` in another.

### Build & Deploy
```bash
npm run build            # Builds to `out/` directory (static export only - no SSR)
juno hosting deploy      # Deploy to production Satellite (runs predeploy: npm run build)
```

### Serverless Functions
```bash
juno functions eject     # Initialize project for writing serverless functions
juno functions build     # Compile Satellite code (auto-redeployed locally)
juno functions upgrade   # Upgrade serverless functions in production
```

### Post-install Hook
The `postinstall` script (`postinstall:copy-auth`) copies authentication workers from `@junobuild/core` to `public/workers/` - **critical for auth to work**. Never delete `public/workers/auth.worker.js` manually.

## Project-Specific Patterns

### 1. Satellite Initialization (Frontend)
All pages using Juno features **must** call `initSatellite()` in a `useEffect` hook:

```tsx
import { initSatellite } from "@junobuild/core";

useEffect(() => {
  (async () => await initSatellite({ workers: { auth: true } }))();
}, []);
```

See `src/app/page.tsx` for the canonical example. This initializes connection to your Satellite canister.

### 2. Datastore Operations
Juno provides a NoSQL-like datastore with collections. Common operations:

```tsx
import { setDoc, getDoc, listDocs, deleteDoc } from "@junobuild/core";

// Create/Update document (requires version for updates)
await setDoc({
  collection: "my_collection",
  doc: {
    key: "doc_id",
    data: { name: "Example" },
    version: 3n // Optional for updates, validates latest entry
  }
});

// Read document
const doc = await getDoc({ collection: "my_collection", key: "doc_id" });

// List documents with filtering/pagination
const list = await listDocs({
  collection: "my_collection",
  filter: {
    matcher: { description: "searchTerm" },
    paginate: { limit: 10 }
  }
});
```

### 3. Rust Satellite Hooks
The Satellite (`src/satellite/src/lib.rs`) uses Juno macros for lifecycle hooks:
- `#[on_set_doc]`, `#[on_delete_doc]` - database operations
- `#[on_upload_asset]`, `#[on_delete_asset]` - file storage
- `#[assert_set_doc]`, `#[assert_upload_asset]` - authorization checks

**Important**: All hooks are scaffolded by default. To reduce bundle size, disable default features in `src/satellite/Cargo.toml`:
```toml
junobuild-satellite = { version = "0.3.1", default-features = false, features = ["on_set_doc"] }
```

Must include `include_satellite!();` at the end of `lib.rs` for Console/CLI compatibility.

### 4. Component Styling Convention
Components use Tailwind with a specific neuomorphic design system:
- Border: `border-[3px] border-black`
- Shadow: `shadow-[8px_8px_0px_rgba(0,0,0,1)]`
- Dark mode: `dark:shadow-[8px_8px_0px_#7888FF]`
- Custom palette: `lavender-blue-*` colors (50-900 shades in `src/app/globals.css`)
- Active state: `active:translate-x-[8px] active:translate-y-[8px] active:shadow-none`

See `src/components/article.tsx` for the standard pattern.

### 5. Import Aliases
Use `@/*` for absolute imports from `src/`:
```tsx
import { Article } from "@/components/article";
```

Configured in `tsconfig.json` paths.

## Integration Points

- **Juno Configuration**: `juno.config.mjs` defines Satellite IDs for dev/prod environments
- **Next.js Plugin**: `next.config.mjs` wraps config with `withJuno()` to enable Juno features
- **Candid Interface**: `src/satellite/satellite.did` defines the WebAssembly contract interface (auto-generated)
- **Workspace**: Root `Cargo.toml` manages Rust workspace with Satellite as a member

## Common Gotchas

1. **Satellite changes require rebuild**: After modifying `src/satellite/src/lib.rs`, run `juno functions build` locally or `juno functions upgrade` for production
2. **Static export only**: Next.js is configured for static generation (`out/` directory) - SSR is not supported by Juno
3. **Authentication workers**: Don't modify `public/workers/` manually - it's auto-generated by `postinstall` script
4. **Tailwind v4**: Uses the new `@theme` directive in CSS (`@import "tailwindcss"`) instead of `tailwind.config.js`
5. **Document versioning**: Always include `version` field when updating documents with `setDoc()` to prevent concurrent modification conflicts
6. **Emulator requires Docker/Podman**: The local development environment runs in a container - ensure Docker Desktop 4.25.0+ (M-series Mac) or Podman is installed

## Authentication Patterns

Juno supports multiple authentication methods:
- **Internet Identity**: Decentralized ICP authentication (domain-scoped)
- **Passkeys**: WebAuthn-based (domain-scoped, uses device biometrics)
- **Google Sign-In**: OpenID Connect provider (not domain-scoped)

```tsx
import { signIn, signOut } from "@junobuild/core";

// Internet Identity
await signIn({ internet_identity: {} });

// Passkeys (requires sign-up first)
await signUp({ webauthn: {} });
await signIn({ webauthn: {} });

// Sign out
await signOut();
```

**Domain scoping**: Internet Identity and Passkeys create separate identities per domain unless you configure a `derivationOrigin` in the Console and frontend code.

# @chefready/legal

Shared legal content (Privacy Policy, Terms & Conditions) for all Chef Ready surfaces — used by:

- `chefready_user_web` (chefreadyapp.com)
- `chefready_web` (chefreadycreator.com)
- `chefready_dashboard` (dashboard.chefreadycreator.com)

The Flutter mobile app links to `chefreadyapp.com/privacy-policy` and `/terms-and-conditions` rather than consuming this package directly.

## Source of truth

Canonical content lives in [`content/`](content):

- `privacy-policy.md`
- `terms-and-conditions.md`

Edits should be made to these `.md` files directly. The original `.docx` files in [`docs/legal/`](docs/legal) are kept for historical reference only — they are **not** the source of truth anymore.

Cross-references between the two documents use root-relative URLs (`/privacy-policy`, `/terms-and-conditions`) so that, when rendered on any consuming site, links navigate within the *current* domain.

## Usage (consumers)

```ts
import {
  privacyPolicy,
  termsAndConditions,
  privacyPolicyLastUpdated,
  termsLastUpdated,
} from '@chefready/legal'
```

Both `privacyPolicy` and `termsAndConditions` are plain markdown strings. Render with [`react-markdown`](https://github.com/remarkjs/react-markdown) plus a custom `a` component that routes relative links through your router's `<Link>` (so cross-doc links stay SPA navigations on the current domain).

## Workflow

### Update the policy text

1. Edit the relevant file in `content/`.
2. Bump `version` in `package.json` (`npm version patch|minor|major`).
3. Commit and push; tag the version.
4. In each consuming repo, bump the dependency reference and redeploy.

### Re-converting from a new .docx (rarely needed)

If legal sends a new `.docx`, drop it into `docs/legal/` then:

```bash
npm run convert
```

The conversion script (`scripts/convert-docx.mjs`) shells out to [`pandoc`](https://pandoc.org) — you must have it installed on your machine (`brew install pandoc` on macOS). Pandoc's docx reader preserves the list-marker styles from the source (`a)`, `b)`, `c)` for lowerLetter; `i)`, `ii)`, `iii)` for lowerRoman; `1.` for decimal) and converts tables to GFM pipe tables, which is why it's the right tool for these legal docs.

After conversion, hand-clean the output:

- Prepend the document title (`# Privacy Policy ...` / `# Terms of Use`) and `_Last updated: YYYY-MM-DD_`.
- Demote section headings (the script's sed step does this in bulk, but verify): `## N.` for numbered sections, `### N.N` for sub-sections.
- Promote any inline-bold "13.1 ..." style sub-headings to proper `### 13.1 ...` headings.
- Re-apply the cross-reference links between the two documents (`/privacy-policy` ↔ `/terms-and-conditions`).
- Remove any `<span class="mark">[...]</span>` author annotations.

### Build

```bash
npm install
npm run build
```

Produces `dist/index.{js,cjs,d.ts}` with the markdown content inlined as string literals (esbuild's `text` loader). Consumers don't need any special bundler config to import.

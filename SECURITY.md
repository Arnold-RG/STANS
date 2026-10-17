# Security Policy

## Supported versions

Security updates apply to the latest commit on the default branch of this repository.

Live desk: https://arnold-rg.github.io/STANS/

## Reporting a vulnerability

Email **rurangwaarnold32@gmail.com** with:

- Repository name and affected URL/path
- Description and impact
- Steps to reproduce (proof of concept if available)

Please do **not** open a public issue for unpatched vulnerabilities.

We aim to acknowledge reports within 7 days and publish a fix or mitigation when confirmed.

## Accepted risk: braces (GHSA-vfj7-8cjw-p6xm)

`braces` through 3.0.3 can overflow the Node process on a deeply nested pattern. Upstream has not published a patched release. Tailwind CSS 3 is the only package here that depends on it, through `chokidar` and `micromatch`, and it uses those calls to expand this repo's own content globs at build time. `braces` is not a production dependency and it is not in `dist` or the runtime image.

The security workflow blocks on production dependencies:

```bash
npm audit --omit=dev --audit-level=high
```

A full audit, including this finding, is uploaded and does not fail the job. Remove this exception when Tailwind 4, or an upstream `braces` release, drops it. That work is tracked in https://github.com/Arnold-RG/STANS/issues/10.

## Practice

- No secrets in source; use `.env.example` only
- Prefer `textContent` over `innerHTML` for untrusted data
- External links use `rel="noopener noreferrer"`
- CSP meta in `index.html`; free public APIs only (Nominatim, OSRM, Overpass, Open-Meteo)
- Dependabot / Actions least privilege where applicable

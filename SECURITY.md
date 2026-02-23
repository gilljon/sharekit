# Security Policy

## Reporting a Vulnerability

The @sharekit SDK handles authentication tokens and privacy-sensitive data filtering. We take security seriously.

**Do not open a public issue for security vulnerabilities.**

Instead, please email **gilljon212@gmail.com** with:

- A description of the vulnerability
- Steps to reproduce
- Which package(s) are affected
- The potential impact

We will acknowledge receipt within 48 hours and aim to provide a fix or mitigation within 7 days for critical issues.

## Scope

Security issues we care about:

- **Token predictability or collision** -- weaknesses in share token generation
- **Privacy bypass** -- server-side data filtering can be circumvented, exposing hidden fields
- **Authentication bypass** -- auth adapters returning incorrect user identity
- **Injection attacks** -- malicious input via share params, field names, or tokens

## Supported Versions

We provide security fixes for the latest minor version of each package. Older versions may receive patches for critical vulnerabilities at our discretion.

## Responsible Disclosure

We follow responsible disclosure practices. If you report a vulnerability, we will:

1. Confirm the issue and determine its impact
2. Develop and test a fix
3. Release the fix and publish a security advisory
4. Credit you in the advisory (unless you prefer to remain anonymous)

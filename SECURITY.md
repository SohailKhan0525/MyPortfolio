# Security Policy

## Supported project

Security fixes are handled for the current `main` branch and the latest deployed version of the portfolio.

## Reporting a vulnerability

Please do **not** publish credentials, tokens, private information, or an exploitable proof of concept in a public issue.

For a security-sensitive report, contact the maintainer through the private contact method listed on the maintainer's GitHub profile and include:

- a short description of the issue;
- affected file or route;
- reproduction steps;
- potential impact;
- a suggested fix, if known.

Please allow reasonable time for investigation and remediation before public disclosure.

## Secret hygiene

Do not commit API keys, access tokens, passwords, `.env` files, deployment credentials, or private user data. If a secret is accidentally committed, revoke or rotate it immediately and then remove it from the repository history.

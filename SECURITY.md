# Security

## Reporting a vulnerability

Please do not open a public issue. Report it privately through
[GitHub security advisories](https://github.com/oddurs/rockaway/security/advisories/new)
(the repository's **Security** tab, **Report a vulnerability**). Only the
maintainers can see the report.

Say which package and version is affected, what an attacker could do, and the
smallest code that shows it. You should hear back within a week. A fix, and an
advisory crediting you if you would like that, follow as soon as the fix ships.

## What is in scope

rockaway is a design system: an integer geometry engine, tokens, CSS and React
components. Nothing in it runs on a server of ours or handles credentials.
Here is what could still go wrong:

- **Injection through rendered text.** A component that puts a caller's text
  into the page anywhere but a text node, or a painter that lets a string
  become markup.
- **The token and theme pipeline.** An imported terminal theme or theme file
  that executes code, or reaches outside the package, when it is generated.
- **Dependencies.** A vulnerable version of a dependency the packages ship
  with. Dependabot watches these, but a report is still welcome.

## Supported versions

Before the first release, fixes land on `main` only. After it, and until 1.0,
only the latest 0.x release receives fixes.

# Code Quality
- No `any` (use `unknown` + narrowing); no `!` without a reason.
- Functions ≤ 40 lines, ≤ 4 params; files ≤ 300 lines; early returns.
- Intent-revealing names; booleans `is/has/can`.
- No magic numbers/strings: use constants/enums in `common/`.
- No dead/commented-out code, no `console.log` (use Nest `Logger`), no TODOs without a TASKS.md entry.
- No empty `catch`; no floating promises; `async/await` only.
- Prefer `readonly`/`const`; comments explain WHY.
- Run `npm run lint -- --fix` before finishing.

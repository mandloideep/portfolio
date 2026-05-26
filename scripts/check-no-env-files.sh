#!/usr/bin/env bash
# Pre-commit guard: reject any staged file that looks like a real env file.
# `.env.example` is allowed; everything else (.env, .env.development,
# .env.production, .env.local, .env.*.local) is rejected.
#
# Belt-and-suspenders to .gitignore — protects against `git add -f` mistakes.

set -e

bad=$(git diff --cached --name-only --diff-filter=ACM \
  | grep -E '(^|/)\.env(\..*)?$' \
  | grep -vE '(^|/)\.env\.example$' \
  || true)

if [ -n "$bad" ]; then
  echo "ERROR: refused to commit env file(s):" >&2
  echo "$bad" | sed 's/^/  /' >&2
  echo "" >&2
  echo "If you really need to commit one, use \`git commit --no-verify\` (and double-check secrets first)." >&2
  exit 1
fi

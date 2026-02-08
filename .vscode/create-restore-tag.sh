#!/usr/bin/env sh
set -e

# Commit and push current work (if any)
STAMP=$(date +%Y-%m-%d-%H%M%S)
MSG="chore: checkpoint $STAMP"

if git status --porcelain | grep -q .; then
  git add -A
  git commit -m "$MSG"
  git push origin HEAD
  printf 'Committed and pushed: %s\n' "$MSG"
else
  printf 'No changes to commit; proceeding to tag current HEAD.\n'
fi

# Create and push restore tag
TAG=restore-$STAMP
git tag -a "$TAG" -m 'Restore point after commit or existing HEAD'
git push origin "$TAG"
printf 'Created and pushed tag %s\n' "$TAG"

#!/bin/bash
# Usage: ./deploy.sh "your commit message"
# If no message provided, uses a default timestamp message

MSG="${1:-"Update: $(date '+%Y-%m-%d %H:%M')"}"

cd "$(dirname "$0")"

git add .
git commit -m "$MSG"
git push

echo ""
echo "Deployed! GitHub Pages will update in ~2 minutes."
echo "https://levixliang222.github.io/Timebit/"

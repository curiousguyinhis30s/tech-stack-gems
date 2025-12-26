#!/bin/bash
# Quick ntfy.sh notification helper
# Usage: ./notify.sh "message" [title] [priority]
#
# Examples:
#   ./notify.sh "Build complete"
#   ./notify.sh "Deploy failed!" "Alert" "urgent"
#   echo "Hello" | ./notify.sh

NTFY_TOPIC="${NTFY_TOPIC:-your-topic}"

MESSAGE=$1
TITLE=${2:-"Notification"}
PRIORITY=${3:-"default"}

# Read from stdin if no message provided
if [ -z "$MESSAGE" ]; then
  MESSAGE=$(cat)
fi

curl -s \
  -d "$MESSAGE" \
  -H "Title: $TITLE" \
  -H "Priority: $PRIORITY" \
  "https://ntfy.sh/$NTFY_TOPIC"

echo "Sent to ntfy.sh/$NTFY_TOPIC"

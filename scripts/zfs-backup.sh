#!/bin/bash
# ZFS Snapshot Manager
# Usage: ./zfs-backup.sh <action> [dataset] [name]
#
# Actions:
#   snap   - Create snapshot
#   list   - List snapshots
#   roll   - Rollback to snapshot
#   clean  - Remove old snapshots

NTFY_TOPIC="server-alerts"
DEFAULT_DATASET="apps/www"

action=$1
dataset=${2:-$DEFAULT_DATASET}
name=$3

notify() {
  curl -s -d "$1" "https://ntfy.sh/$NTFY_TOPIC" > /dev/null 2>&1 || true
}

case $action in
  snap|snapshot)
    SNAP_NAME="${name:-$(date +%Y%m%d-%H%M%S)}"
    zfs snapshot "$dataset@$SNAP_NAME"
    echo "✅ Created snapshot: $dataset@$SNAP_NAME"
    notify "📸 Snapshot created: $dataset@$SNAP_NAME"
    ;;

  list)
    echo "Snapshots for $dataset:"
    zfs list -t snapshot -o name,creation,used -s creation | grep "^$dataset@"
    ;;

  roll|rollback)
    if [ -z "$name" ]; then
      echo "Usage: ./zfs-backup.sh rollback <dataset> <snapshot-name>"
      exit 1
    fi
    echo "⚠️  Rolling back $dataset to @$name..."
    echo "This will destroy all changes after this snapshot!"
    read -p "Continue? (y/N) " confirm
    if [ "$confirm" = "y" ]; then
      zfs rollback -r "$dataset@$name"
      echo "✅ Rolled back to $dataset@$name"
      notify "⏪ Rolled back $dataset to @$name"
    fi
    ;;

  clean)
    KEEP=${name:-5}
    echo "Keeping last $KEEP snapshots of $dataset"
    SNAPS=$(zfs list -t snapshot -o name -s creation | grep "^$dataset@" | head -n -$KEEP)
    for snap in $SNAPS; do
      echo "Removing $snap..."
      zfs destroy "$snap"
    done
    echo "✅ Cleanup complete"
    ;;

  *)
    echo "ZFS Snapshot Manager"
    echo ""
    echo "Usage: ./zfs-backup.sh <action> [dataset] [name]"
    echo ""
    echo "Actions:"
    echo "  snap [dataset] [name]  - Create snapshot (default: timestamp)"
    echo "  list [dataset]         - List all snapshots"
    echo "  roll <dataset> <name>  - Rollback to snapshot"
    echo "  clean [dataset] [keep] - Remove old snapshots (keep N, default: 5)"
    echo ""
    echo "Examples:"
    echo "  ./zfs-backup.sh snap                    # Snapshot apps/www"
    echo "  ./zfs-backup.sh snap apps/db pre-update # Named snapshot"
    echo "  ./zfs-backup.sh list                    # List snapshots"
    echo "  ./zfs-backup.sh roll apps/www pre-update # Rollback"
    ;;
esac

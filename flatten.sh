#!/bin/bash
# flatten.sh - Bash script to flatten directory structure for Linux
# Function to print usage info usage() {
echo "Usage: $0 [root_directory] [file_extension]"
echo " root_directory: Directory containing 'src' folder (default: current directory)" echo " file_extension: File extension to match (default: .js)"
exit 1
}
# Set default values ROOT_DIR="${1:-.}" FILE_EXT="${2:-.js}"
# Create paths SRC_DIR="$ROOT_DIR/src" FLAT_DIR="$ROOT_DIR/flat"
# Check if source directory exists if [ ! -d "$SRC_DIR" ]; then
echo "Error: Source directory $SRC_DIR does not exist."
exit 1 fi
# Create flat directory if it doesn't exist if [ ! -d "$FLAT_DIR" ]; then
mkdir -p "$FLAT_DIR"
echo "Created directory: $FLAT_DIR" fi
# Counter for files processed TOTAL_FILES=0
# Find all matching files and copy them
find "$SRC_DIR" -type f -name "*$FILE_EXT" | while read -r SRC_FILE; do
# Get the relative path from src_dir
REL_PATH=$(realpath --relative-to="$SRC_DIR" "$(dirname "$SRC_FILE")") FILENAME=$(basename "$SRC_FILE")
# Create new filename
if [ "$REL_PATH" = "." ]; then
# File is directly in src directory
NEW_FILENAME="$FILENAME" else
# File is in a subdirectory
# Replace path separators with '--' PATH_PART=$(echo "$REL_PATH" | sed 's/\//--/g') NEW_FILENAME="src--${PATH_PART}--${FILENAME}"
fi
# Destination path DST_FILE="$FLAT_DIR/$NEW_FILENAME"
# Copy the file
cp "$SRC_FILE" "$DST_FILE"
echo "Copied: $SRC_FILE -> $DST_FILE"
TOTAL_FILES=$((TOTAL_FILES + 1)) done
echo ""
echo "Done! Flattened $TOTAL_FILES $FILE_EXT files to $FLAT_DIR"
#!/bin/bash
# Build vendors.js from individual vendor libraries
# This script concatenates the vendor libraries in the correct order

set -e  # Exit on any error

echo "Building src/js/vendors.js..."

# Check if vendor files exist
VENDOR_FILES=(
  "src/js/vendor/jquery-3.7.1.min.js"
  "src/js/vendor/jquery.velocity.min.js"
  "src/js/vendor/backbone.localstorage.min.js"
  "src/js/vendor/backbone-polling.min.js"
)

for file in "${VENDOR_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Error: Required vendor file not found: $file"
    exit 1
  fi
done

# Remove existing vendors.js
rm -f src/js/vendors.js

# Concatenate all vendor files in order
cat src/js/vendor/jquery-3.7.1.min.js >> src/js/vendors.js
echo "" >> src/js/vendors.js

cat src/js/vendor/jquery.velocity.min.js >> src/js/vendors.js
echo "" >> src/js/vendors.js

cat src/js/vendor/backbone.localstorage.min.js >> src/js/vendors.js
echo "" >> src/js/vendors.js

cat src/js/vendor/backbone-polling.min.js >> src/js/vendors.js
echo "" >> src/js/vendors.js

echo "vendors.js built successfully!"
echo "Total size: $(wc -c < src/js/vendors.js) bytes"
echo "Total lines: $(wc -l < src/js/vendors.js) lines"

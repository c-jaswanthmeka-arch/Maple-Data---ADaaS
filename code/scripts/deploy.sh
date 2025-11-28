#!/usr/bin/env bash

# Check if slug is provided
if [ -z "$1" ]; then
  echo "Error: Package slug is required"
  echo "Usage: $0 <package-slug>"
  exit 1
fi

PACKAGE_SLUG="$1"

echo "Creating Snap-in package with slug: $PACKAGE_SLUG..."

# First, check if package already exists
PACKAGE_LIST=$(devrev snap_in_package list 2>&1)
# Parse newline-delimited JSON and find package by slug
EXISTING_PACKAGE=$(echo "$PACKAGE_LIST" | grep -v "^Error" | jq -s -r ".[]? | select(.slug == \"$PACKAGE_SLUG\") | .id" 2>/dev/null | head -1)

if [ -n "$EXISTING_PACKAGE" ] && [ "$EXISTING_PACKAGE" != "null" ]; then
  echo "Using existing package: $EXISTING_PACKAGE"
  PACKAGE_ID="$EXISTING_PACKAGE"
else
  echo "Creating new Snap-in package..."
  PACKAGE_OUTPUT=$(devrev snap_in_package create-one --slug "$PACKAGE_SLUG" 2>&1)
  PACKAGE_ID=$(echo "$PACKAGE_OUTPUT" | jq -r '.snap_in_package.id' 2>/dev/null)
  
  # If package creation failed due to conflict (already exists), try to find it
  if [ -z "$PACKAGE_ID" ] || [ "$PACKAGE_ID" == "null" ]; then
    ERROR_MSG=$(echo "$PACKAGE_OUTPUT" | jq -r '.message' 2>/dev/null)
    if [[ "$ERROR_MSG" == *"Conflict"* ]] || [[ "$ERROR_MSG" == *"AlreadyExists"* ]]; then
      echo "Package already exists, fetching it..."
      # Try to get the package by slug from the list
      PACKAGE_LIST=$(devrev snap_in_package list 2>&1)
      EXISTING_PACKAGE=$(echo "$PACKAGE_LIST" | grep -v "^Error" | jq -s -r ".[]? | select(.slug == \"$PACKAGE_SLUG\") | .id" 2>/dev/null | head -1)
      if [ -n "$EXISTING_PACKAGE" ] && [ "$EXISTING_PACKAGE" != "null" ]; then
        PACKAGE_ID="$EXISTING_PACKAGE"
        echo "Using existing package: $PACKAGE_ID"
      else
        echo "Error: Package exists but could not be retrieved. Output: $PACKAGE_OUTPUT"
        exit 1
      fi
    else
      echo "Error: Failed to create package. Output: $PACKAGE_OUTPUT"
      exit 1
    fi
  else
    echo "Created package: $PACKAGE_ID"
  fi
fi

echo "Creating Snap-in version with package: $PACKAGE_ID..."

# Check if there's an existing non-published/non-ready version and delete it
echo "Checking for existing non-published versions..."
VERSIONS_LIST=$(devrev snap_in_version list --package "$PACKAGE_ID" 2>&1)

# Check for versions that are not "ready" (draft, build_failed, deployment_failed, etc.)
NON_READY_VERSION_ID=$(echo "$VERSIONS_LIST" | grep -v "^Error" | jq -s -r '.[]? | select(.state != "ready") | .id' 2>/dev/null | head -1)

if [ -n "$NON_READY_VERSION_ID" ] && [ "$NON_READY_VERSION_ID" != "null" ]; then
  VERSION_STATE=$(echo "$VERSIONS_LIST" | grep -v "^Error" | jq -s -r ".[]? | select(.id == \"$NON_READY_VERSION_ID\") | .state" 2>/dev/null | head -1)
  echo "Found existing non-ready version: $NON_READY_VERSION_ID (state: $VERSION_STATE)"
  echo "Deleting non-ready version to allow new version creation..."
  devrev snap_in_version delete-one "$NON_READY_VERSION_ID" 2>&1
  echo "Non-ready version deleted. Waiting 2 seconds..."
  sleep 2
fi

# Create a new snap-in version with the package
VER_OUTPUT=$(devrev snap_in_version create-one \
  --path "." \
  --package "$PACKAGE_ID" 2>&1)

echo "$VER_OUTPUT"

# Filter the output to get the snap-in version ID
FILTERED_OUTPUT=$(grep "snap_in_version" <<<"$VER_OUTPUT" | grep -o '{.*}')

# Check if DevRev CLI returned an error (error messages contain the field 'message')
if echo "$FILTERED_OUTPUT" | jq -e '.message' > /dev/null 2>&1; then
  ERROR_MSG=$(echo "$FILTERED_OUTPUT" | jq -r '.message' 2>/dev/null)
  if [ "$ERROR_MSG" != "null" ] && [ -n "$ERROR_MSG" ]; then
    if [[ "$ERROR_MSG" == *"Conflict"* ]] && [[ "$ERROR_MSG" == *"non-published"* ]]; then
      echo "Warning: There's still a non-published version. Please activate or delete it in the UI first."
      echo "Or use: devrev snap_in_version delete-one <version-id>"
    fi
    echo "Error creating snap-in version: $ERROR_MSG"
    exit 1
  fi
fi

# Get the snap-in version ID
VERSION_ID=$(echo "$FILTERED_OUTPUT" | jq -r '.snap_in_version.id' 2>/dev/null)

if [ -z "$VERSION_ID" ] || [ "$VERSION_ID" == "null" ]; then
  echo "Error: Failed to extract snap-in version ID. Output: $VER_OUTPUT"
  exit 1
fi

echo "Snap-in version created: $VERSION_ID"

echo "Waiting 10 seconds for Snap-in version to be ready..."
sleep 10

# Wait for the snap-in version to be ready
while :; do
  VER_OUTPUT2=$(devrev snap_in_version show "$VERSION_ID")
  STATE=$(jq -r '.snap_in_version.state' <<<"$VER_OUTPUT2")
  if [[ "$STATE" == "build_failed" ]] || [[ "$STATE" == "deployment_failed" ]]; then
    echo "Snap-in version build/deployment failed: $(jq -r '.snap_in_version.failure_reason' <<<"$VER_OUTPUT2")"
    exit 1
  elif [[ "$STATE" == "ready" ]]; then
    break
  else
    echo "Snap-in version's state is $STATE, waiting 10 seconds..."
    sleep 10
  fi
done

echo "Creating Snap-in draft..."

# Create a new snap-in draft
DRAFT_OUTPUT=$(devrev snap_in draft --snap_in_version "$VERSION_ID")
jq <<<"$DRAFT_OUTPUT"

# Check if DevRev CLI returned an error (error messages contain the field 'message')
if ! jq '.message' <<<"$DRAFT_OUTPUT" | grep null >/dev/null; then
  exit 1
fi

# Get the snap-in ID and URL from the draft output
SNAP_IN_ID=$(jq -r '.snap_in.id' <<<"$DRAFT_OUTPUT")
SNAP_IN_URL=$(echo "$DRAFT_OUTPUT" | grep -o 'https://[^ ]*' | head -1)

if [[ -z "$SNAP_IN_ID" ]] || [[ "$SNAP_IN_ID" == "null" ]]; then
  echo "Error: Failed to extract snap-in ID from draft output"
  exit 1
fi

echo ""
echo "✅ Snap-in draft successfully created!"
if [[ -n "$SNAP_IN_URL" ]]; then
  echo "📋 Snap-in URL: $SNAP_IN_URL"
fi
echo ""
echo "Next steps:"
echo "1. Go to the snap-in page in the DevRev UI (link above)"
echo "2. Click 'Install snap-in' or 'Activate' to activate the snap-in"
echo "3. Once activated, you can start the import from: Airdrops -> Start Airdrop -> <your snap-in>"

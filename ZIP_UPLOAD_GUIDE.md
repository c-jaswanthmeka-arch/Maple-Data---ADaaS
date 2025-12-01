# ZIP File Upload Guide for Airdrop Snap-in

This guide explains how to upload a ZIP file containing `customers.json` and `maple_kb` data to DevRev and get the artifact ID for use in the Airdrop connection.

## Prerequisites

1. **DevRev Internal CLI** installed and accessible in your PATH
   - Verify installation: `which devrev`
   - Should return: `/opt/homebrew/bin/devrev` or similar path

2. **Authenticated with DevRev**
   - You need to be logged in to DevRev CLI
   - If not authenticated, see [Authentication](#authentication) section below

3. **ZIP file ready**
   - File should be named `maple-data.zip` (or any name)
   - Must contain:
     - `customers.json` at the root level
     - `maple_kb/` folder with:
       - `articles.json`
       - `*.md` markdown files

## Step-by-Step Process

### Step 1: Verify CLI Installation

Check if DevRev CLI is installed:

```bash
devrev --version
```

If not installed, contact your DevRev administrator for access to the Internal CLI.

### Step 2: Authenticate (if needed)

If you haven't authenticated yet, use one of these methods:

**Option A: Interactive Login**
```bash
devrev profiles authenticate --org YOUR_ORG_SLUG --usr your.email@devrev.ai
```

**Option B: Use existing profile**
```bash
devrev profiles authenticate
```

**Option C: Set environment variables**
```bash
export DEVREV_TOKEN="your-service-account-token"
export DEVREV_ENDPOINT="https://api.devrev.ai"
```

### Step 3: Upload ZIP File

Navigate to the directory containing your ZIP file, or use the full path:

```bash
# If ZIP file is in Desktop
devrev artifacts upload ~/Desktop/maple-data.zip --config-set default

# If ZIP file is in current directory
devrev artifacts upload maple-data.zip --config-set default

# If ZIP file is in a specific path
devrev artifacts upload /path/to/your/maple-data.zip --config-set default
```

### Step 4: Copy the Artifact ID

The command will output the artifact ID in this format:

```
"don:core:dvrv-us-1:devo/YOUR_ORG:artifact/ARTIFACT_ID"
```

**Example output:**
```
"don:core:dvrv-us-1:devo/12vppxiOSS:artifact/6437"
```

Copy this entire string (including the quotes, or just the ID without quotes).

### Step 5: Use in Airdrop Connection

1. Go to your DevRev organization
2. Navigate to **Airdrop** settings
3. Create or edit a connection for "Maple Data"
4. In the **"ZIP Artifact ID"** field, paste the artifact ID:
   ```
   don:core:dvrv-us-1:devo/YOUR_ORG:artifact/ARTIFACT_ID
   ```
5. Save the connection
6. The Airdrop snap-in will automatically download and extract the ZIP file when it runs

## Complete Example

Here's a complete example workflow:

```bash
# 1. Check CLI is installed
devrev --version

# 2. Authenticate (if needed)
devrev profiles authenticate

# 3. Upload the ZIP file
devrev artifacts upload ~/Desktop/maple-data.zip --config-set default

# Output:
# "don:core:dvrv-us-1:devo/12vppxiOSS:artifact/6437"

# 4. Copy the artifact ID and paste it into Airdrop connection
```

## Troubleshooting

### Error: "required flag(s) 'config-set' not set"

**Solution:** Always include `--config-set default` flag:
```bash
devrev artifacts upload your-file.zip --config-set default
```

### Error: "not authenticated" or "authentication required"

**Solution:** Authenticate first:
```bash
devrev profiles authenticate --org YOUR_ORG --usr your.email@devrev.ai
```

### Error: "command not found: devrev"

**Solution:** 
- DevRev Internal CLI is not installed
- Contact your DevRev administrator for access
- This feature is **not available** in Public CLI

### Error: "file not found"

**Solution:** 
- Check the file path is correct
- Use absolute path: `~/Desktop/maple-data.zip`
- Or navigate to the file directory first: `cd /path/to/file && devrev artifacts upload maple-data.zip --config-set default`

### Artifact ID format validation

The artifact ID should:
- Start with `don:`
- Contain your organization ID
- End with `artifact/ARTIFACT_NUMBER`

**Valid format:**
```
don:core:dvrv-us-1:devo/YOUR_ORG:artifact/6437
```

## Alternative Methods

### Method 1: Issue Attachment (Manual)
1. Create an issue in DevRev
2. Attach the ZIP file to the issue
3. Copy the artifact ID from the attachment details
4. Use it in the Airdrop connection

### Method 2: API Upload (Programmatic)
If you need to upload programmatically, use the DevRev API:
1. Call `artifacts.prepare` endpoint
2. Upload file to the returned S3 URL
3. Get artifact ID from the response

## ZIP File Structure Requirements

Your ZIP file must have this structure:

```
maple-data.zip
├── customers.json          (required at root)
└── maple_kb/               (required folder)
    ├── articles.json       (required)
    ├── article1.md         (optional markdown files)
    ├── article2.md
    └── ...
```

## Quick Reference Commands

```bash
# Check CLI version
devrev --version

# Authenticate
devrev profiles authenticate

# Upload ZIP file
devrev artifacts upload ~/Desktop/maple-data.zip --config-set default

# List artifacts (to verify upload)
devrev artifacts list

# Show artifact details
devrev artifacts show don:core:dvrv-us-1:devo/YOUR_ORG:artifact/ARTIFACT_ID

# Download artifact (if needed)
devrev artifacts download don:core:dvrv-us-1:devo/YOUR_ORG:artifact/ARTIFACT_ID
```

## Notes

- **Internal CLI Only**: This feature is only available in DevRev Internal CLI, not Public CLI
- **Artifact Persistence**: Artifacts remain available as long as your DevRev organization exists
- **File Size**: There may be size limits for artifact uploads (check with DevRev support)
- **Reusability**: Once uploaded, you can reuse the same artifact ID for multiple Airdrop connections
- **Updates**: If you update your ZIP file, you'll need to upload a new version and get a new artifact ID

## Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section above
2. Verify your ZIP file structure matches the requirements
3. Contact your DevRev administrator or the snap-in development team


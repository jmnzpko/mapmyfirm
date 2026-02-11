# MapMyFirm - Quick Start Guide

## Installation

### 1. Fix npm Permissions (One-time setup)

If you encounter permission errors during installation, run:

```bash
sudo chown -R $(whoami) ~/.npm
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag resolves peer dependency conflicts between MUI and Emotion packages.

### 3. Start Development Server

```bash
npm run dev
```

The application will open at [http://localhost:5173](http://localhost:5173)

## Application Workflow

### Step 1: Create a New Project

1. Click **"Create New Project"** on the home screen
2. Enter your WordPress site URL (e.g., `https://yourlawfirm.com`)
3. Optionally, provide a project name

### Step 2: Scan Your WordPress Site

1. Click **"Connect"** to detect available content types
2. Select the content types you want to import:
   - Always include **Pages**
   - Include relevant Custom Post Types (Locations, Practice Areas, etc.)
3. Click **"Start Scanning"**
4. Wait for the scan to complete (progress bar will show current status)

### Step 3: Review Site Structure

1. Navigate the interactive tree view in the left panel
2. Click on any page to view details in the middle panel
3. Use the search box to find specific pages
4. **Tag location hub pages** manually:
   - Select a page in the tree
   - In the details panel, click **"Location Hub"** tag
   - This helps with GBP matching accuracy

### Step 4: Match GBP Locations

1. Click **"GBP Matching"** in the top navigation
2. Define your location hub structure:
   - Choose **"Regular Pages"** if using standard WordPress pages
   - Choose **"Custom Post Type"** if you have a Locations CPT
3. Paste your GBP locations (one per line):
   ```
   San Francisco, CA
   Los Angeles, CA
   New York, NY
   ```
4. Click **"Match Locations"**
5. Review the matching results:
   - Green confidence score (80%+): Good match
   - Yellow confidence score (60-79%): Review manually
   - Red confidence score (<60%): Likely needs manual correction
6. Use the dropdown in the "Override" column to manually assign correct hubs
7. Click **"Generate Checklist"**

### Step 5: Review Checklist

1. The checklist shows all required pages for each location:
   - **Hub**: Does the location hub page exist?
   - **Car Accident**: Is there a car accident page for this location?
   - **Personal Injury**: Is there a personal injury page for this location?
2. Filter the checklist:
   - **All**: Show all locations
   - **Incomplete**: Show only locations with missing pages
   - **Complete**: Show only completed locations
3. Add notes for each location as needed
4. Mark items as complete when addressed
5. Export to CSV for sharing with your team

### Step 6: Export Your Project

1. Click **"Export Project"** in the sitemap screen
2. A JSON file will be downloaded to your computer
3. Import this file anytime to restore your project state

## Tips & Best Practices

### 🎯 Accurate Location Matching

- **Tag hub pages** as "Location Hub" in the sitemap before matching
- Use **city and state** format in GBP locations (e.g., "San Diego, CA")
- Manually override any low-confidence matches

### 🔍 Search & Navigation

- Use **search** to quickly find pages by title, slug, or URL
- Search automatically expands parent nodes to show matches
- Click page titles to view full details and URL

### ⚡ Performance

- Large sites (1000+ pages) may take time to scan
- Consider scanning only essential content types
- Use filters in the checklist to focus on specific locations

### 📊 Progress Tracking

- **Overall Progress**: Shows percentage of all required pages that exist
- **Location Hubs**: Percentage of GBP locations with hub pages
- **Practice Pages**: Percentage of locations with Car Accident and Personal Injury pages

### 💾 Saving Your Work

- Export your project regularly to avoid losing work
- JSON files can be version controlled or shared with team members
- Import projects to resume work exactly where you left off

## Troubleshooting

### WordPress REST API Not Accessible

**Error**: "WordPress REST API is not accessible"

**Solutions**:
1. Ensure the WordPress site has REST API enabled (default since WP 4.7)
2. Check if the site blocks cross-origin requests
3. Install a CORS plugin on WordPress:
   - [WP REST API CORS](https://wordpress.org/plugins/wp-rest-api-cors/)
4. Use a browser CORS extension during development (not recommended for production)

### No Content Types Detected

**Error**: Empty content types list after connecting

**Solutions**:
1. Verify the WordPress URL is correct
2. Ensure REST API is not disabled by a security plugin
3. Check if custom post types have `show_in_rest` enabled

### Low Matching Confidence

**Issue**: GBP locations have low confidence scores

**Solutions**:
1. Tag location hub pages manually as "Location Hub"
2. Ensure location names in WordPress match GBP format
3. Use the manual override dropdown to correct matches

### Pages Not Appearing in Tree

**Issue**: Some pages are missing from the sitemap

**Solutions**:
1. Check if the page status is "publish" (drafts are included but marked)
2. Verify the content type was selected during scanning
3. Re-scan if pages were recently added to WordPress

## File Structure

```
MapMyFirm/
├── src/
│   ├── components/      # React UI components
│   │   ├── home/        # Home screen
│   │   ├── scanner/     # WordPress scanner
│   │   ├── sitemap/     # Tree view and details
│   │   ├── gbp/         # GBP matching
│   │   └── checklist/   # Checklist screen
│   ├── services/        # Business logic
│   │   ├── wordpressApi.ts        # WordPress REST API
│   │   ├── treeBuilder.ts         # Tree algorithms
│   │   ├── locationMatcher.ts     # Fuzzy matching
│   │   ├── checklistGenerator.ts  # Page detection
│   │   └── exportImport.ts        # JSON persistence
│   ├── context/         # State management
│   │   └── ProjectContext.tsx
│   ├── types/           # TypeScript interfaces
│   └── App.tsx          # Main application
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## Support

For questions or issues, please reach out to the WEBRIS development team.

---

**Happy mapping! 🗺️**

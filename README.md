# MapMyFirm

An internal SEO planning tool for personal injury law firm WordPress sites. MapMyFirm visually maps site structure, matches Google Business Profile (GBP) locations to existing content, and identifies missing location-based pages.

## Features

- **WordPress Scanner**: Fetch site content via WordPress REST API
- **Visual Sitemap**: Interactive tree view of site hierarchy
- **GBP Matching**: Match GBP locations to hub pages with fuzzy search
- **Checklist Generator**: Track required pages (Car Accident, Personal Injury)
- **Export/Import**: Save and restore projects as JSON files

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- MUI X Tree View
- React Router
- fuse.js (fuzzy matching)

## Getting Started

### Fix npm Permissions (If Needed)

If you encounter npm permission errors, run:

```bash
sudo chown -R $(whoami) ~/.npm
```

### Install Dependencies

```bash
npm install --legacy-peer-deps
```

**Note**: The `--legacy-peer-deps` flag is needed due to peer dependency conflicts between MUI and Emotion packages.

### Run Development Server

```bash
npm run dev
```

The app will open at [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/        # React components organized by feature
├── context/          # React Context for state management
├── services/         # Business logic and API integrations
├── types/            # TypeScript interfaces
├── hooks/            # Custom React hooks
├── App.tsx           # Main app with routing
└── index.tsx         # Entry point
```

## Usage

1. **Create New Project**: Start by entering a WordPress site URL
2. **Scan Site**: Select content types to fetch (Pages, CPTs)
3. **View Sitemap**: Navigate the site structure, add manual tags
4. **Match GBP Locations**: Input locations and match to hub pages
5. **Review Checklist**: Track missing required pages
6. **Export Project**: Download JSON file to save progress

## Known Limitations

- Requires WordPress REST API to be enabled
- CORS may need to be configured on the WordPress site
- Large sites (1000+ pages) may experience performance issues

## License

Internal use only - WEBRIS

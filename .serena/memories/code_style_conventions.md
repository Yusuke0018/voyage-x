# Code Style and Conventions for Voyage-X

## JavaScript Style
- **ES6+ syntax**: Use modern JavaScript features
- **Class-based architecture**: StateManager, UI, DataPorter classes
- **Modular functions**: DateUtil object with utility functions
- **Camel case**: Variables and functions use camelCase
- **Constants**: ALL_CAPS for constants like CACHE_NAME
- **Error handling**: Try-catch blocks with user-friendly error messages
- **Event listeners**: Arrow functions preferred for event handlers
- **Template literals**: Use backticks for multi-line HTML strings

## CSS Style
- **CSS Custom Properties**: Use CSS variables for theming
- **BEM-like naming**: `.milestone-label`, `.vision-card-header`
- **Mobile-first**: Responsive design with mobile considerations
- **Theme system**: `data-theme="light|dark"` on body element
- **Consistent spacing**: 8px, 12px, 16px, 24px scale
- **Color palette**: Pre-defined color classes (`ms-color-0` to `ms-color-9`)

## File Organization
```
/
├── index.html          # Main HTML file
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── assets/
│   ├── voyage.js      # Main application logic
│   ├── voyage.css     # All styles
│   └── icons/         # PWA icons
└── README.md          # Documentation
```

## Data Handling
- **LocalStorage**: Key format `voyage:v1`
- **ID Generation**: `prefix_timestamp_random` format
- **Date Format**: ISO format (YYYY-MM-DD) for storage, Japanese format for display
- **State Management**: Immutable updates with listener notifications
- **Version Control**: Data structure versioning for future migrations

## PWA Standards
- **Service Worker**: Cache-first strategy for assets
- **Manifest**: Complete PWA manifest with icons
- **Offline Support**: Full functionality without internet
- **Mobile UX**: Touch-optimized interactions

## Performance Guidelines
- **requestAnimationFrame**: For animations and DOM updates
- **Event delegation**: Minimize event listeners
- **Debouncing**: For input handlers (1 second auto-save)
- **Memory management**: Clean up timers and event listeners
- **Caching**: Aggressive caching for offline experience
# Suggested Commands for Voyage-X Development

## Local Development
```bash
# Start local development
open index.html
# or use a local server
python -m http.server 8000
# then open http://localhost:8000

# Clear browser cache during development
# Use browser dev tools: Application -> Storage -> Clear site data
```

## Git Workflow
```bash
# Standard git operations
git status
git add .
git commit -m "message"
git push origin main

# Deploy to GitHub Pages (automatic)
# Just push to main branch - GitHub Actions handles deployment
```

## PWA Testing
```bash
# Test PWA features in Chrome DevTools
# Application tab -> Manifest, Service Workers
# Network tab -> Offline testing
# Lighthouse for PWA audit
```

## File Structure Commands
```bash
# Project structure
ls -la                    # List all files
find . -name "*.js"       # Find JavaScript files
find . -name "*.css"      # Find CSS files
grep -r "pattern" .       # Search for patterns in files
```

## Development Utilities
```bash
# Check file sizes
du -h assets/*

# Search for specific code patterns
grep -r "orientation" .
grep -r "landscape" .
grep -r "portrait" .

# Validate JSON files
python -m json.tool manifest.json
```

## Browser Testing
- Test in Chrome DevTools Device Mode
- Test on actual Android/iOS devices
- Use Chrome://inspect for remote debugging
- Test PWA installation and offline functionality
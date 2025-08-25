# Task Completion Guidelines for Voyage-X

## When a Task is Completed

### 1. Code Quality Checks
```bash
# Validate HTML
# Use browser dev tools to check for HTML validation errors

# Validate JSON files
python -m json.tool manifest.json

# Check JavaScript syntax
# Use browser console to check for any errors
```

### 2. PWA Testing
- Test Service Worker registration in dev tools
- Verify offline functionality
- Test PWA installation on mobile device
- Check manifest.json validity
- Run Lighthouse PWA audit

### 3. Cross-browser Testing
- Chrome (desktop and mobile)
- Safari (desktop and mobile)
- Firefox
- Edge

### 4. Mobile Device Testing
- Test on actual Android devices
- Test on actual iOS devices
- Verify touch interactions work correctly
- Check screen rotation behavior
- Test PWA installation and home screen icon

### 5. Git Workflow
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Fix: Resolve screen rotation issue on Android PWA"

# Push to trigger GitHub Pages deployment
git push origin main

# Verify deployment at https://yusuke0018.github.io/voyage-x/
```

### 6. Documentation Updates
- Update README.md if new features added
- Update version numbers if significant changes
- Document any new known issues or limitations

### 7. Data Persistence Testing
- Test LocalStorage functionality
- Verify export/import works correctly
- Test data migration if schema changes
- Ensure no data loss during updates

### 8. Performance Checks
- Check bundle size hasn't increased significantly
- Verify loading times are acceptable
- Test smooth animations and interactions
- Monitor memory usage in dev tools

## Definition of Done
- ✅ Code runs without console errors
- ✅ All features work on mobile and desktop
- ✅ PWA functionality verified
- ✅ Changes committed and deployed
- ✅ Cross-browser compatibility confirmed
- ✅ Documentation updated if needed
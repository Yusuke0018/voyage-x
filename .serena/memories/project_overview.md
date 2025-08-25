# Voyage-X Project Overview

## Project Purpose
Voyage-X is a minimal, flexible, and stylish personal timeline application (PWA) for visualizing goals and milestones. The main purpose is to help users visualize the distance to their goals (due dates) at a glance through a personal timeline interface.

## Core Concept
- **Minimal × Variable × Stylish** personal timeline app
- **Technical Approach**: GitHub Pages + LocalStorage only for lightweight operation
- **Non-Goals**: Task management, habit tracking, notifications, online sync, user management, collaborative editing, analytics dashboard

## Tech Stack
- Pure JavaScript (ES6+)
- CSS3 with custom properties
- LocalStorage API for data persistence
- PWA support with Service Worker
- GitHub Pages for static hosting

## Key Features
- ✅ **Complete offline operation** - PWA support, no internet required
- ✅ **3 screens** - Home/Timeline/Detail modal
- ✅ **4 operations** - Add/Edit/Move/Delete
- ✅ **3 types of milestones** - Single day/Month/Range
- ✅ **Mobile optimized** - Touch operations
- ✅ **Keyboard shortcuts** - Full keyboard support
- ✅ **Theme switching** - Dark/Light themes
- ✅ **Data protection** - Export/Import functionality

## Architecture
### Three-layer structure:
1. **Home (Vision List)**: Title, due date, card display
2. **Timeline**: Horizontal scroll, month labels, current position, due date pin
3. **Detail (Modal)**: Milestone editing, free text description

### Core Data Structure
```javascript
{
  version: "1.0.0",
  visions: [{
    id: "vision_xxx",
    title: "Vision name",
    dueDate: "YYYY-MM-DD",
    completionNote: "Optional completion details",
    milestones: [{
      id: "ms_xxx",
      type: "day|range", // month type deprecated -> converted to day
      startDate: "YYYY-MM-DD",
      endDate?: "YYYY-MM-DD", // for range type only
      title: "Milestone name",
      description: "Details",
      color: 0-9, // color index
      y: 120 // vertical position
    }]
  }]
}
```

## Current Status (MVP Complete)
The application is fully functional and deployed at: https://yusuke0018.github.io/voyage-x/

## Known Issues
The app currently has screen rotation issues on Android despite having multiple prevention mechanisms implemented:
1. manifest.json with "orientation": "portrait"
2. JavaScript Screen Orientation API implementation
3. CSS transform rotation fixes for landscape mode
4. Viewport meta tag with user-scalable=no
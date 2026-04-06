# ChiliLand Frontend - AI Context for ChatGPT

**Copy this entire file and paste it into ChatGPT at the start of conversations about the frontend.**

---

## Project: ChiliLand Farm Platform

### Quick Overview
- **Type**: Vanilla HTML/CSS/JS (no frameworks)
- **Purpose**: Farm management & chili pepper product display
- **Roles**: Visitor (browse), Owner (manage), Tour Guide
- **API**: FastAPI backend at http://127.0.0.1:8000

### Design System

**Color Scheme:**
- Primary Brand Red: `#b30000`
- Accent Red: `#d94a4a`
- Dark Text: `#7a1111`
- Light Background: `#fff8f8`
- White: `#ffffff`

**Typography:**
- Font: Arial, sans-serif
- Responsive: Uses viewport width (`vw`) units
- Body: 1vw-1.3vw
- Headings: 2.2vw-3vw

**Layout:**
- CSS Grid for pepper cards: `repeat(auto-fit, minmax(18vw, 1fr))`
- Padding/margins: 1.2vw-3vw
- Card border-radius: 1.2vw
- Card hover: `transform: scale(1.02)`

### File Structure
```
Frontend/
├── index.html (auth page)
├── pages/
│   ├── VisitorMain.html
│   ├── OwnerMain.html
│   └── TourguideMain.html
├── css/
│   ├── auth.css
│   └── VisitorMain.css
└── js/
    ├── auth.js
    └── VisitorMain.js
```

### Code Style
- **HTML IDs/Classes**: camelCase (e.g., `loginEmail`, `pepperContainer`)
- **CSS Classes**: kebab-case (e.g., `pepper-card`, `topbar`)
- **JavaScript**: camelCase functions and variables
- **API Base**: `http://127.0.0.1:8000`

### Key Endpoints
- `GET /chilli/chillies` → Get all peppers
- `GET /chilli/chillies/search?q=query` → Search peppers
- `POST /chilli/chillies` → Add pepper

### Common Patterns

**Fetching Peppers:**
```javascript
async function loadPeppers() {
    try {
        const response = await fetch("http://127.0.0.1:8000/chilli/chillies");
        const peppers = await response.json();
        // Process peppers
    } catch (error) {
        console.error("Error:", error);
    }
}
```

**Creating Elements:**
Use `createElement()` and `innerHTML` with template literals for dynamic content.

**Styling New Components:**
- Use vw units for responsive sizing
- Follow the color palette (#b30000 for primary actions)
- Add hover effects with smooth transitions

### Do's ✅
- Use fetch API with async/await
- Apply consistent color scheme
- Use vw units for responsive design
- Add error handling
- Use semantic HTML
- Keep CSS modular by file

### Don'ts ❌
- Don't use frameworks (vanilla JS only)
- Don't hardcode pixel sizes (use vw)
- Don't use colors outside the palette without approval
- Don't add inline styles (use CSS files)
- Don't forget alt text on images

### When Making Changes:
1. Maintain the red color scheme
2. Keep responsive design with vw units
3. Update both HTML structure AND styling
4. Test on different screen sizes
5. Handle API errors gracefully
6. Follow existing naming conventions

---

**Team Note:** Use this file for consistency across all frontend branches and AI interactions.
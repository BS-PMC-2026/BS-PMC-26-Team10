# ChiliLand Frontend Guidelines

## Project Overview
ChiliLand is a Farm Platform for managing and displaying chili peppers. It features role-based access (Visitor, Owner, Tour Guide) with authentication, product catalog, and management dashboards.

## Tech Stack
- **HTML5** - Semantic markup
- **Vanilla JavaScript** - No frameworks
- **CSS3** - Custom styling with CSS variables
- **API Communication** - Fetch API

## Design System

### Color Palette
- **Primary Red**: `#b30000` - Main brand color (topbar, buttons, accents)
- **Accent Red**: `#d94a4a` - Card borders, highlights
- **Dark Red**: `#7a1111` - Text content
- **Background**: `#fff8f8` - Off-white/light pink background
- **White**: `#ffffff` - Cards, content areas

### Typography
- **Font Family**: Arial, sans-serif
- **Heading Sizes**: 
  - H1: `3vw` (hero sections)
  - H2: `2.2vw` (section titles)
  - H3: `1.5vw` (card titles)
- **Body Text**: `1vw` to `1.3vw`
- **Tab/Button Text**: `1.2vw`

### Spacing & Layout
- **Grid System**: Flexible with vw units for responsiveness
- **Card Grid**: `repeat(auto-fit, minmax(18vw, 1fr))` with `2vw` gap
- **Padding**: `1.2vw` to `3vw` depending on context
- **Border Radius**: `1vw` for cards, `1.2vw` for larger elements

### Components

#### Topbar
- Background: `#b30000`
- Height: `1.5vw` padding
- Logo: Bold, `2.2vw`
- Tabs: White text with hover effect (background turns white, text turns red)

#### Pepper Card
- Border: `0.15vw solid #d94a4a`
- Border Radius: `1.2vw`
- Box Shadow: `0 0.4vw 1vw rgba(0, 0, 0, 0.08)`
- Image Height: `16vw` with `object-fit: cover`
- Hover: `transform: scale(1.02)`

#### Forms
- Input fields with placeholder text
- Button styling with hover effects
- Toggle between tabs using JavaScript

## Folder Structure
```
Frontend/
├── index.html          # Auth page (login/signup)
├── pages/
│   ├── VisitorMain.html    # Main visitor view
│   ├── OwnerMain.html      # Owner dashboard
│   └── TourguideMain.html  # Tour guide dashboard
├── css/
│   ├── auth.css        # Authentication page styles
│   └── VisitorMain.css # Main content styles
└── js/
    ├── auth.js         # Authentication logic
    └── VisitorMain.js  # Visitor page logic
```

## Code Standards

### Naming Conventions
- **HTML Elements**: kebab-case for IDs and classes
  - Example: `id="loginEmail"`, `class="pepper-card"`
- **JavaScript Variables**: camelCase
  - Example: `pepperContainer`, `loadPeppers()`
- **CSS Classes**: kebab-case or descriptive phrases
  - Example: `.pepper-card`, `.topbar`

### JavaScript Best Practices
- Use `const`/`let` instead of `var`
- Use async/await for API calls
- Add error handling with try/catch
- Use semantic element queries (getElementById, querySelector)
- Add comments for complex logic

### CSS Conventions
- Use viewport width units (`vw`) for responsive design
- Apply `box-sizing: border-box` globally
- Use CSS reset at the top of files
- Group related styles together
- Use meaningful class names

### API Integration
- Base URL: `http://127.0.0.1:8000`
- Endpoints:
  - `GET /peppers` → List all peppers
  - `GET /peppers/search?q=query` → Search peppers
  - `POST /peppers` → Add new pepper
- Handle errors gracefully with user-friendly messages

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive: Mobile first approach using `vw` units
- Viewport meta tag required: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`

## Performance Considerations
- Load peppers asynchronously
- Use CSS transitions for smooth interactions
- Minimize DOM manipulation in loops
- Cache API responses when appropriate

## Accessibility
- Use semantic HTML (header, main, section, etc.)
- Proper heading hierarchy
- Alt text for all images
- Form labels for accessibility
- Keyboard navigation support

## Future Enhancements
- Add loading states during API calls
- Implement client-side validation for forms
- Add confirmation dialogs for critical actions
- Implement pagination for large datasets
- Add dark mode support
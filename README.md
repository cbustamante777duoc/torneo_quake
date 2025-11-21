# ⚡ Esports Manager UI

A modern, responsive esports tournament dashboard featuring league standings tables and interactive knockout brackets with real-time editing capabilities.

## 🎯 Project Overview

**Esports Manager UI** is a comprehensive tournament management system that combines the elegance of modern web design with powerful functionality for tracking esports competitions. The project features two main components:

1. **League Standings Table** - A sophisticated, dark-themed table with real-time statistics tracking, form visualization, and automatic ranking calculations
2. **Knockout Tournament Bracket** - An interactive single-elimination bracket with custom branding and double-click elimination functionality

## ✨ Key Features

### 🏆 League Standings
- **Real-time Editing**: Edit team names and statistics directly in the table
- **Automatic Calculations**: Points, goal difference, and rankings update automatically
- **Form Visualization**: Color-coded W/D/L badges showing recent match results
- **Smart Ranking**: Automatic sorting by points, goal difference, and goals scored
- **Playoff Positions**: Visual indicators for promotion (gold) and playoff (cyan) spots
- **Persistent Storage**: Auto-saves all data to browser localStorage
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### 🎮 Tournament Bracket
- **Custom Branding**: Features Quake logo with proper alignment and positioning
- **Interactive Editing**: Click to edit team names inline
- **Elimination Tracking**: Double-click teams to mark them as eliminated
- **Hierarchical Layout**: Clean bracket structure from Quarterfinals to Champion
- **Hover Effects**: Modern CSS animations and transitions
- **Mobile Responsive**: Adapts bracket layout for smaller screens

### 🎨 Design & UX
- **Dark Theme**: Professional esports-inspired color scheme
- **Gradient Effects**: Dynamic gradients with hover animations
- **Typography**: Clean Inter font family with proper hierarchy
- **Accessibility**: Focus states and keyboard navigation support
- **Smooth Animations**: CSS transitions and loading animations

## 🛠 Tech Stack

- **HTML5**: Semantic markup with contenteditable attributes
- **CSS3**: Advanced features including:
  - Flexbox and Grid layouts
  - CSS custom properties and gradients
  - Transforms and animations
  - Media queries for responsiveness
- **Vanilla JavaScript (ES6+)**:
  - Class-based architecture
  - LocalStorage API for persistence
  - Event delegation and handling
  - Debounced auto-save functionality

## 📁 Project Structure

```
tabla_jugadores/
├── index.html              # Main league standings page
├── bracket.html            # Tournament bracket page
├── style.css              # League standings styling
├── bracket.css            # Tournament bracket styling
├── script.js              # League standings functionality
├── bracket.js             # Tournament bracket functionality
└── assets/
    └── quake-logo.png     # Tournament champion logo
```

**Important**: The `assets/` folder is crucial for proper functionality. It contains the Quake logo (`quake-logo.png`) used in the tournament bracket champion display. Ensure this folder exists and contains the logo file to prevent broken image links.

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/esports-manager-ui.git
   cd esports-manager-ui
   ```

2. **Verify asset structure:**
   ```bash
   # Ensure the assets folder exists with the logo
   ls -la assets/quake-logo.png
   ```

3. **Run locally:**
   ```bash
   # Using Python 3
   python -m http.server 8000

   # Using Node.js (if you have http-server installed)
   npx http-server . -p 8000

   # Or simply open the HTML files in your browser
   open index.html
   ```

4. **Access the application:**
   - League Standings: `http://localhost:8000/index.html`
   - Tournament Bracket: `http://localhost:8000/bracket.html`

## 🎮 Usage Guide

### League Standings Table

**Editing Teams:**
- Click on any team name to edit inline
- Edit statistics by clicking on the values
- Click form badges to cycle through Win (G), Draw (E), Loss (P)

**Keyboard Shortcuts:**
- `Ctrl/Cmd + S`: Save current standings
- `Ctrl/Cmd + R`: Reset all statistics
- `Ctrl/Cmd + N`: Add new team

**Automatic Features:**
- Points are calculated as: PG × 3 + PE
- Goal difference: GF - GC
- Teams are automatically ranked by points → GD → GF

### Tournament Bracket

**Navigation:**
- Click the "Ver Torneo de Eliminación Directa" link to access the bracket
- Use browser back button to return to standings

**Editing:**
- Single-click any team name to edit
- Double-click to mark teams as eliminated (strikethrough effect)

## 🎯 Technical Highlights

### Flexbox Alignment Fixes
The project implements sophisticated flexbox solutions for proper alignment:
- Tournament bracket nodes use `flex-direction: row-reverse` for proper flow
- Champion logo is centered using absolute positioning within flex containers
- Form badges use inline-block with precise sizing for consistency

### Responsive CSS Implementation
- Mobile-first approach with progressive enhancement
- Complex media queries for different screen sizes
- Conditional hiding of form column on mobile devices
- Scalable typography using rem units

### Asset Management
- Local asset storage prevents external dependencies
- Relative paths ensure portability
- Fallback styling for missing images
- Proper MIME type handling for different file formats

## 🔧 Customization

### Adding Teams
Edit the HTML in `index.html` to add more team rows:
```html
<tr class="team-row">
    <td class="position">11</td>
    <td class="team">
        <div class="team-info">
            <span class="team-logo">🎯</span>
            <span class="team-name" contenteditable="true">New Team</span>
        </div>
    </td>
    <!-- Add remaining stat cells -->
</tr>
```

### Custom Colors
Modify CSS custom properties in `style.css`:
```css
:root {
    --primary-color: #ff6b6b;
    --secondary-color: #64ffda;
    --accent-color: #ffd93d;
}
```

### Bracket Structure
The bracket supports 8 teams by default. To expand:
1. Add more team pairs in the HTML structure
2. Adjust CSS flex properties for layout
3. Update JavaScript for any additional functionality

## 🐛 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE 11 (Limited support - no CSS Grid)

## 📱 Mobile Compatibility

The application is fully responsive with:
- Touch-friendly editing interfaces
- Optimized table layouts for small screens
- Collapsible form badges on mobile
- Adaptive font sizes and spacing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Inter Font Family** - Professional typography from Rasmus Andersson
- **CSS Grid & Flexbox** - Modern layout capabilities
- **LocalStorage API** - Client-side persistence
- **ContentEditable** - Native inline editing functionality

---

**Built with passion for esports communities worldwide** 🎮
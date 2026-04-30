# Vision Education - Loading Screen Integration Guide

## Quick Integration

Add these two lines to the `<head>` section of every page:

```html
<link rel="stylesheet" href="/loading-screen.css" />
<script src="/loading-screen.js"></script>
```

That's it! The loading screen will automatically appear on page load and during navigation.

## Full Example

```html
<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Page | Vision Education</title>
  
  <!-- Vision Loading Screen (Add these) -->
  <link rel="stylesheet" href="/loading-screen.css" />
  <script src="/loading-screen.js"></script>
  
  <!-- Your other stylesheets -->
  <link rel="stylesheet" href="style.css" />
  <link rel="stylesheet" href="dashboard.css" />
</head>
<body>
  <!-- Your page content -->
</body>
</html>
```

## Features

### ✨ Automatic Features
- ✅ Shows on page load
- ✅ Hides when page is fully loaded
- ✅ Intercepts internal navigation links
- ✅ Smooth fade in/out animations
- ✅ Responsive design
- ✅ Dark/light theme support
- ✅ Floating logo animation
- ✅ Spinning rings
- ✅ Loading bar with gradient
- ✅ Particle effects (optional)

### 🎨 Visual Elements
1. **Animated Logo** - Floats up and down
2. **Spinning Rings** - Two counter-rotating rings
3. **Brand Text** - "Vision Education" with subtitle
4. **Loading Bar** - Animated gradient progress bar
5. **Loading Text** - "Loading..." with animated dots
6. **Particles** - Floating particles in background (optional)

## Customization

### Custom Loading Text

Add `data-loading-text` attribute to links:

```html
<a href="/dashboard" data-loading-text="Loading Dashboard">Dashboard</a>
<a href="/mocks" data-loading-text="Preparing Exam">Mock Exams</a>
<a href="/ai-learning" data-loading-text="Initializing AI">AI Hub</a>
```

### Disable Loader for Specific Links

Add `data-no-loader` attribute:

```html
<a href="/quick-page" data-no-loader>Quick Link</a>
```

### Manual Control

```javascript
// Show loader manually
const loader = new VisionLoader({
  loadingText: 'Processing',
  minDisplayTime: 1000
});

// Update text while loading
loader.updateText('Almost done');

// Hide manually
loader.hide();

// Navigate with loader
VisionLoader.showForNavigation('/dashboard', 'Loading Dashboard');
```

### Configuration Options

```javascript
const loader = new VisionLoader({
  minDisplayTime: 800,      // Minimum display time (ms)
  fadeOutDuration: 400,     // Fade out duration (ms)
  showParticles: true,      // Show particle effects
  loadingText: 'Loading',   // Default loading text
  autoInit: true            // Auto-initialize on page load
});
```

## Pages to Update

Add the loading screen to these pages:

### Main Pages
- [ ] `index.html` - Homepage
- [ ] `dashboard.html` - Student Dashboard
- [ ] `ai-learning.html` - AI Learning Hub
- [ ] `waec-past-questions.html` - Past Questions
- [ ] `admin-waec-upload.html` - Admin Upload

### Auth Pages
- [ ] `login.html` - Login Page
- [ ] `signup.html` - Signup Page
- [ ] `onboard.html` - Onboarding

### Other Pages
- [ ] `mocks.html` - Mock Exams
- [ ] `planner.html` - Study Planner
- [ ] `pricing.html` - Pricing Page
- [ ] `features.html` - Features Page
- [ ] `about.html` - About Page
- [ ] `admin.html` - Admin Panel
- [ ] `admin-pro.html` - Admin Pro

### Error Pages
- [ ] `404.html` - Not Found

## Advanced Usage

### Programmatic Navigation

```javascript
// Navigate with custom loading text
function goToDashboard() {
  VisionLoader.showForNavigation('/dashboard', 'Loading Dashboard');
}

// Navigate after async operation
async function saveAndNavigate() {
  const loader = new VisionLoader({
    autoInit: false,
    loadingText: 'Saving changes'
  });
  
  loader.show();
  
  await saveData();
  
  loader.updateText('Redirecting');
  
  setTimeout(() => {
    window.location.href = '/dashboard';
  }, 500);
}
```

### Form Submission

```javascript
document.getElementById('myForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const loader = new VisionLoader({
    autoInit: false,
    loadingText: 'Submitting'
  });
  
  loader.show();
  
  try {
    await submitForm();
    loader.updateText('Success! Redirecting');
    setTimeout(() => {
      window.location.href = '/success';
    }, 1000);
  } catch (error) {
    loader.hide();
    showError(error);
  }
});
```

### AJAX Requests

```javascript
async function loadData() {
  const loader = new VisionLoader({
    autoInit: false,
    loadingText: 'Fetching data'
  });
  
  loader.show();
  
  try {
    const data = await fetch('/api/data').then(r => r.json());
    loader.hide();
    return data;
  } catch (error) {
    loader.hide();
    throw error;
  }
}
```

## Styling Customization

### Change Colors

Edit `loading-screen.css`:

```css
/* Change primary color */
.vision-loader-ring {
  border-top-color: #your-color;
  border-right-color: #your-color;
}

.vision-loader-bar-fill {
  background: linear-gradient(90deg, 
    #your-color 0%, 
    #your-accent 50%, 
    #your-color 100%);
}
```

### Change Logo Size

```css
.vision-loader-logo {
  width: 150px;  /* Increase size */
  height: 150px;
}

.vision-loader-logo img {
  width: 100px;
  height: 100px;
}
```

### Disable Particles

```javascript
const loader = new VisionLoader({
  showParticles: false
});
```

Or remove from HTML in `loading-screen.js`:

```javascript
showParticles: false  // Set default to false
```

## Performance Tips

1. **Preload Logo**: Add to `<head>`:
   ```html
   <link rel="preload" href="/assets/logo.png" as="image" />
   ```

2. **Inline Critical CSS**: For faster initial render, inline the loading screen CSS in `<head>`

3. **Adjust Min Display Time**: Reduce for faster sites:
   ```javascript
   minDisplayTime: 500  // Faster
   ```

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ✅ IE11 (with polyfills)

## Troubleshooting

### Loader doesn't appear
- Check that CSS and JS files are loaded
- Verify file paths are correct
- Check browser console for errors

### Loader doesn't hide
- Check that `window.load` event fires
- Verify no JavaScript errors
- Try calling `loader.hide()` manually

### Logo doesn't show
- Verify `/assets/logo.png` exists
- Check image path is correct
- Image will hide automatically if not found

### Animations not smooth
- Check CSS animations are enabled
- Verify no conflicting CSS
- Test in different browser

## Examples

### Dashboard Navigation

```html
<a href="/dashboard" data-loading-text="Loading Dashboard">
  <svg>...</svg>
  Dashboard
</a>
```

### Mock Exam Start

```html
<button onclick="startExam()">Start Exam</button>

<script>
function startExam() {
  VisionLoader.showForNavigation('/exam', 'Preparing Exam');
}
</script>
```

### AI Hub Access

```html
<a href="/ai-learning" data-loading-text="Initializing AI">
  AI Learning Hub
</a>
```

## Testing

Test the loading screen:

```javascript
// Show for 3 seconds
const loader = new VisionLoader({
  autoInit: false,
  minDisplayTime: 3000
});
loader.show();
setTimeout(() => loader.hide(), 3000);
```

---

**Need Help?** Check the main documentation or contact the development team.

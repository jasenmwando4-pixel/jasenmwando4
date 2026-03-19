# QuickTranslate - Multilingual Translation Web Application

Public GitHub repo: https://github.com/jasenmwando4/Translator-app

A modern, responsive web-based translation application that allows users to translate text between multiple languages in real-time using the MyMemory Translation API.

## 🚀 Features

### Core Functionality
- **Real-time Translation**: Automatic translation with 1.8-second debounce
- **Manual Translation**: Instant translation via Enter key or Translate button
- **Language Selection**: Support for 10+ languages (English, French, Spanish, German, Italian, Japanese, Chinese, Russian, Arabic, Portuguese)
- **Language Detection**: Automatic source language detection (fallback to English)
- **Language Swap**: One-click button to swap source and target languages

### User Experience
- **Text-to-Speech**: Listen to both input and translated text
- **Copy Functionality**: Easy copying of input and output text
- **Character Counter**: Live character count with 500-character limit
- **Loading States**: Visual feedback during translation
- **Error Handling**: Graceful error messages for API failures
- **Translation Caching**: Offline support with local storage caching

### Interface & Design
- **Dark/Light Theme**: Toggle between themes with floating button
- **Responsive Design**: Mobile-friendly layout
- **Modern UI**: Clean, professional interface with smooth animations
- **Accessibility**: Proper ARIA labels and keyboard navigation

## 🛠 Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **API**: MyMemory Translation API (https://api.mymemory.translated.net/get)
- **Styling**: Custom CSS with CSS Variables for theming
- **Browser APIs**: Web Speech API for text-to-speech, Local Storage API for caching

## 📋 Prerequisites

- Modern web browser with JavaScript enabled
- Internet connection for API calls
- No server setup required (direct API integration)

## 🚀 Installation & Setup

### Option 1: Direct Browser Usage (Recommended)
1. Download or clone this repository
2. Open `index.html` in your web browser
3. Start translating!

### Option 2: Local Development Server
```bash
# Clone the repository
git clone [LECTURER'S_REPOSITORY_URL]
cd translator-app

# Install dependencies
npm install

# Start the application with Node (recommended)
npm start
# Then visit http://localhost:8000

# Alternate quick option (if Python is installed):
# python -m http.server 8000
# Then visit http://localhost:8000
```

## 📖 Usage

1. **Enter Text**: Type or paste text in the input panel (max 500 characters)
2. **Select Languages**:
   - Choose source language (or leave as "Detect Language")
   - Choose target language
3. **Translate**:
   - Text translates automatically after 1.8 seconds of inactivity
   - Press Enter for instant translation
   - Or click the "Translate" button
4. **Additional Features**:
   - Click 🔊 to listen to text
   - Click 📋 to copy text
   - Click ⇄ to swap languages
   - Click 🌓 to toggle dark/light theme

## 🔧 API Integration

The application uses the MyMemory Translation API:

**Endpoint**: `https://api.mymemory.translated.net/get`

**Parameters**:
- `q`: Text to translate
- `langpair`: Language pair in format "source|target" (e.g., "en|fr")

**Example Request**:
```javascript
const url = new URL('https://api.mymemory.translated.net/get');
url.searchParams.set('q', 'Hello, how are you');
url.searchParams.set('langpair', 'en|fr');

fetch(url.toString())
  .then(response => response.json())
  .then(data => console.log(data.responseData.translatedText));
```

## 🎯 Bonus Features Implemented

- ✅ **Real-time translation with debounce** (1.8-second delay)
- ✅ **Loading indicator** (button shows loading state)
- ✅ **Error handling** (user-friendly error messages)
- ✅ **Responsive mobile design** (adapts to different screen sizes)
- ✅ **Dark mode** (complete theme system with local storage persistence)
- ✅ **Text-to-speech** (Web Speech API integration)
- ✅ **Translation caching** (localStorage for offline/retry functionality)

## 📁 Project Structure

```
translator-app/
├── index.html          # Main HTML structure
├── style.css           # CSS styling and themes
├── script.js           # Application logic and API integration
├── server.js           # Express server for local development
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

## 🎨 Design Features

- **Gradient Accents**: App title and buttons use matching blue gradients
- **Smooth Animations**: Hover effects and transitions throughout
- **Floating UI Elements**: Theme toggle positioned as modern floating button
- **Professional Typography**: Clean, readable fonts with proper hierarchy
- **Color-coded Panels**: Visual distinction between input and output areas

## 🔍 Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 📝 Notes

- The application works entirely client-side with direct API calls
- No server backend required for basic functionality
- Translation caching improves performance and provides offline capabilities
- All features are implemented using modern web standards
- **Note**: Russian language support may be limited due to API constraints. If Russian translation fails, try using English as an intermediate language or check the browser console for detailed error information.

## 🤝 Contributing

This is an assignment submission. For improvements or modifications, please fork the repository and create a pull request.

## 📄 License

ISC License - See package.json for details

---

**Assignment Submission**: Full Stack Development - Multilingual Translation Web Application
**Date**: March 13, 2026
**Student**: John Mwando, ID: 2410053

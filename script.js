// State management
let isLoading = false;
let debounceTimer;
let currentRequest = null;

// Language names for display
const languageNames = {
    'en': 'English',
    'fr': 'French',
    'es': 'Spanish',
    'de': 'German',
    'it': 'Italian',
    'ja': 'Japanese',
    'zh': 'Chinese',
    'ru': 'Russian',
    'ar': 'Arabic',
    'pt': 'Portuguese'
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCharacterCount();

    // Set default content as assignment requires
    const inputText = document.getElementById('input');
    const sourceLang = document.getElementById('sourceLang');
    const targetLang = document.getElementById('targetLang');

    inputText.value = 'Hello, how are you';
    sourceLang.value = 'en';
    targetLang.value = 'fr';

    // Clear output until translation is complete
    document.getElementById('output').value = '';

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Setup event listeners
    setupDebounce();
    updateLanguageSelectors();

    // Add input event listener for character count
    inputText.addEventListener('input', updateCharacterCount);

    // Refresh translation when language selection changes
    document.getElementById('sourceLang').addEventListener('change', () => {
        if (inputText.value.trim()) translateText();
    });
    document.getElementById('detectLang').addEventListener('change', () => {
        if (inputText.value.trim()) activateDetectMode();
    });
    document.getElementById('targetLang').addEventListener('change', () => {
        if (inputText.value.trim()) translateText();
    });

    // Perform initial translation with default sentence
    translateText();
});

// Character count update
function updateCharacterCount() {
    const input = document.getElementById('input');
    const count = input.value.length;
    const countElement = document.getElementById('count');
    
    if (countElement) {
        countElement.textContent = `${count}/500`;
        
        if (count >= 500) {
            countElement.style.color = '#ff4444';
        } else {
            countElement.style.color = 'var(--text-secondary)';
        }
    }
}

// Debounce setup for real-time translation
function setupDebounce() {
    const input = document.getElementById('input');
    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (input.value.trim()) {
                translateText();
            }
        }, 1800); // 1 second debounce
    });

    // Add Enter key support for immediate translation
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent new line in textarea
            clearTimeout(debounceTimer); // Cancel any pending debounced translation
            if (input.value.trim()) {
                translateText();
            }
        }
    });
}

// Translation cache helpers (for offline/retry behavior)
const TRANSLATION_CACHE_KEY = 'translatorCache';
const MAX_CACHE_ENTRIES = 100;

function getTranslationCache() {
    try {
        return JSON.parse(localStorage.getItem(TRANSLATION_CACHE_KEY) || '{}');
    } catch (e) {
        return {};
    }
}

function saveTranslationCache(cache) {
    localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache));
}

function getCachedTranslation(key) {
    const cache = getTranslationCache();
    return cache[key] && cache[key].text ? cache[key].text : null;
}

function cacheTranslation(key, text) {
    const cache = getTranslationCache();
    const entries = Object.keys(cache);

    // Keep cache size reasonable
    if (entries.length >= MAX_CACHE_ENTRIES) {
        const oldestKey = entries.reduce((oldest, current) => {
            return cache[current].ts < cache[oldest].ts ? current : oldest;
        }, entries[0]);
        delete cache[oldestKey];
    }

    cache[key] = { text, ts: Date.now() };
    saveTranslationCache(cache);
}

// Detect source language via LibreTranslate
async function detectLanguage(text) {
    try {
        const response = await fetch('https://libretranslate.com/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: text })
        });

        if (!response.ok) {
            throw new Error(`Language detection failed: ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0 && data[0].language) {
            return data[0].language;
        }

        return null;
    } catch (err) {
        console.error('Language detection error:', err);
        showToast('Language detection unavailable, defaulting to English');
        return null;
    }
}

// Translation function
async function translateText() {
    const inputText = document.getElementById('input').value.trim();
    if (!inputText) {
        showError('Please enter text to translate');
        return;
    }

    const sourceLang = document.getElementById('sourceLang').value;
    const targetLang = document.getElementById('targetLang').value;

    // Validate language selection
    if (targetLang === 'detect') {
        showError('Please select a target language');
        return;
    }

    if (sourceLang === 'detect' && targetLang === 'detect') {
        showError('Please select a source and target language');
        return;
    }

    // Build a cache key to support offline / fallback translations
    const cacheKey = `${sourceLang}|${targetLang}|${inputText}`;
    const cachedTranslation = getCachedTranslation(cacheKey);

    // Cancel previous request if exists
    if (currentRequest) {
        currentRequest.abort();
    }

    // Create new abort controller
    currentRequest = new AbortController();

    // Show loading state
    setLoading(true);

    try {
        let effectiveSource = sourceLang;

        if (sourceLang === 'detect') {
            const detected = await detectLanguage(inputText);
            effectiveSource = detected || 'en';
            showToast(`Detected language: ${languageNames[effectiveSource] || effectiveSource}`);
        }

        const langpair = `${effectiveSource}|${targetLang}`;

        // Use MyMemory API directly (no detect mode/reliance on external proxy)
        const url = new URL('https://api.mymemory.translated.net/get');
        url.searchParams.set('q', inputText);
        url.searchParams.set('langpair', langpair);

        const response = await fetch(url.toString(), {
            method: 'GET',
            signal: currentRequest.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data); // Debug log
        console.log('Language pair:', langpair); // Debug log

        if (data.responseData && data.responseData.translatedText) {
            document.getElementById('output').value = data.responseData.translatedText;
            hideError();
            cacheTranslation(cacheKey, data.responseData.translatedText);

            if (sourceLang === 'detect' && data.responseData.detectedLanguage) {
                showToast(`Detected language: ${data.responseData.detectedLanguage}`);
            }

            // If auto-speak is enabled, speak the new output.
            if (autoSpeakOutput) {
                speakText('output');
            }
        } else {
            throw new Error('Invalid response from translation service');
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Request aborted');
        } else {
            console.error('Translation error:', error);
            console.error('Source language:', sourceLang, 'Target language:', targetLang);

            // If network/translation fails, fall back to cached results if available
            if (cachedTranslation) {
                document.getElementById('output').value = cachedTranslation;
                hideError();
                showToast('Offline: showing cached translation');
            } else {
                // Show specific error messages for different scenarios
                if (targetLang === 'ru') {
                    showError('Russian translation may have limited API support. Try a different target language.');
                } else if (sourceLang === 'ru') {
                    showError('Russian as source language may have limited API support. Try English as source.');
                } else {
                    showError('Translation failed. Please check your internet connection and try again.');
                }
            }
        }
    } finally {
        setLoading(false);
        currentRequest = null;
    }
}

// Swap languages
function activateDetectMode() {
    const sourceSelect = document.getElementById('sourceLang');
    sourceSelect.value = 'detect';
    translateText();
}

function swapLanguages() {
    const sourceSelect = document.getElementById('sourceLang');
    const targetSelect = document.getElementById('targetLang');
    const inputText = document.getElementById('input');
    const outputText = document.getElementById('output');

    // Don't swap if either is set to detect
    if (sourceSelect.value === 'detect' || targetSelect.value === 'detect') {
        showToast('Cannot swap when language detection is active');
        return;
    }

    // Swap values only (source and target languages)
    const tempLang = sourceSelect.value;
    sourceSelect.value = targetSelect.value;
    targetSelect.value = tempLang;

    // Re-translate using current input to avoid unexpected language switching behavior
    if (inputText.value.trim()) {
        translateText();
    }
}

// Text-to-speech function
let autoSpeakOutput = false;

function speakText(type) {
    const text = type === 'input' 
        ? document.getElementById('input').value 
        : document.getElementById('output').value;

    if (!text.trim()) {
        showToast('No text to speak');
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language based on type
    if (type === 'input') {
        const lang = document.getElementById('sourceLang').value;
        utterance.lang = lang === 'detect' ? 'en' : lang;
    } else {
        utterance.lang = document.getElementById('targetLang').value;
    }

    window.speechSynthesis.speak(utterance);
    return utterance;
}

// Toggle auto-speak mode for output.
function listen(type) {
    if (type === 'input') {
        const inputBtn = document.getElementById('listenInputButton');
        if (inputBtn) inputBtn.classList.add('active');

        const utterance = speakText('input');
        if (utterance) {
            utterance.onend = () => {
                if (inputBtn) inputBtn.classList.remove('active');
            };
        }
        return;
    }

    autoSpeakOutput = !autoSpeakOutput;
    const outputBtn = document.getElementById('listenButton');

    if (autoSpeakOutput) {
        if (outputBtn) outputBtn.classList.add('active');
        showToast('Listening enabled (will read output updates)');
        // Speak current output immediately
        speakText('output');
    } else {
        if (outputBtn) outputBtn.classList.remove('active');
        showToast('Listening disabled');
        window.speechSynthesis.cancel();
    }
}

// Copy text function
function copyText(type) {
    const text = type === 'input' 
        ? document.getElementById('input').value 
        : document.getElementById('output').value;

    if (!text.trim()) {
        showToast('No text to copy');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
    }).catch(() => {
        showError('Failed to copy text');
    });
}

// Loading state management
function setLoading(loading) {
    isLoading = loading;
    const button = document.getElementById('translateBtn');
    const buttonText = document.getElementById('buttonText');
    
    if (loading) {
        button.disabled = true;
        buttonText.innerHTML = '<span class="loading-indicator"></span>Translating...';
    } else {
        button.disabled = false;
        buttonText.textContent = 'Translate';
    }
}

// Error handling
function showError(message) {
    const container = document.getElementById('errorContainer');
    container.innerHTML = `<div class="error-message">❌ ${message}</div>`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    const container = document.getElementById('errorContainer');
    if (container) {
        container.innerHTML = '';
    }
}

// Toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Theme toggle
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    
    // Save preference
    localStorage.setItem('theme', newTheme);
}

// Update language selectors with full names
function updateLanguageSelectors() {
    const selects = document.querySelectorAll('.language-select');
    selects.forEach(select => {
        Array.from(select.options).forEach(option => {
            if (option.value !== 'detect' && languageNames[option.value]) {
                option.textContent = languageNames[option.value];
            }
        });
    });
}

// Export functions for global access (if using modules)
window.translateText = translateText;
window.swapLanguages = swapLanguages;
window.speakText = speakText;
window.copyText = copyText;
window.toggleTheme = toggleTheme;
window.updateCharacterCount = updateCharacterCount;


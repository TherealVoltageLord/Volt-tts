// Initialize particles.js only if element exists
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('particles-js')) {
        particlesJS("particles-js", {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: "#9c27b0" },
                shape: { type: "circle" },
                opacity: { value: 0.5, random: true },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: "#9c27b0", opacity: 0.4, width: 1 },
                move: { enable: true, speed: 2, direction: "none", random: true, straight: false, out_mode: "out" }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: { enable: true, mode: "repulse" },
                    onclick: { enable: true, mode: "push" }
                }
            }
        });
    }

    // Initialize service worker
    initializeServiceWorker();
    initializeThemeToggle();
    initializeControls();
    initializeVoiceBubbles();
    initializeAudioControls();
    initializeInstallPrompt();
});

// Service Worker Registration
function initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.error('ServiceWorker registration failed: ', err);
            });
    }
}

// Theme Toggle Functionality
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const icon = themeToggle.querySelector('i');
        const themeColor = document.body.classList.contains('light-mode') ? '#f5f5f5' : '#0f0c29';
        
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
        document.querySelector('meta[name="theme-color"]').setAttribute('content', themeColor);
        
        // Save preference to localStorage
        localStorage.setItem('themePreference', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    });

    // Load saved theme preference
    if (localStorage.getItem('themePreference') === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        document.querySelector('meta[name="theme-color"]').setAttribute('content', '#f5f5f5');
    }
}

// Controls Initialization
function initializeControls() {
    const speedControl = document.getElementById('speedControl');
    const pitchControl = document.getElementById('pitchControl');
    const speedValue = document.getElementById('speedValue');
    const pitchValue = document.getElementById('pitchValue');

    if (speedControl && speedValue) {
        speedControl.addEventListener('input', () => {
            speedValue.textContent = speedControl.value;
        });
    }

    if (pitchControl && pitchValue) {
        pitchControl.addEventListener('input', () => {
            pitchValue.textContent = pitchControl.value;
        });
    }
}

// Voice Bubbles Functionality
function initializeVoiceBubbles() {
    const voiceBubbles = document.querySelectorAll('.voice-bubble');
    if (!voiceBubbles.length) return;

    voiceBubbles.forEach(bubble => {
        bubble.addEventListener('click', async function() {
            document.querySelectorAll('.voice-bubble').forEach(b => b.classList.remove('active', 'pulse'));
            this.classList.add('active', 'pulse');
            
            const text = document.getElementById('textInput').value.trim();
            if (!text) return;
            
            await convertTextToSpeech(text, this.dataset.accent);
        });
    });
}

// Audio Conversion Function
async function convertTextToSpeech(text, accent) {
    const speed = document.getElementById('speedControl').value;
    const pitch = document.getElementById('pitchControl').value;
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    try {
        loadingSpinner.style.display = 'block';
        document.querySelectorAll('button').forEach(btn => btn.disabled = true);

        const response = await fetch("https://voltagelord-volt-tts.hf.space/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, accent, speed, pitch })
        });

        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        
        const audioBlob = await response.blob();
        const currentAudioUrl = URL.createObjectURL(audioBlob);
        
        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.src = currentAudioUrl;
        audioPlayer.play();
        
        document.getElementById('pausePlayBtn').innerHTML = '<i class="fas fa-pause"></i> Pause';
        
        // Store reference for download/share
        window.currentAudio = {
            blob: audioBlob,
            url: currentAudioUrl,
            accent: accent
        };
    } catch (error) {
        console.error("Conversion error:", error);
        showNotification(`Error: ${error.message}`, 'error');
    } finally {
        loadingSpinner.style.display = 'none';
        document.querySelectorAll('button').forEach(btn => btn.disabled = false);
    }
}

// Audio Controls
function initializeAudioControls() {
    const pausePlayBtn = document.getElementById('pausePlayBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn');

    if (pausePlayBtn) {
        pausePlayBtn.addEventListener('click', () => {
            const audio = document.getElementById('audioPlayer');
            if (audio.paused) {
                audio.play();
                pausePlayBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            } else {
                audio.pause();
                pausePlayBtn.innerHTML = '<i class="fas fa-play"></i> Play';
            }
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!window.currentAudio?.blob) {
                showNotification('No audio to download!', 'error');
                return;
            }
            
            const fileName = `VoltTTS-${window.currentAudio.accent}-${Date.now()}.mp3`;
            const a = document.createElement('a');
            a.href = window.currentAudio.url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            if (!window.currentAudio?.blob) {
                showNotification('No audio to share!', 'error');
                return;
            }
            
            if (!navigator.canShare) {
                showNotification('Sharing not supported in your browser', 'info');
                return;
            }

            try {
                const file = new File(
                    [window.currentAudio.blob], 
                    `VoltTTS-${window.currentAudio.accent}.mp3`, 
                    { type: "audio/mpeg" }
                );
                
                await navigator.share({
                    title: "Volt TTS Audio",
                    text: "Check out this audio generated by Volt TTS!",
                    files: [file]
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    showNotification(`Sharing failed: ${error.message}`, 'error');
                }
            }
        });
    }
}

// PWA Installation
function initializeInstallPrompt() {
    let deferredPrompt;
    const installBtn = document.getElementById('installBtn');
    const installNotification = document.getElementById('installNotification');
    const installNowBtn = document.getElementById('installNowBtn');
    const dismissInstallBtn = document.getElementById('dismissInstallBtn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        if (installBtn) installBtn.style.display = 'inline-flex';
        
        setTimeout(() => {
            if (!window.matchMedia('(display-mode: standalone)').matches && installNotification) {
                installNotification.style.display = 'flex';
            }
        }, 10000);
    });

    if (installBtn) {
        installBtn.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(choiceResult => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted install');
                    }
                    deferredPrompt = null;
                });
            }
        });
    }

    if (installNowBtn && installNotification) {
        installNowBtn.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(choiceResult => {
                    installNotification.style.display = 'none';
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted install');
                    }
                    deferredPrompt = null;
                });
            }
        });
    }

    if (dismissInstallBtn && installNotification) {
        dismissInstallBtn.addEventListener('click', () => {
            installNotification.style.display = 'none';
        });
    }
}

// Helper function for notifications
function showNotification(message, type = 'info') {
    // Implement your notification system or use console
    console[type](message);
    alert(message); // Fallback
}

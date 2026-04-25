let currentTab = 'today';
let items = JSON.parse(localStorage.getItem('voiceshop_items')) || [];

const listElement = document.getElementById('shopping-list');
const emptyState = document.getElementById('empty-state');
const voiceOverlay = document.getElementById('voice-overlay');
const transcriptPreview = document.getElementById('transcript-preview');
const micBtn = document.getElementById('mic-trigger');
const manualInput = document.getElementById('manual-input');
const errorToast = document.getElementById('error-toast');

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results).map(result => result[0].transcript).join('');
        transcriptPreview.textContent = transcript;
        if (event.results[0].isFinal) {
            addItem(transcript);
            setTimeout(stopListening, 1000);
        }
    };

    recognition.onerror = (event) => {
        console.error('Error de voz:', event.error);
        if (event.error === 'not-allowed') {
            showError('Permiso de micrófono denegado.');
        } else if (event.error === 'network') {
            showError('Error de red. Revisa tu conexión.');
        } else {
            showError('No se pudo detectar la voz.');
        }
        stopListening();
    };
} else {
    micBtn.style.display = 'none';
    console.warn('Speech API no soportada en este navegador.');
}

// Protoco Check (Crucial for Speech API)
if (window.location.protocol === 'file:') {
    setTimeout(() => {
        showError('La voz requiere un servidor (HTTPS). Usa la entrada manual o un servidor local.');
    }, 1000);
}

function setTab(tab) {
    currentTab = tab;
    document.getElementById('tab-today').classList.toggle('active', tab === 'today');
    document.getElementById('tab-tomorrow').classList.toggle('active', tab === 'tomorrow');
    renderList();
}

function addItem(text) {
    if (!text.trim()) return;
    const cleanText = text.trim().charAt(0).toUpperCase() + text.trim().slice(1).toLowerCase();
    items.push({ id: Date.now(), text: cleanText, checked: false, target: currentTab });
    saveAndRender();
}

function addManualItem() {
    const text = manualInput.value;
    if (text.trim()) {
        addItem(text);
        manualInput.value = '';
    }
}

// Permitir añadir con tecla Enter
manualInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addManualItem();
});

function toggleItem(id) {
    items = items.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    saveAndRender();
}

function deleteItem(id) {
    items = items.filter(item => item.id !== id);
    saveAndRender();
}

function saveAndRender() {
    localStorage.setItem('voiceshop_items', JSON.stringify(items));
    renderList();
}

function renderList() {
    const filteredItems = items.filter(item => item.target === currentTab);
    if (filteredItems.length === 0) {
        listElement.innerHTML = '';
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
        listElement.innerHTML = filteredItems.sort((a,b) => a.checked - b.checked || b.id - a.id).map(item => `
            <li class="list-item ${item.checked ? 'checked' : ''}">
                <div class="checkbox-wrapper">
                    <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${item.id})">
                    <span class="checkmark"></span>
                </div>
                <span class="item-text">${item.text}</span>
                <button class="delete-btn" onclick="deleteItem(${item.id})"><i data-lucide="trash-2"></i></button>
            </li>
        `).join('');
    }
    if (window.lucide) lucide.createIcons();
}

function showError(msg) {
    errorToast.textContent = msg;
    errorToast.classList.remove('hidden');
    setTimeout(() => errorToast.classList.add('hidden'), 4000);
}

function startListening() { 
    if (!recognition) {
        showError('Tu navegador no soporta voz o no está en HTTPS.');
        return;
    }
    voiceOverlay.classList.remove('hidden');
    try {
        recognition.start();
    } catch (e) {
        console.error(e);
        stopListening();
    }
}

function stopListening() { 
    if (recognition) {
        try { recognition.stop(); } catch(e) {}
    }
    voiceOverlay.classList.add('hidden'); 
}

micBtn.addEventListener('click', startListening);
renderList();

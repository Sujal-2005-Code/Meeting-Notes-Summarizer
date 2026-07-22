
// State management
let recognition = null;
let isRecording = false;
let currentTranscript = '';
let generatedNotes = '';

// DOM Elements
const meetingTitle = document.getElementById('meetingTitle');
const meetingDate = document.getElementById('meetingDate');
const attendees = document.getElementById('attendees');
const transcriptInput = document.getElementById('transcriptInput');
const liveTranscript = document.getElementById('liveTranscript');
const startRecordingBtn = document.getElementById('startRecording');
const stopRecordingBtn = document.getElementById('stopRecording');
const recordingStatus = document.getElementById('recordingStatus');
const audioUpload = document.getElementById('audioUpload');
const uploadedFileName = document.getElementById('uploadedFileName');
const generateNotesBtn = document.getElementById('generateNotes');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const retryButton = document.getElementById('retryButton');
const outputSection = document.getElementById('outputSection');
const outputContent = document.getElementById('outputContent');
const copyNotesBtn = document.getElementById('copyNotes');
const downloadTxtBtn = document.getElementById('downloadTxt');
const downloadWordBtn = document.getElementById('downloadWord');
const downloadPdfBtn = document.getElementById('downloadPdf');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeRecording();
    initializeUpload();
    initializeEventListeners();
    setDefaultDate();
});

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    meetingDate.value = today;
}

// Tab switching
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// Web Speech API for live recording
function initializeRecording() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            currentTranscript = (currentTranscript + finalTranscript).trim();
            liveTranscript.value = currentTranscript + interimTranscript;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopRecording();
            showError(`Speech recognition error: ${event.error}. Please try again.`);
        };

        recognition.onend = () => {
            if (isRecording) {
                recognition.start();
            }
        };
    } else {
        recordingStatus.innerHTML = '<strong>Browser not supported:</strong> Web Speech API is not supported in your browser. Please use Chrome or Edge for live recording.';
        startRecordingBtn.disabled = true;
    }
}

function startRecording() {
    if (!recognition) {
        showError('Speech recognition is not available in your browser.');
        return;
    }

    try {
        recognition.start();
        isRecording = true;
        currentTranscript = '';
        liveTranscript.value = '';
        startRecordingBtn.disabled = true;
        stopRecordingBtn.disabled = false;
        recordingStatus.textContent = '🎤 Recording... Speak now';
        recordingStatus.classList.add('recording');
    } catch (error) {
        console.error('Error starting recording:', error);
        showError('Failed to start recording. Please try again.');
    }
}

function stopRecording() {
    if (recognition && isRecording) {
        recognition.stop();
        isRecording = false;
        startRecordingBtn.disabled = false;
        stopRecordingBtn.disabled = true;
        recordingStatus.textContent = '✅ Recording stopped';
        recordingStatus.classList.remove('recording');
    }
}

// File upload handling
function initializeUpload() {
    audioUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadedFileName.textContent = `Selected: ${file.name}`;
        }
    });
}

// Event listeners
function initializeEventListeners() {
    startRecordingBtn.addEventListener('click', startRecording);
    stopRecordingBtn.addEventListener('click', stopRecording);
    generateNotesBtn.addEventListener('click', generateNotes);
    retryButton.addEventListener('click', generateNotes);
    copyNotesBtn.addEventListener('click', copyNotes);
    downloadTxtBtn.addEventListener('click', downloadTxt);
    downloadWordBtn.addEventListener('click', downloadWord);
    downloadPdfBtn.addEventListener('click', downloadPdf);
}

// Generate notes using Groq API (via backend server)
async function generateNotes() {
    // Get transcript based on active tab
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    let transcript = '';

    if (activeTab === 'paste') {
        transcript = transcriptInput.value.trim();
    } else if (activeTab === 'record') {
        transcript = liveTranscript.value.trim();
    } else if (activeTab === 'upload') {
        showError('Please use the Live Recording option or paste a transcript instead. Direct audio file transcription requires a paid API.');
        return;
    }

    if (!transcript) {
        showError('Please provide a transcript first.');
        return;
    }

    // Get template
    const template = document.querySelector('input[name="template"]:checked').value;

    // Get meeting details
    const title = meetingTitle.value.trim() || 'Meeting';
    const date = meetingDate.value || new Date().toISOString().split('T')[0];
    const attendeesList = attendees.value.trim() || 'Not specified';

    // Show loading state
    hideError();
    outputSection.classList.add('hidden');
    loadingState.classList.remove('hidden');

    try {
        console.log('Calling backend API...');
        
        const response = await fetch('/api/generate-notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transcript,
                template,
                title,
                date,
                attendees: attendeesList
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate notes');
        }

        const data = await response.json();
        const text = data.notes;
        
        console.log('Notes generated successfully');
        generatedNotes = text;
        renderOutput(text, template, title, date, attendeesList);

        loadingState.classList.add('hidden');
        outputSection.classList.remove('hidden');

    } catch (error) {
        console.error('Error generating notes:', error);
        loadingState.classList.add('hidden');
        showError(`Failed to generate notes: ${error.message}. Please try again.`);
    }
}

function renderOutput(text, template, title, date, attendees) {
    // Convert the plain text output to HTML
    const htmlContent = textToHtml(text, template, title, date, attendees);
    outputContent.innerHTML = htmlContent;
}

function textToHtml(text, template, title, date, attendees) {
    // Split into lines and process
    const lines = text.split('\n');
    let html = '';

    // Add header
    html += `<h1>${title}</h1>`;
    html += `<div class="meta-info">`;
    html += `<p><strong>Date:</strong> ${date}</p>`;
    html += `<p><strong>Attendees:</strong> ${attendees}</p>`;
    html += `</div>`;

    let currentSection = '';

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Check if it's a header (all caps or ends with colon)
        if (line === line.toUpperCase() || line.endsWith(':')) {
            currentSection = line.replace(':', '');
            html += `<h2>${currentSection}</h2>`;
        } else if (line.startsWith('- ')) {
            // List item
            html += `<ul><li>${line.substring(2)}</li></ul>`;
        } else if (line.startsWith('• ')) {
            // Bullet point
            html += `<ul><li>${line.substring(2)}</li></ul>`;
        } else {
            // Regular paragraph
            html += `<p>${line}</p>`;
        }
    }

    return html;
}

// Error handling
function showError(message) {
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
    outputSection.classList.add('hidden');
}

function hideError() {
    errorState.classList.add('hidden');
}

// Export functions
async function copyNotes() {
    try {
        await navigator.clipboard.writeText(generatedNotes);
        alert('Notes copied to clipboard!');
    } catch (error) {
        console.error('Failed to copy:', error);
        showError('Failed to copy notes. Please try again.');
    }
}

function downloadTxt() {
    const blob = new Blob([generatedNotes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meetingTitle.value.trim() || 'meeting-notes'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function downloadWord() {
    try {
        const { Document, Packer, Paragraph, HeadingLevel } = window.docx;
        const lines = generatedNotes.split('\n');
        const children = [];

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            if (line === line.toUpperCase() || line.endsWith(':')) {
                // Header
                children.push(
                    new Paragraph({
                        text: line,
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 100 }
                    })
                );
            } else if (line.startsWith('- ') || line.startsWith('• ')) {
                // List item
                children.push(
                    new Paragraph({
                        text: line.substring(2),
                        bullet: { level: 0 },
                        spacing: { after: 50 }
                    })
                );
            } else {
                // Regular paragraph
                children.push(
                    new Paragraph({
                        text: line,
                        spacing: { after: 100 }
                    })
                );
            }
        }

        const doc = new Document({
            sections: [{
                properties: {},
                children: children
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${meetingTitle.value.trim() || 'meeting-notes'}-${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Failed to generate Word document:', error);
        showError('Failed to generate Word document. Please try again.');
    }
}

function downloadPdf() {
    const element = outputContent;
    const opt = {
        margin: 0.5,
        filename: `${meetingTitle.value.trim() || 'meeting-notes'}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
        html2pdf().set(opt).from(element).save();
    } catch (error) {
        console.error('Failed to generate PDF:', error);
        showError('Failed to generate PDF. Please try again.');
    }
}

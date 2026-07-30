/* =========================================================
   Briefly — Premium Application Logic
   World-Class Interactions & Micro-animations
   ========================================================= */

'use strict';

// ── State Management ──────────────────────────────────────
let recognition = null;
let isRecording = false;
let currentTranscript = '';
let generatedNotes = '';
let processingInterval = null;
let progressInterval = null;

// ── DOM References ────────────────────────────────────────
const navbar = document.getElementById('navbar');
const progressBar = document.getElementById('progressBar');
const progressLineFill = document.getElementById('progressLineFill');
const step1Progress = document.getElementById('step1Progress');
const step2Progress = document.getElementById('step2Progress');
const step3Progress = document.getElementById('step3Progress');

const meetingTitle = document.getElementById('meetingTitle');
const meetingDate = document.getElementById('meetingDate');
const attendees = document.getElementById('attendees');

const transcriptInput = document.getElementById('transcriptInput');
const liveTranscript = document.getElementById('liveTranscript');

const startRecordingBtn = document.getElementById('startRecording');
const stopRecordingBtn = document.getElementById('stopRecording');
const recordingStatus = document.getElementById('recordingStatus');
const recordingStatusText = document.getElementById('recordingStatusText');

const audioUpload = document.getElementById('audioUpload');
const uploadResult = document.getElementById('uploadResult');
const uploadFileName = document.getElementById('uploadFileName');
const uploadFileSize = document.getElementById('uploadFileSize');
const uploadRemove = document.getElementById('uploadRemove');

const generateNotesBtn = document.getElementById('generateNotes');
const loadingState = document.getElementById('loadingState');
const aiStatus = document.getElementById('aiStatus');
const aiProgressFill = document.getElementById('aiProgressFill');
const aiTime = document.getElementById('aiTime');

const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const retryButton = document.getElementById('retryButton');

const outputSection = document.getElementById('outputSection');
const outputContent = document.getElementById('outputContent');

const copyNotesBtn = document.getElementById('copyNotes');
const downloadTxtBtn = document.getElementById('downloadTxt');
const downloadWordBtn = document.getElementById('downloadWord');
const downloadPdfBtn = document.getElementById('downloadPdf');

// ── Bootstrap ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initializeNavbar();
    
    // Only initialize app logic if the main app container exists
    if (document.getElementById('app')) {
        initializeProgress();
        setDefaultDate();
        initializeTabs();
        initializeRecording();
        initializeUpload();
        initializeSampleChips();
        initializeEventListeners();
    }
    
    // Landing page specific logic
    const watchDemoBtn = document.getElementById('watchDemo');
    if (watchDemoBtn) {
        watchDemoBtn.addEventListener('click', () => {
            alert('Demo video coming soon!');
        });
    }
    
    initializeLucideIcons();
});


// ── Glassmorphism Navbar Scroll Effect ───────────────────
function initializeNavbar() {
    let lastScroll = 0;
    const scrollThreshold = 50;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > scrollThreshold) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    }, { passive: true });
}

// ── Progress Indicator ────────────────────────────────────
function initializeProgress() {
    // Track form completion for step 1
    const step1Fields = [meetingTitle, meetingDate, attendees];
    step1Fields.forEach(field => {
        field?.addEventListener('input', updateProgress);
    });
    
    // Track transcript input for step 2
    transcriptInput?.addEventListener('input', updateProgress);
    liveTranscript?.addEventListener('input', updateProgress);
}

function updateProgress() {
    const hasDetails = meetingTitle?.value || meetingDate?.value || attendees?.value;
    const hasTranscript = transcriptInput?.value || liveTranscript?.value;
    
    if (hasDetails && hasTranscript) {
        setProgressStep(2);
    } else if (hasDetails) {
        setProgressStep(1);
    } else {
        setProgressStep(1);
    }
}

function setProgressStep(step) {
    // Remove all active/completed states
    [step1Progress, step2Progress, step3Progress].forEach(s => {
        s?.classList.remove('active', 'completed');
    });
    
    // Set progress based on step
    if (step >= 1) {
        step1Progress?.classList.add('completed');
        progressLineFill.style.width = '0%';
    }
    if (step >= 2) {
        step1Progress?.classList.add('completed');
        step2Progress?.classList.add('active');
        progressLineFill.style.width = '50%';
    }
    if (step >= 3) {
        step1Progress?.classList.add('completed');
        step2Progress?.classList.add('completed');
        step3Progress?.classList.add('active');
        progressLineFill.style.width = '100%';
    }
}

// ── Default Date ──────────────────────────────────────────
function setDefaultDate() {
    if (meetingDate) {
        meetingDate.value = new Date().toISOString().split('T')[0];
    }
}

// ── Tab Switching ─────────────────────────────────────────
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            
            const targetTab = document.getElementById(`${tabId}-tab`);
            if (targetTab) {
                targetTab.classList.add('active');
            }
            
            // Re-initialize icons after tab switch
            setTimeout(() => initializeLucideIcons(), 50);
        });
    });
}


// ── Speech Recognition ────────────────────────────────────
function initializeRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        if (recordingStatusText) {
            recordingStatusText.textContent = 'Not available in this browser';
        }
        if (startRecordingBtn) {
            startRecordingBtn.disabled = true;
        }
        return;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                final += transcript + ' ';
            } else {
                interim += transcript;
            }
        }
        
        currentTranscript = (currentTranscript + final).trim();
        if (liveTranscript) {
            liveTranscript.value = currentTranscript + interim;
        }
        updateProgress();
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopRecording();
        showError(`Microphone error: ${event.error}. Please check permissions and try again.`);
    };
    
    recognition.onend = () => {
        if (isRecording) {
            try {
                recognition.start();
            } catch (e) {
                console.error('Failed to restart recognition:', e);
            }
        }
    };
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
        if (liveTranscript) liveTranscript.value = '';
        
        if (startRecordingBtn) startRecordingBtn.disabled = true;
        if (stopRecordingBtn) stopRecordingBtn.disabled = false;
        
        setRecordingStatus('Recording — speak now', true);
    } catch (err) {
        console.error('Start recording error:', err);
        showError('Could not start recording. Please try again.');
    }
}

function stopRecording() {
    if (!recognition || !isRecording) return;
    
    recognition.stop();
    isRecording = false;
    
    if (startRecordingBtn) startRecordingBtn.disabled = false;
    if (stopRecordingBtn) stopRecordingBtn.disabled = true;
    
    setRecordingStatus('Recording stopped', false);
}

function setRecordingStatus(text, active) {
    if (recordingStatusText) {
        recordingStatusText.textContent = text;
    }
    if (recordingStatus) {
        if (active) {
            recordingStatus.classList.add('active');
        } else {
            recordingStatus.classList.remove('active');
        }
    }
}


// ── File Upload ───────────────────────────────────────────
function initializeUpload() {
    if (audioUpload) {
        audioUpload.addEventListener('change', handleFileUpload);
    }
    
    if (uploadRemove) {
        uploadRemove.addEventListener('click', clearUpload);
    }
    
    // Keyboard support for upload zone
    const uploadZone = document.querySelector('.upload-zone');
    if (uploadZone) {
        uploadZone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                audioUpload?.click();
            }
        });
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Display file info
    if (uploadFileName) {
        uploadFileName.textContent = file.name;
    }
    if (uploadFileSize) {
        uploadFileSize.textContent = formatFileSize(file.size);
    }
    if (uploadResult) {
        uploadResult.classList.add('show');
    }
    
    // Re-initialize icons
    setTimeout(() => initializeLucideIcons(), 50);
}

function clearUpload() {
    if (audioUpload) {
        audioUpload.value = '';
    }
    if (uploadResult) {
        uploadResult.classList.remove('show');
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ── Sample Transcript Chips ───────────────────────────────
function initializeSampleChips() {
    const sampleChips = document.querySelectorAll('.chip[data-sample]');
    
    sampleChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const sampleType = chip.dataset.sample;
            loadSampleTranscript(sampleType);
        });
    });
}

function loadSampleTranscript(type) {
    const samples = {
        business: `John: Good morning everyone. Let's start with the Q4 budget review.
Sarah: Thanks John. We've allocated $50,000 for marketing and $30,000 for product development.
Mike: That looks good. What about the timeline for the new feature launch?
Sarah: We're targeting December 15th. The dev team is on track.
John: Excellent. Any blockers we should discuss?
Mike: We need approval from legal before we can proceed with the API integration.
John: I'll follow up with legal today. Sarah, can you prepare the launch checklist?
Sarah: Absolutely. I'll have it ready by Friday.
John: Perfect. Let's reconvene next Monday to review progress.`,
        
        client: `Alex: Hi Jennifer, thanks for taking the time to meet today.
Jennifer: Of course, Alex. I'm excited to discuss the new campaign.
Alex: We've reviewed your requirements and have three concepts ready to present.
Jennifer: Great! What's your recommendation?
Alex: Concept B aligns best with your brand values and has tested well with focus groups.
Jennifer: I like that approach. What's the timeline?
Alex: We can deliver final assets in 3 weeks, with reviews at weeks 1 and 2.
Jennifer: Perfect. Let's move forward with Concept B.
Alex: Excellent. I'll send over the proposal and contract this afternoon.
Jennifer: Sounds good. Looking forward to working together.`,
        
        lecture: `Professor Smith: Today we'll cover advanced calculus concepts, specifically integration by parts.
Professor Smith: The formula is: integral of u dv equals uv minus integral of v du.
Student: Can you explain when we should use this method?
Professor Smith: Great question. Use it when you have a product of two functions that are difficult to integrate directly.
Professor Smith: For example, x times e to the x, or x times sine of x.
Student: What if we have a polynomial times a logarithm?
Professor Smith: Excellent example. Set u as the logarithm and dv as the polynomial.
Professor Smith: For homework, complete problems 1 through 15 in chapter 7.
Professor Smith: Next class, we'll cover applications to real-world physics problems.`
    };
    
    const sample = samples[type] || samples.business;
    
    if (transcriptInput) {
        transcriptInput.value = sample;
        // Add a subtle animation effect
        transcriptInput.style.animation = 'fadeIn 0.4s ease';
        setTimeout(() => {
            transcriptInput.style.animation = '';
        }, 400);
        updateProgress();
    }
}


// ── Event Listeners ───────────────────────────────────────
function initializeEventListeners() {
    startRecordingBtn?.addEventListener('click', startRecording);
    stopRecordingBtn?.addEventListener('click', stopRecording);
    generateNotesBtn?.addEventListener('click', generateNotes);
    retryButton?.addEventListener('click', generateNotes);
    copyNotesBtn?.addEventListener('click', copyNotes);
    downloadTxtBtn?.addEventListener('click', downloadTxt);
    downloadWordBtn?.addEventListener('click', downloadWord);
    downloadPdfBtn?.addEventListener('click', downloadPdf);
}

// ── Generate Notes with AI Processing Animation ──────────
async function generateNotes() {
    // Get transcript based on active tab
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
    let transcript = '';
    
    if (activeTab === 'paste') {
        transcript = transcriptInput?.value.trim() || '';
    } else if (activeTab === 'record') {
        transcript = liveTranscript?.value.trim() || '';
    } else if (activeTab === 'upload') {
        showError('Direct audio transcription requires a paid API. Use Live Recording or paste a transcript instead.');
        return;
    }
    
    if (!transcript) {
        showError('Please add a transcript before generating notes.');
        return;
    }
    
    const template = document.querySelector('input[name="template"]:checked')?.value || 'business';
    const title = meetingTitle?.value.trim() || 'Meeting';
    const date = meetingDate?.value || new Date().toISOString().split('T')[0];
    const attendeesList = attendees?.value.trim() || 'Not specified';
    
    // Show AI processing state
    hideError();
    hide(outputSection);
    show(loadingState);
    setProgressStep(3);
    
    if (generateNotesBtn) generateNotesBtn.disabled = true;
    
    // Start AI processing animation
    startAIProcessing();
    
    try {
        const response = await fetch('/api/generate-notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transcript,
                template,
                title,
                date,
                attendees: attendeesList
            })
        });
        
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server error ${response.status}`);
        }
        
        const data = await response.json();
        generatedNotes = data.notes || '';
        
        // Stop processing animation
        stopAIProcessing();
        
        // Small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 500));
        
        renderOutput(generatedNotes, template, title, date, attendeesList);
        
        hide(loadingState);
        show(outputSection);
        
        // Smooth scroll to output
        setTimeout(() => {
            outputSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        
    } catch (err) {
        console.error('Generate notes error:', err);
        stopAIProcessing();
        hide(loadingState);
        showError(err.message || 'Failed to generate notes. Please try again.');
    } finally {
        if (generateNotesBtn) generateNotesBtn.disabled = false;
    }
}

// ── AI Processing Animation ───────────────────────────────
function startAIProcessing() {
    const statuses = [
        'Analyzing transcript…',
        'Extracting key points…',
        'Identifying action items…',
        'Finding decisions…',
        'Generating summary…',
        'Formatting notes…'
    ];
    
    let statusIndex = 0;
    let progress = 0;
    
    // Update status text
    processingInterval = setInterval(() => {
        if (aiStatus && statusIndex < statuses.length) {
            aiStatus.textContent = statuses[statusIndex];
            statusIndex++;
        }
    }, 2000);
    
    // Animate progress bar
    progressInterval = setInterval(() => {
        if (progress < 90) {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            if (aiProgressFill) {
                aiProgressFill.style.width = `${progress}%`;
            }
        }
    }, 800);
}

function stopAIProcessing() {
    if (processingInterval) {
        clearInterval(processingInterval);
        processingInterval = null;
    }
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    
    // Complete the progress bar
    if (aiProgressFill) {
        aiProgressFill.style.width = '100%';
    }
    if (aiStatus) {
        aiStatus.textContent = 'Complete!';
    }
}


// ── Render Output ─────────────────────────────────────────
function renderOutput(text, template, title, date, attendeesStr) {
    if (outputContent) {
        outputContent.innerHTML = textToHtml(text, title, date, attendeesStr);
        // Re-initialize icons in output
        setTimeout(() => initializeLucideIcons(), 100);
    }
}

function textToHtml(text, title, date, attendeesStr) {
    const lines = text.split('\n');
    let html = '';
    
    // Escape HTML to prevent XSS
    const esc = (s) => s.replace(/&/g, '&amp;')
                         .replace(/</g, '&lt;')
                         .replace(/>/g, '&gt;')
                         .replace(/"/g, '&quot;');
    
    // Header
    html += `<h1>${esc(title)}</h1>`;
    html += `<div class="meta-info">`;
    html += `<p><strong>Date:</strong> ${esc(date)}</p>`;
    html += `<p><strong>Attendees:</strong> ${esc(attendeesStr)}</p>`;
    html += `</div>`;
    
    let inList = false;
    let listItems = [];
    let inActionItems = false;
    let actionItems = [];
    let inAssignments = false;
    let assignments = [];
    
    const flushLists = () => {
        if (inList) {
            html += `<ul>${listItems.join('')}</ul>`;
            listItems = [];
            inList = false;
        }
        if (inActionItems) {
            html += `<div class="action-items">${actionItems.join('')}</div>`;
            actionItems = [];
            inActionItems = false;
        }
        if (inAssignments) {
            html += `<div class="assignments">${assignments.join('')}</div>`;
            assignments = [];
            inAssignments = false;
        }
    };
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Detect headers
        const isHeader = line.startsWith('#') ||
            (line === line.toUpperCase() && line.length > 3 && /[A-Z]/.test(line)) ||
            /^[A-Z][A-Z\s]+:$/.test(line);
        
        if (isHeader) {
            flushLists();
            const sectionName = line.replace(/^#+\s*/, '').replace(/:$/, '');
            html += `<h2>${esc(sectionName)}</h2>`;
            
            const lower = sectionName.toLowerCase();
            inActionItems = lower.includes('action') || lower.includes('next step') || lower.includes('to-do');
            inAssignments = lower.includes('assign') || lower.includes('responsib');
            
        } else if (/^[-•*]\s/.test(line) || /^\d+\.\s/.test(line)) {
            const content = esc(line.replace(/^[-•*\d.]\s*/, ''));
            
            if (inActionItems) {
                actionItems.push(`<div class="action-item"><span class="label">✓</span>${content}</div>`);
            } else if (inAssignments) {
                assignments.push(`<div class="assignment-item"><span class="label">→</span>${content}</div>`);
            } else {
                listItems.push(`<li>${content}</li>`);
                inList = true;
            }
        } else {
            flushLists();
            html += `<p>${esc(line)}</p>`;
        }
    }
    
    flushLists();
    return html;
}

// ── Error Helpers ─────────────────────────────────────────
function showError(msg) {
    if (errorMessage) errorMessage.textContent = msg;
    show(errorState);
    hide(outputSection);
    setTimeout(() => initializeLucideIcons(), 50);
}

function hideError() {
    hide(errorState);
}

// ── Visibility Helpers ────────────────────────────────────
function show(el) {
    if (el) el.classList.remove('hidden');
}

function hide(el) {
    if (el) el.classList.add('hidden');
}


// ── Export Functions ──────────────────────────────────────
function buildPdfExportMarkup() {
    const title = meetingTitle?.value?.trim() || 'Meeting Notes';
    const date = meetingDate?.value?.trim() || 'Not specified';
    const attendeesStr = attendees?.value?.trim() || 'Not specified';
    const bodyHtml = textToHtml(generatedNotes, title, date, attendeesStr);

    return `
        <div class="briefly-pdf-export" style="font-family: Arial, Helvetica, sans-serif; color: #111827; background: #ffffff; width: 100%; min-height: 100%; box-sizing: border-box;">
            <style>
                .briefly-pdf-export {
                    padding: 24px 28px;
                    line-height: 1.5;
                }
                .briefly-pdf-export h1 {
                    margin: 0 0 16px;
                    font-size: 28px;
                    line-height: 1.2;
                    color: #111827;
                }
                .briefly-pdf-export .meta-info {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 18px;
                    padding: 12px 0 18px;
                    margin-bottom: 18px;
                    border-bottom: 1px solid #d1d5db;
                }
                .briefly-pdf-export .meta-info p {
                    margin: 0;
                    font-size: 13px;
                    color: #374151;
                }
                .briefly-pdf-export .meta-info strong {
                    color: #111827;
                }
                .briefly-pdf-export h2 {
                    margin: 24px 0 12px;
                    font-size: 12px;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: #6b7280;
                    border-bottom: 1px solid #d1d5db;
                    padding-bottom: 6px;
                }
                .briefly-pdf-export p,
                .briefly-pdf-export li,
                .briefly-pdf-export .action-item,
                .briefly-pdf-export .assignment-item {
                    font-size: 14px;
                    color: #111827;
                    line-height: 1.65;
                }
                .briefly-pdf-export p {
                    margin: 0 0 12px;
                }
                .briefly-pdf-export ul {
                    padding-left: 18px;
                    margin: 0 0 14px;
                }
                .briefly-pdf-export li {
                    margin-bottom: 6px;
                }
                .briefly-pdf-export .action-items,
                .briefly-pdf-export .assignments {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin: 0 0 14px;
                }
                .briefly-pdf-export .action-item,
                .briefly-pdf-export .assignment-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 10px 12px;
                    background: #ecfdf5;
                    border: 1px solid #a7f3d0;
                    border-radius: 8px;
                }
                .briefly-pdf-export .action-item .label,
                .briefly-pdf-export .assignment-item .label {
                    font-weight: 700;
                    color: #047857;
                }
            </style>
            ${bodyHtml}
        </div>
    `;
}

async function copyNotes() {
    if (!generatedNotes) return;
    
    try {
        await navigator.clipboard.writeText(generatedNotes);
        
        // Visual feedback
        if (copyNotesBtn) {
            const originalHTML = copyNotesBtn.innerHTML;
            copyNotesBtn.innerHTML = `<i data-lucide="check" style="width: 14px; height: 14px;"></i><span>Copied!</span>`;
            initializeLucideIcons();
            
            setTimeout(() => {
                copyNotesBtn.innerHTML = originalHTML;
                initializeLucideIcons();
            }, 2000);
        }
    } catch (err) {
        console.error('Clipboard write failed:', err);
        showError('Could not copy to clipboard. Please select and copy manually.');
    }
}

function downloadTxt() {
    if (!generatedNotes) return;
    
    const blob = new Blob([generatedNotes], { type: 'text/plain;charset=utf-8' });
    triggerDownload(blob, buildFileName('txt'));
}

async function downloadWord() {
    if (!window.docx) {
        showError('Word export library failed to load. Please refresh and try again.');
        return;
    }
    
    try {
        const { Document, Packer, Paragraph, HeadingLevel } = window.docx;
        const children = [];
        
        for (let line of generatedNotes.split('\n')) {
            line = line.trim();
            if (!line) continue;
            
            if (line === line.toUpperCase() && line.length > 3 && /[A-Z]/.test(line)) {
                children.push(new Paragraph({
                    text: line,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 240, after: 120 }
                }));
            } else if (/^[-•*]\s/.test(line)) {
                children.push(new Paragraph({
                    text: line.replace(/^[-•*]\s*/, ''),
                    bullet: { level: 0 },
                    spacing: { after: 60 }
                }));
            } else {
                children.push(new Paragraph({
                    text: line,
                    spacing: { after: 120 }
                }));
            }
        }
        
        const doc = new Document({
            sections: [{
                properties: {},
                children: children
            }]
        });
        
        const blob = await Packer.toBlob(doc);
        triggerDownload(blob, buildFileName('docx'));
        
    } catch (err) {
        console.error('Word export error:', err);
        showError('Failed to generate Word document. Please try again.');
    }
}

async function downloadPdf() {
    if (!generatedNotes) {
        showError('There are no notes available to export yet.');
        return;
    }

    const title = meetingTitle?.value.trim() || 'Meeting Notes';
    const date = meetingDate?.value.trim() || 'Not specified';
    const attendeesStr = attendees?.value.trim() || 'Not specified';

    const jsPdfLib = window.jspdf?.jsPDF;
    if (jsPdfLib) {
        try {
            const doc = new jsPdfLib({ unit: 'pt', format: 'letter', orientation: 'portrait' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 40;
            const maxTextWidth = pageWidth - margin * 2;
            let y = 48;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text(title, margin, y);
            y += 24;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text(`Date: ${date}`, margin, y);
            y += 16;
            doc.text(`Attendees: ${attendeesStr}`, margin, y);
            y += 24;

            const lines = generatedNotes.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) {
                    y += 10;
                    continue;
                }

                if (trimmed.startsWith('#')) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(13);
                } else {
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(11);
                }

                const wrapped = doc.splitTextToSize(trimmed, maxTextWidth);
                for (const wrappedLine of wrapped) {
                    if (y > pageHeight - margin) {
                        doc.addPage();
                        y = margin;
                    }
                    doc.text(wrappedLine, margin, y);
                    y += 14;
                }
            }

            doc.save(buildFileName('pdf'));
        } catch (err) {
            console.error('jsPDF export error:', err);
            showError('Failed to generate PDF. Please try again.');
        }
        return;
    }

    if (typeof html2pdf === 'undefined') {
        showError('PDF export library failed to load. Please refresh and try again.');
        return;
    }

    const pdfContent = document.createElement('div');
    pdfContent.innerHTML = buildPdfExportMarkup();
    pdfContent.style.cssText = [
        'position: fixed',
        'left: 0',
        'top: 0',
        'width: 760px',
        'max-width: 760px',
        'min-height: 1px',
        'background: #FFFFFF',
        'opacity: 1',
        'visibility: visible',
        'display: block',
        'overflow: visible',
        'transform: none',
        'z-index: 2147483647',
        'pointer-events: none',
        'box-sizing: border-box',
        'backdrop-filter: none',
        '-webkit-backdrop-filter: none'
    ].join(';');

    document.body.appendChild(pdfContent);

    const opt = {
        margin: [0.6, 0.7],
        filename: buildFileName('pdf'),
        image: { type: 'jpeg', quality: 0.97 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#FFFFFF',
            logging: false,
            removeContainer: true,
            scrollX: 0,
            scrollY: 0,
            width: 760,
            height: pdfContent.scrollHeight
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
        await html2pdf().set(opt).from(pdfContent).save();
    } catch (err) {
        console.error('PDF export error:', err);
        showError('Failed to generate PDF. Please try again.');
    } finally {
        pdfContent.remove();
    }
}

// ── Download Helper ───────────────────────────────────────
function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
        href: url,
        download: filename
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function buildFileName(ext) {
    const slug = (meetingTitle?.value.trim() || 'meeting-notes')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    const date = new Date().toISOString().split('T')[0];
    return `${slug}-${date}.${ext}`;
}

// ── Initialize Lucide Icons ───────────────────────────────
function initializeLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ── Demo Video Modal (Future Enhancement) ─────────────────
const watchDemoBtn = document.getElementById('watchDemo');
if (watchDemoBtn) {
    watchDemoBtn.addEventListener('click', () => {
        // Future: Show demo video modal
        alert('Demo video coming soon! 🎬');
    });
}

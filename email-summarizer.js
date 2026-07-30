// ── DOM Elements ──────────────────────────────────────────
const navbar = document.getElementById('navbar');
const emailSubject = document.getElementById('emailSubject');
const emailParticipants = document.getElementById('emailParticipants');
const emailThreadInput = document.getElementById('emailThreadInput');
const generateSummaryBtn = document.getElementById('generateSummaryBtn');

const step1Progress = document.getElementById('step1Progress');
const step2Progress = document.getElementById('step2Progress');
const step3Progress = document.getElementById('step3Progress');
const progressLineFill = document.getElementById('progressLineFill');

const loadingState = document.getElementById('loadingState');
const aiProgressFill = document.getElementById('aiProgressFill');
const aiStatus = document.getElementById('aiStatus');
const aiTime = document.getElementById('aiTime');

const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const retryButton = document.getElementById('retryButton');

const outputSection = document.getElementById('outputSection');
const outputContent = document.getElementById('outputContent');
const copySummaryBtn = document.getElementById('copySummary');

let generatedSummary = '';

// ── Bootstrap ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initializeNavbar();
    if (document.getElementById('email-app')) {
        initializeProgress();
        initializeEventListeners();
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
    [emailSubject, emailParticipants].forEach(field => {
        field?.addEventListener('input', updateProgress);
    });
    emailThreadInput?.addEventListener('input', updateProgress);
}

function updateProgress() {
    const hasContext = emailSubject?.value || emailParticipants?.value;
    const hasThread = emailThreadInput?.value;
    
    if (hasContext && hasThread) {
        setProgressStep(2);
    } else if (hasContext || hasThread) {
        setProgressStep(1);
    } else {
        setProgressStep(1);
        progressLineFill.style.width = '0%';
    }
}

function setProgressStep(step) {
    [step1Progress, step2Progress, step3Progress].forEach(s => {
        s?.classList.remove('active', 'completed');
    });
    
    if (step >= 1) {
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

// ── Event Listeners ───────────────────────────────────────
function initializeEventListeners() {
    generateSummaryBtn?.addEventListener('click', generateSummary);
    retryButton?.addEventListener('click', generateSummary);
    copySummaryBtn?.addEventListener('click', copySummary);
}

function initializeLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ── Visibility Helpers ────────────────────────────────────
function show(el) {
    if (el) el.classList.remove('hidden');
}

function hide(el) {
    if (el) el.classList.add('hidden');
}

// ── API Integration ───────────────────────────────────────
async function generateSummary() {
    const thread = emailThreadInput?.value?.trim();
    if (!thread) {
        showError('Please paste an email thread to summarize.');
        emailThreadInput.focus();
        return;
    }

    const subject = emailSubject?.value?.trim() || '';
    const participants = emailParticipants?.value?.trim() || '';

    // UI Updates
    hide(errorState);
    hide(outputSection);
    show(loadingState);
    generateSummaryBtn.disabled = true;
    
    // Simulate loading progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        if (aiProgressFill) aiProgressFill.style.width = `${progress}%`;
        
        if (progress > 30) aiStatus.textContent = 'Identifying key points...';
        if (progress > 60) aiStatus.textContent = 'Extracting action items...';
        if (progress > 80) aiStatus.textContent = 'Finalizing summary...';
    }, 800);

    try {
        const response = await fetch('/api/summarize-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ thread, subject, participants })
        });

        const data = await response.json();
        clearInterval(progressInterval);

        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate summary');
        }

        if (aiProgressFill) aiProgressFill.style.width = '100%';
        aiStatus.textContent = 'Summary complete!';
        
        setTimeout(() => {
            hide(loadingState);
            generatedSummary = data.summary;
            displaySummary(generatedSummary);
            setProgressStep(3);
            generateSummaryBtn.disabled = false;
        }, 500);

    } catch (err) {
        clearInterval(progressInterval);
        hide(loadingState);
        generateSummaryBtn.disabled = false;
        showError(err.message || 'An unexpected error occurred. Please try again.');
    }
}

function showError(msg) {
    if (errorMessage) errorMessage.textContent = msg;
    show(errorState);
    
    // Scroll to error
    errorState?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function displaySummary(text) {
    if (!outputContent) return;
    
    // Convert basic markdown-like text to HTML
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
    // Format headers (e.g. EXECUTIVE SUMMARY)
    html = html.replace(/([A-Z\s]+)<br>/g, (match, p1) => {
        if (p1.trim().length > 3 && p1 === p1.toUpperCase()) {
            return `<h2>${p1}</h2>`;
        }
        return match;
    });
        
    outputContent.innerHTML = `<p>${html}</p>`;
    show(outputSection);
    
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function copySummary() {
    if (!generatedSummary) return;
    
    try {
        await navigator.clipboard.writeText(generatedSummary);
        if (copySummaryBtn) {
            const originalHTML = copySummaryBtn.innerHTML;
            copySummaryBtn.innerHTML = `<i data-lucide="check" style="width: 14px; height: 14px;"></i><span>Copied!</span>`;
            initializeLucideIcons();
            
            setTimeout(() => {
                copySummaryBtn.innerHTML = originalHTML;
                initializeLucideIcons();
            }, 2000);
        }
    } catch (err) {
        console.error('Failed to copy text:', err);
    }
}

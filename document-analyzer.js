// ── DOM Elements ──────────────────────────────────────────
const navbar = document.getElementById('navbar');
const docUpload = document.getElementById('docUpload');
const uploadResult = document.getElementById('uploadResult');
const uploadFileName = document.getElementById('uploadFileName');
const uploadFileSize = document.getElementById('uploadFileSize');
const uploadRemove = document.getElementById('uploadRemove');
const docTextInput = document.getElementById('docTextInput');

const generateAnalysisBtn = document.getElementById('generateAnalysisBtn');

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
const copyAnalysisBtn = document.getElementById('copyAnalysis');

let generatedAnalysis = '';
let selectedFile = null;

// ── Bootstrap ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initializeNavbar();
    if (document.getElementById('doc-app')) {
        initializeProgress();
        initializeTabs();
        initializeUpload();
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
            updateProgress();
            setTimeout(() => initializeLucideIcons(), 50);
        });
    });
}

// ── File Upload ───────────────────────────────────────────
function initializeUpload() {
    if (!docUpload) return;
    
    docUpload.addEventListener('change', handleFileUpload);
    
    uploadRemove?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectedFile = null;
        docUpload.value = '';
        hide(uploadResult);
        updateProgress();
    });
    
    // Drag and drop
    const dropZone = document.querySelector('.upload-zone');
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-active');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-active');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-active');
            
            if (e.dataTransfer.files.length) {
                docUpload.files = e.dataTransfer.files;
                handleFileUpload();
            }
        });
    }
}

function handleFileUpload() {
    const file = docUpload?.files[0];
    if (file) {
        selectedFile = file;
        if (uploadFileName) uploadFileName.textContent = file.name;
        if (uploadFileSize) uploadFileSize.textContent = formatBytes(file.size);
        
        // Update icon based on type
        const iconWrap = document.querySelector('.upload-file-icon');
        if (iconWrap) {
            let iconName = 'file-text';
            if (file.type.includes('pdf')) iconName = 'file-text'; // or file-pdf if lucide has it
            else if (file.type.includes('word')) iconName = 'file-type';
            
            iconWrap.innerHTML = `<i data-lucide="${iconName}" style="width: 18px; height: 18px;"></i>`;
            initializeLucideIcons();
        }
        
        show(uploadResult);
    } else {
        hide(uploadResult);
    }
    updateProgress();
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ── Progress Indicator ────────────────────────────────────
function initializeProgress() {
    docTextInput?.addEventListener('input', updateProgress);
    
    const analysisOptions = document.querySelectorAll('input[name="analysisType"]');
    analysisOptions.forEach(opt => opt.addEventListener('change', updateProgress));
}

function updateProgress() {
    const activeTabBtn = document.querySelector('.tab-btn.active');
    const isUploadTab = activeTabBtn?.dataset.tab === 'upload';
    
    const hasDocument = isUploadTab ? !!selectedFile : !!(docTextInput?.value?.trim());
    
    const selectedAnalysis = document.querySelector('input[name="analysisType"]:checked');
    const hasAnalysis = !!selectedAnalysis;
    
    if (hasDocument && hasAnalysis) {
        setProgressStep(2);
    } else if (hasDocument) {
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
    generateAnalysisBtn?.addEventListener('click', generateAnalysis);
    retryButton?.addEventListener('click', generateAnalysis);
    copyAnalysisBtn?.addEventListener('click', copyAnalysis);
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
async function generateAnalysis() {
    const activeTabBtn = document.querySelector('.tab-btn.active');
    const isUploadTab = activeTabBtn?.dataset.tab === 'upload';
    
    const analysisType = document.querySelector('input[name="analysisType"]:checked')?.value || 'summary';
    
    const formData = new FormData();
    formData.append('analysisType', analysisType);
    
    if (isUploadTab) {
        if (!selectedFile) {
            showError('Please upload a document to analyze.');
            return;
        }
        
        // Check file size (10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            showError('File size exceeds the 10MB limit. Please upload a smaller document.');
            return;
        }
        
        formData.append('document', selectedFile);
    } else {
        const text = docTextInput?.value?.trim();
        if (!text) {
            showError('Please paste document text to analyze.');
            docTextInput.focus();
            return;
        }
        formData.append('pastedText', text);
    }

    // UI Updates
    hide(errorState);
    hide(outputSection);
    show(loadingState);
    generateAnalysisBtn.disabled = true;
    
    // Simulate loading progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 90) progress = 90;
        if (aiProgressFill) aiProgressFill.style.width = `${progress}%`;
        
        if (progress > 20) aiStatus.textContent = 'Extracting text...';
        if (progress > 50) aiStatus.textContent = 'Analyzing content...';
        if (progress > 80) aiStatus.textContent = 'Formatting results...';
    }, 800);

    try {
        // Send multipart/form-data request
        const response = await fetch('/api/analyze-document', {
            method: 'POST',
            body: formData // fetch automatically sets the correct Content-Type for FormData
        });

        const data = await response.json();
        clearInterval(progressInterval);

        if (!response.ok) {
            throw new Error(data.error || 'Failed to analyze document');
        }

        if (aiProgressFill) aiProgressFill.style.width = '100%';
        aiStatus.textContent = 'Analysis complete!';
        
        setTimeout(() => {
            hide(loadingState);
            generatedAnalysis = data.analysis;
            displayAnalysis(generatedAnalysis);
            setProgressStep(3);
            generateAnalysisBtn.disabled = false;
        }, 500);

    } catch (err) {
        clearInterval(progressInterval);
        hide(loadingState);
        generateAnalysisBtn.disabled = false;
        showError(err.message || 'An unexpected error occurred. Please try again.');
    }
}

function showError(msg) {
    if (errorMessage) errorMessage.textContent = msg;
    show(errorState);
    errorState?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function displayAnalysis(text) {
    if (!outputContent) return;
    
    // Convert basic markdown-like text to HTML
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
    // Format headers
    html = html.replace(/([A-Z\s]+)<br>/g, (match, p1) => {
        if (p1.trim().length > 3 && p1 === p1.toUpperCase()) {
            return `<h2>${p1}</h2>`;
        }
        return match;
    });
    
    // Format ordered lists (1. 2. 3.) roughly
    html = html.replace(/(\d+\.)\s(.*?)(?:<br>|<\/p>)/g, (match, number, item) => {
        return `<div style="margin-bottom: 8px;"><strong>${number}</strong> ${item}</div>`;
    });
        
    outputContent.innerHTML = `<p>${html}</p>`;
    show(outputSection);
    
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function copyAnalysis() {
    if (!generatedAnalysis) return;
    
    try {
        await navigator.clipboard.writeText(generatedAnalysis);
        if (copyAnalysisBtn) {
            const originalHTML = copyAnalysisBtn.innerHTML;
            copyAnalysisBtn.innerHTML = `<i data-lucide="check" style="width: 14px; height: 14px;"></i><span>Copied!</span>`;
            initializeLucideIcons();
            
            setTimeout(() => {
                copyAnalysisBtn.innerHTML = originalHTML;
                initializeLucideIcons();
            }, 2000);
        }
    } catch (err) {
        console.error('Failed to copy text:', err);
    }
}

/**
 * PotholeAI - Modern AI Dashboard JavaScript
 * Interactive functionality and UX enhancements
 */

// ===== Global State =====
const state = {
    currentPage: 'dashboard',
    currentTheme: localStorage.getItem('theme') || 'light',
    sidebarCollapsed: false,
    isStreaming: false,
    selectedFile: null,
    detectionResults: null
};

// ===== DOM Elements =====
const elements = {
    sidebar: null,
    sidebarToggle: null,
    mobileMenuBtn: null,
    navItems: null,
    pageContents: null,
    pageTitle: null,
    themeToggle: null,
    // Upload
    uploadArea: null,
    dropzone: null,
    fileInput: null,
    previewContainer: null,
    previewImage: null,
    previewFilename: null,
    previewSize: null,
    removePreview: null,
    processingContainer: null,
    progressFill: null,
    progressText: null,
    successContainer: null,
    detectBtn: null,
    // Live Video
    videoInput: null,
    uploadVideoBtn: null,
    liveVideo: null,
    videoPlaceholder: null,
    videoOverlay: null,
    videoControls: null,
    startStreamBtn: null,
    stopStreamBtn: null,
    streamStatus: null,
    statusIndicator: null,
    statusText: null,
    videoStats: null,
    videoInfo: null,
    overlayDetection: null,
    // Results
    resultsOverlay: null,
    closeResults: null,
    // Settings
    confidenceSlider: null,
    confidenceValue: null,
    lineWidthSlider: null,
    lineWidthValue: null,
    showLabels: null,
    showConfidence: null,
    darkModeToggle: null,
    compactModeToggle: null,
    // Toast
    toastContainer: null
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    initializeTheme();
    initializeNavigation();
    initializeSidebar();
    initializeUpload();
    initializeLiveVideo();
    initializeResults();
    initializeSettings();
    initializeCharts();
    initializeCounters();
    
    // Check if results should be shown (set by Flask template)
    if (window.showResultsOnLoad) {
        showResultsOverlay();
    }
});

// ===== Element Initialization =====
function initializeElements() {
    elements.sidebar = document.getElementById('sidebar');
    elements.sidebarToggle = document.getElementById('sidebarToggle');
    elements.mobileMenuBtn = document.getElementById('mobileMenuBtn');
    elements.navItems = document.querySelectorAll('.nav-item');
    elements.pageContents = document.querySelectorAll('.page-content');
    elements.pageTitle = document.getElementById('pageTitle');
    elements.themeToggle = document.getElementById('themeToggle');
    
    // Upload
    elements.uploadArea = document.getElementById('uploadArea');
    elements.dropzone = document.getElementById('dropzone');
    elements.fileInput = document.getElementById('fileInput');
    elements.previewContainer = document.getElementById('previewContainer');
    elements.previewImage = document.getElementById('previewImage');
    elements.previewFilename = document.getElementById('previewFilename');
    elements.previewSize = document.getElementById('previewSize');
    elements.removePreview = document.getElementById('removePreview');
    elements.processingContainer = document.getElementById('processingContainer');
    elements.progressFill = document.getElementById('progressFill');
    elements.progressText = document.getElementById('progressText');
    elements.successContainer = document.getElementById('successContainer');
    elements.detectBtn = document.getElementById('detectBtn');
    
    // Live Video
    elements.videoInput = document.getElementById('videoInput');
    elements.uploadVideoBtn = document.getElementById('uploadVideoBtn');
    elements.liveVideo = document.getElementById('liveVideo');
    elements.videoPlaceholder = document.getElementById('videoPlaceholder');
    elements.videoOverlay = document.getElementById('videoOverlay');
    elements.videoControls = document.getElementById('videoControls');
    elements.startStreamBtn = document.getElementById('startStreamBtn');
    elements.stopStreamBtn = document.getElementById('stopStreamBtn');
    elements.streamStatus = document.getElementById('streamStatus');
    elements.statusIndicator = elements.streamStatus?.querySelector('.status-indicator');
    elements.statusText = elements.streamStatus?.querySelector('.status-text');
    elements.videoStats = document.getElementById('videoStats');
    elements.videoInfo = document.getElementById('videoInfo');
    elements.overlayDetection = document.getElementById('overlayDetection');
    
    // Results
    elements.resultsOverlay = document.getElementById('resultsOverlay');
    elements.closeResults = document.getElementById('closeResults');
    
    // Settings
    elements.confidenceSlider = document.getElementById('confidenceSlider');
    elements.confidenceValue = document.getElementById('confidenceValue');
    elements.lineWidthSlider = document.getElementById('lineWidthSlider');
    elements.lineWidthValue = document.getElementById('lineWidthValue');
    elements.showLabels = document.getElementById('showLabels');
    elements.showConfidence = document.getElementById('showConfidence');
    elements.darkModeToggle = document.getElementById('darkModeToggle');
    elements.compactModeToggle = document.getElementById('compactModeToggle');
    
    // Toast
    elements.toastContainer = document.getElementById('toastContainer');
}

// ===== Theme Management =====
function initializeTheme() {
    document.documentElement.setAttribute('data-theme', state.currentTheme);
    
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
    }
    
    if (elements.darkModeToggle) {
        elements.darkModeToggle.checked = state.currentTheme === 'dark';
        elements.darkModeToggle.addEventListener('change', handleDarkModeToggle);
    }
}

function toggleTheme() {
    state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.currentTheme);
    localStorage.setItem('theme', state.currentTheme);
    
    if (elements.darkModeToggle) {
        elements.darkModeToggle.checked = state.currentTheme === 'dark';
    }
    
    showToast('Theme changed', `Switched to ${state.currentTheme} mode`, 'info');
}

function handleDarkModeToggle() {
    state.currentTheme = elements.darkModeToggle.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.currentTheme);
    localStorage.setItem('theme', state.currentTheme);
}

// ===== Navigation =====
function initializeNavigation() {
    const pageTitles = {
        'dashboard': 'Dashboard',
        'upload': 'Upload Image',
        'live': 'Live Detection',
        'history': 'History',
        'settings': 'Settings'
    };
    
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
}

function navigateTo(page) {
    state.currentPage = page;
    
    // Update nav items
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Update page contents
    elements.pageContents.forEach(content => {
        content.classList.toggle('active', content.id === `${page}Page`);
    });
    
    // Update page title
    const pageTitles = {
        'dashboard': 'Dashboard',
        'upload': 'Upload Image',
        'live': 'Live Detection',
        'history': 'History',
        'settings': 'Settings'
    };
    
    if (elements.pageTitle) {
        elements.pageTitle.textContent = pageTitles[page] || 'Dashboard';
    }
    
    // Close mobile sidebar
    if (elements.sidebar) {
        elements.sidebar.classList.remove('open');
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Load history data when navigating to history page
    if (page === 'history') {
        loadHistoryPage();
    }
}

// ===== History Page =====
let historyData = []; // Store history globally for filtering

async function loadHistoryPage() {
    const historyGrid = document.getElementById('historyGrid');
    if (!historyGrid) return;
    
    try {
        // Fetch history from API
        const response = await fetch('/api/history');
        historyData = await response.json();
        
        // Initialize filters
        initializeHistoryFilters();
        
        // Initial render (All)
        renderHistoryItems(historyData);
        
    } catch (error) {
        console.error('Error loading history:', error);
        renderHistoryError();
    }
}

function initializeHistoryFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.onclick = () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            filterHistory(filter);
        };
    });
}

function filterHistory(filter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let filtered = historyData;
    
    if (filter === 'today') {
        filtered = historyData.filter(item => {
            const date = new Date(item.timestamp);
            return date >= today;
        });
    } else if (filter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = historyData.filter(item => {
            const date = new Date(item.timestamp);
            return date >= weekAgo;
        });
    } else if (filter === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filtered = historyData.filter(item => {
            const date = new Date(item.timestamp);
            return date >= monthAgo;
        });
    }
    
    renderHistoryItems(filtered);
}

function renderHistoryItems(items) {
    const historyGrid = document.getElementById('historyGrid');
    if (!historyGrid) return;

    if (!items || items.length === 0) {
        historyGrid.innerHTML = `
            <div class="history-empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                <h3>No Detections Found</h3>
                <p>No history items match the selected filter</p>
            </div>
        `;
        return;
    }
    
    // Generate history items HTML
    historyGrid.innerHTML = items.map(item => {
        const date = new Date(item.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        const formattedTime = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const typeIcon = item.type === 'video' ? 
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>' :
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
        
        return `
            <div class="history-card">
                <div class="history-card-header">
                    <div class="history-type-icon">${typeIcon}</div>
                    <div class="history-info">
                        <h4>${item.filename || 'Unknown'}</h4>
                        <span class="history-time">${formattedDate} at ${formattedTime}</span>
                    </div>
                    <div class="history-count ${item.count > 0 ? 'has-detections' : ''}">
                        <span class="count-number">${item.count}</span>
                        <span class="count-label">pothole${item.count !== 1 ? 's' : ''}</span>
                    </div>
                </div>
                <div class="history-card-footer">
                    <span class="history-type">${item.type || 'image'}</span>
                    ${item.confidence ? `<span class="history-conf">${(item.confidence * 100).toFixed(0)}% accuracy</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderHistoryError() {
    const historyGrid = document.getElementById('historyGrid');
    if (historyGrid) {
        historyGrid.innerHTML = `
            <div class="history-empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h3>Error Loading History</h3>
                <p>Could not load detection history. Please try again.</p>
            </div>
        `;
    }
}

// ===== Sidebar =====
function initializeSidebar() {
    if (elements.sidebarToggle) {
        elements.sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    if (elements.mobileMenuBtn) {
        elements.mobileMenuBtn.addEventListener('click', toggleMobileSidebar);
    }
}

function toggleSidebar() {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    elements.sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
}

function toggleMobileSidebar() {
    elements.sidebar.classList.toggle('open');
}

// ===== Upload Functionality =====
function initializeUpload() {
    if (!elements.dropzone || !elements.fileInput) return;
    
    // Click to browse
    elements.dropzone.addEventListener('click', () => {
        elements.fileInput.click();
    });
    
    // File input change
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    elements.dropzone.addEventListener('dragover', handleDragOver);
    elements.dropzone.addEventListener('dragleave', handleDragLeave);
    elements.dropzone.addEventListener('drop', handleDrop);
    
    // Remove preview
    if (elements.removePreview) {
        elements.removePreview.addEventListener('click', clearPreview);
    }
    
    // Detect button
    if (elements.detectBtn) {
        elements.detectBtn.addEventListener('click', submitForDetection);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFile(file) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Invalid file type', 'Please upload an image file (JPG, PNG, GIF, BMP, WebP)', 'error');
        return;
    }
    
    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
        showToast('File too large', 'Maximum file size is 100MB', 'error');
        return;
    }
    
    state.selectedFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.previewImage.src = e.target.result;
        elements.previewFilename.textContent = file.name;
        elements.previewSize.textContent = formatFileSize(file.size);
        
        elements.dropzone.style.display = 'none';
        elements.previewContainer.style.display = 'block';
        elements.processingContainer.style.display = 'none';
        elements.successContainer.style.display = 'none';
        
        elements.detectBtn.disabled = false;
    };
    reader.readAsDataURL(file);
}

function clearPreview() {
    state.selectedFile = null;
    elements.fileInput.value = '';
    elements.previewContainer.style.display = 'none';
    elements.dropzone.style.display = 'block';
    elements.detectBtn.disabled = true;
}

async function submitForDetection() {
    if (!state.selectedFile) return;
    
    // Show processing state
    elements.previewContainer.style.display = 'none';
    elements.processingContainer.style.display = 'block';
    elements.detectBtn.disabled = true;
    
    // Animate progress
    simulateProgress();
    
    // Prepare form data
    const formData = new FormData();
    formData.append('file', state.selectedFile);
    
    try {
        const response = await fetch('/upload_ajax', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update results in the modal
            const originalImg = document.getElementById('originalImg');
            const resultImg = document.getElementById('resultImg');
            
            if (originalImg) originalImg.src = data.original_image;
            if (resultImg) resultImg.src = data.result_image;
            
            // Update stats in modal using specific IDs
            const resNumDetections = document.getElementById('resNumDetections');
            const resAvgConf = document.getElementById('resAvgConf');
            const resProcTime = document.getElementById('resProcTime');
            
            if (resNumDetections) resNumDetections.textContent = data.num_detections;
            if (resAvgConf) resAvgConf.textContent = `${data.avg_confidence}%`;
            if (resProcTime) resProcTime.textContent = `${data.processing_time}ms`;

            // Update confidence meter using specific IDs
            const resConfHigh = document.getElementById('resConfHigh');
            const resConfMedium = document.getElementById('resConfMedium');
            const resConfLow = document.getElementById('resConfLow');
            
            const meterBars = document.querySelector('.meter-bars');
            if (meterBars && data.conf_dist) {
                const fills = meterBars.querySelectorAll('.bar-fill');
                if (fills.length >= 3) {
                    fills[0].style.width = `${data.conf_dist.high}%`;
                    fills[1].style.width = `${data.conf_dist.medium}%`;
                    fills[2].style.width = `${data.conf_dist.low}%`;
                }
                
                if (resConfHigh) resConfHigh.textContent = `${Math.round(data.conf_dist.high)}%`;
                if (resConfMedium) resConfMedium.textContent = `${Math.round(data.conf_dist.medium)}%`;
                if (resConfLow) resConfLow.textContent = `${Math.round(data.conf_dist.low)}%`;
            }
            
            // Show results overlay
            showResultsOverlay();
            
            // Show success animation
            elements.processingContainer.style.display = 'none';
            elements.successContainer.style.display = 'block';
            
            setTimeout(() => {
                elements.successContainer.style.display = 'none';
                elements.dropzone.style.display = 'block';
                elements.detectBtn.disabled = true;
                state.selectedFile = null;
                elements.fileInput.value = '';
            }, 2000);
            
            showToast('Success', 'Potholes detected successfully', 'success');
        } else {
            showToast('Error', data.error || 'Detection failed', 'error');
            elements.processingContainer.style.display = 'none';
            elements.previewContainer.style.display = 'block';
            elements.detectBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error', 'Connection failed during detection', 'error');
        elements.processingContainer.style.display = 'none';
        elements.previewContainer.style.display = 'block';
        elements.detectBtn.disabled = false;
    }
}

function simulateProgress() {
    let progress = 0;
    const messages = [
        'Analyzing image...',
        'Running YOLOv8 model...',
        'Detecting potholes...',
        'Drawing bounding boxes...',
        'Finalizing results...'
    ];
    
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        
        elements.progressFill.style.width = `${progress}%`;
        elements.progressText.textContent = messages[Math.floor(progress / 25)] || messages[messages.length - 1];
        
        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 400);
}

// ===== Live Video =====
function initializeLiveVideo() {
    if (!elements.uploadVideoBtn || !elements.videoInput) return;
    
    elements.uploadVideoBtn.addEventListener('click', () => {
        elements.videoInput.click();
    });
    
    elements.videoInput.addEventListener('change', handleVideoSelect);
    
    if (elements.startStreamBtn) {
        elements.startStreamBtn.addEventListener('click', startVideoStream);
    }
    
    if (elements.stopStreamBtn) {
        elements.stopStreamBtn.addEventListener('click', stopVideoStream);
    }
}

function handleVideoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate video type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Invalid file type', 'Please upload a video file (MP4, AVI, MOV, MKV, WebM)', 'error');
        // Reset input
        e.target.value = '';
        return;
    }
    
    // Show video info
    if (elements.videoInfo) {
        document.getElementById('videoFilename').textContent = file.name;
        elements.videoInfo.style.display = 'block';
    }
    
    // Show controls
    if (elements.videoControls) {
        elements.videoControls.style.display = 'flex';
    }
    
    showToast('Video loaded', `${file.name} is ready for streaming`, 'success');
}

async function startVideoStream() {
    if (!elements.videoInput || !elements.videoInput.files[0]) {
        showToast('No video selected', 'Please select a video file first', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('video', elements.videoInput.files[0]);
    
    // Show loading state
    if (elements.startStreamBtn) {
        elements.startStreamBtn.disabled = true;
        elements.startStreamBtn.innerHTML = '<span>Loading...</span>';
    }
    
    try {
        const response = await fetch('/start_live_video', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            state.isStreaming = true;
            
            // Update UI
            elements.videoPlaceholder.style.display = 'none';
            elements.videoOverlay.style.display = 'flex';
            elements.videoStats.style.display = 'flex';
            
            if (elements.startStreamBtn) {
                elements.startStreamBtn.style.display = 'none';
            }
            if (elements.stopStreamBtn) {
                elements.stopStreamBtn.style.display = 'flex';
            }
            
            // Update status
            if (elements.statusIndicator) {
                elements.statusIndicator.classList.remove('stopped');
                elements.statusIndicator.classList.add('live');
            }
            if (elements.statusText) {
                elements.statusText.textContent = 'LIVE';
            }
            
            // Start video stream
            elements.liveVideo.src = '/video_feed/' + data.filename;
            elements.liveVideo.style.display = 'block';
            
            // Simulate FPS counter
            startFPSCounter();
            
            showToast('Stream started', 'Live detection is now running', 'success');
        } else {
            showToast('Error', data.error || 'Failed to start stream', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Connection error', 'Failed to start video stream', 'error');
    }
    
    // Reset button state
    if (elements.startStreamBtn) {
        elements.startStreamBtn.disabled = false;
        elements.startStreamBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Start</span>';
    }
}

async function stopVideoStream() {
    try {
        await fetch('/stop_live_video', {
            method: 'POST'
        });
        
        state.isStreaming = false;
        
        // Update UI
        if (elements.liveVideo) {
            elements.liveVideo.src = '';
            elements.liveVideo.style.display = 'none';
        }
        
        elements.videoPlaceholder.style.display = 'flex';
        elements.videoOverlay.style.display = 'none';
        
        if (elements.startStreamBtn) {
            elements.startStreamBtn.style.display = 'flex';
        }
        if (elements.stopStreamBtn) {
            elements.stopStreamBtn.style.display = 'none';
        }
        
        // Update status
        if (elements.statusIndicator) {
            elements.statusIndicator.classList.remove('live');
            elements.statusIndicator.classList.add('stopped');
        }
        if (elements.statusText) {
            elements.statusText.textContent = 'STOPPED';
        }
        
        showToast('Stream stopped', 'Live detection has been stopped', 'info');
    } catch (error) {
        console.error('Error:', error);
    }
}

function startFPSCounter() {
    let frameCount = 0;
    let lastTime = Date.now();
    let lastDetectionFetch = 0;
    
    const updateFPS = () => {
        if (!state.isStreaming) return;
        
        frameCount++;
        const now = Date.now();
        
        if (now - lastTime >= 1000) {
            const fps = frameCount;
            frameCount = 0;
            lastTime = now;
            
            if (document.getElementById('fpsCounter')) {
                document.getElementById('fpsCounter').textContent = fps;
            }
        }
        
        // Poll detection count from server every 200ms for smoother updates
        if (now - lastDetectionFetch > 200) {
            lastDetectionFetch = now;
            fetch('/api/detection_count')
                .then(response => response.json())
                .then(data => {
                    const detections = data.count || 0;
                    if (document.getElementById('detectionCounter')) {
                        document.getElementById('detectionCounter').textContent = detections;
                    }
                    if (elements.overlayDetection) {
                        elements.overlayDetection.textContent = detections;
                    }
                })
                .catch(error => {
                    console.error('Error fetching detection count:', error);
                });
        }
        
        requestAnimationFrame(updateFPS);
    };
    
    updateFPS();
}

// ===== Results =====
function initializeResults() {
    if (elements.closeResults) {
        elements.closeResults.addEventListener('click', hideResultsOverlay);
    }
    
    const newDetectionBtn = document.getElementById('newDetection');
    if (newDetectionBtn) {
        newDetectionBtn.addEventListener('click', () => {
            hideResultsOverlay();
            navigateTo('upload');
            clearPreview();
        });
    }
    
    // Close on outside click
    if (elements.resultsOverlay) {
        elements.resultsOverlay.addEventListener('click', (e) => {
            if (e.target === elements.resultsOverlay) {
                hideResultsOverlay();
            }
        });
    }
}

function showResultsOverlay() {
    if (elements.resultsOverlay) {
        elements.resultsOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function hideResultsOverlay() {
    if (elements.resultsOverlay) {
        elements.resultsOverlay.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// ===== Settings =====
function initializeSettings() {
    if (elements.confidenceSlider && elements.confidenceValue) {
        elements.confidenceSlider.addEventListener('input', (e) => {
            elements.confidenceValue.textContent = `${e.target.value}%`;
            updateSettings();
        });
        
        // Also trigger on change (when user releases slider)
        elements.confidenceSlider.addEventListener('change', (e) => {
            updateSettings(true);
        });
    }
    
    if (elements.lineWidthSlider && elements.lineWidthValue) {
        elements.lineWidthSlider.addEventListener('input', (e) => {
            elements.lineWidthValue.textContent = `${e.target.value}px`;
            updateSettings();
        });
        
        elements.lineWidthSlider.addEventListener('change', (e) => {
            updateSettings(true);
        });
    }
    
    if (elements.showLabels) {
        elements.showLabels.addEventListener('change', (e) => {
            updateSettings(true);
        });
    }
    
    if (elements.showConfidence) {
        elements.showConfidence.addEventListener('change', (e) => {
            updateSettings(true);
        });
    }
    
    if (elements.compactModeToggle) {
        elements.compactModeToggle.addEventListener('change', (e) => {
            document.body.classList.toggle('compact', e.target.checked);
        });
    }
    
    // Load current settings
    loadSettings();
}

async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        
        if (elements.confidenceSlider && elements.confidenceValue) {
            elements.confidenceSlider.value = settings.confidence_threshold * 100;
            elements.confidenceValue.textContent = `${Math.round(settings.confidence_threshold * 100)}%`;
        }
        
        if (elements.lineWidthSlider && elements.lineWidthValue) {
            elements.lineWidthSlider.value = settings.line_thickness;
            elements.lineWidthValue.textContent = `${settings.line_thickness}px`;
        }
        
        if (elements.showLabels) {
            elements.showLabels.checked = settings.show_labels;
        }
        
        if (elements.showConfidence) {
            elements.showConfidence.checked = settings.show_conf;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function updateSettings(showNotification = false) {
    try {
        const settings = {
            confidence_threshold: elements.confidenceSlider ? elements.confidenceSlider.value / 100 : 0.25,
            line_thickness: elements.lineWidthSlider ? parseInt(elements.lineWidthSlider.value) : 4,
            show_labels: elements.showLabels ? elements.showLabels.checked : true,
            show_conf: elements.showConfidence ? elements.showConfidence.checked : true
        };
        
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        const result = await response.json();
        
        if (showNotification && result.success) {
            showToast('Settings Saved', 'Detection settings have been updated', 'success');
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        if (showNotification) {
            showToast('Error', 'Failed to save settings', 'error');
        }
    }
}

// ===== Charts =====
function initializeCharts() {
    const detectionCanvas = document.getElementById('detectionChart');
    const confidenceCanvas = document.getElementById('confidenceChart');
    
    if (!detectionCanvas || !confidenceCanvas) return;
    
    // Fetch real stats and draw charts
    fetchStatsAndDrawCharts(detectionCanvas, confidenceCanvas);
    
    // Auto-refresh stats every 5 seconds when on dashboard
    setInterval(() => {
        if (state.currentPage === 'dashboard') {
            fetchStatsAndDrawCharts(detectionCanvas, confidenceCanvas);
        }
    }, 5000);
}

async function fetchStatsAndDrawCharts(detectionCanvas, confidenceCanvas) {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        
        // Calculate average confidence and speed from detection history
        let avgConfidence = 0;
        let avgSpeed = 0;
        const history = stats.detection_history || [];
        
        if (history.length > 0) {
            const validConfEntries = history.filter(item => item.confidence !== undefined && item.confidence > 0);
            const totalConfidence = validConfEntries.reduce((sum, item) => sum + item.confidence, 0);
            avgConfidence = validConfEntries.length > 0 ? (totalConfidence / validConfEntries.length) * 100 : 0;
            
            const validSpeedEntries = history.filter(item => item.processing_time !== undefined);
            const totalSpeed = validSpeedEntries.reduce((sum, item) => sum + item.processing_time, 0);
            avgSpeed = validSpeedEntries.length > 0 ? (totalSpeed / validSpeedEntries.length) : 0;
            
            // If we have no new data yet, use some defaults but not random
            if (avgConfidence === 0) avgConfidence = 0;
            if (avgSpeed === 0) avgSpeed = 0;
        } else {
            // Fallback for empty history
            avgConfidence = 0;
            avgSpeed = 0;
        }
        
        // Update the animated counters with real data
        const counters = document.querySelectorAll('[data-count]');
        const statValues = [
            stats.total_detections || 0,
            stats.images_processed || 0,
            avgConfidence.toFixed(1),
            Math.round(avgSpeed)
        ];
        
        counters.forEach((counter, index) => {
            if (statValues[index] !== undefined) {
                counter.dataset.count = statValues[index];
            }
        });
        
        // Re-animate counters with new values for real-time updates
        reanimateCounters();
        
        // Update activity list with real history
        updateActivityList(history);
        
        // Update recent uploads with real history
        updateRecentUploads(history);
        
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
    
    // Draw charts
    drawDetectionChart(detectionCanvas);
    drawConfidenceChart(confidenceCanvas);
}

async function updateActivityList(history) {
    const activityList = document.getElementById('activityList');
    if (!activityList || !history || history.length === 0) return;
    
    // Get last 4 activities
    const recent = history.slice(-4).reverse();
    
    let html = '';
    recent.forEach(item => {
        const time = getRelativeTime(item.timestamp);
        const typeIcon = item.type === 'image' ? 
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' :
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>';
        
        const badge = item.count > 0 ? 
            `<span class="activity-badge success">${item.count} Detections</span>` : '';
        
        html += `
            <div class="activity-item">
                <div class="activity-icon success">
                    ${typeIcon}
                </div>
                <div class="activity-content">
                    <span class="activity-title">${item.filename || 'Detection completed'}</span>
                    <span class="activity-time">${time}</span>
                </div>
                ${badge}
            </div>
        `;
    });
    
    activityList.innerHTML = html;
}

function getRelativeTime(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}

function updateRecentUploads(history) {
    const recentUploadsList = document.querySelector('.recent-uploads-list');
    if (!recentUploadsList) return;
    
    if (!history || history.length === 0) {
        recentUploadsList.innerHTML = `
            <div class="recent-upload-item">
                <div class="upload-thumb">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect fill='%23E0E7FF' width='40' height='40' rx='8'/%3E%3Cpath fill='%236366F1' d='M20 10l-8 10h6v10h4V20h6L20 10z'/%3E%3C/svg%3E" alt="Thumbnail">
                </div>
                <div class="upload-info">
                    <span class="upload-name">No uploads yet</span>
                    <span class="upload-meta">Start by uploading an image</span>
                </div>
            </div>
        `;
        return;
    }
    
    // Get last 3 uploads
    const recent = history.slice(-3).reverse();
    
    let html = '';
    recent.forEach(item => {
        const time = getRelativeTime(item.timestamp);
        const conf = item.confidence ? (item.confidence * 100).toFixed(0) : '0';
        
        html += `
            <div class="recent-upload-item">
                <div class="upload-thumb">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect fill='%23E0E7FF' width='40' height='40' rx='8'/%3E%3Cpath fill='%236366F1' d='M20 10l-8 10h6v10h4V20h6L20 10z'/%3E%3C/svg%3E" alt="Thumbnail">
                </div>
                <div class="upload-info">
                    <span class="upload-name">${item.filename || 'Unknown'}</span>
                    <span class="upload-meta">${item.count || 0} potholes • ${conf}% conf.</span>
                </div>
                <span class="upload-time">${time}</span>
            </div>
        `;
    });
    
    recentUploadsList.innerHTML = html;
}

function drawDetectionChart(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Fetch stats for chart data
    fetch('/api/stats').then(r => r.json()).then(stats => {
        const history = stats.detection_history || [];
        
        // Generate weekly data from history
        const today = new Date();
        const weekData = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
        
        history.forEach(item => {
            if (item.timestamp) {
                const itemDate = new Date(item.timestamp);
                const dayOfWeek = itemDate.getDay();
                // Convert to Mon=0 format (Sunday = 6 in JS, so shift)
                const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                // Only include last 7 days
                const diffDays = Math.floor((today - itemDate) / (1000 * 60 * 60 * 24));
                if (diffDays < 7) {
                    weekData[dayIndex] += (item.count || 0);
                }
            }
        });
        
        // If no data, use empty array
        const data = weekData.some(v => v > 0) ? weekData : [0, 0, 0, 0, 0, 0, 0];
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const maxVal = Math.max(...data, 1);
        
        renderChart(ctx, canvas, data, labels, maxVal);
    }).catch(() => {
        const data = [0, 0, 0, 0, 0, 0, 0];
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        renderChart(ctx, canvas, data, labels, 1);
    });
}

function renderChart(ctx, canvas, data, labels, maxVal) {
    
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    const padding = 40;
    const barWidth = (width - padding * 2) / data.length - 10;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw bars
    data.forEach((val, i) => {
        const x = padding + i * (barWidth + 10);
        const barHeight = (val / maxVal) * (height - padding * 2);
        const y = height - padding - barHeight;
        
        // Gradient fill
        const gradient = ctx.createLinearGradient(x, y, x, height - padding);
        gradient.addColorStop(0, '#6366F1');
        gradient.addColorStop(1, '#A5B4FC');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#94A3B8';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + barWidth / 2, height - 15);
    });
}

function drawConfidenceChart(canvas) {
    const ctx = canvas.getContext('2d');
    const colors = ['#10B981', '#F59E0B', '#EF4444'];
    
    // Fetch stats for confidence distribution
    fetch('/api/stats').then(r => r.json()).then(stats => {
        const history = stats.detection_history || [];
        
        // Calculate confidence distribution from actual history
        let high = 0, medium = 0, low = 0;
        
        const validHistory = history.filter(item => item.confidence !== undefined && item.confidence > 0);

        if (validHistory.length > 0) {
            validHistory.forEach(item => {
                const conf = item.confidence * 100;
                if (conf >= 80) high++;
                else if (conf >= 50) medium++;
                else low++;
            });
            
            const totalVal = validHistory.length;
            const highPct = (high / totalVal) * 100;
            const mediumPct = (medium / totalVal) * 100;
            const lowPct = (low / totalVal) * 100;
            
            const data = [highPct, mediumPct, lowPct];
            const avgConf = validHistory.reduce((sum, item) => sum + item.confidence, 0) / validHistory.length;
            
            renderConfidenceChart(ctx, canvas, data, colors, (avgConf * 100).toFixed(0));
        } else {
            // Placeholder if no data, but let user know it's empty
            renderConfidenceChart(ctx, canvas, [100, 0, 0], ['#E2E8F0', '#E2E8F0', '#E2E8F0'], '0');
        }
    }).catch(() => {
        renderConfidenceChart(ctx, canvas, [100, 0, 0], ['#E2E8F0', '#E2E8F0', '#E2E8F0'], '0');
    });
}

function renderConfidenceChart(ctx, canvas, data, colors, avgConf) {
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    
    ctx.clearRect(0, 0, width, height);
    
    let startAngle = -Math.PI / 2;
    
    data.forEach((val, i) => {
        const sliceAngle = (val / 100) * Math.PI * 2;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i];
        ctx.fill();
        
        startAngle += sliceAngle;
    });
    
    // Center circle (donut hole)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary');
    ctx.fill();
    
    // Center text
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${avgConf}%`, centerX, centerY);
}

// ===== Animated Counters =====
// Counter animation function (must be defined first)
function animateCounter(element) {
    const target = parseFloat(element.dataset.count);
    const isDecimal = target % 1 !== 0;
    const duration = 1000; // Shorter duration for updates
    const startTime = performance.now();
    
    // Get current displayed value as start (for smooth transition)
    const currentDisplay = parseFloat(element.textContent) || 0;
    
    const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = currentDisplay + (target - currentDisplay) * easeOutQuart;
        
        element.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = isDecimal ? target.toFixed(1) : target;
        }
    };
    
    requestAnimationFrame(update);
}

function initializeCounters() {
    const counters = document.querySelectorAll('[data-count]');
    
    // Observe for visibility - animate on first view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

// Re-animate counters with new values (for real-time updates)
function reanimateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    counters.forEach(counter => {
        animateCounter(counter);
    });
}

// ===== Toast Notifications =====
function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// ===== Utility Functions =====
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ===== Export for global access =====
window.PotholeAI = {
    navigateTo,
    showToast,
    startVideoStream,
    stopVideoStream
};

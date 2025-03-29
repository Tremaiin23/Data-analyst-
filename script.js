import * as Chart from 'chart.js';
import { config } from './config.js';
import { generateVisualization } from './visualization-service.js';
// Import chat service functionality
import { initChatService, handleAnalysis } from './chat-service.js';
import { initVoiceService } from './voice-service.js';

// Register required Chart.js components
Chart.Chart.register(
    Chart.LineController,
    Chart.BarController,
    Chart.PieController,
    Chart.CategoryScale,
    Chart.LinearScale,
    Chart.PointElement,
    Chart.LineElement,
    Chart.BarElement,
    Chart.ArcElement,
    Chart.Legend,
    Chart.Title,
    Chart.Tooltip
);

// DOM Elements
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const analysisSection = document.getElementById('analysisSection');
const loader = document.getElementById('loader');
const results = document.getElementById('results');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const dataChart = document.getElementById('dataChart');
const recommendationsContent = document.getElementById('recommendationsContent');

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setupFileUpload();
    setupTabs();
    initChatService();
    initVoiceService();
}

function setupFileUpload() {
    dropArea.addEventListener('click', () => fileInput.click());
    
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('active');
    });
    
    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('active');
    });
    
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('active');
        handleFiles(e.dataTransfer.files);
    });
    
    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });
}

function setupTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to current button and content
            button.classList.add('active');
            const tabId = button.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });
}

async function handleFiles(files) {
    if (files.length === 0) return;
    
    const validFiles = Array.from(files).filter(file => {
        if (file.size > config.maxFileSize) {
            alert(`File ${file.name} exceeds the maximum size limit of ${config.maxFileSize/1024/1024}MB`);
            return false;
        }
        if (!config.allowedFileTypes.includes(file.type)) {
            alert(`File type ${file.type} is not supported`);
            return false;
        }
        return true;
    });
    
    if (validFiles.length === 0) return;
    
    // Show analysis section and loader
    analysisSection.style.display = 'block';
    loader.style.display = 'flex';
    results.style.display = 'none';
    
    // Convert files to data URLs
    const filePromises = validFiles.map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                dataUrl: e.target.result
            });
            reader.readAsDataURL(file);
        });
    });
    
    Promise.all(filePromises)
        .then(fileData => {
            // Pass to chat service for analysis
            handleAnalysis(fileData, dataChart, recommendationsContent, loader, results);
        })
        .catch(error => {
            console.error('Error reading files:', error);
            loader.style.display = 'none';
            alert('Error reading files. Please try again.');
        });
}

// Export the elements and functions needed by chat-service
export { 
    dataChart, 
    recommendationsContent,
    generateVisualization
};
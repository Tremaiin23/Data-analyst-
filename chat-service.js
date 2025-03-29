import { config } from './config.js';
import { generateVisualization } from './visualization-service.js';

// DOM Elements
const messageContainer = document.getElementById('messageContainer');
const userQuestion = document.getElementById('userQuestion');
const sendBtn = document.getElementById('sendBtn');
const suggestionsContent = document.getElementById('suggestionsContent');

// State Management
let conversationHistory = [];
let currentData = null;
let datasetMemory = []; // Store metadata about previously analyzed datasets

// Initialize chat service
export function initChatService() {
    setupChat();
    loadConversationHistory();
    loadDatasetMemory();
    updateSuggestions();
}

function setupChat() {
    sendBtn.addEventListener('click', sendMessage);
    userQuestion.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Add restart button event listener
    document.getElementById('restartBtn').addEventListener('click', restartChat);
}

// Handle analysis of uploaded files
export async function handleAnalysis(fileData, dataChart, recommendationsContent, loader, results) {
    currentData = fileData;
    
    // Add to dataset memory for continuous learning
    updateDatasetMemory(fileData);
    
    // Simulate processing time
    setTimeout(() => {
        analyzeData(fileData, dataChart, recommendationsContent, loader, results);
    }, 2000);
}

// Track dataset patterns for continuous learning
function updateDatasetMemory(fileData) {
    // Add new dataset metadata to memory
    const datasetMeta = {
        timestamp: new Date().toISOString(),
        fileCount: fileData.length,
        fileNames: fileData.map(f => f.name),
        fileTypes: fileData.map(f => f.type)
    };
    
    datasetMemory.push(datasetMeta);
    
    // Keep only the last 10 datasets in memory
    if (datasetMemory.length > 10) {
        datasetMemory = datasetMemory.slice(-10);
    }
    
    // Save to localStorage
    localStorage.setItem('datasetMemory', JSON.stringify(datasetMemory));
}

// Load dataset memory from localStorage
function loadDatasetMemory() {
    const savedMemory = localStorage.getItem('datasetMemory');
    if (savedMemory) {
        datasetMemory = JSON.parse(savedMemory);
    }
}

async function analyzeData(fileData, dataChart, recommendationsContent, loader, results) {
    try {
        // Create a more comprehensive system message with dataset memory context
        const systemMessage = createAdaptiveSystemMessage();
        
        // Initial analysis message
        const initialPrompt = `I've uploaded ${fileData.length} file(s) for analysis: ${fileData.map(f => f.name).join(', ')}. 
        Please provide a comprehensive analysis of the data, key trends, and important insights.`;
        
        // Check if we're continuing a conversation or starting new
        if (conversationHistory.length === 0) {
            // First message is a system message establishing the context
            conversationHistory = [
                {
                    role: "system",
                    content: systemMessage
                }
            ];
        }
        
        // Send the user's initial prompt with the file
        const imageContent = fileData.map(file => ({
            type: "image_url",
            image_url: { url: file.dataUrl }
        }));
        
        const newMessage = {
            role: "user",
            content: [
                { type: "text", text: initialPrompt },
                ...imageContent
            ]
        };
        
        conversationHistory.push(newMessage);
        
        const completion = await websim.chat.completions.create({
            messages: conversationHistory
        });
        
        // Add the response to conversation history
        conversationHistory.push(completion);
        
        // Save conversation to localStorage
        saveConversationHistory();
        
        // Display initial analysis
        addMessage(initialPrompt, 'user');
        addMessage(completion.content, 'ai');
        
        // Generate visualization data using the visualization service
        await generateVisualization(fileData, conversationHistory, dataChart);
        
        // Generate recommendations with enhanced AI commentary
        generateRecommendations(recommendationsContent);
        
        // Update suggestions
        updateSuggestions();
        
        // Show results
        loader.style.display = 'none';
        results.style.display = 'block';
        
    } catch (error) {
        console.error('Analysis error:', error);
        loader.style.display = 'none';
        addMessage("I'm sorry, I encountered an error analyzing your data. Please try again.", 'ai');
        results.style.display = 'block';
    }
}

// Create adaptive system message based on dataset memory
function createAdaptiveSystemMessage() {
    let systemMessage = "You are an expert data analyst AI assistant with continuous learning capabilities. ";
    
    if (datasetMemory.length > 0) {
        // Add information about previously analyzed datasets
        systemMessage += "Based on my analysis history, I've previously analyzed: ";
        
        // Group by file types to understand patterns
        const fileTypes = datasetMemory.flatMap(dataset => dataset.fileTypes);
        const uniqueTypes = [...new Set(fileTypes)];
        
        systemMessage += uniqueTypes.map(type => {
            const count = fileTypes.filter(t => t === type).length;
            return `${count} ${type} files`;
        }).join(", ");
        
        // Add adaptive analysis instructions
        systemMessage += ". Provide comprehensive, adaptive analysis that builds upon previous insights if patterns are similar. ";
        systemMessage += "Compare new data to previously seen patterns when relevant. ";
        systemMessage += "Your commentary should be insightful, focusing on unique aspects of this dataset while referencing broader trends ";
        systemMessage += "you've observed across multiple datasets when applicable.";
    } else {
        systemMessage += "Analyze the provided data and explain insights clearly and professionally. ";
        systemMessage += "Your commentary should be thorough and highlight the most important patterns and anomalies in the data.";
    }
    
    return systemMessage;
}

async function sendMessage() {
    const question = userQuestion.value.trim();
    if (!question) return;
    
    // Add user message to UI
    addMessage(question, 'user');
    userQuestion.value = '';
    
    try {
        // Add user message to conversation history
        const newMessage = {
            role: "user",
            content: question
        };
        
        conversationHistory.push(newMessage);
        
        // Only keep the last 10 messages to prevent context overflow
        if (conversationHistory.length > 12) { // 2 for system + 10 for conversation
            conversationHistory = [
                conversationHistory[0], // Keep system message
                ...conversationHistory.slice(-10) // Keep last 10 conversation messages
            ];
        }
        
        // Get AI response
        const completion = await websim.chat.completions.create({
            messages: conversationHistory
        });
        
        // Add AI response to conversation history
        conversationHistory.push(completion);
        
        // Save conversation to localStorage
        saveConversationHistory();
        
        // Display AI response
        addMessage(completion.content, 'ai');
        
        // Update suggestions based on conversation
        updateSuggestions();
        
    } catch (error) {
        console.error('Chat error:', error);
        addMessage("I'm sorry, I encountered an error. Please try again.", 'ai');
    }
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    messageDiv.textContent = text;
    messageContainer.appendChild(messageDiv);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

async function generateRecommendations(recommendationsContent) {
    if (!currentData) return;
    
    try {
        // Get enhanced predictions and recommendations with adaptive commentary
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Based on the data analysis and drawing from patterns observed in ${datasetMemory.length} previous datasets, 
                    provide future predictions and 3-5 actionable recommendations with detailed commentary. 
                    Your analysis should adapt to previously seen patterns and highlight both similarities and unique aspects. 
                    Format your response with clear sections for 'Adaptive Commentary', 'Future Predictions' and 'Recommendations'.`
                },
                ...conversationHistory.filter(msg => msg.role !== "system")
            ]
        });
        
        recommendationsContent.innerHTML = `<div class="recommendations-list">${completion.content}</div>`;
        
    } catch (error) {
        console.error('Recommendations error:', error);
        recommendationsContent.innerHTML = '<p>Unable to generate recommendations. Please try again.</p>';
    }
}

// Save conversation to localStorage
function saveConversationHistory() {
    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
    localStorage.setItem('currentData', JSON.stringify(currentData));
    localStorage.setItem('datasetMemory', JSON.stringify(datasetMemory));
}

// Load conversation from localStorage
function loadConversationHistory() {
    const savedConversation = localStorage.getItem('conversationHistory');
    const savedData = localStorage.getItem('currentData');
    const savedMemory = localStorage.getItem('datasetMemory');
    
    if (savedConversation) {
        conversationHistory = JSON.parse(savedConversation);
        
        // Display saved messages in the UI
        messageContainer.innerHTML = ''; // Clear existing messages
        conversationHistory.forEach(message => {
            if (message.role !== 'system') {
                const content = typeof message.content === 'string' ? 
                    message.content : 
                    message.content.find(item => item.type === 'text')?.text || '';
                
                if (content) {
                    addMessage(content, message.role === 'user' ? 'user' : 'ai');
                }
            }
        });
        
        // Update suggestions based on saved conversation
        updateSuggestions();
    }
    
    if (savedData) {
        currentData = JSON.parse(savedData);
    }
    
    if (savedMemory) {
        datasetMemory = JSON.parse(savedMemory);
    }
}

// Restart chat function
function restartChat() {
    // Clear conversation history but keep dataset memory for continuous learning
    conversationHistory = [];
    currentData = null;
    
    // Clear conversation localStorage but keep dataset memory
    localStorage.removeItem('conversationHistory');
    localStorage.removeItem('currentData');
    
    // Clear UI
    messageContainer.innerHTML = '';
    
    // Add system message
    addMessage("Chat restarted. Upload new data to begin analysis with adaptive AI commentary based on previously analyzed datasets.", 'ai');
    
    // Update suggestions
    updateSuggestions();
}

// Generate AI suggestions based on the conversation context
async function updateSuggestions() {
    if (conversationHistory.length <= 1) {
        // If no meaningful conversation yet, show default suggestions
        suggestionsContent.innerHTML = `
            <div class="suggestion-item">
                <svg class="suggestion-icon" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                <div class="suggestion-text">
                    <h4>Upload Data</h4>
                    <p>Upload your data files for comprehensive analysis and insights.</p>
                </div>
            </div>
            <div class="suggestion-item">
                <svg class="suggestion-icon" viewBox="0 0 24 24">
                    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                </svg>
                <div class="suggestion-text">
                    <h4>Ask Technical Questions</h4>
                    <p>Ask about specific data points, trends, or statistical analysis.</p>
                </div>
            </div>
        `;
        return;
    }
    
    try {
        // Generate context-aware suggestions
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Based on the ongoing conversation about data analysis, generate 2-3 relevant next step suggestions.
                    Each suggestion should have a title and a brief description.
                    Respond directly with JSON, following this schema:
                    {
                      suggestions: [
                        {
                          title: string,
                          description: string,
                          icon: string (one of: "chart", "compare", "export", "filter", "predict", "share", "question", "code")
                        }
                      ]
                    }`
                },
                ...conversationHistory.filter(msg => msg.role !== "system")
            ],
            json: true
        });
        
        // Parse the AI-generated suggestions
        let suggestionData;
        try {
            suggestionData = JSON.parse(completion.content);
        } catch (e) {
            console.error('Failed to parse suggestions:', e);
            // Fallback suggestions
            suggestionData = {
                suggestions: [
                    {
                        title: "Run Predictive Analysis",
                        description: "Project future trends based on the current data patterns.",
                        icon: "predict"
                    },
                    {
                        title: "Export Analysis Report",
                        description: "Generate a comprehensive PDF report with all insights.",
                        icon: "export"
                    }
                ]
            };
        }
        
        // Map icon names to SVG paths
        const iconPaths = {
            "chart": "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-6h-8v6zm0-18v6h8V3h-8z",
            "compare": "M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v2h2V1h-2v2zm0 15H5l5-6v6zm9-15h-5v2h5v13l-5-6v9h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z",
            "export": "M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z",
            "filter": "M10 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z",
            "predict": "M15.5 4.5c2.04 0 3.5 1.29 3.5 3 0 1.25-1.56 3.48-3.5 5.88-1.94-2.4-3.5-4.63-3.5-5.88 0-1.71 1.46-3 3.5-3m0-2C12.5 2.5 10 5 10 7.5c0 2.37 2.37 5.2 5.5 8.5 3.13-3.3 5.5-6.13 5.5-8.5 0-2.5-2.5-5-5.5-5zm-.5 7c.83 0 1.5-.67 1.5-1.5S15.83 6.5 15 6.5 13.5 7.17 13.5 8 14.17 9.5 15 9.5z",
            "share": "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z",
            "question": "M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z",
            "code": "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"
        };
        
        // Build suggestion HTML
        const suggestionHTML = suggestionData.suggestions.map(suggestion => {
            const iconPath = iconPaths[suggestion.icon] || iconPaths.question;
            
            return `
                <div class="suggestion-item">
                    <svg class="suggestion-icon" viewBox="0 0 24 24">
                        <path d="${iconPath}"/>
                    </svg>
                    <div class="suggestion-text">
                        <h4>${suggestion.title}</h4>
                        <p>${suggestion.description}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        suggestionsContent.innerHTML = suggestionHTML;
        
    } catch (error) {
        console.error('Suggestions error:', error);
        suggestionsContent.innerHTML = `
            <div class="suggestion-item">
                <svg class="suggestion-icon" viewBox="0 0 24 24">
                    <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
                </svg>
                <div class="suggestion-text">
                    <h4>Ask Follow-up Questions</h4>
                    <p>Ask further questions to get more insights from your data.</p>
                </div>
            </div>
        `;
    }
}
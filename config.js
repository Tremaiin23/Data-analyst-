// Configuration settings for DataSight AI
export const config = {
    // API settings
    apiTimeout: 30000, // 30 seconds
    
    // UI settings
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: [
        'image/png', 
        'image/jpeg', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/pdf'
    ],
    
    // Analysis settings
    defaultChartType: 'line',
    chartColors: [
        '#4285F4', '#34A853', '#FBBC05', '#EA4335', 
        '#8AB4F8', '#81C995', '#FDE293', '#F28B82'
    ],
    predictionHorizon: 3, // Number of time periods to predict into future
    
    // User settings
    historyLength: 10, // Number of messages to keep in conversation history
    
    // System messages
    messages: {
        welcomeMessage: "Welcome! Upload your data files to begin analysis.",
        errorMessage: "An error occurred. Please try again.",
        processingMessage: "Processing your data. This may take a moment...",
        voiceWelcomeMessage: "Voice commands activated. What would you like to know?"
    },
    
    // Voice recognition settings
    voice: {
        language: 'en-US',
        confidenceThreshold: 0.7, // Minimum confidence level to accept voice commands
        noiseReduction: true,     // Enable noise reduction
        commandTimeout: 5000,      // Timeout after voice command in ms
        silenceTimeout: 5000       // New setting: time to wait after silence before processing
    }
};
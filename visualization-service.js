// Visualization Service - handles chart generation and data visualization
import * as Chart from 'chart.js';
import { config } from './config.js';

// Ensure Chart.js components are registered
Chart.Chart.register(
    Chart.LineController,
    Chart.BarController,
    Chart.PieController,
    Chart.ScatterController,
    Chart.RadarController,
    Chart.DoughnutController,
    Chart.BubbleController,
    Chart.PolarAreaController,
    Chart.CategoryScale,
    Chart.LinearScale,
    Chart.RadialLinearScale,
    Chart.TimeScale,
    Chart.LogarithmicScale,
    Chart.PointElement,
    Chart.LineElement,
    Chart.BarElement,
    Chart.ArcElement,
    Chart.Legend,
    Chart.Title,
    Chart.Tooltip,
    Chart.Filler,
    Chart.SubTitle
);

// Chart instances reference
let chartInstances = {
    pie: null,
    line: null,
    bar: null
};

// Available chart types for dynamic selection
const chartTypes = ['line', 'bar', 'pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble'];

// Generate a visualization based on file data and AI analysis
export async function generateVisualization(fileData, conversationHistory, dataChart) {
    if (!fileData || !dataChart) return null;
    
    try {
        // Generate chart data using AI with adaptive learning and future predictions
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Based on the analyzed data and drawing from patterns in previously analyzed datasets,
                    predict future trends and generate visualization data with adaptive commentary.
                    Create three different chart visualizations: a pie chart, a line chart, and a bar chart.
                    Include both current data and future projections in your response.
                    For each chart, provide adaptive commentary that highlights unique aspects and compares to past patterns when relevant.
                    Respond directly with JSON, following this schema:
                    {
                      pieChart: {
                        title: string,
                        description: string,
                        adaptiveCommentary: string, // New field for AI commentary
                        labels: array of strings,
                        datasets: [{ 
                          label: string, 
                          data: array of numbers,
                          backgroundColor: array of colors (optional)
                        }]
                      },
                      lineChart: {
                        title: string,
                        description: string,
                        adaptiveCommentary: string, // New field for AI commentary
                        labels: array of strings (include future time periods),
                        datasets: [{ 
                          label: string, 
                          data: array of numbers,
                          borderColor: string (optional),
                          backgroundColor: string (optional),
                          borderDash: array (optional, for prediction lines),
                          predictedData: boolean (indicates if this dataset represents predictions)
                        }]
                      },
                      barChart: {
                        title: string,
                        description: string,
                        adaptiveCommentary: string, // New field for AI commentary
                        labels: array of strings,
                        datasets: [{ 
                          label: string, 
                          data: array of numbers,
                          backgroundColor: array of colors or single color (optional)
                        }]
                      }
                    }`
                },
                ...conversationHistory.filter(msg => msg.role !== "system").slice(-5) // Only use last 5 messages for context
            ],
            json: true
        });
        
        // Parse the AI-generated chart data with commentary
        let chartData;
        try {
            chartData = JSON.parse(completion.content);
        } catch (e) {
            console.error('Failed to parse chart data:', e);
            
            // Default fallback chart data with basic commentary
            chartData = {
                pieChart: {
                    title: 'Data Distribution',
                    description: 'Distribution of key categories in the data',
                    adaptiveCommentary: 'This is a standard distribution analysis of your data categories.',
                    labels: ['Category A', 'Category B', 'Category C', 'Category D'],
                    datasets: [{
                        label: 'Distribution',
                        data: [25, 30, 15, 30],
                        backgroundColor: config.chartColors.slice(0, 4)
                    }]
                },
                lineChart: {
                    title: 'Trend Analysis',
                    description: 'Historical trend with future predictions',
                    adaptiveCommentary: 'This trend analysis shows both historical data and predicted future values.',
                    labels: ['Past 3', 'Past 2', 'Past 1', 'Present', 'Future 1', 'Future 2', 'Future 3'],
                    datasets: [{
                        label: 'Historical Data',
                        data: [12, 19, 25, 32],
                        borderColor: config.chartColors[0],
                        backgroundColor: 'rgba(66, 133, 244, 0.2)',
                        fill: true,
                        predictedData: false
                    }, {
                        label: 'Predicted Data',
                        data: [null, null, null, 32, 40, 45, 52],
                        borderColor: config.chartColors[1],
                        backgroundColor: 'rgba(52, 168, 83, 0.2)',
                        borderDash: [5, 5],
                        fill: true,
                        predictedData: true
                    }]
                },
                barChart: {
                    title: 'Comparison Analysis',
                    description: 'Comparison between key metrics',
                    adaptiveCommentary: 'This comparison shows the relative values of key metrics in your dataset.',
                    labels: ['Metric A', 'Metric B', 'Metric C', 'Metric D'],
                    datasets: [{
                        label: 'Current Values',
                        data: [65, 59, 80, 81],
                        backgroundColor: config.chartColors.slice(0, 4)
                    }]
                }
            };
        }
        
        // Add data visualization timestamp to ensure new visualizations
        chartData.timestamp = new Date().getTime();
        
        // Create all three charts with commentary
        createMultipleCharts(dataChart, chartData);
        
        // Return the chart data for additional use
        return chartData;
        
    } catch (error) {
        console.error('Visualization error:', error);
        const fallbackCtx = dataChart.getContext('2d');
        fallbackCtx.clearRect(0, 0, dataChart.width, dataChart.height);
        fallbackCtx.font = '16px Arial';
        fallbackCtx.fillText('Unable to generate visualization for this data', 50, 100);
        return null;
    }
}

// Create multiple charts (pie, line, bar) based on AI-generated data
function createMultipleCharts(mainCanvas, chartData) {
    // Get parent container of the main canvas
    const container = mainCanvas.parentElement;
    
    // Clear existing canvases
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // Create AI commentary modal if it doesn't exist
    createAICommentaryModal();
    
    // Create containers and canvases for each chart type
    const chartTypes = ['pie', 'line', 'bar'];
    
    chartTypes.forEach(type => {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'individual-chart-container';
        chartContainer.style.marginBottom = '20px';
        chartContainer.style.position = 'relative'; // For positioning AI commentary button
        
        // Add title
        const titleElement = document.createElement('h3');
        titleElement.textContent = chartData[`${type}Chart`].title;
        chartContainer.appendChild(titleElement);
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.id = `${type}Chart`;
        canvas.height = 220;
        chartContainer.appendChild(canvas);
        
        // Add AI commentary button
        const commentaryBtn = document.createElement('button');
        commentaryBtn.className = 'ai-commentary-btn';
        commentaryBtn.textContent = 'AI';
        commentaryBtn.dataset.chartType = type;
        commentaryBtn.addEventListener('click', () => showAICommentary(type, chartData[`${type}Chart`]));
        chartContainer.appendChild(commentaryBtn);
        
        // Add description - now more compact
        const descElement = document.createElement('p');
        descElement.className = 'chart-description';
        descElement.textContent = chartData[`${type}Chart`].description;
        chartContainer.appendChild(descElement);
        
        container.appendChild(chartContainer);
        
        // Create the specific chart
        const config = createChartConfig(type, chartData[`${type}Chart`]);
        createChart(canvas, config, type);
    });
}

// Create AI commentary modal in the DOM
function createAICommentaryModal() {
    // Check if modal already exists
    if (document.getElementById('aiCommentaryModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'aiCommentaryModal';
    modal.className = 'ai-commentary-modal';
    
    modal.innerHTML = `
        <div class="ai-commentary-modal-content">
            <button class="ai-commentary-modal-close">&times;</button>
            <div id="aiCommentaryModalContent"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.ai-commentary-modal-close');
    closeBtn.addEventListener('click', closeAICommentary);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAICommentary();
        }
    });
}

// Show AI commentary for a specific chart type
async function showAICommentary(chartType, chartData) {
    const modal = document.getElementById('aiCommentaryModal');
    const modalContent = document.getElementById('aiCommentaryModalContent');
    
    try {
        // Generate more detailed commentary
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Provide a comprehensive and insightful AI commentary for the ${chartType} chart. 
                    Explain the significance of the data, key trends, and unique observations. 
                    Be detailed but concise, focusing on the most important insights.`
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        chartType: chartType,
                        title: chartData.title,
                        description: chartData.description,
                        labels: chartData.labels,
                        data: chartData.datasets[0].data
                    })
                }
            ]
        });
        
        // Populate modal content
        modalContent.innerHTML = `
            <h2>AI Chart Commentary: ${chartData.title}</h2>
            <div class="ai-commentary-content">
                ${completion.content}
            </div>
        `;
        
        // Show modal
        modal.classList.add('active');
        
    } catch (error) {
        console.error('AI Commentary Error:', error);
        modalContent.innerHTML = `
            <h2>AI Commentary</h2>
            <p>Unable to generate commentary at this time. Please try again.</p>
        `;
        modal.classList.add('active');
    }
}

// Close AI commentary modal
function closeAICommentary() {
    const modal = document.getElementById('aiCommentaryModal');
    modal.classList.remove('active');
}

// Create chart configuration based on chart type and data
function createChartConfig(chartType, chartData) {
    // Apply styles and enhancements to datasets
    chartData.datasets.forEach((dataset, index) => {
        // Set default colors if not provided
        if (!dataset.backgroundColor) {
            dataset.backgroundColor = config.chartColors[index % config.chartColors.length];
            
            // Add transparency for area charts
            if (chartType === 'line') {
                dataset.backgroundColor = addTransparency(dataset.backgroundColor, 0.2);
            }
        }
        
        if (!dataset.borderColor && chartType === 'line') {
            dataset.borderColor = config.chartColors[index % config.chartColors.length];
        }
        
        // Style prediction datasets
        if (dataset.predictedData) {
            dataset.borderDash = dataset.borderDash || [5, 5];
            dataset.pointStyle = 'circle';
            dataset.pointRadius = 4;
            dataset.pointHoverRadius = 6;
            dataset.pointBorderColor = dataset.borderColor;
            dataset.pointBackgroundColor = '#fff';
        }
    });
    
    // Create chart options based on chart type
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: chartData.title || `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
            subtitle: {
                display: !!chartData.subtitle,
                text: chartData.subtitle || '',
                font: {
                    size: 14
                },
                padding: {
                    bottom: 10
                }
            },
            legend: {
                display: true,
                position: chartType === 'pie' ? 'right' : 'top',
                labels: {
                    usePointStyle: true,
                    padding: 15
                }
            },
            tooltip: {
                callbacks: {
                    footer: function(tooltipItems) {
                        const datasetIndex = tooltipItems[0].datasetIndex;
                        if (chartData.datasets[datasetIndex].predictedData) {
                            return 'This is a predicted value';
                        }
                        return '';
                    }
                }
            }
        }
    };
    
    // Chart type specific options
    switch (chartType) {
        case 'line':
            options.elements = {
                line: {
                    tension: 0.3 // Smooth lines
                }
            };
            options.scales = {
                y: {
                    beginAtZero: false
                }
            };
            break;
        case 'bar':
            options.scales = {
                y: {
                    beginAtZero: true
                }
            };
            break;
        case 'pie':
            options.plugins.legend.position = 'right';
            break;
    }
    
    return {
        type: chartType,
        data: {
            labels: chartData.labels,
            datasets: chartData.datasets
        },
        options: options
    };
}

// Create or update chart
function createChart(canvas, config, chartType) {
    // Destroy existing chart if it exists
    if (chartInstances[chartType]) {
        chartInstances[chartType].destroy();
    }
    
    // Create new chart
    const ctx = canvas.getContext('2d');
    chartInstances[chartType] = new Chart.Chart(ctx, config);
    
    return chartInstances[chartType];
}

// Helper to add transparency to a color
function addTransparency(color, alpha) {
    if (color.startsWith('rgb')) {
        return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    } else if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
}

// Get current chart instances
export function getCurrentCharts() {
    return chartInstances;
}

// Additional export if needed
export { showAICommentary, closeAICommentary };
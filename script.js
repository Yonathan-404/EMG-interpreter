const SAMPLE_INTERVAL = 5;// more realstic interpreation 
const MAX_SAMPLES = 2000;// to get the 10s of data points in the graph
const GRAPH_MAX_VALUE = 12;
const DOWNSAMPLE_FACTOR = 10; // downsample the data to reduce the number of points drawn on the graph
let sampleCounter = 0; // moved sampleCounter to global scope to maintain state across function calls
const state = {
    isActive: false,
    currentValue: 0,
    samples: [],
};

function generateRestingSample() {
    sampleCounter++;
    return Math.random();
}

function generateActiveSample() {
    sampleCounter++;
    return 10 + (Math.random() - 0.5) * 2; // Random value between 9 and 11

    
}

function updateDisplay() {
    const button = document.getElementById('toggleState');
    const stateLabel = document.getElementById('stateLabel');
    const valueLabel = document.getElementById('valueLabel');
    const resting = document.getElementById('restingPose');
    const active = document.getElementById('activePose');

    if (resting && active) {
        resting.style.display = state.isActive ? 'none' : 'block';
        active.style.display = state.isActive ? 'block' : 'none';
    }

    if (!button || !stateLabel || !valueLabel) {
        return;
    }

    button.textContent = state.isActive ? 'Switch to resting' : 'Switch to active';
    button.setAttribute('aria-pressed', String(state.isActive));
    stateLabel.textContent = state.isActive ? 'Active' : 'Resting';
    valueLabel.textContent = state.currentValue.toFixed(2);

    
    
}


function drawGraph() {
    const canvas = document.getElementById('signalGraph');
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
        return;
    }

    // Handle high-DPI displays (Retina, etc.)
    const bounds = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(bounds.width * pixelRatio);
    canvas.height = Math.round(bounds.height * pixelRatio);
    context.scale(pixelRatio, pixelRatio);

    const width = bounds.width;
    const height = bounds.height;
    const padding = { top: 14, right: 12, bottom: 26, left: 34 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    // Clear and setup text
    context.clearRect(0, 0, width, height);
    context.font = '11px Arial, sans-serif';
    context.textBaseline = 'middle';

    // Draw horizontal grid lines
    [0, 5, 10].forEach((value) => {
        const y = padding.top + plotHeight * (1 - value / GRAPH_MAX_VALUE);
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(width - padding.right, y);
        context.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        context.stroke();
        context.fillStyle = 'rgba(255, 255, 255, 0.62)';
        context.textAlign = 'right';
        context.fillText(String(value), padding.left - 8, y);
    });

    // Draw time labels
    context.fillStyle = 'rgba(255, 255, 255, 0.62)';
    context.textAlign = 'left';
    context.fillText('10s', padding.left, height - 10);
    context.textAlign = 'right';
    context.fillText('now', width - padding.right, height - 10);

    // Exit if not enough data
    if (state.samples.length < 2) {
        return;
    }

    // Calculate sliding window: only draw the last MAX_SAMPLES
    const startIndex = Math.max(0, state.samples.length - MAX_SAMPLES);
    const visibleCount = state.samples.length - startIndex;
    
    if (visibleCount < 2) return;

    // Setup line style
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    
    // Iterate through ALL samples to catch state changes,
    // but only draw every DOWNSAMPLE_FACTOR-th point OR on state transitions
    for (let index = 1; index < visibleCount; index += 1) {
        const actualIndex = startIndex + index;
        const previous = state.samples[actualIndex - 1];
        const sample = state.samples[actualIndex];
        
        // Draw if: (every Nth sample) OR (state just changed from previous)
        const isDownsamplePoint = (sample.id % DOWNSAMPLE_FACTOR === 0);
        const isStateChange = (sample.isActive !== previous.isActive);
        
        if (!isDownsamplePoint && !isStateChange) continue;
        
        // Calculate X coordinates (0 to 1 relative to visible window)
        const relativeX = index / (visibleCount - 1);
        const previousRelativeX = (index - 1) / (visibleCount - 1);

        const previousX = padding.left + previousRelativeX * plotWidth;
        const x = padding.left + relativeX * plotWidth;
        
        // Calculate Y coordinates (flipped: canvas Y grows downward)
        const previousY = padding.top + plotHeight * (1 - previous.value / GRAPH_MAX_VALUE);
        const y = padding.top + plotHeight * (1 - sample.value / GRAPH_MAX_VALUE);

        // Draw the line segment
        context.beginPath();
        context.moveTo(previousX, previousY);
        context.lineTo(x, y);
        context.strokeStyle = sample.isActive ? '#f6b94b' : '#56d6b0';
        context.stroke();
    }
}
function generateSample() {
    const sample = state.isActive ? generateActiveSample() : generateRestingSample();
    state.currentValue = sample;
    state.samples.push({ value: sample, isActive: state.isActive, id:sampleCounter});
   if (state.samples.length > MAX_SAMPLES) {
        state.samples.shift(); // Remove the oldest sample to maintain the sliding window
        console.log(state.samples.length); // Log the current length of the samples array
    } // fix for the visual shift bug 
    updateDisplay();
    drawGraph();
}

function toggleState() {
    state.isActive = !state.isActive;
    updateDisplay();
}

function startGenerator() {
    generateSample();
    setInterval(generateSample, SAMPLE_INTERVAL);
}

window.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('toggleState');

    if (!button) {
        return;
    }

    button.addEventListener('click', toggleState);
    updateDisplay();
    drawGraph();
    startGenerator();
});

window.addEventListener('resize', drawGraph);

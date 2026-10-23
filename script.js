const SAMPLE_INTERVAL = 5;// more realstic interpreation 
const MAX_SAMPLES = 2000;// to get the 10s of data points in the graph
const GRAPH_MAX_VALUE = 12;

const state = {
    isActive: false,
    currentValue: 0,
    samples: [],
};

function generateRestingSample() {
    return Math.random();
}

function generateActiveSample() {
    return 9 + Math.random() * 2;
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

    context.clearRect(0, 0, width, height);
    context.font = '11px Arial, sans-serif';
    context.textBaseline = 'middle';

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

    context.fillStyle = 'rgba(255, 255, 255, 0.62)';
    context.textAlign = 'left';
    context.fillText('10s', padding.left, height - 10);
    context.textAlign = 'right';
    context.fillText('now', width - padding.right, height - 10);

    if (state.samples.length < 2) {
        return;
    }

    const oldestSamplePosition = MAX_SAMPLES - state.samples.length;
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    for (let index = 1; index < state.samples.length; index += 1) {
        const previous = state.samples[index - 1];
        const sample = state.samples[index];
        const previousX = padding.left + ((oldestSamplePosition + index - 1) / (MAX_SAMPLES - 1)) * plotWidth;
        const x = padding.left + ((oldestSamplePosition + index) / (MAX_SAMPLES - 1)) * plotWidth;
        const previousY = padding.top + plotHeight * (1 - previous.value / GRAPH_MAX_VALUE);
        const y = padding.top + plotHeight * (1 - sample.value / GRAPH_MAX_VALUE);

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
    state.samples.push({ value: sample, isActive: state.isActive });
    if (state.samples.length > MAX_SAMPLES) {
        state.samples.shift();
    }
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

console.log('JS is running');

import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

window.addEventListener('DOMContentLoaded', async () => {
  const video = document.getElementById('video-obj');
  if (!video) throw new Error('Element #video-obj not found');
  console.log('video element:', video);

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
      console.log('Video stream started');
    })
    .catch(err => console.error('Error accessing webcam:', err));

  const model = await loadModel(); // <-- refactored

  video.addEventListener('loadeddata', () => {
    detectFrame(model, video, 'coco-ssd', 'coco-ssd-prefix');
    console.log('video loaded');
  });
});

async function loadModel() {
  return await cocoSsd.load(); // can later switch to other models here
}

function detectFrame(model, video, modelType, label = 'Object') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  Object.assign(canvas.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    zIndex: 1,
    pointerEvents: 'none',
  });

  video.parentNode.style.position = 'relative';
  video.parentNode.appendChild(canvas);

  setInterval(detect, 500);

  async function detect() {
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // const predictions = await model.detect(video);
    let predictions = [];

    if (modelType === 'coco-ssd') {
        predictions = await model.detect(video);
    } else if (modelType === 'mobilenet') {
        const result = await model.classify(video);
        // For classification models like MobileNet, you might show top-1 prediction only
        predictions = result.map((res, i) => ({
            class: res.className,
            score: res.probability,
            bbox: [10, 10 + i * 20, 200, 20], // dummy fixed box
        }));
    } else {
        console.warn(`Unknown modelType: ${modelType}`);
    }

    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach(pred => {
      const [x, y, width, height] = pred.bbox;
      ctx.strokeStyle = '#FF00FF';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#FF00FF';
      ctx.fillText(
        `${label}: ${pred.class} (${(pred.score * 100).toFixed(1)}%)`,
        x,
        y > 10 ? y - 5 : 10
      );
    });
  }

  detect();
}

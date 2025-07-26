console.log('JS is running');

import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as mobilenet from '@tensorflow-models/mobilenet';
import '@tensorflow/tfjs';

function waitForVideo(video) {
  return new Promise(resolve => {
    if (video.readyState >= 2) {
      resolve();
    } else {
      video.addEventListener('loadeddata', () => resolve(), { once: true });
    }
  });
}

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

  const modelType = 'coco-ssd'; // ← switch to 'mobilenet' here to test
//   const modelType = 'mobilenet'; // ← switch to 'mobilenet' here to test

  const model = await loadModel(modelType);
  await waitForVideo(video); 

  video.addEventListener('playing', () => {
    detectFrame(model, video, modelType, modelType + '-prefix');
    console.log('TEMP DELAY');

    console.log('video playing for modelType: ' + modelType);
  });

});



async function loadModel(modelType) {
  if (modelType === 'mobilenet') {
    const res = await mobilenet.load();
    console.log('Mobilenet model loaded');
    return res;
  } else if (modelType === 'coco-ssd') {
    return await cocoSsd.load();
  } else {
    throw new Error(`Unsupported model type: ${modelType}`);
  }
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

  setInterval(detect, 1000);

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

console.log('JS is running');

import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

window.addEventListener('DOMContentLoaded', async () => {
  const video = document.getElementById('video-obj');
  if (!video) {
    throw new Error('Element #video-obj not found');
  }
    console.log('video element:', video);

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    console.log('Video stream started');
  })
  .catch(err => {
    console.error('Error accessing webcam:', err);
  });

  

  const model = await cocoSsd.load();

  video.addEventListener('loadeddata', () => {
    // console.log('Video data loaded');
    detectFrame(model, video, 'object');
    console.log('video loaded');
  });
});

function detectFrame(model, video, label = 'object') {
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

    const predictions = await model.detect(video);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach(pred => {
      const [x, y, width, height] = pred.bbox;
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#00FFFF';
      ctx.fillText(
        `${label}: ${pred.class} (${(pred.score * 100).toFixed(1)}%)`,
        x,
        y > 10 ? y - 5 : 10
      );
    });
  }

  detect();
}

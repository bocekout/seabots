import * as faceapi from 'face-api.js';

const video = document.getElementById('video');

async function start() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.ageGenderNet.loadFromUri('/models');
  await faceapi.nets.faceExpressionNet.loadFromUri('/models');
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/models');

  const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
  video.srcObject = stream;

  video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);

    Object.assign(canvas.style, {position: 'absolute', top: 0, left: 0});
    document.body.appendChild(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

      //console.log(detections);
      if (detections.length > 0) {
        const resized = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resized);
        //faceapi.draw.drawLandmarks(canvas, resized);
        faceapi.draw.drawFaceLandmarks(canvas, resized);
      }

    }, 500);
  });
}

start();
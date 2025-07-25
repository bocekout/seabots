import * as faceapi from 'face-api.js';

const video = document.getElementById('video');

async function start() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.ageGenderNet.loadFromUri('/models');
  await faceapi.nets.faceExpressionNet.loadFromUri('/models');
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
  await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
  await faceapi.nets.mtcnn.loadFromUri('/models');
  await faceapi.nets.faceRecognitionNet.loadFromUri('/models');

  const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
  video.srcObject = stream;

  video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);

    Object.assign(canvas.style, { position: 'absolute', top: 0, left: 0 });
    document.body.appendChild(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withAgeAndGender()
        .withFaceDescriptor()
        .withFaceExpressions();


      if (detections) {
        const resized = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resized);
        faceapi.draw.drawFaceLandmarks(canvas, resized);
        faceapi.draw.drawFaceExpressions(canvas, resized);

        const faceMatcher = new faceapi.FaceMatcher(detections.descriptor);
        const bestMatch = faceMatcher.findBestMatch(detections.descriptor);
        console.log(bestMatch.toString());
      }

    }, 500);
  });
}

start();
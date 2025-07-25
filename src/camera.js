import * as faceapi from 'face-api.js';

const video = document.getElementById('video');
const photo = document.getElementById("photo");

document.querySelector("#capture").addEventListener("click", e => {
  takePicture();
  e.preventDefault();
});

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

    Object.assign(canvas.style, { position: 'absolute', top: 0, left: '8px' });
    document.querySelector("#video-container").appendChild(canvas);
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
      }

    }, 500);
  });
}

function takePicture() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (video.videoWidth && video.videoHeight) {
    canvas.width = video.videoWidth / 2;
    canvas.height = video.videoHeight / 2;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photoContainer = document.createElement("div");
    photoContainer.className = "photo-container";
    const photo = document.createElement("img");
    photo.setAttribute("src", canvas.toDataURL("image/png"));
    photoContainer.appendChild(photo);

    const btn = document.createElement("button");
    btn.className= "close";
    btn.addEventListener("click", (e) => {
      e.target.closest(".photo-container").remove();
    })

    photoContainer.appendChild(btn);
    document.querySelector("#photos").appendChild(photoContainer);

  }
}

start();
import * as deeplab from '@tensorflow-models/deeplab';

const video = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');

document.querySelector("#capture").addEventListener("click", e => {
  takePicture();
  e.preventDefault();
});

async function start() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
  video.srcObject = stream;

  // const model = await deeplab.load({ base: 'ade20k', quantizationBytes: 4 });
  // const legend = model.getLegend(); // Array of {id, name, color}
  // console.log(legend);
  // video.addEventListener('play', () => {

  // });
}

async function takePicture() {
  await new Promise(resolve => setTimeout(resolve, 2000));
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

    const scanBtn = document.createElement("button");
    scanBtn.className = "scan";
    scanBtn.addEventListener("click", (e) => {
      segment((e.target.closest(".photo-container").querySelector("img")));
      e.preventDefault();
    });
    photoContainer.appendChild(scanBtn);

    const closeBtn = document.createElement("button");
    closeBtn.className = "close";
    closeBtn.addEventListener("click", (e) => {
      e.target.closest(".photo-container").remove();
    })

    photoContainer.appendChild(closeBtn);
    document.querySelector("#photos").appendChild(photoContainer);
  }
}

async function segment(img) {
  const model = await deeplab.load({ base: 'ade20k', quantizationBytes: 4 });

  // Run segmentation
  const segmentation = await model.segment(img);

  // Create a temporary canvas to draw the segmentation map at its native size
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = segmentation.width;
  tempCanvas.height = segmentation.height;
  const tempCtx = tempCanvas.getContext("2d");

  const imageData = new ImageData(
    new Uint8ClampedArray(segmentation.segmentationMap.map(v => v * 255)), // Convert to grayscale
    segmentation.width,
    segmentation.height
  );
  tempCtx.putImageData(imageData, 0, 0);

  // Now draw the temp canvas scaled onto a final canvas matching the image size
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = img.width;
  finalCanvas.height = img.height;
  const finalCtx = finalCanvas.getContext("2d");

  // Draw scaled segmentation map onto the final canvas
  finalCtx.drawImage(tempCanvas, 0, 0, finalCanvas.width, finalCanvas.height);

  // Overlay canvas on top of the image
  img.closest(".photo-container").appendChild(finalCanvas);
}

start();
import * as deeplab from '@tensorflow-models/deeplab';
import { pipeline, SamModel, AutoProcessor, RawImage } from '@huggingface/transformers';

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

async function segment(imgElement) {
  const modelId = 'Xenova/slimsam-77-uniform';
  const model = await SamModel.from_pretrained(modelId, {
    device: 'webgpu',
    dtype: 'fp16'  // or other supported types
  });
  const processor = await AutoProcessor.from_pretrained(modelId);

  // Load your image
  const rawImage = await RawImage.read(imgElement.src);

  // Provide a point prompt: e.g. [x, y] coordinates
  const inputPoints = [[[160, 120]]]; // Example point, adjust as needed

  const inputs = await processor(rawImage, { input_points: inputPoints });

  const outputs = await model(inputs);

  const masks = await processor.post_process_masks(
    outputs.pred_masks,
    inputs.original_sizes,
    inputs.reshaped_input_sizes
  );

  const maskData = RawImage.fromTensor(masks[0][0].mul(255));
  await maskData.save('mask.png');

  const { height, width } = maskData;
  const rgb = maskData.data; // Flat array of RGB values

  // Create new array with alpha channel added
  const rgba = new Uint8ClampedArray(width * height * 4);

  for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) {
    rgba[j] = rgb[i];       // R
    rgba[j + 1] = rgb[i + 1]; // G
    rgba[j + 2] = rgb[i + 2]; // B
    rgba[j + 3] = 127;        // A (semi-transparent)
  }

  const imageData = new ImageData(rgba, width, height);

  // Draw on canvas
  const canvas = document.createElement("canvas");
  canvas.width = imgElement.naturalWidth;
  canvas.height = imgElement.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.putImageData(imageData, 0, 0);
  imgElement.closest(".photo-container").appendChild(canvas);
}

start();
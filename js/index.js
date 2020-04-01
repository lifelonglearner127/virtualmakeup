let hair_model
let face_model
let video
const videoWidth = 600;
const videoHeight = 500;
let makeupTypes = []

async function virtualMakeup (imageElement) {
  const predictions = await face_model.estimateFaces(imageElement);
  console.log(predictions)
}

/**
 * Loads a the camera to be used in the demo
 *
 */
async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw 'Browser API navigator.mediaDevices.getUserMedia not available';
  }

  video = document.getElementById('video');
  video.width = videoWidth;
  video.height = videoHeight;

  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      width: videoWidth,
      height: videoHeight}
  });
  video.srcObject = stream;

  return new Promise(resolve => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

function virtualMakeupInRealTime () {
  // let frame = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC4)
  // let cap = new cv.VideoCapture('video')

  let videoCanvas = document.getElementById('videoOutput')
  let ctx = videoCanvas.getContext('2d')
  videoCanvas.width = videoWidth
  videoCanvas.height = videoHeight
  ctx.translate(videoWidth, 0);
  ctx.scale(-1, 1);

  async function virtualMakeupFrame () {
    // cap.read(frame)
    const predictions = await face_model.estimateFaces(video);

    ctx.clearRect(0, 0, videoWidth, videoHeight);
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    
    if (predictions.length > 0) {
      predictions.forEach(prediction => {
        let lipsUpper = prediction.annotations.lipsUpperOuter
        lipsUpper.push(...prediction.annotations.lipsUpperInner.reverse())
        const lipsLowerOuter = prediction.annotations.lipsLowerOuter
        ctx.beginPath()
        ctx.moveTo(lipsUpper[0][0], lipsUpper[0][1])
        for (let i = 1; i < lipsUpper.length; i++) {
          const point = lipsUpper[i]
          ctx.lineTo(point[0], point[1])
        }
        ctx.fillStyle = 'aqua';
        ctx.fill();
        ctx.closePath()
      })
    }
    // cv.imshow('videoOutput', src)
    requestAnimationFrame(virtualMakeupFrame)
  }
  virtualMakeupFrame()
}

function makeupType(type) {
  if (makeupTypes.indexOf(type) === -1) {
    makeupTypes.push(type)
  }
  console.log(makeupTypes)
}

async function bindPage() {
  // Load Models
  hair_model = await tf.loadLayersModel('models/model.json')
  face_model = await facemesh.load();

  // Add Image Load Event
  let srcImageInputElement = document.getElementById('srcImageInput');
  let srcImageElement = document.getElementById('srcImage');
  
  srcImageInputElement.onchange = function () {
    srcImageElement.src = URL.createObjectURL(event.target.files[0])
  }
  srcImageElement.onload = function () {
    virtualMakeup(srcImageElement)
  }

  // Virtual make from camera frame
  await setupCamera();
  video.play()
  virtualMakeupInRealTime()
}
  
function onOpenCvReady() {
  bindPage();
}

const videoElement = document.querySelector("video");
const startBtn = document.getElementById("staerBtn");
const stopBtn = document.getElementById("stopBtn");
const selectVideoBtn = document.getElementById("selectVideoBtn");

let mediaRecorder;
const recorderMedia = [];

const { writeFile } = require("fs");
const { desktopCapturer, remote } = require("electron");
const { Menu, dialog } = remote;

selectVideoBtn.onclick = openVideoSource;

startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add("is-danger");
  startBtn.innerText = "Recording";
};

stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove("is-danger");
  startBtn.innerText = "Start";
};

async function openVideoSource() {
  const inputSource = await desktopCapturer.getSources({
    types: ["window", "screen"]
  });

  const videoOptionMenu = Menu.buildFromTemplate(
    inputSource.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      };
    })
  );

  videoOptionMenu.popup();
}

async function selectSource(source) {
  selectVideoBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id
      }
    }
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  videoElement.srcObject = stream;
  videoElement.play();

  const options = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
  console.log("video is available");

  recorderMedia.push(e.data);
}

async function handleStop(e) {
  const blob = new Blob(recorderMedia, {
    type: "video/webm; codes=vp9"
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save Video",
    defaultPath: `vid-${Date.now()}.webm`
  });

  console.log(filePath);

  writeFile(filePath, buffer, () => console.log("video saved successfully"));
}

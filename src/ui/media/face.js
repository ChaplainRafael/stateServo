const vscode = acquireVsCodeApi();

const face = document.getElementById("face");

const moodElement = document.getElementById("mood");

const activityElement = document.getElementById("activity");

const fileElement = document.getElementById("file");

const errorsElement = document.getElementById("errors");

const warningsElement = document.getElementById("warnings");

const leftEye = document.getElementById("left-eye");

const rightEye = document.getElementById("right-eye");

/*
 * --------------------------------------------------
 * MOOD LABELS
 * --------------------------------------------------
 */

const moodLabels = {
  neutral: "NEUTRAL",
  focused: "FOCUSED",
  warning: "WATCHING",
  error: "ERROR",
  "save-success": "SAVED",
  "save-error": "SAVE ERR",
  idle: "SLEEP",
};

/*
 * --------------------------------------------------
 * RENDER STATE
 * --------------------------------------------------
 */

function renderState(state) {
  face.dataset.mood = state.mood;

  moodElement.textContent = moodLabels[state.mood] ?? "NEUTRAL";

  if (state.typing) {
    activityElement.textContent = "EDITING";
  } else if (state.inactive) {
    activityElement.textContent = "IDLE";
  } else {
    activityElement.textContent = "ACTIVE";
  }

  if (state.activeFile) {
    const parts = state.activeFile.split(/[\\/]+/);

    fileElement.textContent = parts[parts.length - 1];
  } else {
    fileElement.textContent = "NO ACTIVE FILE";
  }

  errorsElement.textContent = `ERR ${state.errors}`;

  warningsElement.textContent = `WRN ${state.warnings}`;
}

/*
 * --------------------------------------------------
 * EXTENSION → WEBVIEW
 * --------------------------------------------------
 */

window.addEventListener("message", (event) => {
  const message = event.data;

  if (!message || message.type !== "state") {
    return;
  }
  console.log("listener state", message.state);
  renderState(message.state);
});

/*
 * --------------------------------------------------
 * BLINK
 * --------------------------------------------------
 */

function blink() {
  leftEye.classList.add("blink");

  rightEye.classList.add("blink");

  setTimeout(() => {
    leftEye.classList.remove("blink");

    rightEye.classList.remove("blink");
  }, 120);
}

/*
 * Blink every ~3.5 seconds.
 */

setInterval(blink, 3500);

/*
 * Tell the extension that the
 * webview is ready to receive state.
 */

vscode.postMessage({
  type: "ready",
});

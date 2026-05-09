const statusDiv = document.getElementById("status");
const scanCountDiv = document.getElementById("scanCount");
const exportBtn = document.getElementById("exportBtn");

let attendance = [];
let html5QrCode;

function setStatus(msg, type) {
  statusDiv.className = type;
  statusDiv.innerHTML = msg;
}

function updateCount() {
  scanCountDiv.innerHTML = `${attendance.length} CHECK-INS`;
}

function onScanSuccess(decodedText) {

  const eventName =
    document.getElementById("eventSelect").value;

  if (!eventName) {
    setStatus("SELECT EVENT", "error");
    return;
  }

  const exists = attendance.some(
    x => x.memberId === decodedText && x.event === eventName
  );

  if (exists) {
    setStatus("ALREADY CHECKED IN", "error");
    return;
  }

  attendance.push({
    timestamp: new Date().toLocaleString(),
    memberId: decodedText,
    event: eventName
  });

  updateCount();

  setStatus(`✅ ${decodedText}`, "success");

  navigator.vibrate?.(120);
}

/**
 * FORCE BACK CAMERA START
 */
function startScanner() {

  html5QrCode = new Html5Qrcode("reader");

  Html5Qrcode.getCameras()
    .then(devices => {

      if (!devices || devices.length === 0) {
        setStatus("NO CAMERA FOUND", "error");
        return;
      }

      // Try to find back camera
      let backCamera = devices.find(d =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear") ||
        d.label.toLowerCase().includes("environment")
      );

      // fallback if labels are hidden (iOS often hides them)
      if (!backCamera) {
        backCamera = devices[devices.length - 1];
      }

      html5QrCode.start(
        backCamera.id,
        {
          fps: 10,
          qrbox: 250
        },
        onScanSuccess
      )
      .then(() => {
        setStatus("SCANNING...", "neutral");
      })
      .catch(err => {
        console.error(err);
        setStatus("CAMERA ERROR", "error");
      });
    });
}

startScanner();

/**
 * EXPORT CSV
 */
exportBtn.addEventListener("click", () => {

  if (attendance.length === 0) {
    setStatus("NO DATA", "error");
    return;
  }

  let csv = "Timestamp,Member ID,Event\n";

  attendance.forEach(r => {
    csv += `${r.timestamp},${r.memberId},${r.event}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "ofk-attendance.csv";
  a.click();

  URL.revokeObjectURL(url);

  setStatus("EXPORTED", "success");
});

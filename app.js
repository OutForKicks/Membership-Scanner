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

/**
 * Handle scan result
 */
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
 * FORCE BACK CAMERA (FIX)
 */
function startScanner() {

  html5QrCode = new Html5Qrcode("reader");

  const config = {
    fps: 10,
    qrbox: 250
  };

  /**
   * STEP 1:
   * Strongly request BACK CAMERA
   */
  const cameraConstraints = {
    facingMode: { exact: "environment" }
  };

  html5QrCode.start(
    cameraConstraints,
    config,
    onScanSuccess
  )
  .then(() => {
    setStatus("SCANNING...", "neutral");
  })

  /**
   * STEP 2: fallback for iOS/Safari restrictions
   */
  .catch(err => {

    console.warn("Exact back camera failed, retrying fallback...", err);

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      onScanSuccess
    )
    .then(() => {
      setStatus("SCANNING...", "neutral");
    })

    .catch(err2 => {
      console.error(err2);
      setStatus("CAMERA ERROR", "error");
    });

  });
}

startScanner();

/**
 * EXPORT CSV (LOCAL SPREADSHEET OUTPUT)
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

const statusDiv =
  document.getElementById("status");

const scanCountDiv =
  document.getElementById("scanCount");

const exportBtn =
  document.getElementById("exportBtn");

let attendance = [];

function setStatus(message, type) {

  statusDiv.className = type;
  statusDiv.innerHTML = message;
}

function updateCount() {

  scanCountDiv.innerHTML =
    `${attendance.length} CHECK-INS`;
}

function onScanSuccess(decodedText) {

  const eventName =
    document.getElementById("eventSelect").value;

  if (!eventName) {

    setStatus(
      "SELECT EVENT",
      "error"
    );

    return;
  }

  const alreadyExists =
    attendance.some(
      entry =>
        entry.memberId === decodedText &&
        entry.event === eventName
    );

  if (alreadyExists) {

    setStatus(
      "ALREADY CHECKED IN",
      "error"
    );

    return;
  }

  const entry = {

    timestamp:
      new Date().toLocaleString(),

    memberId:
      decodedText,

    event:
      eventName
  };

  attendance.push(entry);

  updateCount();

  setStatus(
    `✅ ${decodedText}`,
    "success"
  );

  navigator.vibrate?.(120);
}

const scanner =
  new Html5QrcodeScanner(
    "reader",
    {
      fps: 10,
      qrbox: 250
    }
  );

scanner.render(onScanSuccess);

exportBtn.addEventListener(
  "click",
  () => {

    if (attendance.length === 0) {

      setStatus(
        "NO DATA TO EXPORT",
        "error"
      );

      return;
    }

    let csv =
      "Timestamp,Member ID,Event\n";

    attendance.forEach(row => {

      csv +=
        `${row.timestamp},${row.memberId},${row.event}\n`;
    });

    const blob =
      new Blob(
        [csv],
        { type: "text/csv" }
      );

    const url =
      window.URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      "ofk-attendance.csv";

    a.click();

    window.URL.revokeObjectURL(url);

    setStatus(
      "CSV EXPORTED",
      "success"
    );
  }
);

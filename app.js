const statusDiv = document.getElementById("status");
const scanCountDiv = document.getElementById("scanCount");
const exportBtn = document.getElementById("exportBtn");
const newEventBtn = document.getElementById("newEventBtn");

let attendance =
  JSON.parse(localStorage.getItem("ofkAttendance")) || [];

let html5QrCode;

function saveAttendance() {
  localStorage.setItem(
    "ofkAttendance",
    JSON.stringify(attendance)
  );
}

function setStatus(message, type) {
  statusDiv.className = type;
  statusDiv.innerHTML = message;
}

function getSelectedEvent() {
  return document.getElementById("eventSelect").value;
}

function updateCount() {
  const eventName = getSelectedEvent();

  if (!eventName) {
    scanCountDiv.innerHTML = "0 CHECK-INS";
    return;
  }

  const eventCount = attendance.filter(
    row => row.event === eventName
  ).length;

  scanCountDiv.innerHTML =
    `${eventCount} CHECK-INS`;
}

function findMember(decodedText) {
  try {
    const url = new URL(decodedText);

    const rawMember =
      url.searchParams.get("member") ||
      url.searchParams.get("MEMBER");

    if (!rawMember) {
      return null;
    }

    const parts =
      decodeURIComponent(rawMember).split("|");

    if (parts.length < 3) {
      return null;
    }

    return {
      firstName: parts[0],
      surname: parts[1],
      teamName: parts[2]
    };

  } catch {
    return null;
  }
}

function onScanSuccess(decodedText) {
  const eventName = getSelectedEvent();

  if (!eventName) {
    setStatus("SELECT EVENT", "error");
    return;
  }

  const member = findMember(decodedText);

  if (!member) {
    setStatus("INVALID MEMBER QR", "error");
    console.log(decodedText);
    return;
  }

  const fullName =
    `${member.firstName} ${member.surname}`;

  const exists = attendance.some(entry =>
    entry.firstName === member.firstName &&
    entry.surname === member.surname &&
    entry.teamName === member.teamName &&
    entry.event === eventName
  );

  if (exists) {
    setStatus(
      `ALREADY CHECKED IN<br>${fullName}`,
      "error"
    );
    return;
  }

  attendance.push({
    timestamp: new Date().toLocaleString(),
    firstName: member.firstName,
    surname: member.surname,
    teamName: member.teamName,
    event: eventName
  });

  saveAttendance();
  updateCount();

  setStatus(
    `✅ ${fullName}<br>${member.teamName}`,
    "success"
  );

  navigator.vibrate?.(120);
}

function startScanner() {
  html5QrCode = new Html5Qrcode("reader");

  const config = {
    fps: 10,
    qrbox: 250
  };

  html5QrCode.start(
    { facingMode: { exact: "environment" } },
    config,
    onScanSuccess
  )
  .then(() => {
    setStatus("SCANNING...", "neutral");
  })
  .catch(() => {
    html5QrCode.start(
      { facingMode: "environment" },
      config,
      onScanSuccess
    )
    .then(() => {
      setStatus("SCANNING...", "neutral");
    })
    .catch(error => {
      console.error(error);
      setStatus("CAMERA ERROR", "error");
    });
  });
}

startScanner();
updateCount();

document
  .getElementById("eventSelect")
  .addEventListener("change", () => {
    updateCount();
    setStatus("READY TO SCAN", "neutral");
  });

newEventBtn.addEventListener("click", () => {
  updateCount();
  setStatus("READY FOR NEW EVENT", "neutral");
});

exportBtn.addEventListener("click", () => {
  if (attendance.length === 0) {
    setStatus("NO DATA", "error");
    return;
  }

  let csv =
    "Timestamp,First Name,Surname,Team,Event\n";

  attendance.forEach(row => {
    csv +=
      `"${row.timestamp}","${row.firstName}","${row.surname}","${row.teamName}","${row.event}"\n`;
  });

  const blob =
    new Blob([csv], { type: "text/csv" });

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = "ofk-attendance-all-events.csv";
  a.click();

  URL.revokeObjectURL(url);

  setStatus("EXPORTED", "success");
});

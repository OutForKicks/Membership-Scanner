const statusDiv = document.getElementById("status");
const scanCountDiv = document.getElementById("scanCount");
const exportBtn = document.getElementById("exportBtn");

let attendance = [];
let html5QrCode;

function setStatus(message, type) {
  statusDiv.className = type;
  statusDiv.innerHTML = message;
}

function updateCount() {
  scanCountDiv.innerHTML = `${attendance.length} CHECK-INS`;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function findMember(decodedText) {
  let memberSlug = "";

  try {
    const url = new URL(decodedText);
    memberSlug = url.searchParams.get("member");
  } catch {
    return null;
  }

  if (!memberSlug) {
    return null;
  }

  return MEMBERS.find(member => {
    const fullSlug = slugify(`${member.firstName}-${member.surname}`);
    return fullSlug === memberSlug;
  });
}

function onScanSuccess(decodedText) {
  const eventName = document.getElementById("eventSelect").value;

  if (!eventName) {
    setStatus("SELECT EVENT", "error");
    return;
  }

  const member = findMember(decodedText);

  if (!member) {
    setStatus("INVALID MEMBER QR", "error");
    return;
  }

  const fullName = `${member.firstName} ${member.surname}`;

  const exists = attendance.some(entry =>
    entry.firstName === member.firstName &&
    entry.surname === member.surname &&
    entry.event === eventName
  );

  if (exists) {
    setStatus(`ALREADY CHECKED IN<br>${fullName}`, "error");
    return;
  }

  attendance.push({
    timestamp: new Date().toLocaleString(),
    firstName: member.firstName,
    surname: member.surname,
    teamName: member.teamName,
    event: eventName
  });

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

exportBtn.addEventListener("click", () => {
  if (attendance.length === 0) {
    setStatus("NO DATA", "error");
    return;
  }

  let csv = "Timestamp,First Name,Surname,Team,Event\n";

  attendance.forEach(row => {
    csv += `"${row.timestamp}","${row.firstName}","${row.surname}","${row.teamName}","${row.event}"\n`;
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

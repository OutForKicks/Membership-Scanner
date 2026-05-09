const statusDiv = document.getElementById("status");
const scanCountDiv = document.getElementById("scanCount");
const exportBtn = document.getElementById("exportBtn");

let attendance = [];
let html5QrCode;

/**
 * STATUS UI
 */
function setStatus(message, type) {
  statusDiv.className = type;
  statusDiv.innerHTML = message;
}

/**
 * UPDATE COUNT
 */
function updateCount() {
  scanCountDiv.innerHTML =
    `${attendance.length} CHECK-INS`;
}

/**
 * PARSE MEMBER FROM QR
 *
 * Expected QR format:
 * https://outforkicks.github.io/2026-OFK-Member/?MEMBER=AARON|GILL|SOLVE
 */
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
      decodeURIComponent(rawMember)
      .split("|");

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

/**
 * HANDLE QR SCAN
 */
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

  const member =
    findMember(decodedText);

  if (!member) {

    setStatus(
      "INVALID MEMBER QR",
      "error"
    );

    console.log(decodedText);

    return;
  }

  const fullName =
    `${member.firstName} ${member.surname}`;

  const exists =
    attendance.some(entry =>

      entry.firstName === member.firstName &&
      entry.surname === member.surname &&
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

    timestamp:
      new Date().toLocaleString(),

    firstName:
      member.firstName,

    surname:
      member.surname,

    teamName:
      member.teamName,

    event:
      eventName
  });

  updateCount();

  setStatus(
    `✅ ${fullName}<br>${member.teamName}`,
    "success"
  );

  navigator.vibrate?.(120);
}

/**
 * START SCANNER
 * FORCE BACK CAMERA
 */
function startScanner() {

  html5QrCode =
    new Html5Qrcode("reader");

  const config = {
    fps: 10,
    qrbox: 250
  };

  html5QrCode.start(

    {
      facingMode: {
        exact: "environment"
      }
    },

    config,

    onScanSuccess
  )

  .then(() => {

    setStatus(
      "SCANNING...",
      "neutral"
    );
  })

  .catch(() => {

    html5QrCode.start(

      {
        facingMode: "environment"
      },

      config,

      onScanSuccess
    )

    .then(() => {

      setStatus(
        "SCANNING...",
        "neutral"
      );
    })

    .catch(error => {

      console.error(error);

      setStatus(
        "CAMERA ERROR",
        "error"
      );
    });
  });
}

startScanner();

/**
 * EXPORT CSV
 */
exportBtn.addEventListener(
  "click",
  () => {

    if (attendance.length === 0) {

      setStatus(
        "NO DATA",
        "error"
      );

      return;
    }

    let csv =
      "Timestamp,First Name,Surname,Team,Event\n";

    attendance.forEach(row => {

      csv +=
        `"${row.timestamp}","${row.firstName}","${row.surname}","${row.teamName}","${row.event}"\n`;
    });

    const blob =
      new Blob(
        [csv],
        { type: "text/csv" }
      );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      "ofk-attendance.csv";

    a.click();

    URL.revokeObjectURL(url);

    setStatus(
      "EXPORTED",
      "success"
    );
  }
);

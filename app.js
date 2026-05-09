const SCRIPT_URL = "YOUR_GOOGLE_SCRIPT_URL";

const statusDiv =
  document.getElementById("status");

statusDiv.className = "neutral";
statusDiv.innerHTML = "READY TO SCAN";

function setStatus(message, type) {

  statusDiv.className = type;
  statusDiv.innerHTML = message;
}

function onScanSuccess(decodedText) {

  const eventName =
    document.getElementById("eventName").value;

  if (!eventName) {

    setStatus(
      "ENTER EVENT NAME",
      "error"
    );

    return;
  }

  fetch(SCRIPT_URL, {
    method: "POST",

    body: JSON.stringify({
      memberId: decodedText,
      eventName: eventName
    })
  })

  .then(response => response.json())

  .then(data => {

    if (data.success) {

      setStatus(
        `✅ ${data.name}`,
        "success"
      );

      navigator.vibrate?.(120);

    } else {

      setStatus(
        `⚠️ ${data.message}`,
        "error"
      );
    }
  })

  .catch(error => {

    console.error(error);

    setStatus(
      "SERVER ERROR",
      "error"
    );
  });
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

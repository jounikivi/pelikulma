"use strict";

// Storage keys are shared with the games. Records stay in this browser.
function readRecord(key) {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

function updateRecords() {
  document.getElementById("bm").textContent =
    "Ennätys " + readRecord("mato2-classic-normal");
  document.getElementById("bl").textContent =
    "Ennätys " + readRecord("loiste-best");
}

updateRecords();
window.addEventListener("pageshow", updateRecords);
window.addEventListener("storage", updateRecords);

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
  document.getElementById("bm").textContent = readRecord(
    "mato2-classic-normal",
  ).toLocaleString("fi-FI");
  document.getElementById("bl").textContent =
    readRecord("loiste-best").toLocaleString("fi-FI");
  document.getElementById("bp").textContent =
    readRecord("pomppu-best").toLocaleString("fi-FI");
  document.getElementById("bt").textContent = readRecord(
    "taivaskipina-best-normal",
  ).toLocaleString("fi-FI");
  document.getElementById("game-count").textContent =
    String(document.querySelectorAll(".game-card").length).padStart(2, "0") +
    " PELIÄ";
}

updateRecords();
window.addEventListener("pageshow", updateRecords);
window.addEventListener("storage", updateRecords);

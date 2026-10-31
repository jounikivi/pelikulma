// Trap keyboard focus while a game dialog is open.
(() => {
  const overlay = document.querySelector(".overlay");
  const app = document.querySelector(".game-app");
  let previouslyFocused;
  function sync() {
    const open = !overlay.classList.contains("hide");
    app.inert = open;
    if (open) {
      previouslyFocused = document.activeElement;
      overlay.querySelector(".sheet").focus({ preventScroll: true });
    } else if (previouslyFocused && app.contains(previouslyFocused)) {
      previouslyFocused.focus({ preventScroll: true });
    }
  }
  new MutationObserver(sync).observe(overlay, {
    attributes: true,
    attributeFilter: ["class"],
  });
  overlay.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const items = [
      ...overlay.querySelectorAll(
        'button:not(:disabled),a[href],input,summary,[tabindex="0"]',
      ),
    ].filter((element) => element.getClientRects().length > 0);
    const first = items[0],
      last = items[items.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        document.activeElement.classList.contains("sheet"))
    ) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  sync();
})();

function initTheme() {
  const btn = document.getElementById("theme-toggle");

  if (!btn) return;

  const saved = localStorage.getItem("theme");

  if (saved === "light") {
    document.body.classList.add("light-mode");
  }

  updateIcon(btn);

  btn.onclick = () => {
    document.body.classList.toggle("light-mode");

    localStorage.setItem(
      "theme",
      document.body.classList.contains("light-mode") ? "light" : "dark",
    );

    updateIcon(btn);
  };
}

function updateIcon(btn) {
  btn.textContent = document.body.classList.contains("light-mode")
    ? "☀️"
    : "🌙";
}

document.addEventListener("DOMContentLoaded", initTheme);

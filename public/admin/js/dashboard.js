async function loadDashboard() {
  try {
    const response = await fetch("/api/dashboard");

    const data = await response.json();

    if (data.success) {
      document.getElementById("totalManga").textContent =
        data.dashboard.totalManga;

      document.getElementById("totalChapter").textContent =
        data.dashboard.totalChapter;

      document.getElementById("totalPage").textContent =
        data.dashboard.totalPage;
    }
  } catch (error) {
    console.error(error);
  }
}

loadDashboard();

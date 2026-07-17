// ==========================================
// LOAD DANH SÁCH THỂ LOẠI
// ==========================================

async function loadGenres() {
  try {
    const response = await fetch("/api/genres");

    const data = await response.json();

    const genresList = document.getElementById("genresList");

    genresList.innerHTML = "";

    if (!data.success) {
      genresList.innerHTML = "<p>Không thể tải thể loại.</p>";

      return;
    }

    data.genres.forEach((genre) => {
      genresList.innerHTML += `

                <a
                    href="genre-detail.html?id=${genre.id}"
                    class="genre-item"
                >
                    ${genre.name}
                </a>

            `;
    });
  } catch (error) {
    console.error(error);
  }
}

loadGenres();

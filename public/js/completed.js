async function loadCompletedMangas() {
  try {
    const response = await fetch("/api/mangas/completed");

    const data = await response.json();

    const mangaList = document.getElementById("mangaList");

    mangaList.innerHTML = "";

    if (!data.success || data.mangas.length === 0) {
      mangaList.innerHTML = "<p>Chưa có truyện hoàn thành.</p>";

      return;
    }

    data.mangas.forEach((manga) => {
      mangaList.innerHTML += `
                <div class="manga-card">

                    <a href="manga-detail.html?id=${manga.id}">

                        <img src="${manga.cover}" alt="${manga.title}">

                        <h3>${manga.title}</h3>

                    </a>

                </div>
            `;
    });
  } catch (err) {
    console.error(err);
  }
}

loadCompletedMangas();

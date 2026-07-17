async function loadNewMangas() {
  const response = await fetch("/api/mangas/new");

  const data = await response.json();

  const mangaList = document.getElementById("mangaList");

  mangaList.innerHTML = "";

  if (!data.success) {
    mangaList.innerHTML = "<p>Không có truyện.</p>";
    return;
  }

  data.mangas.forEach((manga) => {
    mangaList.innerHTML += `
            <div class="manga-card">

                <a href="manga.html?id=${manga.id}">

                    <img src="${manga.cover}" alt="">

                    <h3>${manga.title}</h3>

                </a>

            </div>
        `;
  });
}

loadNewMangas();

const params = new URLSearchParams(window.location.search);

const genreId = params.get("id");

async function loadGenre() {
  const response = await fetch(`/api/genres/${genreId}`);

  const data = await response.json();

  const mangaList = document.getElementById("mangaList");

  const genreTitle = document.getElementById("genreTitle");

  mangaList.innerHTML = "";

  if (!data.success) {
    genreTitle.innerHTML = "Không tìm thấy thể loại";

    return;
  }

  if (data.mangas.length == 0) {
    genreTitle.innerHTML = "Chưa có truyện";

    return;
  }

  genreTitle.innerHTML = data.mangas[0].genre_name;

  data.mangas.forEach((manga) => {
    mangaList.innerHTML += `
            <div class="manga-card">

                <a href="manga.html?id=${manga.id}">

                    <img src="${manga.cover}" alt="${manga.title}">

                    <h3>${manga.title}</h3>

                </a>

            </div>
        `;
  });
}

loadGenre();

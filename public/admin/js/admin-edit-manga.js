// ==========================================
// LẤY ID TỪ URL
// ==========================================

const params = new URLSearchParams(window.location.search);

const mangaId = params.get("id");

// ==========================================
// LOAD THÔNG TIN TRUYỆN
// ==========================================

async function loadManga() {
  try {
    const response = await fetch(`/api/admin/mangas/${mangaId}`);

    const data = await response.json();

    if (!data.success) {
      alert(data.message);
      return;
    }

    const manga = data.manga;

    document.getElementById("title").value = manga.title;
    document.getElementById("author").value = manga.author || "";
    document.getElementById("artist").value = manga.artist || "";
    document.getElementById("description").value = manga.description || "";
    document.getElementById("status").value = manga.status;

    document.getElementById("coverPreview").src =
      manga.cover || "images/no-cover.png";
  } catch (error) {
    console.error(error);
  }
}

loadManga();

// ==========================================
// LOAD THỂ LOẠI
// ==========================================

async function loadGenres() {
  try {
    const response = await fetch("/api/genres");

    const data = await response.json();

    const genreList = document.getElementById("genreList");

    genreList.innerHTML = "";

    if (!data.success) {
      genreList.innerHTML = "<p>Không tải được thể loại.</p>";
      return;
    }

    data.genres.forEach((genre) => {
      genreList.innerHTML += `
        <label class="genre-item">

          <input
            type="checkbox"
            value="${genre.id}"
          >

          ${genre.name}

        </label>
      `;
    });

    loadSelectedGenres();
  } catch (error) {
    console.error(error);
  }
}

// ==========================================
// LOAD THỂ LOẠI ĐÃ CHỌN
// ==========================================

async function loadSelectedGenres() {
  try {
    const response = await fetch(`/api/admin/mangas/${mangaId}/genres`);

    const data = await response.json();

    if (!data.success) return;

    data.genres.forEach((genre) => {
      const checkbox = document.querySelector(
        `#genreList input[value="${genre.genre_id}"]`,
      );

      if (checkbox) {
        checkbox.checked = true;
      }
    });
  } catch (error) {
    console.error(error);
  }
}

loadManga();

loadGenres();

document
  .getElementById("editMangaForm")
  .addEventListener("submit", updateManga);

async function updateManga(e) {
  e.preventDefault();

  const formData = new FormData();

  formData.append("title", title.value);
  formData.append("author", author.value);
  formData.append("artist", artist.value);
  formData.append("description", description.value);
  formData.append("status", status.value);

  if (cover.files.length > 0) {
    formData.append("cover", cover.files[0]);
  }

  document.querySelectorAll("#genreList input:checked").forEach((checkbox) => {
    formData.append("genres", checkbox.value);
  });

  const response = await fetch(`/api/admin/mangas/${mangaId}`, {
    method: "PUT",
    body: formData,
  });

  const data = await response.json();

  if (data.success) {
    alert("Cập nhật thành công!");

    location.href = "manga.html";
  } else {
    alert(data.message);
  }
}

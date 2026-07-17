// ==========================================
// LOAD DANH SÁCH THỂ LOẠI
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
  } catch (error) {
    console.error(error);
  }
}

loadGenres();

// ==========================================
// THÊM TRUYỆN
// ==========================================

document.getElementById("addMangaForm").addEventListener("submit", addManga);

async function addManga(e) {
  e.preventDefault();

  const formData = new FormData();

  formData.append("title", document.getElementById("title").value);
  formData.append("author", document.getElementById("author").value);
  formData.append("artist", document.getElementById("artist").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("status", document.getElementById("status").value);

  const cover = document.getElementById("cover").files[0];

  if (cover) {
    formData.append("cover", cover);
  }

  // Lấy danh sách thể loại đã chọn
  document.querySelectorAll("#genreList input:checked").forEach((item) => {
    formData.append("genres", item.value);
  });
  for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }
  try {
    const response = await fetch("/api/admin/mangas", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      alert("Thêm truyện thành công!");
      document.getElementById("addMangaForm").reset();
      loadGenres();
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error(error);
    alert("Có lỗi xảy ra.");
  }
}

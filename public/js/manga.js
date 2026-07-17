// ==========================================
// LẤY ID TỪ URL
// ==========================================

const params = new URLSearchParams(window.location.search);

const mangaId = params.get("id");

// ==========================================
// LOAD MANGA
// ==========================================

async function loadManga() {
  if (!mangaId) {
    alert("Không có ID Manga");

    return;
  }

  try {
    const response = await fetch(`/api/mangas/${mangaId}`);

    const data = await response.json();

    if (!data.success) {
      alert(data.message);

      return;
    }

    const manga = data.manga;

    // ==========================================
    // CONTINUE READING
    // ==========================================

    const lastChapter = localStorage.getItem(`reading_${manga.id}`);

    if (lastChapter) {
      const btn = document.getElementById("continueReading");

      btn.style.display = "inline-block";

      btn.href = `chapter.html?id=${lastChapter}`;
    }

    document.title = manga.title;

    document.getElementById("cover").src = manga.cover || "images/no-cover.png";

    document.getElementById("title").textContent = manga.title;

    document.getElementById("author").textContent =
      manga.author || "Đang cập nhật";

    document.getElementById("artist").textContent =
      manga.artist || "Đang cập nhật";

    document.getElementById("status").textContent =
      manga.status || "Đang cập nhật";

    document.getElementById("description").textContent =
      manga.description || "Chưa có mô tả";
    checkFavorite();
  } catch (error) {
    console.error(error);
  }
}

loadManga();

loadChapters();

// ==========================================
// LOAD CHAPTERS
// ==========================================

async function loadChapters() {
  try {
    const response = await fetch(`/api/mangas/${mangaId}/chapters`);

    const data = await response.json();

    const chapterList = document.getElementById("chapters");

    chapterList.innerHTML = "";

    if (!data.success) {
      chapterList.innerHTML = `
                <p>Không thể tải danh sách Chapter.</p>
            `;

      return;
    }

    if (data.chapters.length === 0) {
      chapterList.innerHTML = `
                <p>Chưa có Chapter nào.</p>
            `;

      return;
    }

    data.chapters.forEach((chapter) => {
      chapterList.innerHTML += `

                <a
                    href="chapter.html?id=${chapter.id}"
                    class="chapter-item"
                >

                    <span>

                        Chapter ${chapter.chapter_number}

                        ${chapter.title || ""}

                    </span>

                    <span>

                        Đọc →

                    </span>

                </a>

            `;
    });
  } catch (error) {
    console.error(error);
  }
}

const btnFavorite = document.getElementById("btnFavorite");

if (btnFavorite) {
  btnFavorite.addEventListener("click", toggleFavorite);
}

async function toggleFavorite() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Bạn cần đăng nhập.");
    return;
  }

  const btn = document.getElementById("btnFavorite");

  try {
    // Kiểm tra trạng thái hiện tại
    const checkResponse = await fetch(`/api/favorites/${mangaId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const checkData = await checkResponse.json();

    let response;

    // Nếu đã theo dõi -> Bỏ theo dõi
    if (checkData.isFavorite) {
      response = await fetch(`/api/favorites/${mangaId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
    // Nếu chưa theo dõi -> Theo dõi
    else {
      response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mangaId,
        }),
      });
    }

    const data = await response.json();

    alert(data.message);

    // Cập nhật lại chữ trên nút
    checkFavorite();
  } catch (error) {
    console.error(error);
  }
}

// ==========================================
// CHECK FAVORITE
// ==========================================

async function checkFavorite() {
  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const response = await fetch(`/api/favorites/${mangaId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!data.success) return;

    const btn = document.getElementById("btnFavorite");

    if (data.isFavorite) {
      btn.textContent = "💔 Bỏ theo dõi";
    } else {
      btn.textContent = "💗 Theo dõi";
    }
  } catch (error) {
    console.error(error);
  }
}

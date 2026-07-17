// ==========================================
// LOAD DANH SÁCH YÊU THÍCH
// ==========================================

async function loadFavorites() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Bạn cần đăng nhập.");

    window.location.href = "login.html";

    return;
  }

  try {
    const response = await fetch("/api/favorites", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    const favoriteList = document.getElementById("favoriteList");

    favoriteList.innerHTML = "";

    if (!data.success) {
      favoriteList.innerHTML = "<p>Không thể tải danh sách.</p>";

      return;
    }

    if (data.favorites.length === 0) {
      favoriteList.innerHTML = "<p>Chưa có truyện yêu thích.</p>";

      return;
    }

    data.favorites.forEach((manga) => {
      favoriteList.innerHTML += `
        <div class="manga-card">

            <a href="manga.html?id=${manga.id}">

                <img
                    src="${manga.cover}"
                    alt="${manga.title}"
                >

                <h3>${manga.title}</h3>

            </a>

        </div>
      `;
    });
  } catch (error) {
    console.error(error);
  }
}

loadFavorites();

// ==========================================
// ELEMENT
// ==========================================

const keywordInput = document.getElementById("keyword");

const searchBtn = document.getElementById("searchBtn");

const searchResult = document.getElementById("searchResult");

// ==========================================
// URL PARAM
// ==========================================

const params = new URLSearchParams(window.location.search);

const keyword = params.get("keyword") || "";

keywordInput.value = keyword;

// ==========================================
// LOAD SEARCH
// ==========================================

async function searchManga(keyword) {
  if (!keyword.trim()) {
    searchResult.innerHTML = `
            <div class="empty-result">
                Vui lòng nhập từ khóa tìm kiếm.
            </div>
        `;

    return;
  }

  searchResult.innerHTML = `
        <div class="loading">
            Đang tìm kiếm...
        </div>
    `;

  try {
    const response = await fetch(
      `/api/search?keyword=${encodeURIComponent(keyword)}`,
    );

    const data = await response.json();

    searchResult.innerHTML = "";

    if (!data.success) {
      searchResult.innerHTML = `
                <div class="empty-result">
                    Có lỗi xảy ra.
                </div>
            `;

      return;
    }

    if (data.mangas.length === 0) {
      searchResult.innerHTML = `
                <div class="empty-result">
                    Không tìm thấy truyện phù hợp.
                </div>
            `;

      return;
    }

    data.mangas.forEach((manga) => {
      searchResult.innerHTML += `

                <div class="manga-card">

                    <a href="manga.html?id=${manga.id}">

                        <div class="manga-cover">

                            <img
                                src="${manga.cover || "images/no-cover.png"}"
                                alt="${manga.title}"
                            >

                        </div>

                        <div class="manga-info">

                            <div class="manga-title">

                                ${manga.title}

                            </div>

                            <div class="manga-author">

                                ${manga.author || "Đang cập nhật"}

                            </div>

                            <span class="manga-status">

                                ${manga.status}

                            </span>

                        </div>

                    </a>

                </div>

            `;
    });
  } catch (error) {
    console.error(error);
  }
}

searchManga(keyword);

// ==========================================
// SEARCH BUTTON
// ==========================================

searchBtn.onclick = () => {
  const keyword = keywordInput.value.trim();

  window.location = `search.html?keyword=${encodeURIComponent(keyword)}`;
};

keywordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});

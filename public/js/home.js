// ==========================================
// ELEMENT
// ==========================================

const mangaList = document.getElementById("mangaList");

// ==========================================
// LOAD MANGAS
// ==========================================

async function loadMangas() {
  try {
    const response = await fetch("/api/mangas");

    const data = await response.json();

    mangaList.innerHTML = `
    <div class="loading">
        Đang tải danh sách truyện...
    </div>
`;

    if (!data.success) {
      mangaList.innerHTML = `
                <p>Không thể tải danh sách truyện.</p>
            `;

      return;
    }

    if (data.mangas.length === 0) {
      mangaList.innerHTML = `
                <p>Chưa có truyện nào.</p>
            `;

      return;
    }
    mangaList.innerHTML = "";

    data.mangas.forEach((manga) => {
      mangaList.innerHTML += `

        <div class="manga-card">

            <a href="manga.html?id=${manga.id}">

                <div class="manga-cover">

                    <img
                        src="${manga.cover || "images/no-cover.png"}"
                        alt="${manga.title}"
                    >

                    <span class="badge-new">

                        MỚI

                    </span>

                </div>

                <div class="manga-info">

                    <div class="manga-title">

                        ${manga.title}

                    </div>

                    <div class="manga-author">

                        ${manga.author || "Đang cập nhật"}

                    </div>

                    <div class="chapter-latest">

                        Chapter mới nhất:
                        ${manga.latest_chapter ?? "Chưa có"}

                    </div>

                    <div class="chapter-latest">

                      Tổng Chapter:
                      ${manga.total_chapters}

                    </div>

                    ${
                      localStorage.getItem(`reading_${manga.id}`)
                        ? `

                        <a

                         class="continue-btn"

                         href="chapter.html?id=${localStorage.getItem(`reading_${manga.id}`)}">

                          Đọc tiếp

                        </a>

                        `
                        : ""
                    }

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

loadMangas();

// ==========================================
// SEARCH
// ==========================================

const searchButton = document.getElementById("searchButton");

const searchInput = document.getElementById("searchInput");

const searchSuggest = document.getElementById("searchSuggest");

let currentIndex = -1;

let currentResults = [];

searchButton.onclick = () => {
  const keyword = searchInput.value.trim();

  if (!keyword) return;

  window.location = `search.html?keyword=${encodeURIComponent(keyword)}`;
};

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchButton.click();
  }
});

// ==========================================
// LIVE SEARCH
// ==========================================

searchInput.addEventListener("input", async () => {
  const keyword = searchInput.value.trim();

  if (keyword.length < 2) {
    searchSuggest.style.display = "none";

    searchSuggest.innerHTML = "";

    return;
  }

  const response = await fetch(
    `/api/search?keyword=${encodeURIComponent(keyword)}`,
  );

  const data = await response.json();

  searchSuggest.innerHTML = "";

  currentResults = data.mangas.slice(0, 5);

  currentIndex = -1;

  if (!data.success || data.mangas.length === 0) {
    searchSuggest.style.display = "none";

    return;
  }

  currentResults.forEach((manga) => {
    searchSuggest.innerHTML += `

            <div
                class="search-item"
                data-id="${manga.id}"
            >

                <img
                    src="${manga.cover || "images/no-cover.png"}"
                >

                <div>

                    <strong>

                        ${manga.title}

                    </strong>

                    <br>

                    <small>

                        ${manga.author || ""}

                    </small>

                </div>

            </div>

        `;
  });

  searchSuggest.style.display = "block";
});

searchSuggest.addEventListener("click", (e) => {
  const item = e.target.closest(".search-item");

  if (!item) return;

  searchSuggest.style.display = "none";

  window.location = `manga.html?id=${item.dataset.id}`;
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper")) {
    searchSuggest.style.display = "none";
  }
});

// ==========================================
// UPDATE ACTIVE ITEM
// ==========================================

function updateActiveItem() {
  const items = document.querySelectorAll(".search-item");

  items.forEach((item, index) => {
    item.classList.toggle(
      "active",

      index === currentIndex,
    );
  });
}

searchInput.addEventListener("keydown", (e) => {
  const items = document.querySelectorAll(".search-item");

  if (items.length === 0) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();

      currentIndex++;

      if (currentIndex >= items.length) {
        currentIndex = 0;
      }

      updateActiveItem();

      break;

    case "ArrowUp":
      e.preventDefault();

      currentIndex--;

      if (currentIndex < 0) {
        currentIndex = items.length - 1;
      }

      updateActiveItem();

      break;

    case "Enter":
      if (currentIndex >= 0) {
        e.preventDefault();

        window.location = `manga.html?id=${currentResults[currentIndex].id}`;
      }

      break;

    case "Escape":
      searchSuggest.style.display = "none";

      currentIndex = -1;

      break;
  }
});

// ==========================================
// USER MENU
// ==========================================

const currentUser = JSON.parse(localStorage.getItem("currentUser"));

const userMenu = document.getElementById("userMenu");

if (currentUser) {
  userMenu.innerHTML = `

        <span>

            Xin chào,

            ${currentUser.username}

        </span>

        <button id="logoutBtn">

            Đăng xuất

        </button>

    `;
}

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.removeItem("currentUser");

    location.reload();
  };
}

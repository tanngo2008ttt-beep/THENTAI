// ==========================================
// LOAD MANGAS
// ==========================================

async function loadMangas() {
  const response = await fetch("/api/mangas");

  const data = await response.json();

  const mangaSelect = document.getElementById("manga");

  mangaSelect.innerHTML = `
        <option value="">-- Chọn Manga --</option>
    `;

  if (!data.success) return;

  data.mangas.forEach((manga) => {
    mangaSelect.innerHTML += `
            <option value="${manga.id}">
                ${manga.title}
            </option>
        `;
  });
}

loadMangas();

// ==========================================
// LOAD CHAPTERS
// ==========================================

document.getElementById("manga").addEventListener("change", loadChapters);

async function loadChapters() {
  const mangaId = document.getElementById("manga").value;

  const response = await fetch("/api/chapters");

  const data = await response.json();

  const chapterSelect = document.getElementById("chapter");

  chapterSelect.innerHTML = `<option value="">-- Chọn Chapter --</option>`;

  if (!data.success) return;

  data.chapters
    .filter((chapter) => chapter.manga_id == mangaId)
    .forEach((chapter) => {
      chapterSelect.innerHTML += `
                <option value="${chapter.id}">
                    Chapter ${chapter.chapter_number}
                </option>
            `;
    });
}

// ==========================================
// UPLOAD PAGES
// ==========================================

const form = document.getElementById("pageForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();

  formData.append(
    "chapter_id",

    document.getElementById("chapter").value,
  );

  const files = document.getElementById("images").files;

  for (let file of files) {
    formData.append("images", file);
  }

  const response = await fetch("/api/pages", {
    method: "POST",

    body: formData,
  });

  const data = await response.json();

  if (data.success) {
    alert("Upload thành công");

    form.reset();

    document.getElementById("pageList").innerHTML = "";
  } else {
    alert(data.message);
  }
});

// ==========================================
// LOAD PAGES
// ==========================================

document.getElementById("chapter").addEventListener("change", loadPages);

async function loadPages() {
  const chapterId = document.getElementById("chapter").value;

  if (!chapterId) return;

  const response = await fetch(`/api/pages/${chapterId}`);

  const data = await response.json();

  const list = document.getElementById("pageList");

  list.innerHTML = "";

  if (!data.success) return;

  data.pages.forEach((page) => {
    list.innerHTML += `

            <div class="page-item">

                <img src="${page.image_url}">

                <p>

                    Trang ${page.page_number}

                </p>

                <button
                    onclick="deletePage(${page.id})">

                    Xóa

                </button>

            </div>

        `;
  });
}

// ==========================================
// DELETE PAGE
// ==========================================

async function deletePage(id) {
  const ok = confirm("Bạn có chắc muốn xóa?");

  if (!ok) return;

  const response = await fetch(
    `/api/pages/${id}`,

    {
      method: "DELETE",
    },
  );

  const data = await response.json();

  if (data.success) {
    alert("Đã xóa");

    loadPages();
  } else {
    alert(data.message);
  }
}

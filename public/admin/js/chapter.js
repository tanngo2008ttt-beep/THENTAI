// ==========================================
// EDIT MODE
// ==========================================

let editId = null;

// ==========================================
// LOAD MANGA
// ==========================================

async function loadMangas() {
  try {
    const response = await fetch("/api/mangas");

    const data = await response.json();

    const select = document.getElementById("manga");

    select.innerHTML = `
            <option value="">-- Chọn Manga --</option>
        `;

    if (!data.success) return;

    data.mangas.forEach((manga) => {
      select.innerHTML += `
                <option value="${manga.id}">
                    ${manga.title}
                </option>
            `;
    });
  } catch (error) {
    console.error(error);
  }
}

// ==========================================
// LOAD CHAPTER
// ==========================================

async function loadChapters() {
  try {
    const response = await fetch("/api/chapters");

    const data = await response.json();

    const table = document.getElementById("chapterTable");

    table.innerHTML = "";

    if (!data.success) return;

    data.chapters.forEach((chapter) => {
      table.innerHTML += `

                <tr>

                    <td>${chapter.id}</td>

                    <td>${chapter.manga_title}</td>

                    <td>${chapter.chapter_number}</td>

                    <td>${chapter.title || ""}</td>

                    <td>

                        <button onclick="editChapter(${chapter.id})">

                            Sửa

                        </button>

                        <button onclick="deleteChapter(${chapter.id})">

                            Xóa

                        </button>

                    </td>

                </tr>

            `;
    });
  } catch (error) {
    console.error(error);
  }
}

loadMangas();

loadChapters();

// ==========================================
// SUBMIT FORM
// ==========================================

const form = document.getElementById("chapterForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = {
    manga_id: document.getElementById("manga").value,

    chapter_number: document.getElementById("chapterNumber").value,

    title: document.getElementById("chapterTitle").value,
  };

  let url = "/api/chapters";

  let method = "POST";

  if (editId) {
    url = `/api/chapters/${editId}`;

    method = "PUT";
  }

  const response = await fetch(url, {
    method,

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data.success) {
    alert(editId ? "Cập nhật Chapter thành công" : "Thêm Chapter thành công");

    editId = null;

    form.reset();

    loadChapters();
  } else {
    alert(data.message);
  }
});

// ==========================================
// EDIT CHAPTER
// ==========================================

async function editChapter(id) {
  const response = await fetch(`/api/chapters/${id}`);

  const data = await response.json();

  if (!data.success) {
    alert(data.message);

    return;
  }

  const chapter = data.chapter;

  editId = chapter.id;

  document.getElementById("manga").value = chapter.manga_id;

  document.getElementById("chapterNumber").value = chapter.chapter_number;

  document.getElementById("chapterTitle").value = chapter.title || "";
}

// ==========================================
// DELETE CHAPTER
// ==========================================

async function deleteChapter(id) {
  const ok = confirm("Bạn có chắc muốn xóa?");

  if (!ok) return;

  const response = await fetch(`/api/chapters/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (data.success) {
    alert("Đã xóa");

    loadChapters();
  } else {
    alert(data.message);
  }
}

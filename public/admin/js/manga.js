// ==========================================
// EDIT MODE
// ==========================================

let editId = null;

// ==========================================
// LOAD DANH SÁCH MANGA
// ==========================================

async function loadMangas() {
  try {
    const response = await fetch("/api/mangas");

    const data = await response.json();

    const table = document.getElementById("mangaTable");

    table.innerHTML = "";

    if (!data.success) return;

    data.mangas.forEach((manga) => {
      table.innerHTML += `
                <tr>

                    <td>${manga.id}</td>

                    <td>

                        ${
                          manga.cover
                            ? `<img src="${manga.cover}" width="60">`
                            : ""
                        }

                    </td>

                    <td>${manga.title}</td>

                    <td>${manga.author || ""}</td>

                    <td>${manga.status}</td>

                   <td>

                        <button onclick="editManga(${manga.id})">

                              Sửa

                        </button>

                         <button onclick="deleteManga(${manga.id})">

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

// ==========================================
// THÊM MANGA
// ==========================================

const form = document.getElementById("mangaForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();

  formData.append("title", document.getElementById("title").value);

  formData.append("slug", document.getElementById("slug").value);

  formData.append("author", document.getElementById("author").value);

  formData.append("artist", document.getElementById("artist").value);

  formData.append("description", document.getElementById("description").value);

  formData.append("status", document.getElementById("status").value);

  const cover = document.getElementById("cover").files[0];

  if (cover) {
    formData.append("cover", cover);
  }

  let url = "/api/mangas";

  let method = "POST";

  if (editId) {
    url = `/api/mangas/${editId}`;

    method = "PUT";
  }

  const response = await fetch(url, {
    method,

    body: formData,
  });

  const data = await response.json();

  if (data.success) {
    alert(editId ? "Cập nhật Manga thành công" : "Thêm Manga thành công");

    editId = null;

    form.reset();

    loadMangas();
  } else {
    alert(data.message);
  }
});

// ==========================================
// EDIT MANGA
// ==========================================

async function editManga(id) {
  const response = await fetch(`/api/mangas/${id}`);

  const data = await response.json();

  if (!data.success) {
    alert(data.message);

    return;
  }

  const manga = data.manga;

  editId = manga.id;

  document.getElementById("title").value = manga.title;

  document.getElementById("slug").value = manga.slug || "";

  document.getElementById("author").value = manga.author || "";

  document.getElementById("artist").value = manga.artist || "";

  document.getElementById("description").value = manga.description || "";

  document.getElementById("status").value = manga.status;
}

// ==========================================
// DELETE MANGA
// ==========================================

async function deleteManga(id) {
  const ok = confirm("Bạn có chắc muốn xóa?");

  if (!ok) return;

  const response = await fetch(`/api/mangas/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (data.success) {
    alert("Đã xóa");

    loadMangas();
  } else {
    alert(data.message);
  }
}

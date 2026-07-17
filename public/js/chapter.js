// ==========================================
// URL PARAM
// ==========================================

const params = new URLSearchParams(window.location.search);

const chapterId = params.get("id");

let mangaId = null;

// ==========================================
// LOAD CHAPTER
// ==========================================

async function loadChapter() {
  if (!chapterId) return;

  const response = await fetch(`/api/chapter/${chapterId}`);

  const data = await response.json();

  if (!data.success) {
    alert(data.message);

    return;
  }

  const chapter = data.chapter;

  mangaId = chapter.manga_id;

  localStorage.setItem(
    `reading_${chapter.manga_id}`,

    chapter.id,
  );

  document.title = `${chapter.manga_title} - Chapter ${chapter.chapter_number}`;

  document.getElementById("chapterTitle").textContent =
    `${chapter.manga_title} - Chapter ${chapter.chapter_number}`;

  document.getElementById("backToManga").href =
    `manga.html?id=${chapter.manga_id}`;
}

loadChapter();

// ==========================================
// LOAD PAGES
// ==========================================

async function loadPages() {
  if (!chapterId) return;

  const response = await fetch(`/api/pages/${chapterId}`);

  const data = await response.json();

  const reader = document.getElementById("readerImages");

  reader.innerHTML = "";

  if (!data.success) {
    reader.innerHTML = "<p>Không có ảnh.</p>";

    return;
  }

  data.pages.forEach((page) => {
    reader.innerHTML += `

            <img

                src="${page.image}"

                alt="Page ${page.page_order}"

            >

        `;
  });
}

loadPages();

// ==========================================
// LOAD NAVIGATION
// ==========================================

async function loadNavigation() {
  const response = await fetch(`/api/chapter/${chapterId}/navigation`);

  const data = await response.json();

  if (!data.success) {
    return;
  }

  const nav = data.navigation;

  const prevBtn = document.getElementById("prevChapter");

  const nextBtn = document.getElementById("nextChapter");

  // Chapter trước

  if (nav.prev_id) {
    prevBtn.onclick = () => {
      window.location = `chapter.html?id=${nav.prev_id}`;
    };
  } else {
    prevBtn.disabled = true;

    prevBtn.textContent = "Không có";
  }

  // Chapter sau

  if (nav.next_id) {
    nextBtn.onclick = () => {
      window.location = `chapter.html?id=${nav.next_id}`;
    };
  } else {
    nextBtn.disabled = true;

    nextBtn.textContent = "Không có";
  }
}

loadNavigation();

// ==========================================
// LOAD CHAPTER LIST
// ==========================================

async function loadChapterList() {
  const response = await fetch(`/api/chapter/${chapterId}`);

  const data = await response.json();

  if (!data.success) {
    return;
  }

  const mangaId = data.chapter.manga_id;

  const response2 = await fetch(`/api/mangas/${mangaId}/chapters`);

  const data2 = await response2.json();

  const select = document.getElementById("chapterSelect");

  select.innerHTML = "";

  data2.chapters.forEach((chapter) => {
    select.innerHTML += `

            <option value="${chapter.id}"

            ${chapter.id == chapterId ? "selected" : ""}>

                Chapter ${chapter.chapter_number}

            </option>

        `;
  });
}

loadChapterList();

document

  .getElementById("chapterSelect")

  .addEventListener("change", (e) => {
    window.location = `chapter.html?id=${e.target.value}`;
  });

const backTop = document.getElementById("backTop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 500) {
    backTop.style.display = "block";
  } else {
    backTop.style.display = "none";
  }
});

backTop.onclick = () => {
  window.scrollTo({
    top: 0,

    behavior: "smooth",
  });
};

// ==============================
// GỬI BÌNH LUẬN
// ==============================

const btnComment = document.getElementById("btnComment");

if (btnComment) {
  btnComment.addEventListener("click", sendComment);
}

async function sendComment() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Bạn cần đăng nhập để bình luận.");

    return;
  }

  const content = document.getElementById("commentContent").value.trim();

  if (content === "") {
    alert("Vui lòng nhập nội dung bình luận.");

    return;
  }

  if (!mangaId) {
    alert("Chưa tải được thông tin truyện.");
    return;
  }

  const response = await fetch("/api/comments", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify({
      mangaId,

      chapterId,

      content,
    }),
  });

  const data = await response.json();
  if (data.success) {
    document.getElementById("commentContent").value = "";

    loadComments();
  }

  alert(data.message);
}

// ==========================================
// LOAD COMMENTS
// ==========================================

async function loadComments() {
  const response = await fetch(`/api/comments/${chapterId}`);

  const data = await response.json();

  const title = document.querySelector("#comments h2");

  title.textContent = `Bình luận (${data.comments.length})`;

  const commentList = document.getElementById("commentList");

  commentList.innerHTML = "";

  if (!data.success) {
    commentList.innerHTML = "<p>Không thể tải bình luận.</p>";
    return;
  }

  if (data.comments.length === 0) {
    commentList.innerHTML = "<p>Chưa có bình luận.</p>";
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  data.comments.forEach((comment) => {
    const canDelete = currentUser && currentUser.id === comment.user_id;
    commentList.innerHTML += `
    <div class="comment-item">

        <h4>${comment.username}</h4>

        <p>${comment.content}</p>

        <small>${new Date(comment.created_at).toLocaleString()}</small>

        <br>

        ${
          canDelete
            ? `
<button
    class="delete-comment"
    onclick="deleteComment(${comment.id})"
>
    🗑 Xóa
</button>
`
            : ""
        }

    </div>
`;
  });
}

loadComments();

// ==========================================
// DELETE COMMENT
// ==========================================

async function deleteComment(commentId) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Bạn cần đăng nhập.");

    return;
  }

  const ok = confirm("Bạn có chắc muốn xóa bình luận này?");

  if (!ok) {
    return;
  }

  const response = await fetch(`/api/comments/${commentId}`, {
    method: "DELETE",

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  alert(data.message);

  if (data.success) {
    loadComments();
  }
}

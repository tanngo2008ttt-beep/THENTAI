// ==========================================
// THENTAI SERVER
// ==========================================

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "thentai_secret_key";
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const db = require("./db");

// ==========================================
// APP
// ==========================================

const app = express();

const PORT = 3000;

// ==========================================
// JWT AUTH MIDDLEWARE
// ==========================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,

      message: "Chưa đăng nhập.",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,

      message: "Token không hợp lệ.",
    });
  }

  jwt.verify(token, JWT_SECRET, (error, user) => {
    if (error) {
      return res.status(403).json({
        success: false,

        message: "Token hết hạn hoặc không hợp lệ.",
      });
    }

    req.user = user;

    next();
  });
}

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// ==========================================
// STATIC
// ==========================================

app.use(express.static(path.join(__dirname, "public")));

app.use(
  "/uploads",

  express.static(path.join(__dirname, "public/uploads")),
);

// ==========================================
// CREATE UPLOAD FOLDERS
// ==========================================

const uploadRoot = path.join(__dirname, "public", "uploads");

const coverFolder = path.join(uploadRoot, "covers");

const chapterFolder = path.join(uploadRoot, "chapter-images");

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot);
}

if (!fs.existsSync(coverFolder)) {
  fs.mkdirSync(coverFolder);
}

if (!fs.existsSync(chapterFolder)) {
  fs.mkdirSync(chapterFolder);
}

// ==========================================
// MULTER STORAGE
// ==========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "cover") {
      cb(null, coverFolder);
    } else {
      cb(null, chapterFolder);
    }
  },

  filename: (req, file, cb) => {
    const fileName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, fileName);
  },
});

// ==========================================
// UPLOAD
// ==========================================

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/images");
    },

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);

      cb(null, Date.now() + ext);
    },
  }),
});

// ==========================================
// UPLOAD PAGE IMAGES
// ==========================================

const pageUpload = multer({
  storage: storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.send("THENTAI SERVER IS RUNNING");
});

// ==========================================
// API TEST
// ==========================================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,

    message: "API hoạt động bình thường",
  });
});

// ==========================================
// TRUYỆN MỚI
// ==========================================

app.get("/api/mangas/new", async (req, res) => {
  try {
    const [mangas] = await db.query(`
      SELECT *
      FROM mangas
      ORDER BY id DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      mangas,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =======================================
// LẤY DANH SÁCH TRUYỆN HOÀN THÀNH
// =======================================

app.get("/api/mangas/completed", async (req, res) => {
  try {
    const [mangas] = await db.query(`
            SELECT
                id,
                title,
                cover,
                author,
                artist,
                status
            FROM mangas
            WHERE status = 'Hoàn thành'
            ORDER BY id DESC
        `);

    res.json({
      success: true,
      mangas,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

// ==========================================
// API - THÊM MANGA
// ==========================================

app.post("/api/mangas", upload.single("cover"), async (req, res) => {
  try {
    const { title, slug, author, artist, description, status } = req.body;

    const cover = req.file ? "/uploads/covers/" + req.file.filename : null;

    const sql = `
      INSERT INTO mangas
      (
        title,
        slug,
        author,
        artist,
        description,
        cover,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      title,
      slug,
      author,
      artist,
      description,
      cover,
      status,
    ]);

    res.json({
      success: true,
      message: "Thêm truyện thành công",
      id: result.insertId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - DANH SÁCH MANGA
// ==========================================
app.get("/api/mangas", async (req, res) => {
  try {
    const sql = `
      SELECT
        m.*,
        MAX(c.chapter_number) AS latest_chapter,
        COUNT(c.id) AS total_chapters
      FROM mangas m
      LEFT JOIN chapters c
      ON m.id = c.manga_id
      GROUP BY m.id
      ORDER BY
        MAX(c.chapter_number) DESC,
        m.id DESC
    `;

    const [mangas] = await db.query(sql);

    res.json({
      success: true,
      mangas,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - CHI TIẾT MANGA
// ==========================================

app.get("/api/mangas/:id", async (req, res) => {
  try {
    const [results] = await db.query(
      `
      SELECT *
      FROM mangas
      WHERE id = ?
      `,
      [req.params.id],
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy Manga",
      });
    }

    res.json({
      success: true,
      manga: results[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - CẬP NHẬT MANGA
// ==========================================

app.put("/api/mangas/:id", upload.single("cover"), async (req, res) => {
  try {
    const { id } = req.params;

    const { title, slug, author, artist, description, status } = req.body;

    const [rows] = await db.query("SELECT cover FROM mangas WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy truyện",
      });
    }

    let cover = rows[0].cover;

    if (req.file) {
      cover = "/uploads/covers/" + req.file.filename;
    }

    await db.query(
      `
      UPDATE mangas
      SET
        title=?,
        slug=?,
        author=?,
        artist=?,
        description=?,
        cover=?,
        status=?
      WHERE id=?
      `,
      [title, slug, author, artist, description, cover, status, id],
    );

    res.json({
      success: true,
      message: "Cập nhật truyện thành công",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - XÓA MANGA
// ==========================================

app.delete("/api/mangas/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await db.query("SELECT cover FROM mangas WHERE id = ?", [
      id,
    ]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy truyện",
      });
    }

    const cover = results[0].cover;

    if (cover) {
      const imagePath = path.join(__dirname, "public", cover);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await db.query("DELETE FROM mangas WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Xóa truyện thành công",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - DASHBOARD
// ==========================================

app.get("/api/dashboard", async (req, res) => {
  try {
    const [[manga]] = await db.query("SELECT COUNT(*) AS total FROM mangas");

    const [[chapter]] = await db.query(
      "SELECT COUNT(*) AS total FROM chapters",
    );

    const [[page]] = await db.query("SELECT COUNT(*) AS total FROM pages");

    res.json({
      success: true,

      dashboard: {
        totalManga: manga.total,
        totalChapter: chapter.total,
        totalPage: page.total,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - THÊM CHAPTER
// ==========================================

app.post("/api/chapters", async (req, res) => {
  try {
    const { manga_id, chapter_number, title } = req.body;

    const sql = `
      INSERT INTO chapters
      (
        manga_id,
        chapter_number,
        title
      )
      VALUES (?, ?, ?)
    `;

    const [result] = await db.query(sql, [manga_id, chapter_number, title]);

    res.json({
      success: true,
      id: result.insertId,
      message: "Thêm Chapter thành công",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// ==========================================
// API - DANH SÁCH CHAPTER
// ==========================================

app.get("/api/chapters", async (req, res) => {
  try {
    const sql = `
      SELECT
        chapters.id,
        chapters.manga_id,
        chapters.chapter_number,
        chapters.title,
        mangas.title AS manga_title
      FROM chapters
      INNER JOIN mangas
      ON chapters.manga_id = mangas.id
      ORDER BY chapters.id DESC
    `;

    const [chapters] = await db.query(sql);

    res.json({
      success: true,
      chapters,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - CHI TIẾT CHAPTER
// ==========================================

app.get("/api/chapters/:id", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM chapters WHERE id = ?", [
      req.params.id,
    ]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy Chapter",
      });
    }

    res.json({
      success: true,
      chapter: results[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// ==========================================
// API - CẬP NHẬT CHAPTER
// ==========================================

app.put("/api/chapters/:id", async (req, res) => {
  try {
    const { manga_id, chapter_number, title } = req.body;

    await db.query(
      `
      UPDATE chapters
      SET
        manga_id = ?,
        chapter_number = ?,
        title = ?
      WHERE id = ?
      `,
      [manga_id, chapter_number, title, req.params.id],
    );

    res.json({
      success: true,
      message: "Cập nhật Chapter thành công",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - XÓA CHAPTER
// ==========================================

app.delete("/api/chapters/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM chapters WHERE id = ?", [req.params.id]);

    res.json({
      success: true,
      message: "Xóa Chapter thành công",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - UPLOAD PAGES
// ==========================================

app.post("/api/pages", pageUpload.array("images"), async (req, res) => {
  try {
    const chapterId = req.body.chapter_id;

    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Chưa chọn ảnh",
      });
    }

    const values = files.map((file, index) => [
      chapterId,
      "/uploads/chapter-images/" + file.filename,
      index + 1,
    ]);

    const sql = `
      INSERT INTO pages
      (
        chapter_id,
        image,
        page_order
      )
      VALUES ?
    `;

    await db.query(sql, [values]);

    res.json({
      success: true,
      message: "Upload thành công",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - DANH SÁCH PAGES
// ==========================================

app.get("/api/pages/:chapterId", async (req, res) => {
  try {
    const [pages] = await db.query(
      `
      SELECT *
      FROM pages
      WHERE chapter_id = ?
      ORDER BY page_order ASC
      `,
      [req.params.chapterId],
    );

    res.json({
      success: true,
      pages,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - XÓA PAGE
// ==========================================

app.delete("/api/pages/:id", async (req, res) => {
  try {
    const [results] = await db.query("SELECT image FROM pages WHERE id = ?", [
      req.params.id,
    ]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy Page",
      });
    }

    const imagePath = path.join(__dirname, "public", results[0].image);

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await db.query("DELETE FROM pages WHERE id = ?", [req.params.id]);

    res.json({
      success: true,
      message: "Xóa Page thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - CHAPTER THEO MANGA
// ==========================================

app.get("/api/mangas/:id/chapters", async (req, res) => {
  try {
    const [chapters] = await db.query(
      `
      SELECT
        id,
        chapter_number,
        title,
        created_at
      FROM chapters
      WHERE manga_id = ?
      ORDER BY chapter_number DESC
      `,
      [req.params.id],
    );

    res.json({
      success: true,
      chapters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - CHI TIẾT CHAPTER
// ==========================================

app.get("/api/chapter/:id", async (req, res) => {
  try {
    const [results] = await db.query(
      `
      SELECT
        c.*,
        m.title AS manga_title
      FROM chapters c
      INNER JOIN mangas m
      ON c.manga_id = m.id
      WHERE c.id = ?
      `,
      [req.params.id],
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy Chapter",
      });
    }

    res.json({
      success: true,
      chapter: results[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - CHAPTER TRƯỚC / SAU
// ==========================================

app.get("/api/chapter/:id/navigation", async (req, res) => {
  try {
    const [results] = await db.query(
      `
      SELECT
        c1.id,
        c1.manga_id,
        c1.chapter_number,

        (
          SELECT id
          FROM chapters
          WHERE manga_id = c1.manga_id
          AND chapter_number < c1.chapter_number
          ORDER BY chapter_number DESC
          LIMIT 1
        ) AS prev_id,

        (
          SELECT id
          FROM chapters
          WHERE manga_id = c1.manga_id
          AND chapter_number > c1.chapter_number
          ORDER BY chapter_number ASC
          LIMIT 1
        ) AS next_id

      FROM chapters c1
      WHERE c1.id = ?
      `,
      [req.params.id],
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy Chapter",
      });
    }

    res.json({
      success: true,
      navigation: results[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - SEARCH MANGA
// ==========================================

app.get("/api/search", async (req, res) => {
  try {
    const keyword = req.query.keyword;

    if (!keyword || keyword.trim() === "") {
      return res.json({
        success: true,
        mangas: [],
      });
    }

    const search = `%${keyword}%`;

    const [mangas] = await db.query(
      `
      SELECT *
      FROM mangas
      WHERE title LIKE ?
      OR author LIKE ?
      ORDER BY title ASC
      `,
      [search, search],
    );

    res.json({
      success: true,
      mangas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - REGISTER
// ==========================================

app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin.",
      });
    }

    const [users] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email đã được sử dụng.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `
      INSERT INTO users
      (
        username,
        email,
        password
      )
      VALUES (?, ?, ?)
      `,
      [username, email, hashedPassword],
    );

    res.json({
      success: true,
      message: "Đăng ký thành công.",
      userId: result.insertId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - LOGIN
// ==========================================

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập email và mật khẩu.",
      });
    }

    const [results] = await db.query(
      `
      SELECT *
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email],
    );

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng.",
      });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.json({
      success: true,
      message: "Đăng nhập thành công.",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - PROFILE
// ==========================================

app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({
    success: true,

    user: req.user,
  });
});

// ==========================================
// API - GET COMMENTS
// ==========================================

app.get("/api/comments/:chapterId", async (req, res) => {
  try {
    const [comments] = await db.query(
      `
      SELECT
        comments.id,
        comments.user_id,
        comments.content,
        comments.created_at,
        users.username
      FROM comments
      INNER JOIN users
      ON comments.user_id = users.id
      WHERE comments.chapter_id = ?
      ORDER BY comments.created_at ASC
      `,
      [req.params.chapterId],
    );

    res.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - ADD COMMENT
// ==========================================

app.post("/api/comments", authenticateToken, async (req, res) => {
  try {
    const { mangaId, chapterId, content } = req.body;

    if (!mangaId || !chapterId || !content) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu.",
      });
    }

    await db.query(
      `
      INSERT INTO comments
      (
        manga_id,
        chapter_id,
        user_id,
        content
      )
      VALUES (?, ?, ?, ?)
      `,
      [mangaId, chapterId, req.user.id, content],
    );

    res.json({
      success: true,
      message: "Đã thêm bình luận.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - DELETE COMMENT
// ==========================================

app.delete("/api/comments/:id", authenticateToken, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    const [results] = await db.query(
      "SELECT user_id FROM comments WHERE id = ?",
      [commentId],
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bình luận.",
      });
    }

    if (results[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa bình luận này.",
      });
    }

    await db.query("DELETE FROM comments WHERE id = ?", [commentId]);

    res.json({
      success: true,
      message: "Đã xóa bình luận.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - ADD FAVORITE
// ==========================================

app.post("/api/favorites", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mangaId } = req.body;

    if (!mangaId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu Manga ID.",
      });
    }

    await db.query(
      `
      INSERT INTO favorites
      (user_id, manga_id)
      VALUES (?, ?)
      `,
      [userId, mangaId],
    );

    res.json({
      success: true,
      message: "Đã theo dõi truyện.",
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "Bạn đã theo dõi truyện này.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - CHECK FAVORITE
// ==========================================

app.get("/api/favorites/:mangaId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const mangaId = req.params.mangaId;

    const [results] = await db.query(
      `
      SELECT id
      FROM favorites
      WHERE user_id = ?
      AND manga_id = ?
      LIMIT 1
      `,
      [userId, mangaId],
    );

    res.json({
      success: true,
      isFavorite: results.length > 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - DANH SÁCH FAVORITES
// ==========================================

app.get("/api/favorites", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [favorites] = await db.query(
      `
      SELECT
        mangas.id,
        mangas.title,
        mangas.cover
      FROM favorites
      INNER JOIN mangas
      ON favorites.manga_id = mangas.id
      WHERE favorites.user_id = ?
      ORDER BY favorites.id DESC
      `,
      [userId],
    );

    res.json({
      success: true,
      favorites,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - UNFAVORITE
// ==========================================

app.delete("/api/favorites/:mangaId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const mangaId = req.params.mangaId;

    await db.query(
      `
      DELETE FROM favorites
      WHERE user_id = ?
      AND manga_id = ?
      `,
      [userId, mangaId],
    );

    res.json({
      success: true,
      message: "Đã bỏ theo dõi.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - DANH SÁCH THỂ LOẠI
// ==========================================

app.get("/api/genres", async (req, res) => {
  try {
    const [genres] = await db.query(`
      SELECT
        id,
        name,
        slug
      FROM genres
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      genres,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// API - TRUYỆN THEO THỂ LOẠI
// ==========================================

app.get("/api/genres/:id", async (req, res) => {
  try {
    const [mangas] = await db.query(
      `
      SELECT
        mangas.id,
        mangas.title,
        mangas.cover,
        genres.name AS genre_name
      FROM mangas
      JOIN manga_genres
        ON mangas.id = manga_genres.manga_id
      JOIN genres
        ON genres.id = manga_genres.genre_id
      WHERE genres.id = ?
      `,
      [req.params.id],
    );

    res.json({
      success: true,
      mangas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// ADMIN - THÊM TRUYỆN
// ==========================================

app.post("/api/admin/mangas", upload.single("cover"), (req, res) => {
  const { title, author, artist, description, status } = req.body;

  if (!title) {
    return res.json({
      success: false,
      message: "Tên truyện không được để trống",
    });
  }

  const cover = req.file ? "/images/" + req.file.filename : "";

  const sql = `
        INSERT INTO mangas
        (
            title,
            author,
            artist,
            description,
            status,
            cover
        )
        VALUES
        (
            ?, ?, ?, ?, ?, ?
        )
    `;

  db.query(
    sql,
    [title, author, artist, description, status, cover],
    (error, result) => {
      if (error) {
        return res.json({
          success: false,
          message: error.message,
        });
      }

      const mangaId = result.insertId;

      const genres = req.body["genres[]"];

      if (!genres) {
        return res.json({
          success: true,
          message: "Thêm truyện thành công",
        });
      }

      const genreArray = Array.isArray(genres) ? genres : [genres];

      const values = genreArray.map((id) => [mangaId, id]);

      db.query(
        `
                INSERT INTO manga_genres
                (
                    manga_id,
                    genre_id
                )
                VALUES ?
                `,
        [values],
        (err) => {
          if (err) {
            return res.json({
              success: false,
              message: err.message,
            });
          }

          res.json({
            success: true,
            message: "Thêm truyện thành công",
          });
        },
      );
    },
  );
});

// ==========================================
// ADMIN - LẤY CHI TIẾT TRUYỆN
// ==========================================

app.get("/api/admin/mangas/:id", async (req, res) => {
  try {
    const mangaId = req.params.id;

    const [results] = await db.query(
      `
      SELECT
        id,
        title,
        author,
        artist,
        description,
        status,
        cover
      FROM mangas
      WHERE id = ?
      LIMIT 1
      `,
      [mangaId],
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy truyện",
      });
    }

    res.json({
      success: true,
      manga: results[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// ADMIN - LẤY THỂ LOẠI CỦA TRUYỆN
// ==========================================

app.get("/api/admin/mangas/:id/genres", async (req, res) => {
  try {
    const mangaId = req.params.id;

    const [genres] = await db.query(
      `
      SELECT
        genre_id
      FROM manga_genres
      WHERE manga_id = ?
      `,
      [mangaId],
    );

    res.json({
      success: true,
      genres,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// ADMIN - CẬP NHẬT TRUYỆN
// ==========================================

app.put("/api/admin/mangas/:id", upload.single("cover"), async (req, res) => {
  try {
    const mangaId = req.params.id;

    const { title, author, artist, description, status } = req.body;

    const genres = req.body.genres
      ? Array.isArray(req.body.genres)
        ? req.body.genres
        : [req.body.genres]
      : [];

    // Lấy ảnh hiện tại
    const [rows] = await db.query("SELECT cover FROM mangas WHERE id = ?", [
      mangaId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy truyện",
      });
    }

    const cover = req.file ? "/images/" + req.file.filename : rows[0].cover;

    // Cập nhật thông tin truyện
    await db.query(
      `
      UPDATE mangas
      SET
        title = ?,
        author = ?,
        artist = ?,
        description = ?,
        status = ?,
        cover = ?
      WHERE id = ?
      `,
      [title, author, artist, description, status, cover, mangaId],
    );

    // Xóa toàn bộ thể loại cũ
    await db.query("DELETE FROM manga_genres WHERE manga_id = ?", [mangaId]);

    // Thêm lại thể loại mới
    if (genres.length > 0) {
      const values = genres.map((genreId) => [mangaId, genreId]);

      await db.query(
        `
        INSERT INTO manga_genres
        (manga_id, genre_id)
        VALUES ?
        `,
        [values],
      );
    }

    res.json({
      success: true,
      message: "Cập nhật truyện thành công",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log("");

  console.log("========================================");

  console.log("THENTAI SERVER STARTED");

  console.log("");

  console.log("Running at:");

  console.log(`http://localhost:${PORT}`);

  console.log("");

  console.log("========================================");
});

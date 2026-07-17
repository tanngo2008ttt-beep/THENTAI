const form = document.getElementById("loginForm");

const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();

  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/api/login", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email,

        password,
      }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem(
        "currentUser",

        JSON.stringify(data.user),
      );

      localStorage.setItem(
        "token",

        data.token,
      );

      message.style.color = "green";

      message.textContent = data.message;

      setTimeout(() => {
        window.location = "index.html";
      }, 1000);
    } else {
      message.style.color = "red";

      message.textContent = data.message;
    }
  } catch (error) {
    message.style.color = "red";

    message.textContent = "Không thể kết nối đến máy chủ.";
  }
});

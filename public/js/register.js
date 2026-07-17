const form = document.getElementById("registerForm");

const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();

  const email = document.getElementById("email").value.trim();

  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/api/register", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username,

        email,

        password,
      }),
    });

    const data = await response.json();

    if (data.success) {
      message.style.color = "green";

      message.textContent = data.message;

      form.reset();
    } else {
      message.style.color = "red";

      message.textContent = data.message;
    }
  } catch (error) {
    message.style.color = "red";

    message.textContent = "Không thể kết nối đến máy chủ.";
  }
});

async function loadProfile() {
  const token = localStorage.getItem("token");

  const response = await fetch("/api/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  console.log(data);
}

loadProfile();

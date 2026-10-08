const form = document.getElementById("register-form"); 
const message = document.getElementById("auth-message");

form.addEventListener("submit", async e => { 
  e.preventDefault(); 

  // Ambil elemen input secara spesifik
  const nameInput = document.getElementById("name") || document.querySelector('input[name="name"]');
  const emailInput = document.getElementById("email") || document.querySelector('input[name="email"]');
  const passwordInput = document.getElementById("password") || document.querySelector('input[name="password"]');
  const confirmPasswordInput = document.getElementById("confirm-password");

  if (passwordInput.value !== confirmPasswordInput.value) {
    message.textContent = "Konfirmasi password tidak sama.";
    message.className = "booking-message error";
    return;
  }

  message.textContent = "Membuat akun..."; 

  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameInput.value,
        email: emailInput.value,
        password: passwordInput.value
      })
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      throw new Error((data && data.message) || `Error (${response.status}): Gagal terhubung ke server.`);
    }

    localStorage.setItem("padelmate_token", data.token);
    localStorage.setItem("padelmate_user", JSON.stringify(data.user));

    message.textContent = "Akun berhasil dibuat!";
    message.className = "booking-message success";
    setTimeout(() => location.href = "index.html", 500);

  } catch (err) {
    message.textContent = err.message || "Registrasi gagal.";
    message.className = "booking-message error";
  }
});
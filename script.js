function copyEmail() {
  const email = "weservices2022@gmail.com";
  navigator.clipboard.writeText(email).then(() => {
    alert("Email copied: " + email);
  });
}

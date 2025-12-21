function save(event) {
  event.preventDefault();

  let mobile = document.getElementById("signin-email").value;
  let password = document.getElementById("signin-password").value;

  let obj = {
    mobilenumber: mobile,
    password: password,
  };

  axios
    .post("http://localhost:3000/userlogin", obj)
    .then((response) => {
      console.log(response);

      if (response.data.data === "notexist") {
        alert("User not exist, check mobile number again");
      } 
      else if (response.data.data === "wrongpassword") {
        alert("Password entered wrongly! Check again");
      } 
      else if (response.data.data === "success") {
        alert("Login successful");

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("name", response.data.Name);

        window.location.href =
          "http://127.0.0.1:5501/frontend/userhomepage/campuscove.html";
      } 
      else {
        alert("Internal server error");
      }
    })
    .catch((error) => {
      console.error(error);
      alert("Backend not reachable");
    });
}

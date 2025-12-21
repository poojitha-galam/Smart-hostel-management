function sendOTP() {
  let mobile = document.getElementById("mobile").value;

  if (mobile.length !== 10) {
    document.getElementById("msg").innerHTML = "Enter valid 10-digit mobile number!";
    document.getElementById("msg").style.color = "red";
    return;
  }

  axios.post("http://localhost:3000/userforgotpassword", { mobilenumber: mobile })
    .then((res) => {
      console.log(res.data);

      if (res.data.status === "success") {
        document.getElementById("msg").innerHTML = "OTP sent to your registered mobile number.";
        document.getElementById("msg").style.color = "green";

        setTimeout(() => {
          window.location.href = "../userslogin/userforgototpverify.html?mobile=" + mobile;
        }, 1500);
      }

      else if (res.data.status === "notfound") {
        document.getElementById("msg").innerHTML = "Mobile number not registered!";
        document.getElementById("msg").style.color = "red";
      }

      else {
        document.getElementById("msg").innerHTML = "Error sending OTP!";
        document.getElementById("msg").style.color = "red";
      }
    })
    .catch((err) => {
      console.log(err);
      document.getElementById("msg").innerHTML = "Server error!";
      document.getElementById("msg").style.color = "red";
    });
}


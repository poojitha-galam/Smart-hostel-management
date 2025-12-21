
    const emailBtn = document.getElementById('email-btn');
    const emailInput = document.getElementById('email');
    const emailSection = document.getElementById('email-section');
    const otpSection = document.getElementById('otp-section');
    const infoText = document.getElementById('info-text');
    const errorMsg = document.getElementById('error-msg');

     if (!navigator.onLine) {
       document.body.innerHTML =
         "<p style='color: white;'>Please check your internet connection</p>";

     }

    document.getElementById("back").addEventListener("click",()=>{
            window.location.href =
              "http://127.0.0.1:5500/frontend/login/userlogin.html";
        })

    function validateEmail(email) {
      // Simple email regex
      return /\S+@\S+\.\S+/.test(email);
    }
    emailBtn.addEventListener('click', () => {
      const email = emailInput.value.trim();
      if (!validateEmail(email)) {
        errorMsg.classList.remove('hidden');
        return;
      }
      errorMsg.classList.add('hidden');
      emailSection.classList.add('hidden');
      otpSection.classList.remove('hidden');
      infoText.innerText = `Please enter the OTP sent to ${email}`;
    });

    function emailotp(event){
      event.preventDefault()
    let email = emailInput.value;
    let obj = {
      Email:email
    }
    axios.post("http://localhost:3000/userverifylogin",obj)
    .then((res)=>{
      const response = res.data;
      if(response.data == "notexist"){
        alert("Your Email id don't have admin access,kindly check email")
        window.location.href = "http://127.0.0.1:5500/frontend/login/userlogin.html"
      }
      else if(response.data == "success"){
        alert("otp sent successfully")
      }
      else if(response.data == "fail"){
        alert("something went wrong please try again")
      }
      else if(response.data == "notactive"){
         window.location.href =
           "http://127.0.0.1:5500/frontend/login/userlogin.html";
        alert("Due to multiple wrong otps, your account has been blocked,contact admin")
      }
    })
    .catch((err)=>{
      console.log(err)
      alert("error is",err.message)
    })
    }

    //resending otp if he not received
    function resendotp(){
      let email = emailInput.value;
    let obj = {
      Email:email
    }
    axios.post("http://localhost:3000/userverifylogin",obj)
    .then((res)=>{
      const response = res.data;
      if(response.data=="success"){
        alert("otp resend successfully")
      }
      else if(response.data == "notactive"){
        alert("For security reasons your account has been blocked, contact admin")
      }
      else{
        alert("something went wrong sending otp")
      }
    }).catch((err)=>{
      console.log(err)
      alert("Error is",err.message)
    })
    }

    //login into account
    function login(event){
      event.preventDefault();
      let email = emailInput.value;
      let inp1 = document.getElementById("1").value;
      let inp2 = document.getElementById("2").value;
      let inp3 = document.getElementById("3").value;
      let inp4 = document.getElementById("4").value;
      let otp = inp1 + inp2 + inp3 + inp4;
    let obj = {
      Email:email,
      Otp:otp
    }
    axios.post("http://localhost:3000/loginaccount",obj).
    then((res)=>{
      const response = res.data;
      console.log(response)
      if(response.data == "notactive"){
        alert("For security reason your account has been blocked,contact admin")
      }
      else if(response.data =="wrongotp"){
        alert("Entered wrong otp")
      }
      else if(response.data == "success"){
        localStorage.setItem("token",response.token)
        localStorage.setItem("Name",response.Name)
        email.value = "";
        alert("user login successfull")
        window.location.href =
          "http://127.0.0.1:5500/frontend/Homepage/home1.html";
      }
      else if(response.data == "noattempts"){
        alert("For security purpose we have blocked your account,contact admin")
      }
      else{
        alert("something went wrong")
      }

    }).catch((err)=>{
      alert(`Error:${err.message}`)
    })
    }

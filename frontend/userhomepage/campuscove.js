
window.addEventListener("load", () => {
  axios.get("http://localhost:3000/mystaydays", {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    })
    .then((res) => {
      console.log(res);
      document.getElementById("count").innerHTML = res.data;
    });
});

//logout function

function logout() {
  if (confirm("Are you sure to logout?")) {
    localStorage.removeItem("token");
    window.location.href =
      "http://127.0.0.1:5500/frontend/userslogin/campuscovehostels.html";
  }
}

//displaying pending payment for this month
window.addEventListener("load", () => {
  axios
    .get("http://localhost:3000/mypaymentstatus", {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    })
    .then((res) => {
      document.getElementById("isdue").innerText = res.data;
    })
    .catch(() => {
      document.getElementById("isdue").innerText = "Not Paid";
    });
});

//displaying user profile

function loadProfile() {
  axios
    .get("http://localhost:3000/myprofile", {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    })
    .then((res) => {
      var user = res.data;
      document.getElementById("name").innerText = `Name : ${user.Name}`
      document.getElementById("roomnumber").innerText = `Room Number : ${user.Room}`
      document.getElementById("branch").innerText = `Branch : ${user.Branch}`
      document.getElementById("college").innerText = `College :${user.College}`
      document.getElementById("joindate").innerText = `Join Date : ${user.JoinDate.slice(0,10)}`
      document.getElementById("mobilenumber").innerText = `Mobile Number: ${user.PhoneNumber}`
    });
}

//showing payment history

function loadPaymentHistory() {
  axios
    .get("http://localhost:3000/mypayments", {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    })
    .then((res) => {
      var list = res.data || [];
      var tbody = document.querySelector("#paymenthistoryTable tbody");
      tbody.innerHTML = "";
      list.forEach((p) => {
        var tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${p.Amount}</td>
        <td>${p.TransactionId}</td>
        <td>${p.Mode}</td>
        <td>${(p.Date.slice(0,10))}</td>
        <td>${p.Month}</td>
      `;
        tbody.appendChild(tr);
      });
    })
    .catch(() => {
      document.querySelector("#paymenthistoryTable tbody").innerHTML =
        "<tr><td colspan='5'>No Records</td></tr>";
    });
}


function showSection(sectionId) {
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.add("hidden");
  });
  document.getElementById(sectionId).classList.remove("hidden");
  if (sectionId === "myprofile") {
    loadProfile();
  }
  else if(sectionId == "payment"){
    loadPaymentHistory()

  }
  else if(sectionId=="roomCount"){
    loadRoomMembers();
  }
}

//payment gateway

document
  .getElementById("paymentsubmit-btn")
  .addEventListener("click", async function (e) {
    e.preventDefault();
    const payPhoneValue = document.getElementById("payPhone").value;
    console.log(payPhoneValue)

    let amount = parseInt(document.getElementById("amount").value) * 100;
    let receipt = "receipt_" + Math.floor(Math.random() * 100000);
    try {
      const orderRes = await axios.post(
        "http://localhost:3000/createorder",
        {
          amount,
          currency: "INR",
          receipt,
          mobilenumber:payPhoneValue
        }
      );

      const orderData = orderRes.data;

      const options = {
        key: "rzp_test_RCbunur8vK5qev",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Hostel Fee",
        description: "Purchase",
        order_id: orderData.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(
              "http://localhost:3000/verify-payment",
              response,
              {
                headers: {
                  Authorization: "Bearer " + localStorage.getItem("token"),
                },
              }
            );
            if (verifyRes.data.success) {
              alert("Payment Successful!");
              window.location.href =
                "http://127.0.0.1:5500/expensetrackerhome.html";
            } else {
              alert("Payment verification failed!");
            }
          } catch (err) {
            alert("Payment verification error");
          }
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (err) {
      alert("Error creating order");
      console.error(err);
    }
  });


  document.getElementById("payPhone").addEventListener("blur", () => {
    const phone = document.getElementById("payPhone").value.trim();
    console.log(phone);

    const obj = {
      Phonenumber: phone,
    };

    axios.post("http://localhost:3000/namesearch", obj).then((res) => {
      const response = res.data;
      document.getElementById("verifyName").innerHTML = response;
      console.log(response);
    });
  });


   document.getElementById("download").addEventListener("click", () => {
     window.location.href = "http://localhost:3000/download";
   });
  //room member details

  function loadRoomMembers() {
    axios
      .get("http://localhost:3000/roommates", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      })
      .then((res) => {
        const data = res.data;
        document.getElementById("roomCountResult").innerText =
          "Room No: " + data.room;
        const ul = document.getElementById("roomMemberList");
        ul.innerHTML = "";
        data.members.forEach((m) => {
          const li = document.createElement("li");
          li.innerText = m.Name + " (" + m.PhoneNumber + ")";
          ul.appendChild(li);
        });
      });
  }


  document.getElementById("download").addEventListener('click',()=>{
    window.location.href = "http://localhost:3000/download";

  })


//displaying admin-name
let adminName = localStorage.getItem("name")
document.getElementById("admin-name").innerHTML = ` Welcome ${adminName}`
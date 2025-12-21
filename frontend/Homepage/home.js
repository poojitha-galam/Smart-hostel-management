document.getElementById("reset").addEventListener("click", () => {
  document.getElementById("memberForm").reset();
});

window.addEventListener("load", () => {
  axios.get("http://localhost:3000/totalhostlers").then((res) => {
    document.getElementById("count").innerHTML = res.data;
  });
});

window.addEventListener("load", () => {
  axios
    .post(
      "http://localhost:3000/authenticate",
      {},
      {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      }
    )
    .catch((err) => {
      console.log("auth failed", err);
      window.location.href =
        "http://127.0.0.1:5500/frontend/login/userlogin.html";
    });
});

function logout() {
  if (confirm("Are you sure to logout?")) {
    localStorage.removeItem("token");
    window.location.href =
      "http://127.0.0.1:5500/frontend/login/userlogin.html";
  }
}

//displaying pending payment for this month
window.addEventListener("load", () => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const d = new Date();
  const month = months[d.getMonth()];
  const obj = { pendingmonth: month };
  axios
    .post("http://localhost:3000/pendingmembers", obj)
    .then((res) => {
      const list = res.data || [];
      document.getElementById("totaldue").innerHTML = list.length;
    })
    .catch(() => {
      document.getElementById("totaldue").innerHTML = 0;
    });
});

function showSection(sectionId) {
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.add("hidden");
  });
  document.getElementById(sectionId).classList.remove("hidden");
  if (sectionId === "memberList") {
    renderMembers();
  }
  else if(sectionId == "vacatedmembersList"){
    vacateMembers();

  }
}
//adding the member to the database process

document.getElementById("memberForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("memberId").value;
  const name = document.getElementById("name").value;
  const room = document.getElementById("room").value;
  const branch = document.getElementById("branch").value;
  const college = document.getElementById("college").value;
  const joiningDate = document.getElementById("joiningDate").value;
  const phone = document.getElementById("phone").value;

  let obj = {
    username: name.toLowerCase(),
    userroom: room,
    userbranch: branch.toLowerCase(),
    usercollege: college.toLowerCase(),
    userjoiningdate: joiningDate,
    userphone: phone,
    _id: id,
  };

  axios
    .post("http://localhost:3000/onboarduser", obj)
    .then((res) => {
      const response = res.data;
      console.log(response);
      if (response.data == "exist") {
        alert("Already Mobile Number exist,Please check again");
      } else if (response.data == "created") {
        alert("Successfully Added Person");
        location.reload();
      } else if (response.data == "updated") {
        alert("userdetails updated successfully");
        location.reload();
      } else {
        alert("something went wrong,try again");
      }
    })
    .catch((err) => {
      ocument.getElementById("memberForm").reset();
      alert("Error occured due to", err.message);
    });
});

//displaying memberws list by fetching from database

function renderMembers() {
  axios.get("http://localhost:3000/memberslist").then((res) => {
    const response = res.data;
    const tbody = document.querySelector("#memberTable tbody");
    tbody.innerHTML = "";

    response.forEach((member) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>
          <a href="https://chatgpt.com/c/68fb0dcc-9778-8321-b9b7-bdafb03e1526">${member.Name}</a></td>
          <td>${member.Room}</td>
          <td>${member.Branch}</td>
          <td>${member.College}</td>
          <td>${member.JoinDate.slice(0, 10)}</td>
          <td>${member.PhoneNumber}</td>
          <td>
            <button onclick="editMember('${member._id}')">Edit</button>
            <button onclick="deleteMember('${member._id}')">Delete</button>
          </td>
        `;
      tbody.appendChild(tr);
    });
  });
}

//vacating members list
function vacateMembers() {
  axios.get("http://localhost:3000/vacatehistory").then((res) => {
    const response = res.data;
    const tbody = document.querySelector("#vacatemembersTable tbody");
    tbody.innerHTML = "";

    response.forEach((member) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${member.Name}</td>
          <td>${member.Room}</td>
          <td>${member.Branch}</td>
          <td>${member.College}</td>
          <td>${member.JoinDate.slice(0, 10)}</td>
          <td>${member.PhoneNumber}</td>
          <td>${member.VacateDate.slice(0,10)}</td>
        `;
      tbody.appendChild(tr);
    });
  });
}


//deleting member
function deleteMember(id) {
  if (confirm("Are you sure to delete user")) {
    const obj = {
      _id: id,
    };
    axios
      .post("http://localhost:3000/deleteMember", obj)
      .then((res) => {
        const response = res.data;
        if (response.data == "success") {
          alert("Successfully deleted user");
          renderMembers();
        } else if (response.data == "failed") {
          alert("something went wrong,please try again");
        }
      })
      .catch((err) => {
        alert("Internal server error");
      });
  }
}

function editMember(id) {
  const obj = {
    _id: id,
  };

  axios.post("http://localhost:3000/editmember", obj).then((res) => {
    const response = res.data;
    document.getElementById("memberId").value = response._id;
    document.getElementById("name").value = response.Name;
    document.getElementById("room").value = response.Room;
    document.getElementById("branch").value = response.Branch;
    document.getElementById("college").value = response.College;
    document.getElementById("joiningDate").value = response.JoinDate.slice(
      0,
      10
    );
    document.getElementById("phone").disabled = true;
    document.getElementById("phone").value = response.PhoneNumber;
    document.querySelector("#memberForm button").innerText = "Update Member";
    showSection("addMember");
  });
}

//displaying members list based upon the search keyword

document.getElementById("search-btn").addEventListener("click", () => {
  const keyword = document.getElementById("search").value.toLowerCase().trim();
  const tbody = document.querySelector("#memberTable tbody");
  tbody.innerHTML = "";

  axios.get("http://localhost:3000/memberslist").then((res) => {
    const response = res.data;

    const filtered = response.filter(
      (member) =>
        member.Name.toLowerCase().includes(keyword) ||
        String(member.Room).toLowerCase().includes(keyword) ||
        member.Branch.toLowerCase().includes(keyword) ||
        member.College.toLowerCase().includes(keyword) ||
        member.PhoneNumber.toLowerCase().includes(keyword)
    );

    filtered.forEach((member) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${member.Name}</td>
          <td>${member.Room}</td>
          <td>${member.Branch}</td>
          <td>${member.College}</td>
          <td>${member.JoinDate.slice(0, 10)}</td>
          <td>${member.PhoneNumber}</td>
          <td>
            <button onclick="editMember('${member._id}')">Edit</button>
            <button onclick="deleteMember('${member._id}')">Delete</button>
          </td>
        `;
      tbody.appendChild(tr);
    });
  });
});

//adding payment function

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

document.getElementById("payPhone").addEventListener("input", () => {
  document.getElementById("verifyName").innerHTML = "";
});

//adding payment
document.getElementById("paymentForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const phone = document.getElementById("payPhone").value.trim();
  const month = document.getElementById("month").value;
  const paymentdate = document.getElementById("paymentDate").value;
  const amount = document.getElementById("amount").value;
  const txnid = document.getElementById("txnId").value;
  const mode = document.getElementById("modeofpayment").value;

  const obj = {
    paymentphone: phone,
    paymentmonth: month,
    paymentdate,
    paymentamount: amount,
    paymenttxn: txnid,
    paymentmode: mode,
  };

  axios
    .post("http://localhost:3000/addpayment", obj)
    .then((res) => {
      const response = res.data;
      if (response.data == "created") {
        alert("payment added successfully");
        document.getElementById("paymentForm").reset();
        document.getElementById("verifyName").innerHTML = "";
      } else if (response.data == "exist") {
        alert("payment already exist for this month");
      } else if (response.data == "nouser") {
        alert("no user found with this phone number");
      } else {
        alert("something went wrong,please try again");
      }
    })
    .catch((err) => {
      alert("internal server error");
    });
});

//show month wise payments
function showMonthPayments() {
  const month = document.getElementById("paymentMonthSelect").value;
  const tbody = document.querySelector("#monthPaymentTable tbody");
  tbody.innerHTML = "";
  document.getElementById("totalAmount").innerHTML = "";

  const obj = { fetchmonth: month };

  axios
    .post("http://localhost:3000/fetchpayments", obj)
    .then((res) => {
      const response = res.data;
      let total = 0;
      response.forEach((p) => {
        total += Number(p.Amount);
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${p.PhoneNumber}</td>
        <td>${p.Amount}</td>
        <td>${p.TransactionId}</td>
        <td>${p.Mode}</td>
        <td>${p.Date.slice(0, 10)}</td>
      `;
        tbody.appendChild(tr);
      });
      document.getElementById("totalAmount").innerHTML =
        "Total Amount : " + total;
    })
    .catch((err) => {
      alert("internal server error");
    });
}

//fetching the payment history
function fetchPaymentHistory() {
  const phone = document.getElementById("searchPhone").value.trim();
  const obj = { historyphone: phone };
  axios
    .post("http://localhost:3000/paymenthistory", obj)
    .then((res) => {
      const data = res.data || [];
      const ul = document.getElementById("paymentHistory");
      ul.innerHTML = "";
      if (data.length == 0) {
        ul.innerHTML = "<li>No payments found</li>";
        return;
      }
      data.forEach((p) => {
        const li = document.createElement("li");
        li.textContent = `${p.Date.slice(0, 10)} | ${p.Month} | ₹${
          p.Amount
        } | ${p.TransactionId} | ${p.Mode}`;
        ul.appendChild(li);
      });
    })
    .catch((err) => {
      alert("internal server error");
    });
}

//showing room wise members
function showRoomMembers() {
  const roomno = document.getElementById("roomSelect").value;
  const obj = { roomno: roomno };
  axios
    .post("http://localhost:3000/roommembers", obj)
    .then((res) => {
      const response = res.data;
      const ul = document.getElementById("roomMemberList");
      const p = document.getElementById("roomCountResult");
      ul.innerHTML = "";
      p.innerHTML = "Total Members : " + response.length;
      response.forEach((m) => {
        const li = document.createElement("li");
        li.textContent = `${m.Name} (${m.PhoneNumber})`;
        ul.appendChild(li);
      });
    })
    .catch((err) => {
      alert("internal server error");
    });
}

//day wise members details
function showDayWiseMembers() {
  const dayno = document.getElementById("daySelect").value;
  const obj = { dayno: dayno };
  const ul = document.getElementById("dayWiseList");
  ul.innerHTML = "";

  axios
    .post("http://localhost:3000/daywisemembers", obj)
    .then((res) => {
      const list = res.data || [];
      if (list.length == 0) {
        ul.innerHTML = "<li>No members joined on this day</li>";
        return;
      }
      list.forEach((m) => {
        const li = document.createElement("li");
        li.textContent = `${m.Name} - Room ${m.Room} (${m.PhoneNumber})`;
        ul.appendChild(li);
      });
    })
    .catch((err) => {
      alert("internal server error");
    });
}

//payment pending members showcasing
function showPendingMembers() {
  const month = document.getElementById("pendingMonthSelect").value;
  const obj = { pendingmonth: month };
  const ul = document.getElementById("pendingMemberList");
  ul.innerHTML = "";

  axios
    .post("http://localhost:3000/pendingmembers", obj)
    .then((res) => {
      const list = res.data || [];
      if (list.length == 0) {
        ul.innerHTML = "<li>No pending members</li>";
        return;
      }
      list.forEach((m) => {
        const li = document.createElement("li");
        li.textContent = `${m.Room} - ${m.Name} (${m.PhoneNumber})`;
        ul.appendChild(li);
      });
    })
    .catch((err) => {
      alert("internal server error");
    });
}

function remainder() {
  setTimeout(() => {
    alert("Remainder Sent Successfully");
  }, 3000);
}

//displaying admin-name
let adminName = localStorage.getItem("Name")
document.getElementById("admin-name").innerHTML = `Admin - ${adminName}`

const express = require('express')
const app = express();
const { adminuser, otpverify,user,payment,vacate,signupuser, onlinepayment} = require("./models/mongoSchema");
const cors = require("cors")
const jwt = require("jsonwebtoken");
const axios = require("axios");
const fetch = require("node-fetch");
const bcrypt = require("bcrypt")
const { Razorpay, razorpay } = require("./routes/razorpaydetails");
const path = require("path");


app.use(cors())
require("dotenv").config();
app.use(express.json());

//authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  console.log(token)
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.secrettoken, (err, user) => {
    console.log(user);
    if (err) return res.sendStatus(403);
    req.user = user;
    console.log(req.user);
    next();
  });
}

//login otp verify
app.post("/userverifylogin", async (req, res) => {
  try {
    const { Email } = req.body;
    await otpverify.deleteOne({Email});
    const exist = await adminuser.find({Email});
    console.log(exist)
    if (exist.length==0) {
      return res.json({ data: "notexist" });
    }
    if(!exist[0].Status){
      return res.json({data:"notactive"})
    }
    const otp = Math.floor(1000 + Math.random() * 9000);
    await otpverify.create({
      Email: Email,
      Passcode: otp,
    });
    var SibApiV3Sdk = require("sib-api-v3-sdk");

    var defaultClient = SibApiV3Sdk.ApiClient.instance;
    defaultClient.authentications["api-key"].apiKey = process.env.mailapikey;

    var apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    var sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    const senderEmail = "218x1a0482@khitguntur.ac.in";
    const recipientEmail = Email;

    sendSmtpEmail.sender = { name: "Verification", email: senderEmail };
    sendSmtpEmail.to = [{ email: recipientEmail }];
    sendSmtpEmail.subject = "Campus Cove Hostels";
    sendSmtpEmail.htmlContent = `<p>Your otp password is ${otp}</p>`;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("API called successfully. Returned data: ", data);

    res.status(200).json({ data: "success" });
    console.log(otp);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "fail" });
  }
});

//login into account
app.post("/loginaccount", async (req, res) => {
  const { Email,Otp } = req.body;
  try {
    const userexist = await adminuser.find({Email});
    const otp = await otpverify.findOne({ Email });
    console.log(otp);
    if (!userexist.length || !userexist[0].Status) {
      return res.json({ data: "notactive" });
    } else {
      if (otp && otp.Passcode == Otp) {
        await otpverify.deleteOne({Email});
        const token = jwt.sign(
          { email: userexist[0].Email },
          process.env.secrettoken,
          { expiresIn: "30m" }
        );
        return res.json({ data: "success" ,token,Name:userexist[0].Name});
      } else {
        await otpverify.updateOne({ Email }, { $inc: { Count: 1 } })
        if ((otp?.Count ?? 0) + 1 >= 3) {
          await user.updateOne({ Email }, { $set: { Status: false } });
          await otpverify.deleteOne({ Email });
          return res.json({ data: "noattempts" });
        } else {
          return res.json({ data: "wrongotp" });
        }
      }
    }
  } catch (err) {
    await otpverify.deleteOne({Email});
    return res.json({ data: err.message });
  }
});

//hotel first user onboarding

app.post("/onboarduser",async(req,res)=>{
  try{
    const { username, userroom, userbranch, usercollege, userjoiningdate, userphone,_id} = req.body;
    if(_id.length>0){
      await user.updateOne({_id},{$set:{Name:username,Room:userroom,Branch:userbranch,College:usercollege,JoinDate:userjoiningdate}})
      return res.json({data:"updated"})
    }
    const userexist = await user.findOne({PhoneNumber:userphone})
    if(userexist){
      return res.json({data:"exist"})
    }
    await user.create({
      Name:username,
      Room:userroom,
      Branch:userbranch,
      College:usercollege,
      JoinDate:new Date(userjoiningdate),
      PhoneNumber:userphone
    })
    await sendWelcomeSMS(userphone, username,userroom).catch(() => {});
    return res.json({data:"created"})

  }
  catch(err){
    console.log("error is",err.message)
    return res.json({data:"failed",mess:err.message})
  }
})

//members list
app.get("/memberslist",async(req,res)=>{
  try{
    const usersdetails = await user.find({},{__v:0})
    console.log(usersdetails)
    return res.send(usersdetails)
  }
  catch(err){
    return res.json({error:err.message})
  }
})

//authenticate

app.post("/authenticate",authenticateToken,async(req,res)=>{
  return res.json({data:"ok"})
})

//delete member------------

app.post('/deleteMember',async(req,res)=>{
  try{
    const{_id} = req.body;
    const userdetails = await user.findOne({_id})
    await vacate.create({
      Name:userdetails.Name,
      Room:userdetails.Room,
      Branch:userdetails.Branch,
      College:userdetails.College,
      JoinDate:userdetails.JoinDate,
      PhoneNumber:userdetails.PhoneNumber
    })
    await user.deleteOne({_id})
    return res.json({data:"success"})
  }
  catch(err){
    console.log(err.message)
    return res.json({data:"failed"})
  }
})

//editing member details
app.post("/editmember",async(req,res)=>{
  try{
    const {_id} = req.body;
    const userdetails = await user.findOne({_id},{__v:0})
    console.log(userdetails)
    return res.send(userdetails)
  }
  catch(err){
    console.log(err.message)
  }
})
//total hostlers
app.get("/totalhostlers",async(req,res)=>{
  try{
    const userscount = await user.aggregate([{
      $count:"Total_users"
    }])
    const count = userscount[0].Total_users;
    res.send(count)
  }
  catch(err){
    console.log(err)
  }
})

//searching the name to verify when adding payment
app.post('/namesearch',async(req,res)=>{
  try{
    const {Phonenumber} = req.body;
    console.log(Phonenumber)
    const userdata = await user.findOne({PhoneNumber:Phonenumber})
    const username = userdata.Name;
    return res.send(username)
  }
  catch(err){
    console.log(err.message)
  }
})

//searching vacate history
app.get("/vacatehistory",async(req,res)=>{

  try {
    const usersdetails = await vacate.find({}, { __v: 0 }).sort({Date:-1})
    console.log(usersdetails)
    return res.send(usersdetails);
  } catch (err) {
    console.log(err.message)
    return res.json({ error: err.message });
  }

})

//user signup
app.post("/usersignup",async(req,res)=>{

  try{
    const {mobilenumber,password} = req.body;
    const userexist = await user.find({PhoneNumber:mobilenumber})
    if(userexist.length==0){
      return res.json({data:"noaccess"})
    }
    const usersignupexist = await signupuser.find({PhoneNumber:mobilenumber})
    if(usersignupexist.length==1){
      return res.json({data:"exist"})
    }
    const hash =await  bcrypt.hash(password,10)
    await signupuser.create({
      PhoneNumber:mobilenumber,
      Passcode:hash
    })
    return res.json({data:"success"})

  }
  catch(err){
    console.log(err.message)
    return res.json({data:"fail"})

  }

})

//users login route
app.post("/userlogin",async(req,res)=>{

  try{
    const {mobilenumber,password} = req.body;
    const userexist = await signupuser.find({PhoneNumber:mobilenumber})
    if(userexist.length==0){
      res.json({data:"notexist"})
    }
    console.log(userexist)
    const result = await bcrypt.compare(password,userexist[0].Passcode)
    const username = await user.findOne({PhoneNumber:mobilenumber})
    const token = jwt.sign(
      { mobilenumber: mobilenumber },
      process.env.secrettoken,
      { expiresIn: "3h" }
    );
    console.log(token)
    if(result){
      return res.json({data:"success",Name:username.Name,token})
    }
    else{
      return res.json({data:"wrongpassword"})
    }

  }
  catch(err){
    console.log(err)
    res.json({data:"fail"})
  }

})

//total number of days user stayed in hostel

app.get("/mystaydays", authenticateToken, async (req, res) => {
  try {
    const phone = req.user.mobilenumber;
    const u = await user.findOne({ PhoneNumber: phone });
    const join = new Date(u.JoinDate);
    const today = new Date();
    const diffMs = today.getTime() - join.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    res.send(days.toString());
    console.log(days)
  } catch (err) {
    console.log(err.message)
    res.json({data:"fail"})
  }
});

//present month payment details
app.get("/mypaymentstatus", authenticateToken, async (req, res) => {
  try {
    const phone = req.user.mobilenumber;
    const now = new Date();
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
    const currentMonth = months[now.getMonth()];

    const pay = await payment.findOne({
      PhoneNumber: phone,
      Month: currentMonth,
    });
    if (pay) {
      res.send("Paid");
    } else {
      res.send("Not Paid");
    }
  } catch (err) {
    res.send("Not Paid");
  }
});

//fetching user profile

app.get("/myprofile", authenticateToken, async (req, res) => {
  try {
    const phone = req.user.mobilenumber;
    const u = await user.findOne({ PhoneNumber: phone });
    res.json(u);
  } catch (err) {
    res.json({});
  }
});

//user payment history

app.get("/mypayments", authenticateToken, async (req, res) => {
  try {
    const phone = req.user.mobilenumber;
    const pays = await payment.find({ PhoneNumber: phone }).sort({ Date: -1 });
    console.log(pays)
    res.json(pays);
  } catch (err) {
    res.json([]);
  }
});



//adding payment to database
app.post("/addpayment",async(req,res)=>{
  try{
    const { paymentphone, paymentmonth, paymentdate, paymentamount, paymenttxn, paymentmode } = req.body;

    const userexist = await user.findOne({ PhoneNumber: paymentphone })
    if(!userexist){
      return res.json({data:"nouser"})
    }

    const paymentexist = await payment.findOne({ PhoneNumber: paymentphone, Month: paymentmonth })
    if(paymentexist){
      return res.json({data:"exist"})
    }

    await payment.create({
      PhoneNumber: paymentphone,
      Month: paymentmonth,
      Date: new Date(paymentdate),
      Amount: paymentamount,
      TransactionId: paymenttxn,
      Mode: paymentmode
    })

    await sendPaymentSms(paymentphone,paymentamount,paymentdate.slice(0,10)).catch(() => {});

    return res.json({data:"created"})
  }
  catch(err){
    console.log("error is",err.message)
    return res.json({data:"failed",mess:err.message})
  }
})

//fetching payments
app.post("/fetchpayments",async(req,res)=>{
  try{
    const { fetchmonth } = req.body;
    const paymentslist = await payment.find({Month:fetchmonth},{__v:0}).sort({Date:-1})
    return res.send(paymentslist)
  }
  catch(err){
    console.log("error is",err.message)
    return res.json({data:"failed",mess:err.message})
  }
})

//fetching payment history
app.post("/paymenthistory", async (req, res) => {
  try {
    const { historyphone } = req.body;
    const history = await payment
      .find({ PhoneNumber: historyphone }, { __v: 0 })
      .sort({ Date: -1 });
    return res.send(history);
  } catch (err) {
    console.log("error is", err.message);
    return res.json({ data: "failed", mess: err.message });
  }
});

//fetching members by room
app.post("/roommembers",async(req,res)=>{
  try{
    const { roomno } = req.body;
    const members = await user.find({Room:roomno},{__v:0}).sort({Name:1})
    return res.send(members)
  }
  catch(err){
    console.log("error is",err.message)
    return res.json({data:"failed",mess:err.message})
  }
})

//day wise members

//fetching day-wise joined members
app.post("/daywisemembers",async(req,res)=>{
  try{
    const { dayno } = req.body;
    const members = await user.find(
      { $expr: { $eq: [ { $dayOfMonth: "$JoinDate" }, Number(dayno) ] } },
      { __v:0 }
    ).sort({Name:1})
    return res.send(members)
  }
  catch(err){
    console.log("error is",err.message)
    return res.json({data:"failed",mess:err.message})
  }
})


//payment pending members for a month
app.post("/pendingmembers",async(req,res)=>{
  try{
    const { pendingmonth } = req.body;
    const paidphones = await payment.distinct("PhoneNumber",{Month:pendingmonth})
    const pending = await user.find(
      { PhoneNumber: { $nin: paidphones } },
      { __v:0 }
    ).sort({Room:1,Name:1})
    return res.send(pending)
  }
  catch(err){
    console.log("error is",err.message)
    return res.json({data:"failed",mess:err.message})
  }
})

//function for sending welcome user
async function sendWelcomeSMS(number, name,room) {
  const url = "https://www.fast2sms.com/dev/bulkV2";
  const body = new URLSearchParams({
    route: "q",
    language: "english",
    message: `Hi ${name}, welcome to Rajesh Hostels! ,we have allocated Room no ${room} to you.We're happy to have you with us. Wishing you a comfortable and memorable stay.`,
    numbers: String(number).trim(),
  });

  const { data } = await axios.post(url, body, {
    headers: {
      authorization: process.env.FAST2SMS_API_KEY,
      "content-type": "application/x-www-form-urlencoded",
    },
    timeout: 15000,
  });

  return data;
}

//payment list
app.get("/paymentslist", authenticateToken, async (req, res) => {
  const rows = await payment.find({}, "PhoneNumber Amount Month Date").lean();
  res.json(rows);
});




//sending payment received message
async function sendPaymentSms(number,amount,date) {
  const url = "https://www.fast2sms.com/dev/bulkV2";
  const body = new URLSearchParams({
    route: "q",
    language: "english",
    message: `Hostel fee of ₹${amount} received on ${date}.
  Thank you for your payment 
   — Rajesh Hostels`,
    numbers: String(number).trim(),
  });

  const { data } = await axios.post(url, body, {
    headers: {
      authorization: process.env.FAST2SMS_API_KEY,
      "content-type": "application/x-www-form-urlencoded",
    },
    timeout: 15000,
  });

  console.log(data)
}


//razor pay connecting


app.post("/createorder", async (req, res) => {
  const { amount, currency, receipt,mobilenumber } = req.body;
  try {
    if (!mobilenumber) {
      return res.status(400).json({ error: "Mobile number is required" });
    }
    const order = await razorpay.orders.create({ amount, currency, receipt });
    console.log(order)

    await onlinepayment.create({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      receipt: order.receipt,
      PhoneNumber: mobilenumber,
    });

    res.json(order);
  } catch (err) {
    console.log(err)
    res.status(500).send(err);
  }
});

//payment verifying-----------------------------------------
app.post("/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.razorpaykey)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    await onlinepayment.updateOne(
      { order_id: razorpay_order_id },
      { $set: { status: "paid" } }
    );
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});

app.get("/roommates", authenticateToken, async (req, res) => {
  const phone = req.user.mobilenumber;
  const me = await user.findOne({ PhoneNumber: phone });
  const mates = await user.find({ Room: me.Room });
  res.json({ room: me.Room, members: mates });
});

//sending menu

app.get("/download", (req, res) => {
  try{
  const filePath = path.join(__dirname,"menuhostel.pdf");
  res.download(filePath, "menuhoostel.pdf", (err) => {
    if (err) {
      console.error("Error while sending the file:", err);
      res.status(500).send("Error downloading the file");
    } else {
      console.log("File downloaded successfully");
    }
  })
}
catch(err){
  console.log(err.message)
}
});




app.listen(3000,(err)=>{
  if(err){
    console.log(err.message)
  }
  console.log("server running")
})

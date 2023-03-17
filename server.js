const express = require("express");
const app = express();
const crypto = require('crypto')
const base64 = require('base64-arraybuffer')
const http = require('http')
var cors = require("cors");
const socketio = require('socket.io')
const User = require('./models/user')
const { auth ,guest } = require("./middlewares/middlewares");
const authRouter = require("./routes/auth.js");
const connectDB = require("./db/connect.js");
const { sessionMiddleware ,wrap } = require("./middlewares/sessionMiddleware");
require("dotenv").config();
var corsOptions = {
  origin: "*",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,   
};
app.use(cors(corsOptions));
// starting the server
const port = process.env.PORT || 3000;

//middleware

app.use(express.json());
app.use(express.static("./public"));
app.set("view engine", "ejs");
app.use(sessionMiddleware);
app.use(express.json());
//routes
app.use("/auth", authRouter);

app.get("/test", (req, res) => {
  req.session.test = "yep the session is shared"
  res.json({ DFSDF: "dqdqsd" });
});


app.get("/profile", auth, async (req, res) => {
  
  const user = await User.findOne({username : req.session.user.username })
  res.render("profile", { user  });
});

app.get("/",guest, (req, res) => res.render("index"));


let server=null
let io=null
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URl);
    server = http.createServer(app)
    io = socketio(server,{
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
      }
    });
    server.listen(port,"192.168.0.172", () => console.log(`Server is listening port ${port}...`));
    io.use(wrap(sessionMiddleware));
    module.exports.io = io
    require('./ws/index')
  } catch (error) {
    console.log(error);
  }
  
};
start();
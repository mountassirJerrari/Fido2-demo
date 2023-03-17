const session = require("express-session");
const sessionMiddleware =session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: false },
  })
  const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

module.exports = {wrap , sessionMiddleware}
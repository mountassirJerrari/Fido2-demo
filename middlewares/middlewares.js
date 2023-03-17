const User = require("../models/user");


const checkUser = (req, res, next) => {
  if (req.session.user) {
      next() ; 
      return ;
  }
  console.log("user is not present in the session");
  res.status(400).json({error : "user is not present in the session"})
  return ;

}
const insertUsernameIntoSession = (req,res,next)=>{
  
   
  if(!req.body.username || !/[a-zA-Z0-9-_]+/.test(req.body.username))
  {
    console.log("must provide a valid username , try avoiding special caracters");
    res.status(400).json({error : "must provide a valid username , try avoiding special caracters"})
    return;
  }
  const username = req.body.username
  
  req.session.user = {username : username}
  next()
  return ;
}

const firstTimeRegistring = async (req,res,next) =>{
    
    const username = req.body.username
    const user = await User.findOne({username : username})
    if (user?.credentials.length >0) {
      console.log("u can't register an existing account");
      return res.status(400).json({error : "u can't register an existing account"})
    }
    next()
    return ;
  }
const auth = (req,res,next)=>{
    if(req.session?.auth)
    {
      return next()
    }
    return res.redirect('/')
  }
const guest = (req,res,next)=>{
    if(!req.session?.auth)
    {
      return next()
    }
    return res.redirect('/profile')
  }
  
module.exports = {insertUsernameIntoSession , checkUser ,firstTimeRegistring ,auth ,guest}

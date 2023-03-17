const express = require('express')
const {insertUsernameIntoSession}=require('../middlewares/middlewares')
const {registrationReq ,registrationRes}= require ('../controllers/registration')
const {registrationReqQr ,registrationResQr}= require ('../controllers/registrationQR.js')

const {authenticationReq ,authenticationRes}= require ('../controllers/authentication')
const {authenticationReqQr ,authenticationResQr}= require ('../controllers/authenticationQr')
const {checkUser ,guest, firstTimeRegistring} = require('../middlewares/middlewares')
 
const router = express.Router()  


router.post('/registerRequest',[guest,insertUsernameIntoSession,firstTimeRegistring],registrationReq)
router.post('/registerResponse',[guest,checkUser],registrationRes)
router.post('/authRequest',[guest,insertUsernameIntoSession],authenticationReq)
router.post('/authResponse',[guest,checkUser],authenticationRes)
// testing routes
router.post('/registerRequestQr',[insertUsernameIntoSession,firstTimeRegistring],registrationReqQr)
router.post('/registerResponseQr',[checkUser],registrationResQr)
router.post('/authRequestQr',[guest,insertUsernameIntoSession],authenticationReqQr)
router.post('/authResponseQr',[guest,checkUser],authenticationResQr)


router.get("/logout" , (req,res)=>{
  req.session.auth = false ;
  res.redirect('/')
})

module.exports = router
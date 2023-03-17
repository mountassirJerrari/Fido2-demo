const mongoose = require('mongoose')

const connectDB = (url) => {
  return  mongoose.connect(url, { 
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
}
mongoose.set('strictQuery', true);

module.exports = connectDB;
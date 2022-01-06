const mongoose=require('mongoose');

const userSchema=new mongoose.Schema({
    uuid:String,
    Coins:String,
    Crypto:String,
})

module.exports=mongoose.model('Users',userSchema);
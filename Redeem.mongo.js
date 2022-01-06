const mongoose=require('mongoose');

const redeemSchema=new mongoose.Schema({
    uuid:String,
    Redeem:String
})

module.exports=mongoose.model('Redeem',redeemSchema);
const mongoose=require('mongoose');

const redeemSchema=new mongoose.Schema({
    uuid:String,
    RedeemCrypto:String,
    RedeemIndus:String,
})

module.exports=mongoose.model('Redeem',redeemSchema);
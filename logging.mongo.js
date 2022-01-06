const mongoose=require('mongoose');

const loggingSchema=new mongoose.Schema({
    uuid:String,
    ActionCode:String,
    IndusCoin:String,
    IndusPoint:String,
})

module.exports=mongoose.model('Logging',loggingSchema);
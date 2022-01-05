const mongoose=require('mongoose');

const loggingSchema=new mongoose.Schema({
    uuid:String,
    ActionCode:String
})

module.exports=mongoose.model('Logging',loggingSchema);
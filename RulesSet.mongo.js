const mongoose=require('mongoose');

const RulesSchema=new mongoose.Schema({
    ActionCode:String,
    IndusPoint:String,
    IndusCoin:String,

})

module.exports=mongoose.model('Rules',RulesSchema);
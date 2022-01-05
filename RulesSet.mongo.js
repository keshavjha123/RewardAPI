const mongoose=require('mongoose');

const RulesSchema=new mongoose.Schema({
    ActionCode:String,
    IndusCoin:String,
})

module.exports=mongoose.model('Rules',RulesSchema);
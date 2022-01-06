const mongoose=require('mongoose');

const userSchema=new mongoose.Schema({
    
    userlist : [ 
        {
            uuid : String,
            DefaultReward : String,
            CryptoPrimaryAccountNumber : String,
            CryptoSecondaryAccountNumber :String,
            CryptoPrimaryPrivateKey:String,
            CryptoSecondaryPrivateKey:String,
        }
    ]
}
)

module.exports=mongoose.model('Users',userSchema);
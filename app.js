// import {fetch} from "node-fetch";

const express=require('express');
const https = require('https')
const cors=require('cors');
const path=require('path');
const morgan=require('morgan');
var bodyParser = require('body-parser');
const request =require('request');
const mongoose=require('mongoose');
// const moment=require('moment');
const { response } = require('express');
var axios = require('axios');

const Logging=require('./logging.mongo');
const Rules=require('./RulesSet.mongo');
const Redeem=require('./Redeem.mongo');
const Users=require('./users.mongo');

const app=express();
const port=process.env.PORT||3000 ;

var conversionRate={
    beginner:{
        coins:100,
        rate:1.0/15
    },
    explorer:{
        coins:500,
        rate:1.0/20
    },
    expert:{
        coins:1000,
        rate:1.0/10
    },
    legend:{
        coins:2000,
        rate:1.0/5
    }
    
}
var month_map={
    'Jan':'01',
    'Feb':'02',
    'Mar':'03',
    'Apr':'04',
    'May':'05',
    'Jun':'06',
    'Jul':'07',
    'Aug':'08',
    'Sep':'09',
    'Oct':'10',
    'Nov':'11',
    'Dec':'12',
}
var week_map={
    'Mon':0,
    'Tue':1,
    'Wed':2,
    'Thu':3,
    'Fri':4,
    'Sat':5,
    'Sun':6,
    
}

const MONGO_URL='mongodb+srv://API_Indus:hMJkjgn20CNq0KSC@cluster0.botjc.mongodb.net/IndusAPI?retryWrites=true&w=majority'

// const CreateEthereumWallet='https://api-eu1.tatum.io/v3/ethereum/wallet';

mongoose.connection.once('open',()=>{
    console.log('MongoDB connection is Ready');
})
mongoose.connection.on('error',(err)=>{
    console.log(err);
})













app.get('/ActionLogging',async(req,res)=>{
    // Requestbody
	//      {
	//         "privatekey":"",
	//         "ActionCode":""
	//      }
    // const url='https://code-brigade-flask.appbazaar.com/verifykey';


    var config = {
        method: 'get',
        url: 'https://code-brigade-flask.appbazaar.com/verifykey',
        headers: { 
          'privatekey': req.headers.publickey
        }
      };
      
      try {
        const response=await axios(config);
        console.log(req.headers.actioncode);
        await Logging.insertMany({
            uuid:response.data.uuid,
            ActionCode:req.headers.actioncode,
        })
        res.send(response.data);
      } catch (error) {
          console.log('error',error);
      }


    })
    
    // const response=await fetch(`${url}`,{
    //     headers:{
    //         privatekey:req.headers.privatekey
    //     }
    // })
    // .then((response=>response.json()))
    // .catch((console.log('There was some error while fetching the request')));
   
async function getRewards(publickey){
    var config = {
        method: 'get',
        url: 'https://code-brigade-flask.appbazaar.com/verifykey',
        headers: { 
          'privatekey': publickey
        }
      };
      try {
        const response=await axios(config);
        // console.log(req.headers.actioncode);
        const consumers=await Logging.find({
            uuid:response.data.uuid,
        })
        const rules=await Rules.find();
        console.log(rules);
        console.log(consumers);
        let tot=0;
        for (let index = 0; index < rules.length; index++) {
            const element = rules[index];
            let c=0;
            for (let index2= 0; index2 < consumers.length; index2++) {
                const element2 = consumers[index2];
                if(element.ActionCode===element2.ActionCode){
                    c++;
                }
            }
            tot=tot+c*(+element.IndusCoin);
        }
        // console.log('from function',tot);
        return tot
      } catch (error) {
        //   console.log('error',error);
        return (error);
      }
}



async function getRedeems(publickey){
    var config = {
        method: 'get',
        url: 'https://code-brigade-flask.appbazaar.com/verifykey',
        headers: { 
          'privatekey': publickey
        }
      };
      try {
        const response=await axios(config);
        // console.log(req.headers.actioncode);
        const consumerRedeem=await Redeem.find({
            uuid:response.data.uuid,
        })
        // console.log('from function',tot);
        let totRedeem=0;
        for (let index = 0; index < consumerRedeem.length; index++) {
            const element = consumerRedeem[index];
            let c=0;
            
            totRedeem=totRedeem+(+element.Redeem);
        }
        return totRedeem;
      } catch (error) {
        //   console.log('error',error);
        return (error);
      }
}






app.get('/getRewards',async(req,res)=>{
    let totCoins=await getRewards(req.headers.publickey);
    let totRedeem=await getRedeems(req.headers.publickey);
    // let uuid=await getUUID(req.headers.publickey);
    // let user=await Users.findByIdAndUpdate({
    //     uuid:uuid,
    // })
    // if(user){
    //     await user.update({
    //         Coins:totCoins-totRedeem,
    //     })
    // }else{
    //     await user.insertMany({
    //         uuid:uuid,
    //         Coins:totCoins-totRedeem,
    //     })
    // }
    res.send({
            IndusCoin:totCoins-totRedeem,
            Crypto:0,
            });
})



app.get('/getpaidcoupon',(req,res)=>{
    res.send({
        zomato:{
            text:"Zomato",
            coinrequired:100,
            couponcode:"Z3edM",
            link:'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Zomato_logo.png/800px-Zomato_logo.png'
        },
        swiggy:{
            text:"Swiggy",
            coinrequired:100,
            couponcode:"Z3edMY",
            link:'https://cdn-images-1.medium.com/max/1200/1*v5SYqjYEdQMPIwNduRrnCw.png'
        }
    })
})


app.get('/getDayWiseRewards',async(req,res)=>{

    var config = {
        method: 'get',
        url: 'https://code-brigade-flask.appbazaar.com/verifykey',
        headers: { 
          'privatekey': req.headers.publickey
        }
      };
      
      try {
        const response=await axios(config);
        // console.log(req.headers.actioncode);
        const consumers=await Logging.find({
            uuid:response.data.uuid,
        })
        const rules=await Rules.find();
         let consumersDateDiff=consumers.map((c)=>{
            let time=String((c._id).getTimestamp()).substring(0,15).split(" ");
            let date=month_map[time[1]]+'/'+time[2]+'/'+time[3];
            let currentTime=String(Date()).substring(0,15).split(" ");
            let currentDate=month_map[currentTime[1]]+'/'+currentTime[2]+'/'+currentTime[3];
            
            let date1 = new Date(date);
            let date2 = new Date(currentDate);
            let Difference_In_Time = date2.getTime() - date1.getTime();
            let Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
            let reward=rules.filter(obj=>{
                        return obj.ActionCode===c.ActionCode
                    });
            return {timeStamp:String((c._id).getTimestamp()).substring(0,15),
                    date:date,
                    day:time[0],
                    currentDate:currentDate,
                    Difference_In_Days:Difference_In_Days,
                    ActionCode:c.ActionCode,
                    reward:reward[0].IndusCoin,
                }
         });
         let currentTime=String(Date()).substring(0,15).split(" ");
         let daysToTake=week_map[currentTime[0]];
         console.log(daysToTake);
         let lastSevenDaysActions=consumersDateDiff.filter((el)=>{
             return el.Difference_In_Days>=0 & el.Difference_In_Days<=daysToTake
         })
         let finalArrayObject={};
         for (let index = 0; index < lastSevenDaysActions.length; index++) {
             const element = lastSevenDaysActions[index];
             if(finalArrayObject[element.Difference_In_Days]){
                 finalArrayObject[element.Difference_In_Days].coinsInDay+=(+element.reward)
             }else{
                finalArrayObject[element.Difference_In_Days]={
                    day:element.day,
                    date:element.date,
                    coinsInDay:+element.reward,
                    currentDate:element.currentDate
                }
             }
             
         }
        res.send(finalArrayObject);
        
      } catch (error) {
          console.log('error',error);
      }
})




app.get('/getConversionRate',(req,res)=>{
    res.send({
        rate:conversionRate
    })
})


async function getUUID(publickey){
    var config = {
        method: 'get',
        url: 'https://code-brigade-flask.appbazaar.com/verifykey',
        headers: { 
          'privatekey': publickey
        }
      };
      
      try {
        const response=await axios(config);
        return response.data.uuid;
      } catch (error) {
        return (error);
      }
}

app.get('/redeemCoins',async(req,res)=>{
    
    var config = {
        method: 'get',
        url: 'https://code-brigade-flask.appbazaar.com/verifykey',
        headers: { 
          'privatekey': req.headers.publickey
        }
      };
      
      try {
        const response=await axios(config);
        console.log(req.headers.actioncode);
        await Redeem.insertMany({
            uuid:response.data.uuid,
            Redeem:req.headers.coins,
        })
        res.send(response.data);
      } catch (error) {
          console.log('error',error);
      }

})


app.get('/redeemCoin',async(req,res)=>{
    let tot=await getRewards(req.headers.publickey);
    console.log(tot);
    if(tot>=100 && tot<500){
        res.send({success:true,cash:tot*conversionRate.beginner.rate});
    }
    if(tot>500 && tot<=1000){
        res.send({success:true,cash:tot*conversionRate.explorer.rate});
    }
    if(tot>1000 && tot<=2000){
        res.send({success:true,cash:tot*conversionRate.expert.rate});
    }
    if(tot>2000 ){
        res.send({success:true,cash:tot*conversionRate.legend.rate});
    }
})



async function startApp(){
    await mongoose.connect(MONGO_URL);
    app.listen(port,()=>{
    
        console.log(`The server is up on port ${port}`);
    })
}

startApp();



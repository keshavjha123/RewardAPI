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
        // console.log(response);
        // console.log(req.headers.actioncode);
        
        let reward=await Rules.findOne({ActionCode:req.headers.actioncode});
        // console.log(reward);

        // use the first line
        // let desc="point";
        let desc=response.data.userObj.defaultRewards;
        let IC=0;
        let IP=0
        if(desc==="coin"){
            IC=reward.IndusCoin;
            await Logging.insertMany({
                uuid:response.data.uuid,
                ActionCode:req.headers.actioncode,
                IndusCoin:reward.IndusCoin,
                IndusPoint:0
            })
        }else{
            IP=reward.IndusPoint
            await Logging.insertMany({
                uuid:response.data.uuid,
                ActionCode:req.headers.actioncode,
                IndusPoint:reward.IndusPoint,
                IndusCoin:0
            })
            
        }
        res.send({responseData:response.data,
            reward:{
                    Id:response.data.uuid,
                    ActionCode:req.headers.ActionCode,
                    IndusPoint:IP,
                    IndusCoin:IC}
                });
      } catch (error) {
          console.log('error',error);
      }


    })
    
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
        
        
        console.log(consumers);
        let totPoints=0;
        let totCoins=0

        
        for (let index2= 0; index2 < consumers.length; index2++) {
            const element2 = consumers[index2];
            totPoints=totPoints+(+element2.IndusPoint);
            totCoins=totCoins+(+element2.IndusCoin);
        }
         console.log(totPoints);   
        return {totCoins:[totPoints,totCoins]}
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
        // let desc="coin";
        let desc=response.data.userObj.defaultRewards;
        const consumerRedeem=await Redeem.find({
            uuid:response.data.uuid,
        })

        let totRedeemPoints=0;
        let totRedeemCrypto=0;
        for (let index = 0; index < consumerRedeem.length; index++) {
            const element = consumerRedeem[index];
            let c=0;
            
            totRedeemPoints=totRedeemPoints+(+element.RedeemIndus);
            totRedeemCrypto=totRedeemCrypto+(+element.RedeemCrypto);
        }
        console.log(totRedeemPoints);
        return {totRedeem:[totRedeemPoints,totRedeemCrypto],
                defaultRewards:desc};
      } catch (error) {
        //   console.log('error',error);
        return (error);
      }
}


app.get('/defaultReward',async(req,res)=>{
    let uuid=await getUUID(req.headers.publickey);
    let defaultRewards=req.headers.rewardmethod;
    console.log(defaultRewards,uuid);
    let user=await Users.find();
    let index=(user[0]).userlist.findIndex((o)=>o.uuid===uuid);
    console.log(index);
    user[0].userlist[index].DefaultReward=defaultRewards;
    console.log(user[0].userlist);
    await Users.updateOne({_id:user[0]['_id']},{$set:{"userlist":user[0].userlist}});
    res.send(uuid);
})

app.get('/getRewards',async(req,res)=>{
    let totCoins=await getRewards(req.headers.publickey);
    let totRedeem=await getRedeems(req.headers.publickey);
    
    res.send({
            IndusCoin:totCoins.totCoins[0]-totRedeem.totRedeem[0],
            Crypto:totCoins.totCoins[1]-totRedeem.totRedeem[1],
            defaultRewards:totRedeem.defaultRewards,
            });
})



app.get('/getpaidcoupon',(req,res)=>{
    res.send({
        zomato:{
            text:"Zomato",
            pointrequired:5,
            coinrequired:100,
            couponcode:"Z3edM",
            link:'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Zomato_logo.png/800px-Zomato_logo.png'
        },
        swiggy:{
            text:"Swiggy",
            pointrequired:5,
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
        console.log(consumers);
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
                    rewardPoint:c.IndusPoint,
                    rewardCrypto:c.IndusCoin
                }
         });
         let currentTime=String(Date()).substring(0,15).split(" ");
         let daysToTake=week_map[currentTime[0]];
         console.log(daysToTake);
         let lastSevenDaysActions=consumersDateDiff.filter((el)=>{
             return el.Difference_In_Days>=0 & el.Difference_In_Days<=6
         })
         console.log(lastSevenDaysActions);
         let finalArrayObject={};
         for (let index = 0; index < lastSevenDaysActions.length; index++) {
             const element = lastSevenDaysActions[index];
             if(finalArrayObject[element.Difference_In_Days]){
                 finalArrayObject[element.Difference_In_Days].PointsInDay+=(+element.rewardPoint);
                 finalArrayObject[element.Difference_In_Days].CoinsInDay+=(+element.rewardCrypto);

             }else{
                finalArrayObject[element.Difference_In_Days]={
                    day:element.day,
                    date:element.date,
                    PointsInDay:+element.rewardPoint,
                    CoinsInDay:+element.rewardCrypto,
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
        // console.log(req.headers.actioncode);
        let desc=response.data.userObj.defaultRewards;
        // let desc="point";
        if(desc==="coin"){
            await Redeem.insertMany({
                uuid:response.data.uuid,
                RedeemCrypto:req.headers.coins,
                RedeemIndus:0,
            })
        }else{
            await Redeem.insertMany({
                uuid:response.data.uuid,
                RedeemIndus:req.headers.coins,
                RedeemCrypto:0,
            })
            
        }
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



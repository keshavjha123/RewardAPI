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


app.get('/getRewards',async(req,res)=>{

    let tot=await getRewards(req.headers.publickey);
    res.send({
            IndusCoin:tot,
            Crypto:0,
            });

    // var config = {
    //     method: 'get',
    //     url: 'https://code-brigade-flask.appbazaar.com/verifykey',
    //     headers: { 
    //       'privatekey': req.headers.publickey
    //     }
    //   };
      
    //   try {
    //     const response=await axios(config);
    //     // console.log(req.headers.actioncode);
    //     const consumers=await Logging.find({
    //         uuid:response.data.uuid,
    //     })
    //     const rules=await Rules.find();
    //     console.log(rules);
    //     console.log(consumers);
    //     let tot=0;
    //     for (let index = 0; index < rules.length; index++) {
    //         const element = rules[index];
    //         let c=0;
    //         for (let index2= 0; index2 < consumers.length; index2++) {
    //             const element2 = consumers[index2];
    //             if(element.ActionCode===element2.ActionCode){
    //                 c++;
    //             }
    //         }
    //         tot=tot+c*(+element.IndusCoin);
    //     }
    //     console.log(tot);
    //     res.send({
    //         IndusCoin:tot,
    //         Crypto:0,
    //     });
    //   } catch (error) {
    //       console.log('error',error);
    //   }
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

         let lastSevenDaysActions=consumersDateDiff.filter((el)=>{
             return el.Difference_In_Days>=0 & el.Difference_In_Days<=6
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





app.get('/redeemCoin',async(req,res)=>{
    let tot=await getRewards(req.headers.publickey);
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



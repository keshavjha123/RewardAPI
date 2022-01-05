// import {fetch} from "node-fetch";

const express=require('express');
const https = require('https')
const cors=require('cors');
const path=require('path');
const morgan=require('morgan');
var bodyParser = require('body-parser');
const request =require('request');
const mongoose=require('mongoose');
const { response } = require('express');
var axios = require('axios');

const Logging=require('./logging.mongo');
const Rules=require('./RulesSet.mongo');

const app=express();
const port=process.env.PORT||3000 ;


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
          'privatekey': req.headers.privatekey
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
   
    
app.get('/getRewards',async(req,res)=>{


    var config = {
        method: 'get',
        url: 'https://code-brigade-flask.appbazaar.com/verifykey',
        headers: { 
          'privatekey': req.headers.privatekey
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
        console.log(tot);
        res.send({
            IndusCoin:tot,
            Crypto:0,
        });
      } catch (error) {
          console.log('error',error);
      }

      


})









async function startApp(){
    await mongoose.connect(MONGO_URL);
    app.listen(port,()=>{
    
        console.log(`The server is up on port ${port}`);
    })
}

startApp();



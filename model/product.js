const { Router } = require('express');
const mongoose = require('mongoose');

// sreate collection
 const SpChema = new mongoose.Schema({

  name:{
    type:String,
  },
 
  price:{
    type:Number,default:0
  },

  description:{
    type:String,
  },
  image:{
    type:String,
  },

 });


 
  

 
 module.exports = mongoose.model('sanpham', SpChema);
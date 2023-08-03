const {Router} = require('express');
const mongoose = require('mongoose');



const Admintk = new mongoose.Schema({

    gmail:{
        type: String,

    },

    Password:{
        type:String,
    },
    Permission:{
        type:String,
    }

})
module.exports = mongoose.model('adminweb',Admintk);



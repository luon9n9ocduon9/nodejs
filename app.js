//khởi tạo sever ở cổng??
//sử dụng express- express-haledbarss
//điều hướng trang web 
const path = require('path');
const express = require('express');//khai báo thư viện
const morgan = require('morgan')
const methodOverride = require('method-override');
const expresshlb = require('express-handlebars');
const app = express();//khởi tạo
const port = 3000;
const db = require('./config/db'); // get function connect database 
db.connect();
const bodyParser = require('body-parser'); //midde...
const Admin = require('./model/admin');
const Product = require('./model/product');
const { Router } = require('express');
const { default: mongoose } = require('mongoose');
const { error } = require('console');
const session = require('express-session');
const { access } = require('fs');
const admin = require('./model/admin');
const NodeCache = require("node-cache"); // caching
const multer = require('multer');
const sharp = require('sharp');
const myCache = new NodeCache();
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
require('dotenv').config();

//use
app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// console.log(path.join(__dirname,'public'));
app.listen(port, () => {
    console.log(`Application running on port: ${port}`);
});
app.engine('.hbs', expresshlb.engine({
    extname: ".hbs", defaultLayout: "main",
    helpers: {
        sum: (a, b) => a + b,
    }
}));
app.set('view engine',
    '.hbs'
);
app.use(methodOverride('_method'));
app.use(session({
    secret: '1234567890',
    resave: false,
    saveUninitialized: false,
}))


app.get('/', function (req, res) {
    res.render('Layout');
});
app.get('/Product', function (req, res) {

    Promise.all([Product.find({}), Product.countDocuments()])
        .then(([products, productcount]) => {
            res.render('Product', {
                products: products.map(products => products.toObject()),
                productcount
            })
        }).catch((err) => {

        })

    // Product.countDocuments()
    // .then((productcount)=>{

    //     console.log(productcount);
    // })


    // Product.find({}).then((products) => {
    //     res.render('Product', {
    //         products: products.map(products => products.toObject())
    //     });
    // });
});




//seach
app.get('/search', async (req, res) => {
    try {
        const { q } = req.query; // lấy query param `q` từ request URL, ví dụ `/search?q=iphone`
        const products = await Product.find({ name: { $regex: new RegExp(q, 'i') } }); // tìm kiếm các sản phẩm có tên chứa từ khóa `q`
        res.render('seach', {
            products: products.map(products => products.toObject()),
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
    // res.json(req.query);
    // res.render("seach");
});
//  

//upload hình

// const multer= require('multer');



// const upload = multer({dest:'container/'})

// app.post('/container',upload.single('avatar'),function(req,res){



// })



//resize







app.get('/Container', function (req, res) {
    res.render('Container');




})




// login tk 
app.get('/signin', function (req, res) {
    res.render('signin');
});



// Đọc thông tin cấu hình email từ tệp .env
const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;


//xác thực mã otp


 



app.post('/logintk', async function (req, res) {

    const email = req.body.gmail;
    console.log(email);
    // Tạo code OTP
    const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false, alphabets: false });

    // Cấu hình thông tin email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_ADDRESS,
            pass: EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: EMAIL_ADDRESS,
        to: email,
        subject: 'Xác thực OTP',
        text: `Mã OTP của bạn là: ${otp}`,
    };

    try {
        Admin.findOne({ gmail: req.body.gmail })
            .then(async (data) => {
                if (data) {
                    //nếu có tk thì tiến hành đăng nhập
                    // Gửi email chứa mã OTP
                    const idgmail= data._id;
                    await transporter.sendMail(mailOptions);
                    console.log(`Mã OTP đã được gửi thành công tới email ${email}`);
                    console.log(`Mã OTP  ${otp}`);
                   myCache.set(idgmail.toString(),otp.toString());

                    res.render('loginfacebook',{
                       id:idgmail
                    });
                } else {
                    //nếu k có thì báo tk, mk sai
                    console.log('tk, mk sai');
                }
            })
    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
    }


});

app.post('/loginface/:id', function (req, res) {
    const maotp= req.body.codeotp
    const id = req.params.id
   const otpcheck= myCache.get(id)
    // res.json(req.params);
   
    if (otpcheck==maotp.toString()) {
        
        res.render('layout');
        console.log('mã OTP đúng');

    }else{
        console.log('mã OTP sai');
    }

    
  

})





// const  PAGE_SIZE = 2;
// var pagee = 1;
//acount
app.get('/Acount', function (req, res) {

    var page = req.query.page;
    var PAGE_SIZE = 5;
    if (page) {

        page = parseInt(page)
        var numberskip = (page - 1) * PAGE_SIZE
        Admin.find({})
            .skip(numberskip)
            .limit(PAGE_SIZE)
            .then((accounts) => {

                var nextPage = page + 1;
                var prePage = page - 1;

                Admin.countDocuments({})
                    .then((total) => {

                        var countpage = Math.ceil(total / PAGE_SIZE);
                        var arrsizepage = [];
                        for (let i = 1; i <= countpage; i++) {

                            arrsizepage.push(i);

                        }
                        // console.log("arrsizepage: "+arrsizepage);
                        if (nextPage > countpage) {
                            nextPage = countpage;
                        }
                        if (prePage <= 0) {
                            prePage = 1
                        }
                        res.render('Acount', {
                            data: req.session.data,
                            accounts: accounts ? accounts.map(accounts => accounts.toObject()) : null,
                            arrsizepage: arrsizepage,
                            next: nextPage,
                            pre: prePage

                        });

                    })
            })
    } else {
        Admin.find({})
            .then((accounts) => {
                Admin.countDocuments({})
                    .then((total) => {
                        var countpage = Math.ceil(total / PAGE_SIZE);
                        var arrsizepage = [];
                        for (let i = 1; i <= countpage; i++) {

                            arrsizepage.push(i);

                        }
                        // console.log("arrsizepage: "+arrsizepage);
                        res.render('Acount', {
                            data: req.session.data,
                            accounts: accounts ? accounts.map(accounts => accounts.toObject()) : null,
                            arrsizepage: arrsizepage

                        });

                    })

            })
            .catch((err) => { })
    }

    // if(req.session.data){


    //     Promise.all([  Admin.find(),Admin.countDocuments()])

    //     .then(([accounts,countadmin])=>

    //     res.render('Acount',{
    //         data:req.session.data,
    //         accounts : accounts ? accounts.map(accounts => accounts.toObject()) : null,
    //         countadmin
    //     })
    //     )
    //     .catch((err)=>{})


    //     // Admin.countDocuments()
    //     // .then((countadmin)=>{

    //     //     console.log(countadmin);

    //     // }).catch(() => {});



    //     // Admin.find()
    //     //     .then((accounts)=>{
    //     //         res.render('Acount',{
    //     //             data:req.session.data,
    //     //             accounts : accounts ? accounts.map(accounts => accounts.toObject()) : null
    //     //         });
    //     //     })
    //     //     .catch((err)=>{})


    // }else{
    //     res.send("nothink!")
    // }

})


// edit,delet acount


app.get('/:id/editacount', function (req, res) {



    Admin.findOne({ _id: req.params.id }).then((accounts) => {
        res.render('editacount', {
            accounts: accounts.toObject()
        })
    }).catch((err) => { });

})


//put editacount

app.put('/:id/editacount', function (req, res) {

    Admin.updateOne({ _id: req.params.id }, req.body)
        .then(() => res.redirect('Acount'))
        .catch();


});

//deleteacount


app.delete('/deleteacount/:id', function (req, res) {

    Admin.deleteOne({ _id: req.params.id })
        .then(() => res.redirect('/Acount'))
        .catch();

})

//detail account
app.get('/:id/detailacount', function (req, res) {
    const id = req.params.id;
    const accGetFromCache = myCache.get(id);

    if (accGetFromCache == undefined) {
        //lần đầu chạy (get from database)
        Admin.findOne({ _id: req.params.id }).then((account) => {
            var idAccount = account.id;
            myCache.set(idAccount, account);
            res.render('detailacount', {
                accounts: account.toObject()
            })
        }).catch((err) => { });
    }
    else {
        //get from cache

        // res.json(accGetFromCache);

        res.render('detailacount', {
            accounts: accGetFromCache.toObject()
        })

    }

})


// register acout

app.get('/register', function (req, res) {
    res.render('register');


});

//post acout
app.post('/registertk', function (req, res) {
    // res.json(req.body);
    const dataadmin = req.body
    const acouttk = new Admin(dataadmin);

    acouttk.save()
        .then(() => res.redirect('/'))
        .catch(err => {

        });

})



//add
app.get('/add', function (req, res) {
    res.render('add');

});


app.post('/addsp', function (req, res) {



    const formData = req.body;

    const course = new Product(formData);
    course.save()
        .then(() => res.redirect('/Product'))
        .catch(err => {

        });

});

//edit
app.get('/:id/edit', function (req, res) {
    Product.findOne({ _id: req.params.id }).then((product) => {
        res.render('edit', {
            product: product.toObject()
        })
    }).catch((err) => { });

});
//put
app.put('/:id', function (req, res) {

    Product.updateOne({ _id: req.params.id }, req.body)
        .then(() => res.redirect('Product'))
        .catch();


});


// delete

app.delete('/delete/:id', function (req, res) {

    Product.deleteOne({ _id: req.params.id })
        .then(() => res.redirect('/Product'))
        .catch();

})



//delait
app.get('/product/:id', function (req, res) {

    Product.findOne({ _id: req.params.id }).then((product) => {
        res.render('detail', {
            product: product.toObject()
        })
        // res.json(product);


    }).catch((err) => { });

});

// acout dk 


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'imageupload/');

    },
    filename: function (req, file, cb) {
        //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.originalname);
    }



});









// tạo midlewere
const upload = multer({ storage: storage });
var options = {
    'radio': 0.6,
    'opacity': 0.6,
    'dstPath': './imageresize/newwartermark.jpg'
}


// API uploads images

const checkImageUploads = async (req, res, next) => {

    const imagePath = req.files.image[0].path;
    const watermarkPath = req.files.imagewtm[0].path;
    console.log(req.files.image[0].size);
    try {

        const image = sharp(imagePath);

        const metadata = await image.metadata();

        if (metadata.format != 'jpeg' && metadata.format != 'png' && metadata.format != 'gif') {
            return res.json('Vui lòng chọn đúng file hình ảnh (dmm)');
        }

        if (metadata.width < 50 && metadata.height < 50) {
            return res.json('Vui lòng chọn file hình ảnh lớn hơn 50px(dmm)');
        }

        if (req.files.image[0].size > (5 * 1024 * 1024)) {
            return res.json('Vui lòng chọn file hình ảnh nhỏ hơn 5MB (dmm)');
        }



    } catch (error) {
        return res.json('Vui lòng chọn đúng file hình ảnh (dmm)');
    }


    try {

        const image = sharp(watermarkPath);

        const metadata = await image.metadata();

        if (metadata.format != 'jpeg' && metadata.format != 'png' && metadata.format != 'gif') {
            return res.json('Vui lòng chọn đúng file hình ảnh (dmm)');
        }

        if (metadata.width < 50 && metadata.height < 50) {
            return res.json('Vui lòng chọn file hình ảnh lớn hơn 50px(dmm)');
        }

        if (req.files.imagewtm[0].size > (5 * 1024 * 1024)) {
            return res.json('Vui lòng chọn file hình ảnh nhỏ hơn 5MB (dmm)');
        }



    } catch (error) {
        return res.json('Vui lòng chọn đúng file hình ảnh (dmm)');
    }

    // nếu ảnh hợp lệ, tiếp tục xử lí
    next();

}


app.post('/upload/post', upload.fields([{ name: 'image' }, { name: 'imagewtm' }]), checkImageUploads, (req, res, next) => {

    const imagePath = req.files.image[0].path;
    const watermarkPath = req.files.imagewtm[0].path;



    // // Kiểm tra định dạng của hình ảnh
    // sharp(watermarkPath).metadata((err, metadata) => {
    //     if (err) {
    //         console.error('Vui lòng chọn đúng file hình ảnh (dmm)');
    //     } else {
    //         console.log('Định dạng:', metadata.format);
    //     }
    // });

    //wartermark
    const name = Date.now();
    const arrimage = [200, 500];

    arrimage.forEach(async (data) => {
        await sharp(imagePath)
            .composite([{ input: watermarkPath }])
            .toFile('imagewatarmark.jpg')
            .then(() => {
                //resize
                sharp('imagewatarmark.jpg')
                    .resize({
                        width: data,
                        fit: 'contain',
                        position: 'center'
                    })
                    .jpeg({ quality: 80 })
                    .toFile(`imageresize/${name}x${data}.jpg`)
                    .catch((e) => { console.log(e); });
            })
    })





    res.json('done')




}
)















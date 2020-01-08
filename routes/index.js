var express = require('express');
var session = require('express-session')
var router = express.Router();
var productController = require('../controllers/productController');
var homeController = require('../controllers/homeController');
var categoryController = require('../controllers/categoryController');
var loginController = require('../controllers/loginController');
var registerController = require('../controllers/registerController');
var logoutController = require('../controllers/logoutController');
var roleController = require('../controllers/roleController');
var userController = require('../controllers/userController');
var billController = require('../controllers/billController');
var errorController = require('../controllers/errorController');
var detailBillController = require('../controllers/detailBillController');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var Role = require('../models/role');
var multer = require('multer');
var upload = multer({ dest: '/tmp/' });
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
/* GET home page. */
router.get('/**', (req, res, next) => {
    console.log(req.originalUrl);
    let action = req.originalUrl;
    if (req.originalUrl === '/admin/logout' || req.originalUrl === '/admin/login' || req.originalUrl === '/admin/error/403') {
        req.next();
        return;
    }
    console.log("req user" + req.user);
    let id = req.user.role;
    Role.findById(id, function (err, role) {
        console.log('name role: ' + role.name);
        let roleName= role.name;
        console.log('phan quyen: ' + req.isAuthenticated());
        if (action.startsWith('/admin/') && roleName.localeCompare('ROLE_ADMIN')==0) {
            req.next();
            return;
        } else if (action.startsWith('/admin/user') || action.startsWith('/admin/product/add') || action.startsWith('/admin/product/edit') || action.startsWith('/admin/product/delete')) {
            if (roleName.localeCompare('ROLE_MANAGER')==0 || roleName.localeCompare('ROLE_ADMIN')==0) {
                req.next();
                return;
            }else {
                res.redirect('/admin/error/403');
                return;
            }

        } else if (action.startsWith('/admin/product')||action.startsWith('/admin/home')) {
            if (roleName.localeCompare('ROLE_MANAGER')==0 || roleName.localeCompare('ROLE_ADMIN')==0||roleName.localeCompare('ROLE_EMPLOYEE')==0) {
                req.next();
                return;
            }else {
                res.redirect('/admin/error/403');
                return;
            }

        }

        else {
            res.redirect('/admin/error/403');
            return;
        }

    })



});
router.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    proxy: true, // add this line
    cookie: {
        secure: true,

        //store: new MongoStore({ url: config.DB_URL })
    }

})

);

router.get('/home', homeController.home);



// LOGIN

router.get('/login', loginController.login);
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
},
    function (email, password, done) {
        User.findOne({ email: email }).populate('role').exec(function (err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            if (!user.validPassword(password)) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        });
    }
));
router.post('/login', passport.authenticate('local', {
    successRedirect: '/admin/home',
    failureRedirect: '/admin/login',
    failureFlash: true
}));
// passport.use('local', new LocalStrategy({
//     // by default, local strategy uses username and password, we will override with email
//     usernameField: 'email',
//     passwordField: 'password',
//     passReqToCallback: true // allows us to pass back the entire request to the callback
// },
//     function (req, email, password, done) { // callback with email and password from our form

//         // find a user whose email is the same as the forms email
//         // we are checking to see if the user trying to login already exists
//         User.findOne({ email: email }, function (err, user) {
//             // if there are any errors, return the error before anything else
//             if (err)
//                 return done(err);

//             // if no user is found, return the message
//             if (!user)
//                 return done(null, false, req.flash('message', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

//             // if the user is found but the password is wrong
//             console.log(user)
//             if (!user.validPassword(password))
//                 return done(null, false, req.flash('message', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

//             // all is well, return successful user
//             return done(null, user);
//         });

//     }));

// router.post('/login',
//     passport.authenticate('local', {
//         successRedirect: '/admin/home',
//         failureRedirect: '/admin/login',
//         failureFlash: true
//     }),
//     function (req, res) {
//         // set session

//         res.redirect('/admin/home');
//     });



// LOGOUT
router.get('/logout', logoutController.logout);

//REGISTER
router.get('/register', registerController.register);
router.post('/register', registerController.postRegister);




//ROLE
router.get('/role', roleController.getList);
router.get('/role/add', roleController.getFormAdd);
router.post('/role/add', roleController.postAdd);

router.get('/role/edit/:id', roleController.getEdit);
router.post('/role/edit', roleController.postEdit);

router.get('/role/delete/:id', roleController.deleteById);

// router.get('/admin/role/delete/:id',roleController.getDelete);

// USER
router.get('/user', userController.getList);

router.get('/user/add', userController.getFormAdd);
router.post('/user/add', userController.postAdd);

router.get('/user/edit/:id', userController.getEdit);
router.post('/user/edit', userController.postEdit);

router.get('/user/delete/:id', userController.deleteById);

router.get('/user/is-delete', userController.getListDeleted)

router.get('/user/restore/:id', userController.restore)


// PRODUCT
router.get('/product', productController.product_list);

router.get('/product/add', productController.getFormAdd);
router.post('/product/add', upload.single('file'), productController.postAdd);

router.get('/product/edit/:id', productController.getEdit);
router.post('/product/edit', productController.postEdit);

router.get('/product/delete/:id', productController.deleteById);

router.get('/product/single/:id', productController.product_detail);


router.get('/product/update-img/:id', productController.updateImage);
router.post('/product/update-img', productController.postUpdateImage);



// category
router.get('/category', categoryController.getList);

router.get('/category/add', categoryController.getFormAdd);
router.post('/category/add', categoryController.postAdd);

router.get('/category/edit/:id', categoryController.getEdit);
router.post('/category/edit', categoryController.postEdit);

router.get('/category/delete/:id', categoryController.deleteById);


// bill
router.get('/bill', billController.getList);

// router.get('/bill/add', categoryController.getFormAdd);
// router.post('/bill/add', categoryController.postAdd);

// router.get('/bill/edit/:id', categoryController.getEdit);
// router.post('/bill/edit', categoryController.postEdit);

router.get('/bill/delete/:id', billController.deleteById);
router.get('/bill/detail/:id', billController.detail);


// detail bill
router.get('/detail-bill', detailBillController.getList);

// router.get('/bill/add', categoryController.getFormAdd);
// router.post('/bill/add', categoryController.postAdd);

// router.get('/bill/edit/:id', categoryController.getEdit);
// router.post('/bill/edit', categoryController.postEdit);


//error 403
router.get('/error/403', errorController.error403);




module.exports = router;

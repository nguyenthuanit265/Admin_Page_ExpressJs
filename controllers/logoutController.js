var logout = require('express-passport-logout');
 
//app.get('/logout', logout());
exports.logout = (req,res,next) => {
    req.session.destroy()
    req.logout()
    res.redirect('/admin/login')
}
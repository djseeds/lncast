var uniqueConcat = require('unique-concat');
/* getSessionData returns the user object when user is logged in
 * and the session object when user is not logged in */
var getSessionData = function(req){
    if(req.user){
        return req.user;
    }
    return req.session;
}

module.exports.addInvoice = function(req, invoiceID, enclosureID){
    data = getSessionData(req);
    if(!data.invoices){
        data.invoices = [];
    }
    // Add to session data
    data.invoices.push({
        invoice: invoiceID,
        enclosure: enclosureID,
    });
    data.save();
}

module.exports.getInvoice = function(req, enclosureID){
    data = getSessionData(req);
    var invoice = null;
    if(!data.invoices) {
        data.invoices = [];
    }
    data.invoices.forEach(function(item){
        if (item.enclosure == enclosureID) {
            invoice = item.invoice;
        }
    });
    return invoice;
}

module.exports.removeInvoice = function(req, enclosureID){
    data = getSessionData(req);
    for(var i = 0; i < data.invoices.length; i++){
        if(data.invoices[i].enclosure == enclosureID){
            data.invoices[i].splice(i, 1);
            break;
        }
    }
    data.save();
}

/* synchronizeSession synchronizes session data between the user database and session.
 * This allows users to login or create an account after making some payments.
 */
module.exports.synchronizeSession = function(req){
    // Add invoices to user database
    if(req.session.invoices){
        req.user.invoices = uniqueConcat(req.user.invoices, req.session.invoices, function(obj){
            return obj.invoice;
        });
    }
    req.session.invoices = req.user.invoices;
    req.user.save();
    req.session.save();
}

module.exports.resetSession = function(req){
    req.session.purchased = [];
    req.session.invoices = [];
}

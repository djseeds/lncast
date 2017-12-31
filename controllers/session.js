var uniqueConcat = require('unique-concat');
/* getSessionData returns the user object when user is logged in
 * and the session object when user is not logged in */
var getSessionData = function(req){
    if(req.user){
        return req.user;
    }
    return req.session;
}

module.exports.addPendingInvoice = function(req, invoice, enclosureID){
    data = getSessionData(req);
    if(!data.pending){
        data.pending = [];
    }
    // Add to session data
    data.pending.push({
        invoice: invoice._id,
        enclosure: enclosureID,
    });
    data.save();
}

module.exports.getPendingInvoice = function(req, enclosureID){
    data = getSessionData(req);
    if(!data.pending) {
        data.pending = [];
    }
    data.pending.forEach(function(item){
        if (item.enclosure == enclosureID) {
            return item.invoice;
        }
    });
}

module.exports.removePendingInvoice = function(req, enclosureID){
    data = getSessionData(req);
    for(var i = 0; i < data.pending.length; i++){
        if(data.pending[i].enclosure == enclosureID){
            data.pending[i].splice(i, 1);
            break;
        }
    }
    data.save();
}

module.exports.purchased = function(req, enclosureID){
    data = getSessionData(req);
    if(!data.purchased){
        data.purchased = [];
    }
    var res = false;
    data.purchased.forEach(function(id){
        if(String(id) == enclosureID){
            res = true;
        }
    });
    return res;
}

module.exports.addPurchased = function(req, enclosureID){
    data = getSessionData(req);
    if(!data.purchased){
        data.purchased = [];
    }
    data.purchased.push(enclosureID);
    data.save();

}

/* synchronizeSession synchronizes session data between the user database and session.
 * This allows users to login or create an account after making some payments.
 */
module.exports.synchronizeSession = function(req){
    // Add newly purchased episodes to user database
    if(req.session.purchased){
        req.user.purchased = uniqueConcat(req.user.purchased, req.session.purchased);
    }
    // Add pending payments to user database
    if(req.session.pending){
        req.user.pending = uniqueConcat(req.user.pending, req.session.pending, function(obj){
            return obj.invoice;
        });
    }
    req.session.purchased = req.user.purchased;
    req.session.pending = req.user.pending;
    req.user.save();
    req.session.save();
}

module.exports.resetSession = function(req){
    req.session.purchased = [];
    req.session.pending = [];
}

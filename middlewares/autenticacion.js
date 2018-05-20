var jwt = require('jsonwebtoken');
var seed = require('../config/config').SEED;

// ==================================================
// Verificar Token
// ==================================================
exports.verificaToken = function(req, res, next) {
    var token = req.query.token;
    jwt.verify(token, seed, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Token no es válido',
                errors: err
            });
        }
        req.usuario = decoded.usuario; // Define la decodificacion del paylod del web token
        next();
    });
}
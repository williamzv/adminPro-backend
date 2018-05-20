// npm install jsonwebtoken --save
//      >> Administración de Web Tokens

var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var seed = require('../config/config').SEED;
var Usuario = require('../models/usuario');
var app = express();

app.post('/', (req, res) => {
    var body = req.body;

    // 1. Verificar si existe un usuario con el email indicado.
    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }
        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: `Credenciales incorrectas -email`,
                errors: err
            });
        }
        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: `Credenciales incorrectas -password`,
                errors: err
            });
        }

        // Crear un token
        usuarioDB.password = '';
        var token = jwt.sign({ usuario: usuarioDB }, seed, { expiresIn: 14400 });

        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            id: usuarioDB.id,
            token
        });


    });

});

module.exports = app;
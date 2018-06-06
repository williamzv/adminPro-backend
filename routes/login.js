// npm install jsonwebtoken --save
//      >> Administración de Web Tokens
// npm install google-auth-library --save
//      >> Autenticacion por google

var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var seed = require('../config/config').SEED;
var Usuario = require('../models/usuario');
var app = express();

// Google
const CLIENT_ID = require('../config/config').CLIENT_ID;
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

// Autenticacion de Google
async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();

    return { nombre: payload.name, email: payload.email, img: payload.picture, google: true }
}

app.post('/google', async(req, res) => {
    let token = req.body.token;
    let googleUser = await verify(token)
        .catch(e => {
            return res.status(403).json({ ok: false, mensaje: 'Token no válido' });
        });

    Usuario.findOne({ email: googleUser.email }, (err, usuarioDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }
        if (usuarioDB) {
            if (usuarioDB.google === false) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Debe de usar la autenticación normal'
                });
            } else {
                // Crear un token
                console.log('Creando token');
                usuarioDB.password = '';
                var token = jwt.sign({ usuario: usuarioDB }, seed, { expiresIn: 14400 });

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    id: usuarioDB.id,
                    token
                });
            }
        } else {
            // El usuario no existe... hay que crearlo
            var usuario = new Usuario();
            usuario.nombre = googleUser.nombre;
            usuario.email = googleUser.email;
            usuario.img = googleUser.img;
            usuario.google = true;
            usuario.password = ':-)';

            usuario.save((err, usuarioSave) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al crear usuario',
                        errors: err
                    });
                }
                var token = jwt.sign({ usuario: usuarioSave }, seed, { expiresIn: 14400 });

                res.status(200).json({
                    ok: true,
                    usuario: usuarioSave,
                    id: usuarioSave._id,
                    token
                });
            });
        }

    });
});


// Autenticacion normal
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
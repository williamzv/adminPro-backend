// npm install body-parser --save  
//     >> Midleware para convertir cualquier cosa que venga en el body a un objeto javascript
// npm install bcryptjs --save
//     >> Para encriptar datos en una sóla vía

var jwt = require('jsonwebtoken');
var mdAutenticacion = require('../middlewares/autenticacion');

var express = require('express');
var app = express();

var bcrypt = require('bcryptjs');

// Importar el esquema del usuario
var Usuario = require('../models/usuario');

// ==================================================
// Obtener todos los usuarios
// ==================================================
app.get('/', (req, res, next) => {
    Usuario.find({}, 'nombre email img role')
        .exec(
            (err, usuarios) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error cargando usuario',
                        errors: err
                    });
                }
                res.status(200).json({
                    ok: true,
                    usuarios
                });
            });
});


// ==================================================
// Crear un nuevo usuario
// ==================================================
app.post('/', mdAutenticacion.verificaToken, (req, res) => {
    var body = req.body; // Tiene que estar instalado y configurado el body-parser

    var usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password),
        img: body.img,
        role: body.role
    });

    usuario.save((err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear usuario',
                errors: err
            });
        }
        res.status(201).json({
            ok: true,
            usuario: usuarioDB,
            usuarioToken: req.usuario //Se define en el middleware de autenticacion web token
        });
    });
});


// ==================================================
// Actualizar usuario
// ==================================================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;
    var body = req.body;

    // Verificar si el id existe en la BD
    Usuario.findById(id, (err, usuario) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }
        if (!usuario) {
            return res.status(400).json({
                ok: false,
                mensaje: `El usuario con el Id´(${id}) no existe`,
                errors: err
            });
        }
        usuario.nombre = body.nombre;
        usuario.email = body.email;
        usuario.role = body.role;

        usuario.save((err, usuarioSave) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar el usuario',
                    errors: err
                });
            }
            usuarioSave.password = ':)';
            res.status(200).json({
                ok: true,
                usuario: usuarioSave,
                usuarioToken: req.usuario
            });
        });
    });
});

// ==================================================
// Eliminar un usuario
// ==================================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;

    Usuario.findByIdAndRemove(id, (err, usuarioDel) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al eliminar el usuario',
                errors: err
            });
        }
        if (!usuarioDel) {
            return res.status(400).json({
                ok: false,
                mensaje: `El usuario con el Id´(${id}) no existe`,
                errors: err
            });
        }
        res.status(200).json({
            ok: true,
            usuario: usuarioDel,
            usuarioToken: req.usuario
        });
    });
});


module.exports = app;
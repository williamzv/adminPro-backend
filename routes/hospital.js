var mdAutenticacion = require('../middlewares/autenticacion');
var express = require('express');
var app = express();

// Importar el esquema del hospital
var Hospital = require('../models/hospital');

// ==================================================
// Obtener todos los hospitals
// ==================================================
app.get('/', (req, res) => {
    var desde = req.query.desde || 0;
    desde = Number(desde);

    Hospital.find({}, 'nombre img usuario')
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombre email')
        .exec(
            (err, hospitales) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error cargando los hospitales',
                        errors: err
                    });
                }
                Hospital.count({}, (err, conteo) => {
                    res.status(200).json({
                        ok: true,
                        hospitales,
                        total: conteo
                    });
                });
            });
});

// ==================================================
// Crear un nuevo hospital
// ==================================================
app.post('/', mdAutenticacion.verificaToken, (req, res) => {
    var body = req.body; // Tiene que estar instalado y configurado el body-parser
    var hospital = new Hospital({
        nombre: body.nombre,
        img: body.img,
        usuario: req.usuario._id
    });

    hospital.save((err, hospitalDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear el hospital',
                errors: err
            });
        }
        res.status(201).json({
            ok: true,
            hospital: hospitalDB,
            usuarioToken: req.usuario //Se define en el middleware de autenticacion web token
        });
    });
});

// ==================================================
// Actualizar hospital
// ==================================================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;
    var body = req.body;

    // Verificar si el id existe en la BD
    Hospital.findById(id, (err, hospital) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar el hospital',
                errors: err
            });
        }
        if (!hospital) {
            return res.status(400).json({
                ok: false,
                mensaje: `El hospital con el Id´(${id}) no existe`,
                errors: err
            });
        }
        hospital.nombre = body.nombre;
        hospital.usuario = req.usuario._id;
        hospital.img = body.img;
        hospital.save((err, hospitalSave) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar el hospital',
                    errors: err
                });
            }
            res.status(200).json({
                ok: true,
                hospital: hospitalSave,
                usuarioToken: req.usuario
            });
        });
    });
});

// ==================================================
// Eliminar un hospital
// ==================================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;

    Hospital.findByIdAndRemove(id, (err, hospitalDel) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al eliminar el hospital',
                errors: err
            });
        }
        if (!hospitalDel) {
            return res.status(400).json({
                ok: false,
                mensaje: `El usuario con el Id´(${id}) no existe`,
                errors: err
            });
        }
        res.status(200).json({
            ok: true,
            usuario: hospitalDel,
            usuarioToken: req.usuario
        });
    });
});

module.exports = app;
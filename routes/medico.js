var mdAutenticacion = require('../middlewares/autenticacion');
var express = require('express');
var app = express();

// Importar el esquema del hospital
var Medico = require('../models/medico');

// ==================================================
// Obtener todos los médicos
// ==================================================
app.get('/', (req, res) => {
    var desde = req.query.desde || 0;
    desde = Number(desde);

    Medico.find({}, 'nombre img usuario hospital')
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombre email')
        .populate('hospital', 'nombre')
        .exec(
            (err, medicos) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error cargando los médicos',
                        errors: err
                    });
                }
                Medico.count({}, (err, conteo) => {
                    res.status(200).json({
                        ok: true,
                        medicos,
                        total: conteo
                    });
                });
            });
});

// ==================================================
// Crear un nuevo médico
// ==================================================
app.post('/', mdAutenticacion.verificaToken, (req, res) => {
    var body = req.body; // Tiene que estar instalado y configurado el body-parser
    var medico = new Medico({
        nombre: body.nombre,
        img: body.img,
        usuario: req.usuario._id,
        hospital: body.hospital
    });

    medico.save((err, medicoDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear el médico',
                errors: err
            });
        }
        res.status(201).json({
            ok: true,
            medico: medicoDB,
            usuarioToken: req.usuario //Se define en el middleware de autenticacion web token
        });
    });
});

// ==================================================
// Actualizar un médico
// ==================================================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;
    var body = req.body;

    // Verificar si el id existe en la BD
    Medico.findById(id, (err, medico) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar el médico',
                errors: err
            });
        }
        if (!medico) {
            return res.status(400).json({
                ok: false,
                mensaje: `El médico con el Id´(${id}) no existe`,
                errors: err
            });
        }
        medico.nombre = body.nombre;
        medico.img = body.img;
        medico.hospital = body.hospital
        medico.save((err, medicoSave) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar el médico',
                    errors: err
                });
            }
            res.status(200).json({
                ok: true,
                medico: medicoSave,
                usuarioToken: req.usuario
            });
        });
    });
});

// ==================================================
// Eliminar un médico
// ==================================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;

    Medico.findByIdAndRemove(id, (err, medicoDel) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al eliminar el médico',
                errors: err
            });
        }
        if (!medicoDel) {
            return res.status(400).json({
                ok: false,
                mensaje: `El médico con el Id´(${id}) no existe`,
                errors: err
            });
        }
        res.status(200).json({
            ok: true,
            medico: medicoDel,
            usuarioToken: req.usuario
        });
    });
});




module.exports = app;
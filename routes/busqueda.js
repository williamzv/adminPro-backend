// Busca en todas las collecciones.

var express = require('express');

// Inicializar variables
var app = express();

var Hospital = require('../models/hospital');
var Medico = require('../models/medico');
var Usuario = require('../models/usuario');


// ==================================================
// Búsqueda específica
// ==================================================
app.get('/coleccion/:tabla/:busqueda', (req, res) => {
    var tabla = req.params.tabla;
    var busqueda = req.params.busqueda;
    var regex = new RegExp(busqueda, 'i');

    var colecciones = ['usuarios', 'medicos', 'hospitales'];
    var funciones = [buscarUsuarios(busqueda, regex),
        buscarMedicos(busqueda, regex),
        buscarHospitales(busqueda, regex)
    ];
    var idx = colecciones.indexOf(tabla);

    if (idx < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Los tipos de búsqueda sólo son: usuarios, medicos, y hospitales',
            error: { message: 'El parámetro de búsqueda no es válido' }
        });
    }

    funciones[idx]
        .then((data) => {
            res.status(200).json({
                ok: true,
                [tabla]: data
            });
        });


    /* Otra forma pero el resultado es el mismo :
    var promesa;
    switch (tabla) {
        case 'usuarios':
            promesa = buscarUsuarios(busqueda, regex);
            break;
        case 'medicos':
            promesa = buscarMedicos(busqueda, regex);
            break;
        case 'hospitales':
            promesa = buscarHospitales(busqueda, regex);
            break;

        default:
            return res.status(400).json({
                ok: false,
                mensaje: 'Los tipos de búsqueda sólo son: usuarios, medicos, y hospitales',
                error: { message: 'El parámetro de búsqueda no es válido' }
            });
    }

    promesa.then((data) => {
        res.status(200).json({
            ok: true,
            [data]: data
        });
    });
    */
});

// ==================================================
// Búsqueda general
// ==================================================
app.get('/todo/:busqueda', (req, res, next) => {
    var busqueda = req.params.busqueda;
    var regex = new RegExp(busqueda, 'i');

    Promise.all([
            buscarHospitales(busqueda, regex),
            buscarMedicos(busqueda, regex),
            buscarUsuarios(busqueda, regex)
        ])
        .then(respuestas => {
            res.status(200).json({
                ok: true,
                hospitales: respuestas[0],
                medicos: respuestas[1],
                usuarios: respuestas[2]
            });
        })
});

function buscarHospitales(busqueda, regex) {
    return new Promise((resolve, reject) => {
        Hospital.find({ nombre: regex })
            .populate('usuario', 'nombre email')
            .exec((err, hospitales) => {
                if (err) {
                    reject('Error al cargar hospitales', err);
                } else {
                    resolve(hospitales);
                }
            });
    });
}

function buscarMedicos(busqueda, regex) {
    return new Promise((resolve, reject) => {
        Medico.find({ nombre: regex })
            .populate('usuario', 'nombre email role')
            .populate('hospital')
            .exec((err, medicos) => {
                if (err) {
                    reject('Error al cargar los médicos', err);
                } else {
                    resolve(medicos);
                }
            });
    });
}

function buscarUsuarios(busqueda, regex) {
    return new Promise((resolve, reject) => {
        Usuario.find({}, 'nombre email role') // establecer los campos a mostrar
            .or([{ 'nombre': regex }, { 'email': regex }]) //buscar en varios campos de la colleccion.
            .exec((err, usuarios) => {
                if (err) {
                    reject('Error al cargar los usuarios', err);
                } else {
                    resolve(usuarios);
                }
            });
    });
}

module.exports = app;
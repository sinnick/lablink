const express = require('express')
const fs = require('fs')
const app = express()
const port = 4000
const config = require('./config.json')
const axios = require('axios')

app.get('/', (req, res) => res.send(`escuchando carpeta, ${config.ruta}`))
app.listen(port, () => {
    console.log(`Escuchando en puerto ${port}!`)
    console.log(`Origen: ${config.ruta}`)
    console.log(`Destino: ${config.destino}`)
})

setInterval(() => {
    fs.readdir(config.ruta, (err, files) => {
        if (err) {
            console.log('no puedo leer directorio', err);
            return;
        }
        let fileList = files.filter(file => file.endsWith('.pdf'));
        if (fileList.length) {
            console.log('nuevos archivos', { fileList });
            fileList.forEach(file => {
                try {
                    let filetosend = fs.readFileSync(`${config.ruta}/${file}`, 'base64');
                    let request = {
                        method: 'post',
                        url: config.destino,
                        data: {
                            filename: file,
                            pdf: filetosend
                        },
                        headers: {
                            'Content-Type': 'application/pdf',
                        }
                    }
                    axios(request)
                    .then(res => {
                        console.log('archivo enviado', res.data);
                        if (!fs.existsSync(`${config.ruta}/enviados`)) {
                            fs.mkdirSync(`${config.ruta}/enviados`);
                        }
                        fs.rename(`${config.ruta}\\${file}`, `${config.ruta}\\enviados\\${file}`, (err) => {
                            err ? console.log('error al renombrar archivo', err) : console.log(`Archivo ${file} movido a carpeta enviados`)
                        })
                    })
                }
                catch (error) {
                    console.log('no se pudo mover archivo', error);
                }
            });
        } 
    })
}, 5000)
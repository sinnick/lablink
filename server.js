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
				console.log('trabajando con archivo', file);
				let laboratorio = file.split('_')[0];
				let protocolo = file.split('_')[1];
				let dni = file.split('_')[2];
				let regexlaboratorio = /^[0-9]{4}$/;
				const regexProtocolo = /^[0-9]{1,8}$/;
				let regexdni = /^[0-9]{7,8}$/;
				if (regexlaboratorio.test(laboratorio) && regexProtocolo.test(protocolo) && regexdni.test(dni)) {
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
								fs.rename(`${config.ruta}/${file}`, `${config.ruta}/enviados/${file}`, (err) => {
									err ? console.log('error al renombrar archivo', err) : console.log(`Archivo ${file} movido a carpeta enviados`)
								})
							})
							.catch(err => {
								console.log('error al enviar archivo', err.response.data);
							})
					}
					catch (error) {
						console.log('no se pudo mover archivo', error);
					}
				} else {
					console.log('archivo no cumple con formato, no se envia', file);
					try {
						if (!fs.existsSync(`${config.ruta}/no validos`)) {
							fs.mkdirSync(`${config.ruta}/no validos`);
						}
						fs.rename(`${config.ruta}/${file}`, `${config.ruta}/no validos/${file}`, (err) => {
							err ? console.log('error al renombrar archivo', err) : console.log(`Archivo ${file} movido a carpeta no validos`)
						})

					} catch (error) {
						console.log('no se pudo mover archivo', error);
					}
				}
			});
		}
	})
}, 5000)
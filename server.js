const express = require('express')
const fs = require('fs').promises
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

async function processFiles() {
	try {
		const files = await fs.readdir(config.ruta)
		const fileList = files.filter(file => file.endsWith('.pdf'))

		if (!fileList.length) return

		console.log('nuevos archivos', { fileList })

		for (const file of fileList) {
			await processFile(file)
		}
	} catch (err) {
		console.log('no puedo leer directorio', err)
	}
}

async function processFile(file) {
	console.log('trabajando con archivo', file)

	const [laboratorio, protocolo, dni] = file.split('_')
	const regexLaboratorio = /^[0-9]{4}$/
	const regexProtocolo = /^[0-9]{1,8}$/
	const regexDni = /^[0-9]{7,8}$/

	const isValid = regexLaboratorio.test(laboratorio) &&
		regexProtocolo.test(protocolo) &&
		regexDni.test(dni)

	if (isValid) {
		await sendFile(file)
	} else {
		await moveToInvalid(file)
	}
}

async function sendFile(file) {
	try {
		const filetosend = await fs.readFile(`${config.ruta}/${file}`, 'base64')

		const response = await axios({
			method: 'post',
			url: config.destino,
			data: {
				filename: file,
				pdf: filetosend
			},
			headers: {
				'Content-Type': 'application/json',
			}
		})

		console.log('archivo enviado', response.data)

		await ensureDir(`${config.ruta}/enviados`)
		await fs.rename(`${config.ruta}/${file}`, `${config.ruta}/enviados/${file}`)
		console.log(`Archivo ${file} movido a carpeta enviados`)
	} catch (err) {
		console.log('error al enviar archivo', err.response?.data || err.message)
	}
}

async function moveToInvalid(file) {
	console.log('archivo no cumple con formato, no se envia', file)
	try {
		await ensureDir(`${config.ruta}/no validos`)
		await fs.rename(`${config.ruta}/${file}`, `${config.ruta}/no validos/${file}`)
		console.log(`Archivo ${file} movido a carpeta no validos`)
	} catch (err) {
		console.log('no se pudo mover archivo', err)
	}
}

async function ensureDir(path) {
	try {
		await fs.access(path)
	} catch {
		await fs.mkdir(path)
	}
}

setInterval(processFiles, 5000)

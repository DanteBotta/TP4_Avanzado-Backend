import pkg from 'pg'
import dbconfig from './dbconfig.js'
import express from 'express'
import bcrypt from 'bcrypt'
import cors from 'cors'

import cancionRouters from "router/cancionRouter.js"
import escuchaRoutes from "router/escuchaRouter.js"
import usuarioRouters from "router/usuarioRouter.js"

const {Client} = pkg;
const client = new Client(dbconfig)
await client.connect()


const app = express()
const port = 3000;

app.use(cors());
app.use(express.json());
app.use("/cancion", cancionRouters)
app.use("/escucha", escuchaRoutes)
app.use("/usuario", usuarioRouters)


app.get('/usuarios', async (req, res) => {
    try {
        const client = new Client(dbconfig);
        await client.connect();

        const result = await client.query(
            "SELECT id, nombre, password FROM usuarios ORDER BY id"
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Error al obtener los usuarios"
        });
    }
});

app.get('/escucho', async (req, res) => {

    const authHeader = req.headers.authorization

    console.log("authorization:", authHeader)

    if (!authHeader) {
        return res.status(401).json({
            message: "Token inexistente"
        })
    }

    const partes = authHeader.split(" ")

    if (partes.length !== 2 || partes[0] !== "Bearer") {
        return res.status(401).json({
            message: "Formato de token incorrecto"
        })
    }

    const token = partes[1]

    console.log("token recibido:", token)

    try {

        const payloadoriginal = jwt.verify(token, secretKey)

        console.log("payload:", payloadoriginal)

        const infoCanciones = await client.query(
            `SELECT e.reproducciones, c.nombre
             FROM escucha e
             INNER JOIN canciones c 
             ON e.cancionesid = c.id
             WHERE e.usuarioid = $1`,
            [payloadoriginal.id]
        )

        if (infoCanciones.rowCount === 0) {
            return res.status(404).json({
                message: "Usuario no escuchó canciones"
            })
        }

        return res.status(200).json(infoCanciones.rows)

    } catch (error) {

        console.log("ERROR JWT:", error.name)
        console.log("MENSAJE:", error.message)

        return res.status(401).json({
            message: "Token inválido o expirado"
        })
    }
})

app.post('/crearusuario', async (req, res) => {
 const user = req.body;

    if(!user.nombre || !user.password){
        return res.status(400).json({ error: "Faltan datos" });
    }

    try{
        const client = new Client(dbconfig);
        await client.connect();

        // Comprobar si ya existe el nombre
        const existe = await client.query(
            "SELECT id FROM usuarios WHERE nombre = $1",
            [user.nombre]
        )

        if (existe.rows.length > 0) {
            await client.end();
            return res.status(409).json({
                error: "El nombre de usuario ya existe"
            })
        }

        const hashedpassword = await bcrypt.hash(user.password, 10);
        user.password = hashedpassword;
        const result = await client.query("INSERT INTO usuarios (nombre, password) VALUES ($1, $2)",
        [user.nombre, hashedpassword]);
        await client.end();

        return res.status(201).json({ mensaje: "Usuario creado correctamente" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Error al crear el usuario"});
    }
});

app.post('/login', async (req, res) => {
    const user = req.body

    if (!user.nombre || !user.password) {
        return res.status(400).json({ message: "Faltan datos" })
    }

    try {
        const result = await client.query(
            "SELECT * FROM usuarios WHERE nombre = $1",
            [user.nombre]
        )

        // Si no existe el usuario
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" })
        }

        const dbUser = result.rows[0]

        // Comparar contraseña
        const passOK = await bcrypt.compare(
            user.password,
            dbUser.password
        )

        // Si la contraseña no coincide
        if (!passOK) {
            return res.status(401).json({ message: "Clave inválida" })
        }

        const payload = {
            id: dbUser.id,
            username: dbUser.nombre
        }


        const options = {
            expiresIn: '1h',
            issuer: 'mi_organizacion'
        }

        // Generar el token
        const token = jwt.sign(payload, SecretKey, options)

        console.log(token)

        // Devolver el token
        return res.json({
            token: token
        })

    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
})


app.listen(port, () => {
 console.log(`Local en http://localhost:${PORT}`);
});

// export default app;
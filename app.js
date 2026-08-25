import pkg from 'pg'
import dbconfig from './dbconfig.js'
import express from 'express'
import bcrypt from 'crypto'

const {Client} = pkg;
const client = new Client(dbconfig)
await client.connect()

await client.end()

const app = express()
// const port = 3000;

app.post('/crearusuario', async (req, res) => {
 const user = req.body;

    if(!user.nombre || !user.userid || !user.password){
        return res.status(400).json({ error: "Faltan datos" });
    }

    try{
        const client = new Client(config);
        await client.connect();
        const hashedpassword = await bcrypt.hash(user.password, 10);
        user.password = hashedpassword;
        let result = await client.query("Insert into usuarios values ($1, $2, $3)", 
        [user.userid, user.nombre, hashedpassword]);
        await client.end();

        return res.status(201).json({ mensaje: "Usuario creado correctamente" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Error al crear el usuario"});
    }
});

app.post('/login', (req, res) => {

})


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
 console.log(`Local en http://localhost:${PORT}`);
});

// export default app;
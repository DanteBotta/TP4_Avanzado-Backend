import jwt from 'jsonwebtoken'
import 'dotenv/config'; // Carga automática en una sola línea

export const verifyToken = async (req, res, next) => {
    const authHeader = req.Header['authorization']
    if (!authHeader){
        return res.status(401).send({ error: "No llego ningun token en el header"})
    }
    const token = authHeader.split(' ') [1]
    try{
        const payload = jwt.verify(token, secretKey)
        req.userid = payload.id
        req.rol = payload.rol
        next()
    } catch (err){
        console.error(err)
        return res.status(401).send({ error: "Unauthorized"})
    }
}
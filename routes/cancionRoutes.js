import {Router} from 'express'
import {config} from '../db.js'
import pkg from 'pg'
const {Pool} = pkg
const router = Router()
require('dotenv').config()
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors')
const axios = require('axios');
const { executeQuery } = require('./config/db');
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }))
app.use(cors())
const multer = require('multer')

var storage = multer.diskStorage(
  {
    destination: './public/data/uploads/',
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  }
);

var upload = multer({ storage: storage });

app.post('/registration', async (req, res) => {

  const email = req.body.email;
  const fn = req.body.first_name;
  const ln = req.body.last_name;
  const password = req.body.password;

  if (password?.length < 8) {
    res.status(200).json({
      "status": 102,
      "message": "Password Minimal 8 karakter",
      "data": null
    });
  } else {

    const sql = await executeQuery('insert into users(email,first_name,last_name,password)values(?,?,?,?) ', [email, fn, ln, password])
    if (sql) {
      res.status(200).json({
        "status": 0,
        "message": "Registrasi berhasil silahkan login",
        "data": sql
      });
    } else {
      res.status(200).json({
        "status": 102,
        "message": "Paramter email tidak sesuai format",
        "data": sql
      })
    }
  }

})


app.post('/login', (req, res) => {
  const email = req.body.email;
  const user = {
    email: email,
  }
  const accesstoken = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '15m' });
  res.json({ 
    token: accesstoken
   })
})


function auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

const posts = [
  {
    "username": "rifqi",
    "Description": "This ini Description"
  }, {
    "username": "andi",
    "Description": "This ini Description 2"
  }
]

app.get('/posts', auth, (req, res) => {
  res.json(posts.filter(post => post.username === req.user.name));
})


app.listen(5000);

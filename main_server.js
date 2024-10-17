require('dotenv').config()
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors')
const { executeQuery } = require('./config/db');
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }))
app.use(cors())
const multer = require('multer')

//::::::::::::::::::::::::::::::::::::::::: START OF PROFILE ::::::::::::::::::::::::::::::::::::::::::::::::::::::::

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
    if (sql != undefined || sql != "") {
      await executeQuery('insert into balance(email,balances)values(?,?) ', [email, 0])
      res.status(200).json({
        "status": 0,
        "message": "Registrasi berhasil silahkan login",
        "data": null
      });
    } else {
      res.status(200).json({
        "status": 102,
        "message": "Paramter email tidak sesuai format",
        "data": null
      })
    }
  }
})


app.post('/login', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const sql = await executeQuery('select * from users where email= ? and password = ? limit 1', [email, password])
  if (sql.length > 0) {
    const user = {
      email: email,
    }
    const accesstoken = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '15m' });
    res.status(200).json({
      "status": 0,
      "message": "Login Success",
      "data": sql,
      "token": accesstoken
    })
  } else {
    res.status(200).json({
      "status": 0,
      "message": "Login Failed",
      "data": null
    })
  }
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

app.get('/profile', auth, async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
  const userEmail = decoded.email;
  const sql = await executeQuery('select * from users where email= ? ', [userEmail]);
  if (sql.length > 0) {
    res.status(200).json({
      "status": 0,
      "message": "Sukses",
      "data": sql
    })
  } else {
    res.status(200).json({
      "status": 0,
      "message": "Failed",
      "data": null
    })
  }
})


app.put('/profile/update', auth, async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
  const userEmail = decoded.email;
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const sql = await executeQuery('update users set first_name = ? , last_name = ?  where email= ? ', [first_name, last_name, userEmail]);
  if (sql != undefined || sql != "") {
    const sql2 = await executeQuery('select * from users where email= ? ', [userEmail]);
    res.status(200).json({
      "status": 0,
      "message": "Sukses",
      "data": sql2
    })
  } else {
    res.status(200).json({
      "status": 0,
      "message": "Failed",
      "data": null
    })
  }
})


app.put('/profile/image', auth, upload.single('photo'), async (req, res) => {

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
  const userEmail = decoded.email;
  const fileupload = req.file.originalname.replace(" ", "");
  const sql = await executeQuery('update users set profile_image = ? where email= ? ', [fileupload, userEmail]);
  if (sql != undefined || sql != "") {
    const sql2 = await executeQuery('select * from users where email= ? ', [userEmail]);
    res.status(200).json({
      "status": 0,
      "message": "Sukses",
      "data": sql2
    })
  } else {
    res.status(200).json({
      "status": 0,
      "message": "Failed",
      "data": null
    })
  }
})

//::::::::::::::::::::::::::::::::::::::::::::::: END OF PROFILE ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

//::::::::::::::::::::::::::::::::::::::::::::::: START OF BANNERS & SERVICE ::::::::::::::::::::::::::::::::::::::::::::::::::

app.get('/banner', async (req, res) => {
  const sql = await executeQuery('select * from banners');
  if (sql.length > 0) {
    res.status(200).json({
      "status": 0,
      "message": "Sukses",
      "data": sql
    })
  } else {
    res.status(200).json({
      "status": 0,
      "message": "Failed",
      "data": null
    })
  }
})

app.get('/services', async (req, res) => {
  const sql = await executeQuery('select * from services');
  if (sql.length > 0) {
    res.status(200).json({
      "status": 0,
      "message": "Sukses",
      "data": sql
    })
  } else {
    res.status(200).json({
      "status": 0,
      "message": "Failed",
      "data": null
    })
  }
})
//::::::::::::::::::::::::::::::::::::::::::::::: END OF BANNERS & SERVICES ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//::::::::::::::::::::::::::::::::::::::::::::::: START OF TRANSACTION ::::::::::::::::::::::::::::::::::::::::::::::::::

app.get('/balance', auth, async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
  const userEmail = decoded.email;
  const sql = await executeQuery('select *,sum(balances) as jumlah from balance where email= ? group by email', [userEmail]);
  if (sql.length > 0) {
    res.status(200).json({
      "status": 0,
      "message": "Sukses",
      "balaces": sql[0]?.jumlah
    })
  } else {
    res.status(200).json({
      "status": 0,
      "message": "Failed",
      "data": null
    })
  }
})

app.post('/topup', auth, async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
  const userEmail = decoded.email;
  const top_up = req.body.top_up_amount;
  const sql = await executeQuery('insert into balance(email,balances)values(?,?)', [userEmail, top_up]);
  if (sql != undefined || sql != "") {
    const sql2 = await executeQuery('select * from balance where email= ? order by id desc limit 1', [userEmail]);
    res.status(200).json({
      "status": 0,
      "message": "Sukses",
      "data": sql2
    })
  } else {
    res.status(200).json({
      "status": 0,
      "message": "Failed",
      "data": null
    })
  }
})

app.post('/transaction', auth, async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
  const userEmail = decoded.email;
  const service_code = req.body.service_code;
  const saldo = await executeQuery('select id,email,balances as amount from balance where email = ? order by id desc limit 1', [userEmail]);
  const orders = await executeQuery('select * from services where service_code = ? ', [service_code]);

  if (saldo[0]?.amount > orders[0]?.service_tarif) {
    const today = new Date();
    const month = (today.getMonth() + 1);
    const datess = today.getDate() + "" +month + ""+today.getFullYear();
    let id_inv = "";
    const variable = await executeQuery('select id,email,max(id) as id_jml from transaction');
    if (variable[0]?.id_jml == null || variable[0]?.id_jml == "") {
      id_inv = 1;
    } else {
      id_inv = variable[0]?.id_jml + 1;
    }
    const invo = "INV" + datess + "-00" + id_inv;

    const updated_saldo = parseInt(saldo[0]?.amount - orders[0]?.service_tarif);
    const sql2 = await executeQuery('insert into transaction(email,invoice_number,service_code,service_name,total_amount)values(?,?,?,?,?)', [userEmail, invo, orders[0]?.service_code, orders[0]?.service_name, orders[0]?.service_tarif]);
    if (sql2 != undefined || sql2 != "") {
      await executeQuery('update balance set balances = ? where id = ? ', [updated_saldo, saldo[0]?.id]);
      const result = await executeQuery('select * from transaction where email = ? ', [userEmail]);
      res.status(200).json({
        "status": 0,
        "message": "Transaksi berhasi",
        "data": result
      })
    } else {
      res.status(200).json({
        "status": 102,
        "message": "Service atau Layanan tidak ditemukan",
        "data": null
      })
    }


  } else {
    res.status(200).json({
      "status": 0,
      "message": "Saldo Anda Tidak Cukup",
      "data": null
    })
  }
})


app.get('/transaction/history', auth, async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
  const userEmail = decoded.email;
  const sql = await executeQuery('select * from transaction where email= ? ', [userEmail]);
  if (sql.length > 0) {
    res.status(200).json({
      "status": 0,
      "message": "Sukses",
      "data": sql
    })
  } else {
    res.status(200).json({
      "status": 0,
      "message": "Failed",
      "data": null
    })
  }
})

//::::::::::::::::::::::::::::::::::::::::::::::: END OF TRANSACTION ::::::::::::::::::::::::::::::::::::::::::::::::::

app.listen(6000);

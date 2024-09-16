const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Cs12345678",
  database: "RinyaphatDatabase"
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to the database.');
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const profileName = "profile_";
    const ext = path.extname(file.originalname);
    cb(null, profileName + Date.now() + ext);
  }
});

const upload = multer({ storage: storage });

db.connect();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));


// เพิ่มสินค้า
app.post('/product', upload.single('Image'), (req, res) => {
  const { brandproduct, nameproduct, serialnumber, amount, price, cpu, ram, rom } = req.body;

  if (!brandproduct || !nameproduct || !serialnumber || !amount || !price || !cpu || !ram || !rom) {
    return res.status(400).send({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน', status: false });
  } //ตรวจสอบว่าไม่มีข้อมูลที่ขาดหายไป

  if (!req.file) {
    return res.json({ "message": "ต้องมีภาพประกอบ", "status": false });
  }

  const ImageURL = `/uploads/${req.file.filename}`;

  const sql = `INSERT INTO product (brandproduct, nameproduct, serialnumber, amount, price, cpu, ram, rom, imageFile) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`; //ใช้เครื่องหมาย ? เพื่อป้องกัน SQL Injection
  db.query(sql, [brandproduct, nameproduct, serialnumber, amount, price, cpu, ram, rom, ImageURL ], (err, result) => {
    if (err) {
      console.error('Error inserting product:', err);
      return res.status(500).send({ message: 'Error saving data', status: false });
    }
    res.send({ message: 'Product saved successfully', status: true });
  });
});

// ดึงข้อมูลสินค้าตาม ID
app.get('/product/:id', (req, res) => {
  const productID = req.params.id;

  if (isNaN(productID)) {
    return res.status(400).send({ message: 'Product ID must be a number', status: false });
  } //ตรวจสอบข้อมูลของ productID

  const sql = `SELECT * FROM product WHERE productID = ?`;
  db.query(sql, [productID], (err, result) => {
    if (err) {
      console.error('Error retrieving product:', err);
      return res.status(500).send({ message: 'Error retrieving product', status: false });
    } //ส่งข้อความข้อผิดพลาดที่เป็นกลางและบันทึกข้อผิดพลาดอย่างละเอียดในล๊อก
    res.send(result[0]);
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

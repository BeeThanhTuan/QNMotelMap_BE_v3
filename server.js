// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');


const connectDB = require('./connectDB/connectDB.js');
// Sử dụng route liên quan 
const authRoutes = require('./routes/authRoutes.js');
const roleRoutes = require('./routes/roleRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const motelRoutes = require('./routes/motelRoutes.js');



const app = express();
const port = 3000;

//Sử dụng các middleware
app.use(cors());
// Sử dụng express.static để phục vụ các file từ thư mục 'uploads'
app.use('/resources', express.static(path.join(__dirname, 'resources')));
// Kết nối database
app.use(bodyParser.json({ limit: '10mb' }))
app.use(bodyParser.urlencoded({ extended: true}));

connectDB();


app.use('/', authRoutes);
app.use('/', roleRoutes);
app.use('/', userRoutes);
app.use('/', motelRoutes);


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const db = require('./db.js');




const app = express()   

const PORT =  3000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

app.get('/test', (req, res) => {
  res.status(200).json('Hello World!')
}) 


module.exports = app;
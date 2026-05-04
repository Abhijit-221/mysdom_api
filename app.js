const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const helmet = require('helmet');
// const dbConfig = require('./src/config/db.config');
const { connection } = require('./src/config/db2.config');
connection();
const path =  require('path');

app.use(express.urlencoded({ extended: true })); // extended: true enables qs parsing
app.use(express.json());

const port = process.env.PORT || 3000;
app.use(cors(
        {
        "origin": "*",
        "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
        // "preflightContinue": false,
        // "optionsSuccessStatus": 204
        }
));
// app.use(helmet());
app.use('/public', express.static(path.join(__dirname, 'public')));
// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

// Import routes
const authRoutes = require('./src/routes/Auth.routes');
const clientRoutes = require('./src/routes/Client.routes');
const serviceRoutes = require('./src/routes/Service.routes');
const productRoutes = require('./src/routes/Product.routes');
const clientServiceRoutes = require('./src/routes/ClientService.routes');
const bgvRequestRoutes = require('./src/routes/BGVRequest.routes');
const mailRoutes = require('./src/routes/mail.routes');
// Use routes
app.use('/api/v1/mysdom/auth', authRoutes);
app.use('/api/v1/mysdom/client', clientRoutes);
app.use('/api/v1/mysdom/service', serviceRoutes);
app.use('/api/v1/mysdom/product', productRoutes);
app.use('/api/v1/mysdom/client-service',clientServiceRoutes);
app.use('/api/v1/mysdom/bgvrequest', bgvRequestRoutes);
app.use('/api/v1/mysdom/mail', mailRoutes);

app.use((err, req, res, next) => {
  console.error(err);
// console.log(req.body.services[0].form_data);
  res.status(500).json({ error: 'Something went wrong!' });
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

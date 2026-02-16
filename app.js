const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const helmet = require('helmet');
const dbConfig = require('./src/config/db.config');

app.use(express.json());
const port = process.env.PORT || 3000;
app.use(cors(
        {
        "origin": "*",
        "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
        "preflightContinue": false,
        "optionsSuccessStatus": 204
        }
));
app.use(helmet());
app.use('/static',express.static('src/assets'));
// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

// Import routes
const authRoutes = require('./src/routes/Auth.routes');
const clientRoutes = require('./src/routes/Client.routes');
const serviceRoutes = require('./src/routes/Service.routes');
const clientServiceRoutes = require('./src/routes/ClientService.routes');
const bgvRequestRoutes = require('./src/routes/BGVRequest.routes');
// Use routes
app.use('/api/v1/mysdom/auth', authRoutes);
app.use('/api/v1/mysdom/client', clientRoutes);
app.use('/api/v1/mysdom/service', serviceRoutes);
app.use('/api/v1/mysdom/client-service',clientServiceRoutes);
app.use('/api/v1/mysdom/bgvrequest', bgvRequestRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

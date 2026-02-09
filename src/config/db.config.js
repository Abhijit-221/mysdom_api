const mongoose = require('mongoose');

const dbConfig = {
    url: process.env.MONGO_URI || 'mongodb://localhost:27017/mysdom'
};

mongoose.connect(dbConfig.url, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true
}).then(() => {
    console.log('Successfully connected to the database');
}).catch(err => {
    console.error('Connection error', err);
    process.exit();
});

module.exports = dbConfig;
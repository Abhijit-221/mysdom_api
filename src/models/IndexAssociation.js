const ClientService = require("./ClienServiceSchema");
const Client = require("./ClientSchema");
const Service = require("./ServiceSchema");
const User = require("./UserSchema");

//user table
User.belongsTo(Client,{as:'clients',foreignKey:'client',targetKey:'id'});
Client.hasMany(User,{as:'users',foreignKey:'client',sourceKey:'id'});

//Client table
Client.belongsTo(User,{as:'creator',foreignKey:'createdBy',targetKey:'id'});
Client.belongsTo(User,{as:'updater',foreignKey:'updatedBy',targetKey:'id'});
User.hasMany(Client,{as:'createdClients',foreignKey:'createdBy',sourceKey:'id'});
User.hasMany(Client,{as:'updatedClients',foreignKey:'updatedBy',sourceKey:'id'});

//service table

User.hasMany(Service,{as:'services',foreignKey:'createdBy',sourceKey:'id'});
Service.belongsTo(User,{as:'creator',foreignKey:'createdBy',targetKey:'id'});
User.hasMany(Service,{as:'updatedServices',foreignKey:'updatedBy',sourceKey:'id'});
Service.belongsTo(User,{as:'updater',foreignKey:'updatedBy',targetKey:'id'});

//Client Service association
ClientService.belongsTo(Client,{as:'client',foreignKey:'clientId',targetKey:'id'});
Client.hasMany(ClientService,{as:'clientServices',foreignKey:'clientId',sourceKey:'id'});
ClientService.belongsTo(Service,{as:'service',foreignKey:'serviceId',targetKey:'id'});
Service.hasMany(ClientService,{as:'clientServices',foreignKey:'serviceId',sourceKey:'id'});

module.exports = {
    Client,
    User,
    Service,
    ClientService
}
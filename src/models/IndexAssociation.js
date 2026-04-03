const BatchUploadService = require("./BGVBatchUploadServiceSchema");
const BGVEmployment = require("./BGVEmployeementSchema");
const BGVRequestForm = require("./BGVRequestFormSchema");
const BGVRequest = require("./BGVRequestSchema");
const BGVRequestService = require("./BGVRequestServiceSchema");
const ClientService = require("./ClienServiceSchema");
const ClientBatchUploadDocs = require("./ClientBatchUploadSchema");
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


//BGV request associations
BGVRequest.belongsTo(Client,{as:'client',foreignKey:'clientId',targetKey:'id'});
Client.hasMany(BGVRequest,{as:'bgvRequest',foreignKey:'clientId',sourceKey:'id'});

BGVRequest.belongsTo(User,{as:'submitUser',foreignKey:'submittedBy',targetKey:'id'});
User.hasMany(BGVRequest,{as:'bgvrequests',foreignKey:'submittedBy',sourceKey:'id'});

BGVRequest.belongsTo(User,{as:'updatedUser',foreignKey:'updatedBy',targetKey:'id'});
User.hasMany(BGVRequest,{as:'bgvRequests',foreignKey:'updatedBy',sourceKey:'id'});


BGVRequest.hasMany(BGVRequestService,{as:'bgvReqestService',foreignKey:'requestId',sourceKey:"id"});
BGVRequestService.belongsTo(BGVRequest,{as:'bgvRequest',foreignKey:'requestId',targetKey:'id'});

Service.hasMany(BGVRequestService,{as:'bgvReqService',foreignKey:'serviceId',sourceKey:"id"});
BGVRequestService.belongsTo(Service,{as:'services',foreignKey:'serviceId',targetKey:'id'});

User.hasMany(BGVRequestService,{as:'bgvReqServices',foreignKey:'createdBy',sourceKey:"id"});
BGVRequestService.belongsTo(User,{as:'createdUser',foreignKey:'createdBy',targetKey:'id'});

User.hasMany(BGVRequestService,{as:'BGVRequestService',foreignKey:'updatedBy',sourceKey:"id"});
BGVRequestService.belongsTo(User,{as:'updatedUser',foreignKey:'updatedBy',targetKey:'id'});

//BGV employeement request
BGVRequest.hasMany(BGVEmployment, {
  foreignKey: "bgvRequestId",
  as: "employments"
});

BGVEmployment.belongsTo(BGVRequest, {
  foreignKey: "bgvRequestId"
});

//BGV request form service
BGVRequestForm.belongsTo(BGVRequestService,{as:'bgvRequestService',foreignKey:'req_service_id',targetKey:'id'});
BGVRequestService.hasMany(BGVRequestForm,{as:'bgvRequestForm',foreignKey:'req_service_id',targetKey:'id'});

//batch upload association
ClientBatchUploadDocs.belongsTo(Client,{as:'client',foreignKey:'client_id',targetKey:'id'});
Client.hasMany(ClientBatchUploadDocs,{as:'batchupload_doc',foreignKey:'client_id',targetKey:'id'});

// Batch upload service schema
BatchUploadService.belongsTo(Service,{as:'service',foreignKey:'service_id',targetKey:'id'});
Service.hasMany(BatchUploadService,{as:'service',foreignKey:'service_id',targetKey:'id'});

module.exports = {
    Client,
    User,
    Service,
    ClientService,
    BGVRequest,
    BGVRequestService,
    BGVRequestForm,
    ClientBatchUploadDocs,
    BatchUploadService
}
const { Notification } = require('../models/Commerce');
const { notifyUser } = require('./emailQueue');
async function notify(values) {
 const record=await Notification.create(values);
 await notifyUser(record.user,record.title,record.message,record.link,'notification-'+record._id);
 return record;
}
module.exports={notify};

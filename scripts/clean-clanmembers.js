const MongoDataBase = require("../MongoDataBase");
const deleteAll = require("./deleteAll");

MongoDataBase.init({ database: "ProjectX" }).then(async (db) => {
  await deleteAll(db, "UserClanMembers");
  await deleteAll(db, "UserClanInvitations");
  process.exit();
});

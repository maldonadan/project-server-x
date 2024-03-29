const MongoDataBase = require("./MongoDataBase");

MongoDataBase.init().then(async (db) => {
  const myDb = db.client.db("ProjectX");
  // const userId = "12f6538d-fea7-421c-97f0-8f86b763ce75";
  // const userId = "12f6538d-fea7-421c-97f0-8f86b763ce75";
  const userId2 = "fdcd2886-4a08-4a56-bc09-30c5f362817f";
  // const res = await getUserExperienceRecordsByUserId(myDb, userId);
  // console.log(res);
  deleteUserProgressByUserId(myDb, userId2);
  // showLastError(myDb);
});

function getUserExperienceRecordsByUserId(db, userId) {
  return db
    .collection("UserExperienceRecords")
    .find({
      user_id: userId,
    })
    .toArray();
}

const collections = [
  "Alerts",
  // "Bridges",
  "ClanRelationships",
  "Clans",
  "CraftedObjects",
  // "DefaultStats",
  "DisabledUsers",
  "Errors",
  "EventRecords",
  "Invitations",
  "Materials",
  "Objects",
  "RegisterAttempts",
  "Requests",
  // "ScalingFactors",
  // "Skills",
  "UserBridges",
  "UserClanInvitations",
  "UserClanMembers",
  "UserClans",
  "UserExperience",
  "UserExperienceRecords",
  "UserMaterials",
  "UserPoints",
  "UserSkillPoints",
  "UserSkills",
  "UserStats",
  // "Users",
];
function deleteUserProgressByUserId(db, userId) {
  const collections = [
    "DisabledUsers",
    "UserExperience",
    "UserExperienceRecords",
    "UserPoints",
    "UserSkillPoints",
    "UserSkills",
    "UserStats",
  ];
  const promises = collections.map((collection) => {
    return db.collection(collection).deleteMany({
      user_id: userId,
    });
  });

  promises.push(
    db.collection("Users").deleteMany({
      id: userId,
    })
  );

  return Promise.all(promises).then(console.log);
}

function deleteAll(db, collectionName) {
  return db.collection(collectionName).deleteMany({});
}

async function showLastError(db) {
  const limit = 1;
  const sort = { timestamp: -1 };
  const errors = await db
    .collection("Errors")
    .find({}, { limit, sort })
    .toArray();
  const lastError = errors[0];
  if (!lastError) {
    console.log("No errors.");
  } else {
    console.log(lastError.timestamp);
    console.log(lastError.error.message);
    lastError.error.stack.split("\n").forEach((line) => console.log(line));
  }
}

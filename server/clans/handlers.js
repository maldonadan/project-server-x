const { getUserIdFromRequest } = require("../../auth");
const { forceMeterUpdate } = require("../../forceMeterUpdate");
const numberOfMembersToActivate =
  parseInt(process.env.NUMBER_OF_MEMBERS_TO_ACTIVATE) || 10;

function saveClan(db) {
  return async (req, res) => {
    const userId = await getUserIdFromRequest(db, req);
    await assertUserCreateAClan(db, userId);
    const clanName = getClanName(req);
    const clanDescription = getClanDescription(req);
    await db.saveUserClan(clanName, clanDescription, userId);
    await forceMeterUpdate(userId, db, "CREATING_CLAN");
    res.status(200).send({});
  };
}

async function assertUserCreateAClan(db, userId) {
  const clans = await db.userFunctionalClans(userId);
  if (clans.length > 1) {
    const e = new Error("User reached clan creation limit.");
    e.context = "CREATING_USER_CLAN";
    e.reason = "USER_CLAN_LIMIT";
    e.payload = {
      user_id: userId,
    };
    throw e;
  }
}

function getClanName(req) {
  const clanName = req.body.name;
  if (!clanName) {
    throw new Error("Clan name is required.");
  }
  return clanName;
}
function getClanDescription(req) {
  const clanDescription = req.body.description;
  if (!clanDescription) {
    throw new Error("Clan description is required.");
  }
  return clanDescription;
}
function inviteToMyClan(db) {
  return async (req, res) => {
    const invitadorId = getInvitadorId(req);
    const invitadoId = getInvitadoId(req);
    await db.inviteToClan(invitadorId, invitadoId);
    res.status(201).send({
      master_id: invitadorId,
      disciple_id: invitadoId,
      clan_name: "sarasa",
    });
  };
}
function getInvitadorId(req) {
  return req.headers["master-id"];
}
function getInvitadoId(req) {
  return req.headers["disciple-id"];
}
function joinToClan(db) {
  return async (req, res) => {
    const invitationId = req.params.invitationId;
    const userId = await getUserIdFromRequest(db, req);
    await db.joinClan(invitationId, userId, numberOfMembersToActivate);
    // const membersToNotify = await db.joinClan(
    //   invitationId,
    //   userId,
    //   numberOfMembersToActivate
    // );
    // await Promise.all(
    //   membersToNotify.map((member) => {
    //     forceMeterUpdate(
    //       member.member_id,
    //       db,
    //       "MEMBER_ACCEPT_INVITATION_TO_JOIN"
    //     );
    //   })
    // );
    await forceMeterUpdate(userId, db, "MEMBER_ACCEPT_INVITATION_TO_JOIN");
    res.status(200).send({});
  };
}
function leaveToClan(db) {
  return async (req, res) => {
    const userId = await getUserIdFromRequest(db, req);
    await db.leaveClan(userId);
    await forceMeterUpdate(userId, db, "MEMBER_LEAVE_CLAN");
    res.status(200).send({});
  };
}
function managementClans(db) {
  return async (req, res) => {
    const clans = await db.getClans();
    res.status(200).send({ clans });
  };
}
function getUserInfo(db) {
  return async (req, res) => {
    const { userId } = req.params;
    const clan = await db.getClanOfUser(userId);
    if (clan) {
      const { enemies } = await db.getClanRelationships(userId);
      return res.status(200).send({
        id: clan.name,
        name: clan.name,
        status: clan.status === "active" ? 1 : 0,
        can_invite: true,
        user_id: userId,
        enemies: enemies.map((enemy) => enemy.name),
      });
    }
    const membership = await db.getClanOfJoinedMember(userId);
    if (membership) {
      const userClan = await db.findOne("UserClans", {
        clan_id: membership._id,
      });
      const { enemies } = await db.getClanRelationships(userClan.user_id);
      if (membership.status !== "active") {
        return res.status(404).send({
          user_id: userId,
        });
      }
      return res.status(200).send({
        id: membership.name,
        name: membership.name,
        status: membership.status === "active" ? 1 : 0,
        can_invite: false,
        user_id: userId,
        enemies: enemies.map((enemy) => enemy.name),
      });
    }
    res.status(404).send({
      user_id: userId,
    });
  };
}
function deleteClan(db) {
  return async (req, res) => {
    const id = req.params.id;
    console.log("Clan to delete: ", id);
    await db.deleteClan(id);
    res.send({});
  };
}
function adminPutClanDown(db) {
  return async (req, res) => {
    const userId = await getUserIdFromRequest(db, req);
    await db.adminPutClanDown(userId);
    // const membersToNotify = await db.adminPutClanDown(userId);
    // await Promise.all(
    //   membersToNotify.map((member) => {
    //     forceMeterUpdate(member.member_id, db, "ADMIN_PUT_CLAN_DOWN");
    //   })
    // );
    await forceMeterUpdate(userId, db, "ADMIN_PUT_CLAN_DOWN");
    res.send({});
  };
}
function declineInvitation(db) {
  return async (req, res) => {
    const userId = await getUserIdFromRequest(db, req);
    const invitationId = req.params.invitationId;
    await db.declineInvitation(userId, invitationId);
    res.send({});
  };
}
function declareWar(db) {
  return async (req, res) => {
    const userId = await getUserIdFromRequest(db, req);
    const payload = req.body;
    if (payload.type === "war_declaration") {
      const targetClanId = payload.target_clan_id;
      await db.declareWar(userId, targetClanId);
      return res.send({});
    }
    if (payload.type === "forge_alliance") {
      const targetClanId = payload.target_clan_id;
      await db.forgeAlliance(userId, targetClanId);
      return res.send({});
    }
    res.status(404).send({});
  };
}
function kickoutToClan(db) {
  return async (req, res) => {
    const clanMasterId = await getUserIdFromRequest(db, req);
    const memberId = req.body.member_id;
    await db.kickoutFromClan(clanMasterId, memberId);
    await forceMeterUpdate(memberId, db, "KICKING_A_MEMBER_OUT_FROM_CLAN");
    res.status(200).send({});
  };
}
function setRoleToMember(db) {
  return async (req, res) => {
    const clanMasterId = await getUserIdFromRequest(db, req);
    console.log("clanMasterId: ", clanMasterId);
    const memberId = req.body.member_id;
    const roleName = req.body.role;
    await db.setRoleToMember(clanMasterId, memberId, roleName);
    res.status(200).send({});
  };
}

module.exports = {
  saveClan,
  inviteToMyClan,
  joinToClan,
  leaveToClan,
  managementClans,
  getUserInfo,
  deleteClan,
  adminPutClanDown,
  declineInvitation,
  declareWar,
  kickoutToClan,
  setRoleToMember,
};

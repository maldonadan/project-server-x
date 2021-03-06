require("dotenv").config();

const path = require("path");
const cors = require("cors");
const express = require("express");
const findUsers = require("./routes/findUsers");
const saveBridge = require("./routes/saveBridge");
const assignExperience = require("./routes/assignExperience");
const getUserProfile = require("./routes/getUserProfile");
const assignPointsToStats = require("./routes/assignPointsToStats");
const returnUserById = require("./routes/returnUserById");
const getUrlToProfile = require("./routes/getUrlToProfile");
const getSkills = require("./routes/getSkills");
const saveSkills = require("./routes/saveSkills");
const deleteSkill = require("./routes/deleteSkill");
const updateUserSkills = require("./routes/updateUserSkills");
const getProfileSkills = require("./routes/getProfileSkills");
const listBridges = require("./routes/listBridges");
const saveBridges = require("./routes/saveBridges");
const toggleSkill = require("./routes/toggleSkill");
const toggleBridge = require("./routes/toggleBridge");
const getPlayers = require("./routes/getPlayers");
const getPoints = require("./routes/getPoints");
const togglePlayer = require("./routes/togglePlayer");
const getInviteUrl = require("./routes/getInviteUrl");
const registerInvitado = require("./routes/registerInvitado");
const getInvitation = require("./routes/getInvitation");
const userModule = require("../user");
const { UserMaterials } = require("../core/UserMaterials");
const pickUpUserMaterials = require("./routes/pickUpUserMaterials");

const PORT = process.env.PORT || 3001;

const responses = {
  USER_ALREADY_EXISTS: {
    status: 400,
    message: "User already exists",
  },
  BRIDGE_NOT_FOUND: {
    status: 400,
    message: "Bridge not found",
  },
  ATTEMPT_NOT_FOUND: {
    status: 400,
    message: "Attempt not found",
  },
};

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

class MyServer {
  constructor(app) {
    this.app = app;
  }
  static start(db, systemEvents, tokens, UI_URL) {
    const assertBridgeIsEnabled = (db) => async (req, res, next) => {
      const id = req["headers"]["bridge-id"];
      const bridge = await db.findOne("Bridges", { id });
      if (!bridge || !bridge.enabled) {
        throw new Error("Bridge invalid");
      }
      next();
    };

    const app = express();

    app.use(express.static("public"));
    app.use(cors());
    app.use(
      express.urlencoded({
        extended: true,
      })
    );
    app.use(express.json());
    app.set("views", path.resolve(path.join(__dirname, "..", "view")));
    app.set("view engine", "ejs");
    app.get(
      "/api/users",
      asyncHandler(assertBridgeIsEnabled(db)),
      asyncHandler(findUsers(db))
    );
    app.get(
      "/api/users/:id",
      asyncHandler(assertBridgeIsEnabled(db)),
      asyncHandler(returnUserById(db))
    );

    app.delete("/api/users/:id", async (req, res) => {
      const id = req.params.id;
      await db.deleteOne("Users", { id });
      console.log("User of id %s deleted.", id);
      res.send({});
    });
    app.post(
      "/api/users/:id/stats",
      asyncHandler(assignPointsToStats(db, systemEvents))
    );
    app.get("/api/users/:id/materials", async (req, res) => {
      const user_id = req.params.id;
      const materials = await db.find("UserMaterials", { user_id });
      res.send(UserMaterials.from(materials));
    });
    app.post(
      "/api/users/:id/calc/skills",
      asyncHandler(async (req, res) => {
        const { id } = req.params;
        const stats = req.body;

        const user = await userModule.findUserById(db, id);

        const updatedStats = Object.keys(stats).reduce((acc, statName) => {
          acc[statName] = acc[statName] + stats[statName];
          return acc;
        }, user.stats);

        const { skills } = await userModule.getSkills(db, {
          ...user,
          stats: updatedStats,
        });

        res.send({
          skills,
        });
      })
    );
    app.post("/api/bridge", saveBridge(db));
    app.get("/api/bridges", listBridges(db));
    app.post("/api/bridges", saveBridges(db));
    app.post("/api/xp", asyncHandler(assignExperience(db, systemEvents)));
    app.get("/api/skills", asyncHandler(getSkills(db)));
    app.post("/api/skills", asyncHandler(saveSkills(db)));
    app.delete("/api/skills/:id", asyncHandler(deleteSkill(db)));
    app.get("/api/skills/:skill_id/toggle", asyncHandler(toggleSkill(db)));
    app.get("/api/bridges/:bridge_id/toggle", asyncHandler(toggleBridge(db)));
    app.get("/api/players/:player_id/toggle", asyncHandler(togglePlayer(db)));
    app.get("/api/profile/:token", asyncHandler(getUserProfile(db)));
    app.post(
      "/api/profile/:token/skills",
      asyncHandler(updateUserSkills(db, tokens))
    );
    app.get("/api/auth/:id", asyncHandler(getUrlToProfile(db)));
    app.get("/api/skills/:id", getProfileSkills(db));
    app.get("/api/players", getPlayers(db));
    app.get("/api/points/:id", getPoints(db));

    app.post(
      "/api/invite",
      asyncHandler(assertBridgeIsEnabled(db)),
      asyncHandler(getInviteUrl(tokens, UI_URL, db))
    );
    app.get("/api/invite/:id", asyncHandler(getInvitation(tokens, db)));
    app.post(
      "/api/register/:id",
      asyncHandler(registerInvitado(db, tokens, UI_URL))
    );

    app.post(
      "/api/pickup",
      asyncHandler(assertBridgeIsEnabled(db)),
      asyncHandler(pickUpUserMaterials(db))
    );

    app.use((error, req, res, next) => {
      console.log(error.stack);
      const custom = responses[error.message];
      res
        .status((custom && custom.status) || 500)
        .send({ message: (custom && custom.message) || error.message });
    });
    return new MyServer(app);
  }
  listen() {
    this.server = this.app.listen(PORT, () => {
      console.log("Server is running at port " + PORT);
    });
  }
  async close() {
    if (this.server) {
      await new Promise((r) => {
        this.server.close(() => {
          console.log("Server closed at port " + PORT);
          r();
        });
      });
    }
  }
}

module.exports = {
  MyServer,
};

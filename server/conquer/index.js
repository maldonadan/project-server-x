// Body:
//  - conquer_id
//  - clan_id
//  - disputers

const uuid = require("uuid");
const { timestamp } = require("../../time");
const assertBridgeIsEnabled = require("../routes/assertBridgeIsEnabled");
const asyncHandler = require("../routes/asyncHandler");
const SystemEvents = require("../SystemEvents");

module.exports = {
  setPointAsConquered: (app, db) => {
    app.post(
      "/api/conquer",
      asyncHandler(assertBridgeIsEnabled(db)),
      assertHasRequiredParameters,
      asyncHandler(setPointAsConquered(db))
    );
  },
  createPoint: (app, db) => {
    app.post("/api/conquer-point", asyncHandler(createConquerPoint(db)));
  },
  launchPoint: (app, db) => {
    app.post("/api/conquer-point/launch", asyncHandler(launchConquerPoint(db)));
  },
};

function launchConquerPoint(db) {
  return async (req, res) => {
    const [conquerPoint, bridge] = await Promise.all([
      getConquestPoint(req, db),
      db.findOne("Bridges", {
        id: req.body.bridge_id,
        enabled: true,
      }),
    ]);

    if (!bridge) {
      const e = new Error("BAD_REQUEST");
      e.context = "LAUNCHING_CONQUERING_POINT";
      e.reason = "Bridge to notify not found.";
      e.payload = {
        body: req.body,
        headers: req.headers,
      };
      throw e;
    }

    const systemEvents = new SystemEvents();

    const requestResult = await systemEvents.notifyConquerPointLaunched(
      bridge,
      conquerPoint
    );

    await db.save("ConquestPointLaunchings", {
      body: req.body,
      request_result: requestResult.data,
      request_result_status: requestResult.status,
      conquer_point: conquerPoint,
      bridge,
      timestamp: timestamp(),
    });

    res.send({});
  };
}

function createConquerPoint(db) {
  return async (req, res) => {
    await db.save("ConquestPoints", {
      id: uuid.v4(),
      status: "active",
      ttl: 3600,
      timestamp: timestamp(),
    });
    res.send({});
  };
}

function setPointAsConquered(db) {
  return async (req, res) => {
    const [clan, conquestPoint] = await Promise.all([
      getClan(req, db),
      getConquestPoint(req, db),
    ]);
    await db.save("Conquests", {
      ...req.body,
      timestamp: timestamp(),
    });
    res.send({
      point: conquestPoint,
      clan,
    });
  };
}

async function getConquestPoint(req, db) {
  //ConquestPoints
  // status (initial state: 'active', also posibles: conquered, disabled)
  // created_at
  // -> status = 'conquered' => conquered_at
  // -> status = 'disabled' => disabled_at
  // ttl (unit: seconds)
  //
  const conquestPoint = await db.findOne("ConquestPoints", {
    id: req.body.conquer_id,
  });
  if (!conquestPoint) {
    const e = new Error("BAD_REQUEST");
    e.context = "CLAN_CONQUERING_POINT";
    e.reason = "Conquest point not found.";
    e.payload = {
      body: req.body,
      headers: req.headers,
    };
    throw e;
  }
  return conquestPoint;
}

async function getClan(req, db) {
  const clan = await db.findOne("Clans", {
    name: { $regex: new RegExp(req.body.clan_id, "i") },
  });
  if (!clan) {
    const e = new Error("BAD_REQUEST");
    e.context = "CLAN_CONQUERING_POINT";
    e.reason = "Clan not found.";
    e.payload = {
      body: req.body,
      headers: req.headers,
    };
    throw e;
  }
  return clan;
}

function assertHasRequiredParameters(req, res, next) {
  if (!req.body.clan_id) {
    const e = new Error("BAD_REQUEST");
    e.context = "CLAN_CONQUERING_POINT";
    e.reason = "Missing clan_id.";
    e.payload = {
      body: req.body,
      headers: req.headers,
    };
    throw e;
  }
  if (!req.body.conquer_id) {
    const e = new Error("BAD_REQUEST");
    e.context = "CLAN_CONQUERING_POINT";
    e.reason = "Missing conquer_id.";
    e.payload = {
      body: req.body,
      headers: req.headers,
    };
    throw e;
  }
  if (
    !Array.isArray(req.body.disputers) ||
    (req.body.disputers && req.body.disputers.length === 0)
  ) {
    const e = new Error("BAD_REQUEST");
    e.context = "CLAN_CONQUERING_POINT";
    e.reason = "Missing disputers.";
    e.payload = {
      body: req.body,
      headers: req.headers,
    };
    throw e;
  }
  next();
}

require("dotenv").config();
const path = require("path");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const express = require("express");
const { logBridgeId } = require("./logBridgeId");
const findUsers = require("./routes/findUsers");
const getUserDataOrRegisterLink = require("./routes/getUserDataOrRegisterLink");
const saveUser = require("./routes/saveUser");
const saveBridge = require("./routes/saveBridge");
const assignExperience = require("./routes/assignExperience");
const getUserProfile = require("./routes/getUserProfile");
const { App } = require("../client/src/App");

const PORT = process.env.PORT || 3000;

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

class MyServer {
  constructor(app) {
    this.app = app;
  }
  static start(db, systemEvents) {
    const app = express();

    app.set("view engine", "pug");
    app.set("views", path.resolve(path.join(__dirname, "..", "view")));

    app.use(express.static("public"));
    app.use(
      express.urlencoded({
        extended: true,
      })
    );
    app.use(express.json());
    app.get("/api/users", findUsers(db));
    app.get("/api/users/:id", logBridgeId, async (req, res, next) => {
      try {
        await getUserDataOrRegisterLink(db)(req, res);
      } catch (error) {
        next(error);
      }
    });
    app.post("/api/users/:id/stats", async (req, res) => {
      const stats = { user_id: req.params.id, ...req.body };
      await db.save("UsersProps", stats);
      res.send();
    });
    app.get("/", function (req, res) {
      res.sendFile(path.resolve(path.join(__dirname, "/../view/home.html")));
    });
    app.post("/register/:id", async (req, res, next) => {
      try {
        await saveUser(db, systemEvents)(req, res);
      } catch (error) {
        next(error);
      }
    });
    app.get("/register/:id", function (req, res) {
      res.sendFile(
        path.resolve(path.join(__dirname, "/../view/register.html"))
      );
    });
    app.get("/profile/:id", getUserProfile(db));
    app.post("/api/bridge", saveBridge(db));
    app.post("/api/xp", async (req, res, next) => {
      try {
        await assignExperience(db, systemEvents)(req, res);
      } catch (error) {
        next(error);
      }
    });
    app.get("/ssr", (req, res) => {
      const app = ReactDOMServer.renderToString(<App />);

      const html = `
          <html lang="en">
          <head>
              <script src="app.js" async defer></script>
          </head>
          <body>
              <div id="root">${app}</div>
          </body>
          </html>
      `;
      res.send(html);
    });
    app.use((error, req, res, next) => {
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
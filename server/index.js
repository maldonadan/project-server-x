const path = require("path");
const express = require("express");
const { logBridgeId } = require("./logBridgeId");
const { verifyIsValidBridge } = require("./verifyIsValidBridge");
const { findUserById, saveUser } = require("../user");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get(
  "/api/users/:id",
  logBridgeId,
  verifyIsValidBridge,
  function (req, res) {
    const id = req.params.id;
    findUserById(id).then((user) => {
      if (user.isRegistered()) {
        res.send(user.asJSONResponse());
      } else {
        res.status(404).send(user.getLinkToRegister());
      }
    });
  }
);
app.get("/", function (req, res) {
  res.sendFile(path.resolve(path.join(__dirname, "/../view/home.html")));
});
app.post("/register/:id", function (req, res) {
  const id = req.params.id;
  const { name } = req.body;

  saveUser(id, name);

  res.sendFile(path.resolve(path.join(__dirname, "/../view/home.html")));
});
app.get("/register/:id", function (req, res) {
  res.sendFile(path.resolve(path.join(__dirname, "/../view/register.html")));
});

app.listen(PORT, () => {
  console.log("Server is running at port " + PORT);
});

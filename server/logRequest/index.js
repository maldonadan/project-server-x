function logRequest(req, res, next) {
  const bridge = req.headers["bridge-id"];
  console.log("bridge: ", bridge);
  next();
}

module.exports = {
  logRequest,
};
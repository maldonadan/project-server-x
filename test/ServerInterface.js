const { expect } = require("chai");
const supertest = require("supertest");

class ServerInterface {
  constructor(server) {
    this.server = server;
  }
  GivenTheresABridge({ id, url }) {
    return supertest(this.server.app)
      .post("/api/bridge")
      .set("bridge-id", id)
      .send({ bridge_url: url });
  }
  async AssertUserNotRegistered(userId) {
    const res = await supertest(this.server.app)
      .get("/api/users/" + userId)
      .set("bridge-id", "BRIDGE_ID");
    return {
      equals(status, body) {
        expect({
          status: res.status,
          body: res.body,
        }).to.eqls({ status, body });
      },
    };
  }
  async RegisterUser(userId, formValues) {
    const res = await supertest(this.server.app)
      .post("/register/" + userId)
      .send(formValues);
    return {
      equals(status, message) {
        expect({
          status: res.status,
          message: res.body.message,
        }).to.eqls({ status, message });
      },
    };
  }
  async AssertUserExist(userId, user) {
    const { body } = await supertest(this.server.app)
      .get("/api/users/" + userId)
      .set("bridge-id", "BRIDGE_ID")
      .expect(200);

    expect(body).to.eqls(user);
  }
  async findUser(userId) {
    const res = await supertest(this.server.app)
      .get("/api/users/" + userId)
      .set("bridge-id", "BRIDGE_ID");
    return {
      equals(status, message) {
        expect({
          status: res.status,
          message: res.body.message,
        }).to.eqls({ status, message });
      },
    };
  }
  async findAllUsers() {
    const res = await supertest(this.server.app)
      .get("/api/users")
      .set("bridge-id", "BRIDGE_ID");
    return {
      equals(status, body) {
        expect({
          status: res.status,
          body: res.body,
        }).to.eqls({ status, body });
      },
    };
  }
}

module.exports = {
  ServerInterface,
};
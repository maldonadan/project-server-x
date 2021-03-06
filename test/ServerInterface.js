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
      statusEquals(status) {
        expect(res.status).to.eqls(status);
      },
    };
  }
  async RegisterUserStats(userId, formValues) {
    const res = await supertest(this.server.app)
      .post("/api/users/" + userId + "/stats")
      .send(formValues);
    return {
      statusEquals(status) {
        expect(res.status).to.eqls(status);
      },
      equals({ status, message }) {
        expect(res.status).to.eqls(status);
        expect(res.body.message).to.eqls(message);
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
  async assignExperience(experienceToAssign) {
    const res = await supertest(this.server.app)
      .post("/api/xp")
      .send(experienceToAssign)
      .set("bridge-id", "BRIDGE_ID");
    expect(res.status).to.eqls(200);
    return {
      statusEquals(status) {
        expect(res.status).to.eqls(status);
      },
    };
  }
  async getURLToProfile(userId) {
    const res = await supertest(this.server.app)
      .get("/api/auth/" + userId)
      .set("bridge-id", "BRIDGE_ID")
      .expect(200);
    return {
      bodyEquals(expectedBody) {
        expect(res.body).to.eqls(expectedBody);
      },
      url: () => res.body.url,
    };
  }
  async GetUserProfile(token) {
    const res = await supertest(this.server.app)
      .get("/api/profile/" + token)
      .expect(200);
    return {
      debug() {
        console.log({
          status: res.status,
          body: res.body,
        });
      },
      skillsPointsEquals(skillPoints) {
        expect(res.body.skill_points).to.eqls(skillPoints);
      },
      contains({ skills_catalog, skill_points, skills }) {
        if (skill_points) {
          expect(res.body.skill_points).to.eqls(skill_points);
        }
        if (skills_catalog) {
          expect(res.body.skills_catalog).to.eqls(skills_catalog);
        }
        if (skills) {
          expect(res.body.skills).to.eqls(skills);
        }
      },
    };
  }
  async LearnSkills({ token, skills }) {
    const res = await supertest(this.server.app)
      .post("/api/profile/" + token + "/skills")
      .send({ skills });
    return {
      debug() {
        console.log({
          status: res.status,
          body: res.body,
        });
      },
      contains({ skills }) {
        if (skills) {
          expect(res.body.skills).to.eqls(skills);
        }
      },
    };
  }
  async SaveSkill(body) {
    const res = await supertest(this.server.app).post("/api/skills").send(body);
    return {
      debug() {
        console.log({
          status: res.status,
          body: res.body,
        });
      },
      statusEquals(status) {
        expect(res.status).to.eqls(status);
      },
    };
  }
  async GetUserSkills(id, settings) {
    const qs = settings && settings.page ? `?page=${settings.page}` : "";
    const res = await supertest(this.server.app)
      .get("/api/skills/" + id + qs)
      .expect(200);
    return {
      debug() {
        console.log({
          status: res.status,
          body: res.body,
        });
      },
      contains(key, value) {
        expect(res.body[key]).to.eqls(value);
      },
    };
  }
}

module.exports = {
  ServerInterface,
};

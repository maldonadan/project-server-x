const { expect } = require("chai");
const InMemoryDataBase = require("../InMemoryDataBase");
const { MyServer } = require("../server");
const { ServerInterface } = require("./ServerInterface.js");

class SystemEventsMock {
  constructor() {
    this.map = {
      USER_REGISTERED: [],
      USER_LEVEL_UP: [],
    };
  }
  hasReceiveThatUserRegister(expected) {
    expect(this.map["USER_REGISTERED"]).to.eqls([expected]);
  }
  hasReceiveThatUserLevelUp(expected) {
    expect(this.map["USER_LEVEL_UP"]).to.eqls([expected]);
  }
  notify(eventName, data) {
    this.map[eventName].push(data);
  }
}

const listOf = (...arg) => arg;
const userExperience = (user_id, xp) => ({
  user_id,
  xp,
});

describe("Given I need to provide the skills of the users", () => {
  let server;
  let systemEvents;
  const UI_URL = "http://origin.com";
  const tokens = {
    getTokenForProfile(userId) {
      tokens.userId = userId;
      return "12345678";
    },
    getUserIdFromToken() {
      return tokens.userId;
    },
  };
  beforeEach(async () => {
    systemEvents = new SystemEventsMock();
    server = await MyServer.start(
      InMemoryDataBase.init(),
      systemEvents,
      tokens,
      UI_URL
    );
  });
  afterEach(async () => {
    server.close();
  });
  describe("because user doesn't have skills", () => {
    it("should provide empty skills", async () => {
      const api = new ServerInterface(server);
      const USER_ID = "12f6538d-fea7-421c-97f0-8f86b763ce75";
      await api.GivenTheresABridge({
        id: "BRIDGE_ID",
        url: "http://sarasa.com",
      });
      await api.AssertUserNotRegistered(USER_ID);

      const formValues = {
        name: "Daniel",
        breed: "Dragon",
        type: "Ice",
        level_name: "Milleniums",
      };
      await api.RegisterUser(USER_ID, formValues);

      const res = await api.GetUserSkills("12345678");

      res.contains("skills", []);
    });
  });
  describe("because user has only 1 skill", () => {
    it("should provide only that skill", async () => {
      const api = new ServerInterface(server);
      const USER_ID = "12f6538d-fea7-421c-97f0-8f86b763ce75";
      await api.GivenTheresABridge({
        id: "BRIDGE_ID",
        url: "http://sarasa.com",
      });
      await api.AssertUserNotRegistered(USER_ID);

      const formValues = {
        name: "Daniel",
        breed: "Dragon",
        type: "Ice",
        level_name: "Milleniums",
      };
      await api.RegisterUser(USER_ID, formValues);

      await api.assignExperience(listOf(userExperience(USER_ID, 240)));

      const saveSkillResponse = await api.SaveSkill({
        id: "fire-beam",
        name: "Fire Beam",
        description: "Some description for fire beam...",
        level_min: 2,
        level_gap: 4,
      });

      saveSkillResponse.statusEquals(200);

      await api.getURLToProfile(USER_ID);

      await api.LearnSkills({
        token: "12345678",
        skills: [
          {
            id: "fire-beam",
            skill_level_value: 1,
            user_level_value: 2,
          },
        ],
      });

      const res = await api.GetUserSkills(
        "12f6538d-fea7-421c-97f0-8f86b763ce75"
      );

      res.contains("skills", [
        {
          name: "Fire Beam-I",
        },
      ]);
    });
  });

  describe("Test de formato de respuesta de skills", () => {
    it("test 1", async () => {
      const api = new ServerInterface(server);
      const USER_ID = "12f6538d-fea7-421c-97f0-8f86b763ce75";
      await api.GivenTheresABridge({
        id: "BRIDGE_ID",
        url: "http://sarasa.com",
      });
      await api.AssertUserNotRegistered(USER_ID);

      const formValues = {
        name: "Daniel",
        breed: "Dragon",
        type: "Ice",
        level_name: "Milleniums",
      };
      await api.RegisterUser(USER_ID, formValues);

      await api.assignExperience(listOf(userExperience(USER_ID, 240)));

      const saveSkillResponse = await api.SaveSkill({
        id: "fire-beam",
        name: "Fire Beam",
        description: "Some description for fire beam...",
        icon: "40032c3a-79a9-f91f-8af3-0fd250f8a0b8",
        level_min: 2,
        level_gap: 4,
        health_self: 100,
        health_other: 0,
        mana_self: -50,
        mana_other: 0,
        amount: 0,
        effect: 1,
        duration: 0,
        cooldown: 10,
        target: 0,
        reach: 0,
      });

      saveSkillResponse.statusEquals(200);

      await api.getURLToProfile(USER_ID);

      await api.LearnSkills({
        token: "12345678",
        skills: [
          {
            id: "fire-beam",
            skill_level_value: 1,
            user_level_value: 2,
          },
        ],
      });

      const res = await api.GetUserSkills(
        "12f6538d-fea7-421c-97f0-8f86b763ce75"
      );

      res.contains("skills", [
        {
          reach: 0,
          name: "Fire Beam-I",
          icon: "40032c3a-79a9-f91f-8af3-0fd250f8a0b8",
          mana_self: -50,
          mana_other: 0,
          health_self: 100,
          health_other: 0,
          effect: 1,
          amount: 0,
          duration: 0,
          cooldown: 10,
          target: 0,
        },
      ]);
    });
  });

  describe("because we limit the amount of skills to 2", () => {
    it("should provide a url to get more skills", async () => {
      const api = new ServerInterface(server);
      const USER_ID = "12f6538d-fea7-421c-97f0-8f86b763ce75";
      await api.GivenTheresABridge({
        id: "BRIDGE_ID",
        url: "http://sarasa.com",
      });
      await api.AssertUserNotRegistered(USER_ID);

      const formValues = {
        name: "Daniel",
        breed: "Dragon",
        type: "Ice",
        level_name: "Milleniums",
      };
      await api.RegisterUser(USER_ID, formValues);

      await api.assignExperience(listOf(userExperience(USER_ID, 240)));

      const saveSkillResponse = await api.SaveSkill({
        id: "fire-beam",
        name: "Fire Beam",
        description: "Some description for fire beam...",
        level_min: 2,
        level_gap: 4,
      });
      const saveSkillResponse2 = await api.SaveSkill({
        id: "ice-wing",
        name: "Ice Wing",
        description: "Some description for ice wing...",
        level_min: 2,
        level_gap: 4,
      });
      const saveSkillResponse3 = await api.SaveSkill({
        id: "mega-punch",
        name: "Mega Punch",
        description: "Some description for mega punch...",
        level_min: 2,
        level_gap: 4,
      });

      saveSkillResponse.statusEquals(200);
      saveSkillResponse2.statusEquals(200);
      saveSkillResponse3.statusEquals(200);

      await api.getURLToProfile(USER_ID);

      await api.LearnSkills({
        token: "12345678",
        skills: [
          {
            id: "fire-beam",
            skill_level_value: 1,
            user_level_value: 2,
            skill_level_value: 1,
          },
          {
            id: "ice-wing",
            skill_level_value: 1,
            user_level_value: 2,
            skill_level_value: 1,
          },
          {
            id: "mega-punch",
            skill_level_value: 1,
            user_level_value: 2,
            skill_level_value: 1,
          },
        ],
      });

      const res = await api.GetUserSkills(
        "12f6538d-fea7-421c-97f0-8f86b763ce75"
      );

      res.contains(
        "next",
        "http://localhost:3001/api/skills/12f6538d-fea7-421c-97f0-8f86b763ce75?page=2"
      );
      res.contains("skills", [
        {
          name: "Fire Beam-I",
        },
        {
          name: "Ice Wing-I",
        },
      ]);
    });
    it("should ...", async () => {
      const api = new ServerInterface(server);
      const USER_ID = "12f6538d-fea7-421c-97f0-8f86b763ce75";
      await api.GivenTheresABridge({
        id: "BRIDGE_ID",
        url: "http://sarasa.com",
      });
      await api.AssertUserNotRegistered(USER_ID);

      const formValues = {
        name: "Daniel",
        breed: "Dragon",
        type: "Ice",
        level_name: "Milleniums",
      };
      await api.RegisterUser(USER_ID, formValues);

      await api.assignExperience(listOf(userExperience(USER_ID, 240)));

      const saveSkillResponse = await api.SaveSkill({
        id: "fire-beam",
        name: "Fire Beam",
        description: "Some description for fire beam...",
        level_min: 2,
        level_gap: 4,
      });
      const saveSkillResponse2 = await api.SaveSkill({
        id: "ice-wing",
        name: "Ice Wing",
        description: "Some description for ice wing...",
        level_min: 2,
        level_gap: 4,
      });
      const saveSkillResponse3 = await api.SaveSkill({
        id: "mega-punch",
        name: "Mega Punch",
        description: "Some description for mega punch...",
        level_min: 2,
        level_gap: 4,
      });

      saveSkillResponse.statusEquals(200);
      saveSkillResponse2.statusEquals(200);
      saveSkillResponse3.statusEquals(200);

      await api.getURLToProfile(USER_ID);

      await api.LearnSkills({
        token: "12345678",
        skills: [
          {
            id: "fire-beam",
            skill_level_value: 1,
            user_level_value: 2,
          },
          {
            id: "ice-wing",
            skill_level_value: 1,
            user_level_value: 2,
          },
          {
            id: "mega-punch",
            skill_level_value: 1,
            user_level_value: 2,
          },
        ],
      });

      const res = await api.GetUserSkills(
        "12f6538d-fea7-421c-97f0-8f86b763ce75",
        { page: 2 }
      );

      res.contains("next", undefined);
      res.contains("skills", [
        {
          name: "Mega Punch-I",
        },
      ]);
    });
  });
});

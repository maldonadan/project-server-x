const { findUserById } = require("../../user");

const cache = new Map();

const getUserProfile = (db) => async (req, res) => {
  const id = req.params.id;
  if (cache.get(id)) {
    return res.render("profile", cache.get(id));
  }
  const user = await findUserById(db, id);
  console.log(user);
  const { stats } = user;
  console.log(user.xp_max - user.xp_level);
  console.log(user.xp_level / user.xp_max);
  const utils = {
    xp_level_percentage: new Number(
      (user.xp_level / user.xp_max) * 100
    ).toFixed(2),
  };

  const points = 12;

  const response = {
    user: {
      name: user.name,
      health: user.health,
      mana: user.mana,
      strength: stats.strength,
      fortitude: stats.fortitude,
      intelligence: stats.intelligence,
      will: stats.will,
      perception: stats.perception,
      agility: stats.agility,
      endurance: stats.endurance,
      level_value: user.level_value,
      level_name: user.level_name,
      xp_current: user.xp_current,
      xp_max: user.xp_max,
      xp_level: user.xp_level,
      has_points: points !== null && points !== undefined,
      points: points,
      ...utils,
    },
  };

  cache.set(id, response);

  res.render("profile", response);
};

module.exports = getUserProfile;
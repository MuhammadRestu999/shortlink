let monk = require("monk");
let log = require("./log");


class DB {
  constructor(collection) {
    this.uri = process.env.URI;
    this.db = null;
    this.collection = collection;
  }

  connect() {
    return new Promise(async(resolve, reject) => {
      if(this.db) {
        log.ERR("You are already connected to the database!");
        return reject(false);
      };
      this.db = monk(this.uri);
      this.collection = this.db.get(this.collection);
      log.SUCC("Successfully connected to database");
      resolve(true);
    });
  }

  set(url, short, owner) {
    return new Promise(async(resolve, reject) => {
      if(!this.db) {
        log.ERR("You haven\'t connected to the database yet!");
        return reject({ connected: false });
      }
      log.INFO(`Inserting url \"${url}\" as \"${short}\"`);
      if(await this.get(short)) {
        log.ERR(`Shortlink ${short} already exists`);
        return reject({ exists: true });
      };

      await this.collection.insert({
        url,
        short,
        owner,
        click: 0
      });
      log.SUCC(`Successfully inserting url \"${url}\" as \"${short}\"`);
      resolve(true);
    });
  }

  get(short) {
    return new Promise(async(resolve, reject) => {
      if(!this.db) {
        log.ERR("You haven\'t connected to the database yet!");
        return reject({ connected: false });
      }
      log.INFO(`Getting url \"${short}\"`);
      resolve(await this.collection.findOne({ short }));
    });
  }

  delete(short, owner, admin) {
    return new Promise(async(resolve, reject) => {
      if(!this.db) {
        log.ERR("You haven\'t connected to the database yet!");
        return reject({ connected: false });
      }
      log.INFO(`Deleting url \"${short}\"`);

      let res = await this.get(short);
      if(!res) {
        log.ERR("Not found");
        return reject({ notFound: true });
      };
      if(res.owner != owner && !admin) {
        log.ERR("Not owner");
        return reject({ notOwner: true });
      };

      await this.collection.findOneAndDelete({ short });
      resolve(200);
    });
  }

  increase(short) {
    return new Promise(async(resolve, reject) => {
      if(!this.db) {
        log.ERR("You haven\'t connected to the database yet!");
        return reject({ connected: false });
      }
      let res = await this.collection.update({ short }, {
        $inc: {
          click: 1
        }
      });
      if(res.nModified == 0) reject(false);
      else resolve(true);
    });
  }
};

module.exports = DB;

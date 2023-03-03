// Load .env
if(require("fs").existsSync(".env")) require("dotenv").config()
if(!process.env.URI) throw "please create a file named \".env\" and fill it with \"URI=<your MongoDB uri>\""
if(!process.env.email) throw "please add email in .env"
if(!process.env.token) throw "please add token in .env"

// Import module
let express = require("express");
let morgan = require("morgan");
let cookieParser = require("cookie-parser");
let monk = require("monk");
let { bgcolor, color } = require("./lib/color");
let db = require("./lib/db");
let log = require("./lib/log");
let sendEmail = require("./lib/sendmail");
let { makeId } = require("./lib/function");

// Main
let data = new db("shortlink")
data.connect().catch(function(err) {
  console.error(err);
  process.exit(0);
});

let router = express.Router();
let app = express();
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(async function(req, res, next) {
  //if(req.method !== "GET") return next();
  if(req.path.startsWith("/s/")) return next();

  if(!req.cookies["login"] && !req.path.includes("/login") && !req.path.includes("/register") && !req.path.includes("/verify") && !req.path.includes("/apis/")) {
    res.redirect("/login/");
    return !1;
  };

  let { login } = req.cookies;

  let format = { email: btoa("null"), password: btoa("null") }
  try {
    format = JSON.parse(atob(login));
  } catch {}

  let exists = await data.collection.findOne({ email: atob(format.email) })
  if((!exists || exists.password != atob(format.password)) && (!req.path.includes("/login") && !req.path.includes("/register") && !req.path.includes("/verify") && !req.path.includes("/api") && !req.path.includes("/apis/"))) {
    res.clearCookie("login");
    res.redirect("/login");
    return !1;
  };

  if(req.cookies["login"] && (req.path.includes("/login") || req.path.includes("/register") || req.path.includes("/verify"))) {
    res.redirect("/");
    return !1;
  };

  res.login = {
    email: atob(format.email),
    password: atob(format.password)
  };

  if(req.path.includes("/admin") && res.login.email != process.env.admin) return res.redirect("/notFound");

  next();
});
app.use(express.static("public"));
app.set("port", process.env.PORT || 8080);

app.get("/apis/list", async function(req, res) {
  const { apikey } = req.query;
  if(!apikey) return res.status(411).send({
    error: 411,
    message: "Apikey is Required!"
  });

  const acc = await data.collection.findOne({ apikey });
  if(!acc) return res.status(404).send({
    error: 404,
    message: "Apikey not found!"
  });

  await data.increase("hit", apikey);
  let short = await data.collection.find({ owner: acc.email });
  short = short.map((v, i) => ({
    number: Number(i) + 1,
    url: v.url,
    short: v.short,
    click: v.click
  }));
  res.status(200).send(short);
});

app.get("/apis/short", async function(req, res) {
  let { apikey, url, alias } = req.query;
  alias = alias || makeId(10);
  if(!/^[A-z0-9_-]{3,10}$/.test(alias)) return res.status(400).send({
    error: true,
    message: "Only letters A-z, 0-9, \"_\" and \"-\" are allowed"
  });

  if(!apikey) return res.status(411).send({
    error: 411,
    message: "Apikey is Required!"
  });

  const acc = await data.collection.findOne({ apikey });
  if(!acc) return res.status(404).send({
    error: 404,
    message: "Apikey not found!"
  });

  let hit = await data.increase("hit", apikey);
  let result;

  try {
    result = await data.set(url, alias, acc.email);
  } catch(e) {
    if(e.exists) return res.status(403).send({
      error: true,
      message: "alias already exists"
    });
    return res.status(500).send({
      error: true,
      message: "Internal Server Error",
      stack: e.stack
    });
  };

  res.status(200).send({
    realUrl: url,
    url: req.protocol + "://" + req.get("host") + "/s/" + alias,
    alias,
    hit
  });
});

app.get("/apis/delete", async function(req, res) {
  let { apikey, alias } = req.query;
  if(!apikey) return res.status(411).send({
    error: 411,
    message: "Apikey is Required!"
  });

  const acc = await data.collection.findOne({ apikey });
  if(!acc) return res.status(404).send({
    error: 404,
    message: "Apikey not found!"
  });

  let hit = await data.increase("hit", apikey);
  let result;

  try {
    result = await data.delete(alias, acc.email);
  } catch(e) {
    if(e.notFound) return res.status(404).send({
      error: true,
      message: "alias not found"
    });
    if(e.notOwner) return res.status(401).send({
      error: true,
      message: "You are not the owner of the short link"
    });
    return res.status(500).send({
      error: true,
      message: "Internal Server Error",
      stack: e.stack
    });
  };

  res.status(200).send({
    status: 200,
    message: "Success removing the short link"
  });
});


app.get("/api/list", async function(req, res) {
  let list = await data.collection.find({ owner: res.login.email });
  list = list.map((v, i) => ({
    number: Number(i) + 1,
    url: v.url,
    short: v.short,
    click: v.click
  }));
  res.status(200).send(list);
});

app.get("/api_admin/list", async function(req, res) {
  if(res.login.email != process.env.admin) return res.status(401).send({
    error: true,
    message: "You are not an Admin/Developer of this site!"
  });

  let list = await data.collection.find({})
  list = list.filter(v => typeof v.click == "number").map((v, i) => ({
    number: Number(i) + 1,
    url: v.url,
    short: v.short,
    owner: v.owner,
    click: v.click
  }));
  res.status(200).send(list);
});

app.post("/api_admin/delete", async function(req, res) {
  let { short } = req.body;
  try {
    if(res.login.email != process.env.admin) return res.status(401).send({
      error: true,
      message: "You are not an Admin/Developer of this site!"
    });

    await data.delete(short, res.login.email, true);
    res.status(200).send({
      error: false,
      message: "Success"
    });
  } catch(e) {
    if(e.notFound) return res.status(404).send({
      error: true,
      message: `Shortlink "${short}" not found`
    });

    log.ERR(`An error occurred while deleting "${short}"`)
    console.error(e);
    res.status(500).send(e);
  };
});

app.post("/api/delete", async function(req, res) {
  let { short } = req.body;
  try {
    await data.delete(short, res.login.email);
    res.status(200).send({
      error: false,
      message: "Success"
    });
  } catch(e) {
    if(e.notFound) return res.status(404).send({
      error: true,
      message: `Shortlink "${short}" not found`
    });

    log.ERR(`An error occurred while deleting "${short}"`)
    console.error(e);
    res.status(500).send(e);
  };
});
app.post("/api/edit", async function(req, res) {
  let { short, new: nw } = req.body;
  try {
    await data.edit(short, nw, res.login.email);
    res.status(200).send({
      error: false,
      message: "Success"
    });
  } catch(e) {
    if(e.notFound) return res.status(404).send({
      error: true,
      message: `Shortlink "${short}" not found`
    });

    log.ERR(`An error occurred while editing "${short}"`)
    console.error(e);
    res.status(500).send(e);
  };
});
app.post("/api/login", async function(req, res) {
  let { email, password, remember } = req.body;
  if(!email) return res.status(411).send({
    error: true,
    message: "email required"
  });
  if(!password) return res.status(411).send({
    error: true,
    message: "password required"
  });

  let exists = await data.collection.findOne({ email })
  if(!exists) return res.status(404).send({
    error: true,
    message: "User not found"
  });

  if(exists.password !== password) return res.status(401).send({
    error: true,
    message: "Incorrect password"
  });

  res.cookie("login", btoa(JSON.stringify({
    email: btoa(email),
    password: btoa(password)
  })), {
    maxAge: remember === "on" ? (1000*60*60*24*30*12) : (1000*60*60*24*3) // 3 days if "Remember me" is unchecked
  });

  res.status(200).send({
    error: false,
    message: "success login"
  });
});
app.post("/api/register", async function(req, res) {
  let { email, username, password } = req.body;
  if(!email) return res.status(411).send({
    error: true,
    message: "email required"
  });
  if(!username) return res.status(411).send({
    error: true,
    message: "username required"
  });
  if(!password) return res.status(411).send({
    error: true,
    message: "password required"
  });

  let blocked = [
    process.env.email
  ];
  if(blocked.includes(email)) return res.status(403).send({
    error: true,
    message: "email blocked"
  });

  let exists = await data.collection.findOne({ email })
  if(exists) return res.status(403).send({
    error: true,
    message: "email or username already registered"
  });

  if(!/\S+@\S+\.\S+/.test(email)) return res.status(400).send({
    error: true,
    message: "Invalid email"
  });
  if(!/[A-z0-9_]+$/.test(username)) return res.status(400).send({
    error: true,
    message: "Invalid username"
  });

  let { _id } = await data.collection.insert({
    email,
    username,
    password,
    verified: false
  });
  let id = _id.toHexString()
  let url = req.protocol + "://" + req.get("host")

  await sendEmail(email, "Verify account", `
Thank you for signing up for Shortlink, a free link shortening website.
<br><br>
To shorten the link, please activate your account by clicking <a href="${url}/verify/${id}">here</a>.
`.trim());

  res.status(200).send({
    error: false,
    message: "Successfully created a user, check your email to verify the account"
  });
});

app.get("/verify/:id", async function(req, res, next) {
  let id = req.params.id;
  let find = false;
  try {
    find = await data.collection.findOne({ _id: id });
  } catch {}

  if(find) {
    if(!find.verified) await data.collection.update({ _id: id }, {
      $set: {
        verified: true
      }
    })
    res.redirect("/login/");
  } else next();
});
app.post("/api/short", async function(req, res) {
  let { url, alias } = req.body;
  if(!url) return res.status(411).send({
    error: true,
    message: "url required"
  });

  let { login } = req.cookies;

  let format = {}
  try {
    format = JSON.parse(atob(login));
  } catch {}
  if(!format.email) return res.status(411).send({
    error: true,
    message: "email required"
  });
  if(!format.password) return res.status(411).send({
    error: true,
    message: "password required"
  });

  let exists = await data.collection.findOne({ email: atob(format.email) })
  if(!exists) return res.status(404).send({
    error: true,
    message: "User not found"
  });
  if(exists.password !== atob(format.password)) return res.status(401).send({
    error: true,
    message: "Incorrect password"
  });

  alias = alias || makeId(10);
  if(!/^[A-z0-9_-]{3,10}$/.test(alias)) return res.status(400).send({
    error: true,
    message: "Only letters A-z, 0-9, \"_\" and \"-\" are allowed"
  });

  try {
    await data.set(url, alias, exists.email);
  } catch(e) {
    if(e.exists) return res.status(403).send({
      error: true,
      message: "alias already exists"
    });
    return res.status(500).send(e);
  };
  let result = req.protocol + "://" + req.get("host") + "/s/" + alias;
  res.status(200).send({
    error: false,
    message: `Successfully added link\n${result}`
  });
});

app.post("/api/getKey", async function(req, res) {
  let { login } = req.cookies;

  let format = {}
  try {
    format = JSON.parse(atob(login));
  } catch {}
  if(!format.email) return res.status(411).send({
    error: true,
    message: "email required"
  });
  if(!format.password) return res.status(411).send({
    error: true,
    message: "password required"
  });

  let exists = await data.collection.findOne({ email: atob(format.email) })
  if(!exists) return res.status(404).send({
    error: true,
    message: "User not found"
  });
  if(exists.password !== atob(format.password)) return res.status(401).send({
    error: true,
    message: "Incorrect password"
  });

  try {
    const result = await data.apikey(exists.email);
    res.status(200).send(result);
  } catch(e) {
    return res.status(500).send(e);
  };
});

app.get("/s/:id", async function(req, res, next) {
  let id = req.params.id;
  let get = await data.get(id);
  if(!get) return next();
  await data.increase("short", id);

  res.redirect(get.url);
});


app.get("/404", async(req, res, next) => {
  next()
})
app.use(async(req, res, next) => {
  res.status(404).send(`<!DOCTYPE html>
<html>
  <head>
    <title>404 - Not Found</title>
    <style>
      html, body{
        margin: 0;
        padding: 0;
        text-align: center;
        font-family: sans-serif;
        background-color: #E7FFFF;
      }

      h1, a{
        margin: 0;
        padding: 0;
        text-decoration: none;
      }

      .section{
        padding: 4rem 2rem;
      }

      .section .error{
        font-size: 150px;
        color: #008B62;
        text-shadow:
          1px 1px 1px #00593E,
          2px 2px 1px #00593E,
          3px 3px 1px #00593E,
          4px 4px 1px #00593E,
          5px 5px 1px #00593E,
          6px 6px 1px #00593E,
          7px 7px 1px #00593E,
          8px 8px 1px #00593E,
          25px 25px 8px rgba(0,0,0, 0.2);
      }

      .page{
        margin: 2rem 0;
        font-size: 20px;
        font-weight: 600;
        color: #444;
      }

      .back-home{
        display: inline-block;
        border: 2px solid #222;
        color: #222;
        text-transform: uppercase;
        font-weight: 600;
        padding: 0.75rem 1rem 0.6rem;
        transition: all 0.2s linear;
        box-shadow: 0 3px 8px rgba(0,0,0, 0.3);
      }
      .back-home:hover{
        background: #222;
        color: #ddd;
      }
    </style>
  </head>
  <body>
    <div class="section">
      <h1 class="error">404</h1>
      <div class="page">Oops!!! The page you are looking for was not found</div>
      <a class="back-home" href="/">Home</a>
    </div>
  </body>
</html>
`.trim())
})



app.listen(app.get("port"));

console.log(`Running at port ${app.get("port")}`);

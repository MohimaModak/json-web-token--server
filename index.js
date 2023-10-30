const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const { JsonWebTokenError } = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Can i complete JWT project??");
});

const logger = async (req, res, next) => {
  console.log("called", req.hostname, req.originalUrl);
  next();
};
//  ek kothai logger middleware er maddhome website e asa user er details track kora jai.server kon route e user jacche asche seta track kora jay
// client site er je je methoder vitore rakha hoy oi sokol route e user asche ki na seta track kora jay

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log("value of token in middleware", token);
  if (!token) {
    return res.status(401).send({ message: "not authorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "unauthorized" });
    }
    console.log("value in the token", decoded);
    req.user = decoded;
    next();
  });
};

const uri =
  "mongodb+srv://mmodak550:5lidG8wIUO5NDyFX@cluster0.ggrxkpr.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// self middleware

async function run() {
  try {
    await client.connect();

    // auth
    // app.post("/jwt", async (req, res) => {
    //   const user = req.body;
    //   console.log(user);
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    //     expiresIn: "1h",
    //   });
    //   res
    //     .cookie("token", token, {
    //       httpOnly: true,
    //       secure: false,
    //       sameSite: "none",
    //     })
    //     .send({ success: true });
    // });

    app.post("/jwt", logger, async (req, res) => {
      const user = req.body;
      console.log(user);

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "30d",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    // service
    const database = client.db("JsonWebTokenDB");
    const sixCategoryCollection = database.collection("JsonWebToken");

    const bookingDatabase = client.db("BookingDB");
    const bookingCollection = bookingDatabase.collection("bookingCollection");

    // 6 category home page
    app.get("/home", async (req, res) => {
      const sixCategory = sixCategoryCollection.find();
      const result = await sixCategory.toArray();
      res.send(result);
    });

    //per category bookingpage
    app.get("/home/:name", async (req, res) => {
      const name = req.params.name;
      const query = { name: name };
      const options = {
        projection: { _id: 0, title: 1, description: 1, image: 1, name: 1 },
      };
      const result = await sixCategoryCollection.findOne(query, options);
      res.send(result);
    });

    app.post("/booking", logger, async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.get("/booking", logger, verifyToken, async (req, res) => {
      //  booking er vitore verifytoken dile booking er data ase na
      console.log(req.query.email);
      // console.log("tok tok tok", req.cookies);
      console.log("from valid token", req.user);
      if (req.query.email !== req.user.email) {
        return res;
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/booking/:id", logger, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`try to complete the project god stay with me please ${port}`);
});

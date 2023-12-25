const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const port = process.env.PORT || 5000;
const { MongoClient, ObjectId ,ServerApiVersion} = require("mongodb");

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qaohrfy.mongodb.net/?retryWrites=true&w=majority`;
// const uri = "mongodb://0.0.0.0:27017/";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri);

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db("taskManagementDb").collection("users");
    const taskCollection = client.db("taskManagementDb").collection("task");

//jwt related api
app.post("/jwt", async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });
  // console.log(token)
  // res.send({token:token})
  res.send({ token }); //short hand
});

//middleware
const verifyToken = (req, res, next) => {
  console.log("inside verify token", req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};


app.post("/users", async (req, res) => {
  const user = req.body;
  // insert email if user dosent exist
  // you can do this many ways (1.email unique, 2.upsert 3.simple checking)
  const query = { email: user.email };
  // console.log(query)
  const existingUser = await userCollection.findOne(query);
  if (existingUser) {
    return res.send({ message: "user already exists", insertedId: null });
  }

  const result = await userCollection.insertOne(user);
  res.send(result);
});



 //task related apis
 app.get("/task", async (req, res) => {
  const result = await taskCollection.find().toArray();
  res.send(result);
});

app.get("/task/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId (id) };
  const result = await taskCollection.findOne(query);
  res.send(result);
});

app.post("/task", verifyToken ,async (req, res) => {
  const item = req.body;
  console.log(item);
  const result = await taskCollection.insertOne(item);
  res.send(result);
});

app.patch("/task/:id", async (req, res) => {
  const item = req.body;
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      title: item.title,
      description: item.description,
      deadline: item.deadline,
      priority: item.priority,
     
    },
  };

  const result = await taskCollection.updateOne(filter, updatedDoc);
  res.send(result);
});

app.delete("/task/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await taskCollection.deleteOne(query);
  res.send(result);
});





    // Send a ping to confirm a successful connection
    // await client.db("").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Task management is running ");
  });
  
  app.listen(port, () => {
    console.log(`Task Management Running on port ${port}`);
  });
  

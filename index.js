const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded.decoded;
        next();
    })
}


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ktpzdpn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const houseCollection = client.db("houseDB").collection("houses");
    const usersCollection = client.db("houseDB").collection("allusers");

    app.post('/jwt', (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
        res.send({ token })
    })

    app.post('/allusers', async(req, res) =>{
        const {name, role, phone, email, password} = req.body;
        const existingUser = await usersCollection.findOne({email});
        if(existingUser){
            return res.status(400).json({message: 'This user already exist'})
        }

        await usersCollection.insertOne({name, role, phone, email, password});
        return res.status(200).json({message: 'Registration Successfull'});
    })

    app.post('/login', async(req, res) =>{
        const {email, password} = req.body;
        const user = await usersCollection.findOne({email});

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        res.status(200).json({ message: 'Login successfull', user });
    })

    app.get('/houses', async(req, res) =>{
        const result = await houseCollection.find().toArray();
        res.send(result);
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) =>{
    res.send('house hunter is running')
})

app.listen(port, () => {
    console.log(`house hunter is running on port ${port}`);
})
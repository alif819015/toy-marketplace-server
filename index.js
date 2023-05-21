const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xnalm4u.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();

    const toyCollection = client.db('SuperToyDB').collection('toyes');

    const indexKey = { toyName: 1, seller: 1};
    const indexOptions = { name: "toyNameSeller"};
    
    const result = await toyCollection.createIndex(indexKey, indexOptions);

    app.get("/toySearchByName/:text", async(req, res) => {
        const searchText = req.params.text;
        const result = await toyCollection
        .find({
            $or: [
                { toyName: {$regex: searchText, $options: "i"}},
                { seller: { $regex: searchText, $options: "i"}},
            ],
        })
        .toArray();
        res.send(result);
    });

    app.get('/allToys/:id', async(req,res) =>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await toyCollection.findOne(query);
        res.send(result);
    })

    app.post('/postToys', async(req, res) =>{
        const body = req.body;
        if(!body){
            return res.status(404).send({message: "body data not found"})
        }
        const result = await toyCollection.insertOne(body);
        res.send(result);
        console.log(result);
    });

    app.put('/postToys/:id', async(req, res)=> {
        const id =req.params.id;
        const filter = {_id: new ObjectId(id)}
        const options = {upsert: true};
        console.log(options)
        const updateToy = req.body;
        const Toy = {
            $set: {
                image: updateToy.image, 
                price: updateToy.price, 
                email: updateToy.email, 
                color: updateToy.color, 
                retting: updateToy.retting, 
                toyName: updateToy.toyName, 
                quantity: updateToy.quantity, 
                description: updateToy.description, 
                date: updateToy.date, 
                seller: updateToy.seller, 
                retting: updateToy.retting
            }
        }
        const result = await toyCollection.updateOne(filter, Toy);
        res.send(result);
    })

    app.get("/allToys", async(req, res) => {
        const result = await toyCollection.find({}).toArray();
        res.send(result);
    })

    //bookings
    app.get('/toy-mail', async (req, res) =>{
        console.log(req.query.email)
        let query = {};
        if(req.query?.email){
            query = {email: req.query.email}
        }
        const result = await toyCollection.find(query).toArray();
        res.send(result);
    })

    app.patch('/allToys/:id', async(req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id)};
        const updatedToy = req.body;
        const updateDoc = {
            $set: {
                status: updatedToy.status
            },
        };
        const result = await toyCollection.updateOne(filter, updateDoc);
        res.send(result);
    })

    app.delete('/allToys/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await toyCollection.deleteOne(query);
        res.send(result);
    })

    // Shop by category 

    const CategoryCollection = client.db('SuperToyDB').collection('ShopCategory');

    app.get("/all-categories", async(req, res) => {
        const result = await CategoryCollection.find({}).toArray();
        res.send(result);
    })

    // app.get('/all-categories/:id', async(req,res) =>{
    //     const id = req.params.id;
    //     const query = {_id: new ObjectId(id)}
    //     const result = await CategoryCollection.findOne(query);
    //     res.send(result);
    // })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res) =>{
    res.send('Server is running')
})

app.listen( port, ()=>{
    console.log(`toy server running on: ${port}`)
})
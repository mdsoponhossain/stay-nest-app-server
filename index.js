const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//middlewar ;user  & pass: 
app.use(cors());
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yfrjdbj.mongodb.net/?retryWrites=true&w=majority`;



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

      
        const database = client.db('stayNestDB');
        const collection = database.collection('stayNestCollection');
        const userBooking = database.collection('userBooking');


        app.get('/rooms', async(req, res)=>{
            const sortField = req.query.sortField;
            const pageNumber = parseFloat(req.query.currentPage) ;
            const itemsPerPage = parseFloat(req.query.itemsPerPage) ;
            const skip = itemsPerPage * pageNumber ;
            const limit = itemsPerPage ;
            // console.log('kkkkkkkk', pageNumber, itemsPerPage)
            const sortOrder = parseFloat(req.query.sortOrder);
            let sortObj = {};
            if(sortField && sortOrder){
                sortObj[sortField] = sortOrder ;
            }
            // console.log(sortObj)


            // console.log(sortField,sortOrder)
            const cursor = collection.find().skip(skip).limit(limit).sort(sortObj)
            const result  = await cursor.toArray();
            res.send(result)
        })



        app.get('/rooms/:id', async(req, res)=>{
            const id = req.params.id;
            // console.log('single room id:',id)
            const query = { _id: new ObjectId(id)};
            const result = await collection.findOne(query);
            res.send(result)

        })

        app.get('/roomsCount', async(req, res)=>{
            const totalRoom = await collection.estimatedDocumentCount();
            // console.log(totalRoom)
            res.send({totalRoom})
        })


        app.get('/my-bookings/:userEmail',async(req,res)=>{
            const userEmail = req.params.userEmail ;
            // const query = { person : userEmail};
            const query = { person : userEmail};
            console.log(123,query);
            const cursor = await userBooking.find(query).toArray();
            res.send(cursor)

        })

        app.post('/room-booking',async(req,res)=>{
            const userBookingInfo = req.body
            // console.log(userBookingInfo);
            const result = await userBooking.insertOne(userBookingInfo);
            res.send(result)
        })




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('stay nest server is running')
})

app.listen(port, () => {
    console.log(`stay nest server is runnig on the port ${port}`)
})
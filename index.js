const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//middlewar ;
app.use(express.json())

app.use(cors({
    origin: ['https://stay-nest.web.app','http://localhost:5173'],
    credentials: true
}));
app.use(cookieParser())

const tokenVerify = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).send("Unauthorized")
    }
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send('Forbidden')
        }
        else {

            req.user = decoded;
            next();
        }
    })


}



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
        // await client.connect();


        const database = client.db('stayNestDB');
        const collection = database.collection('stayNestCollection');
        const userBooking = database.collection('userBooking');
        const aboutUs = database.collection('aboutUs');


        app.get('/rooms', async (req, res) => {
            const sortField = req.query.sortField;
            const pageNumber = parseFloat(req.query.currentPage);
            const itemsPerPage = parseFloat(req.query.itemsPerPage);
            const skip = itemsPerPage * pageNumber;
            const limit = itemsPerPage;

            const sortOrder = parseFloat(req.query.sortOrder);
            let sortObj = {};
            if (sortField && sortOrder) {
                sortObj[sortField] = sortOrder;
            }



            // console.log(sortField,sortOrder)
            const cursor = collection.find().skip(skip).limit(limit).sort(sortObj)
            const result = await cursor.toArray();
            res.send(result)
        })




        app.get('/rooms/:id', async (req, res) => {
            const id = req.params.id;
            // console.log('single room id:',id)
            const query = { _id: new ObjectId(id) };
            const result = await collection.findOne(query);
            res.send(result)

        })

        app.get('/roomsCount', async (req, res) => {
            const totalRoom = await collection.estimatedDocumentCount();
            // console.log(totalRoom)
            res.send({ totalRoom })
        })


        app.get('/my-bookings/:userEmail', tokenVerify, async (req, res) => {
            const userEmail = req.params.userEmail;
            if (req.user.email !== userEmail) {
                return res.status(403).send('Forbidden')
            }
            const query = { person: userEmail };
            console.log(123, userEmail);
            const cursor = await userBooking.find(query).toArray();
            res.send(cursor)

        })


        app.get('/about-us', async (req, res) => {
            const userBookingInfo = req.body;

            const cursor = aboutUs.find()
            const result = await cursor.toArray();
            res.send(result)
        })






        app.post('/room-booking', async (req, res) => {
            const userBookingInfo = req.body;

            // console.log(userBookingInfo);
            const result = await userBooking.insertOne(userBookingInfo);
            res.send(result)
        })



        app.patch('/rooms-upadate/:id', async (req, res) => {
            const id = req.params.id;
            const updateRoomInfo = req.body.seat;
            // const add = req.body.add;
            // console.log(44, updateRoomInfo)
            const filter = { _id: new ObjectId(id) }
            const data = await collection.findOne(filter);
            const seat = data.seat;
            const currentSeat = seat - updateRoomInfo;
            // console.log(99999, data.seat)
            // console.log(3333, seat - updateRoomInfo)

            // console.log('add add ', add)

            const upadateDoc = {
                $set: {
                    seat: currentSeat,
                }
            }
            const result = await collection.updateOne(filter, upadateDoc);
            res.send(result)
        })



        //from delete ;
        app.patch('/rooms-upadate-seat/:id', async (req, res) => {
            const id = req.params.id;
            const updateRoomInfo = req.body.seat;
            // const add = req.body.add;
            console.log(44, updateRoomInfo)
            const filter = { _id: new ObjectId(id) }
            const data = await collection.findOne(filter);
            const seat = data.seat;
            const currentSeat = seat + updateRoomInfo;
            console.log(99999, data.seat)
            // console.log(3333, seat - updateRoomInfo)

            // console.log('add add ', add)

            const upadateDoc = {
                $set: {
                    seat: currentSeat,
                }
            }
            const result = await collection.updateOne(filter, upadateDoc);
            res.send(result)
        })


        //oooo

        app.patch('/update-date/:id', async (req, res) => {
            const id = req.params.id;
            const date = req.body;
            console.log(444, date.date)
            console.log(111, id);
            const filter = { _id: new ObjectId(id) }
            // const data = await userBooking.findOne(filter);

            const upadateDoc = {
                $set: {
                    date: date.date,
                }
            }
            const result = await userBooking.updateOne(filter, upadateDoc);
            res.send(result)

        })







        app.patch('/client-review/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const review = req.body.userFeedback;//from client-side
            console.log(111,review)
            const filter = { _id: new ObjectId(id) }
            const data = await collection.findOne(filter);
            console.log(222,data)


            const reviews = data.reviews //from db
            reviews.push(review)

            console.log('find find find:', reviews)


            const upadateDoc = {
                $set: {
                    reviews: reviews
                }
            }

            const result = await collection.updateOne(filter, upadateDoc);
            res.send(result)
        })



        app.delete('/booking-delete/:deleteId', async (req, res) => {
            const deleteId = req.params.deleteId;
            // console.log(999999,deleteId);
            const query = { _id: new ObjectId(deleteId) };
            const result = await userBooking.deleteOne(query);
            res.send(result)
        })




        app.post('/access-token', async (req, res) => {
            const user = req.body;

            const token = jwt.sign(
                user, process.env.TOKEN_SECRET, { expiresIn: '1h' }
            )

            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ success: true })

        })


        app.post('/clear-token', async (req, res) => {
            console.log('hello');
            res.clearCookie('token', {
                maxAge: 0, secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
            }).send({ success: true })
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



app.get('/', (req, res) => {
    res.send('stay nest server is running')
})

app.listen(port, () => {
    console.log(`stay nest server is runnig on the port ${port}`)
})






















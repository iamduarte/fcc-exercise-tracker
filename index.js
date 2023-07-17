const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  exercises:[
  {
    _id: false,
    description: {type: String, required: true},
    duration: {type: Number, required: true},
    date: String
  }
  ]
})

let user = mongoose.model('user', userSchema)

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json()) 
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


//Post for creating new user
app.post("/api/users", (req, res) => {
  const newUsername = req.body.username
  if(!newUsername){
    res.json({error:"username not found"})
  } else{
    let newuser = new user ({username: newUsername})
    newuser.save().then(savedUser => {
    res.json({username:savedUser.username, _id:savedUser._id.toString()})
    })
  }
})

//GET to retrieve all users
app.get("/api/users", (req, res) => {
  user.find()
    .then(users => {
      res.json(users)
    })
})

app.post("/api/users/:_id/exercises", (req, res) => {

//Gather date and format it, if there is no date generates current date  
  let date = req.body.date
  
  if(date === '' || !date){
    date = new Date().toDateString()
  } else {
    dateParts = date.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    date = new Date(year, month, day).toDateString();
  }

//Create exercise object and populates it with provided info
  const newExercise = {
    description: req.body.description,
    duration: +req.body.duration,
    date: date
  }

 userId = req.params._id
  
//find user document with userId

async function findUSerWithId() {
      try {
        const foundUser = await user.find({ _id: userId}).exec();

        //push exercise object into exercises array in user document
        foundUser[0].exercises.push(newExercise)

        //Save changes to DB and return res.json in the desired format
        foundUser[0].save().then(savedUser => {
          res.json({
            _id: userId,
            username:foundUser[0].username,
            date: newExercise.date, 
            duration: newExercise.duration,
            description: newExercise.description
          })
        })
      } catch (error) {
          console.log(error);
      }
    }
  findUSerWithId() 
})

app.get("/api/users/:_id/logs", (req, res) => {
//Gather data from url
  const userId =  req.params._id
  let from = req.query.from
  let to = req.query.to
  let limit = +req.query.limit
  
//format dates to treat data
  let dateFormat = (date) => {
    dateParts = date.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    date = new Date(year, month, day).toDateString();
    return date
  }


//Find user by Id
  async function findUSerWithId() {
        try {
          const foundUser = await user.find({ _id: userId}).exec();
          //Gets exercises Array from foundUser[0].exercises
          let exercisesArray = foundUser[0].exercises
          //Sorts exercises by date descending
          exercisesArray.sort((a, b) => new Date(b.date) - new Date(a.date));
          
//Changes exercisesArray according to the provided query values
          if(from){
            exercisesArray = exercisesArray.filter((exercise) => {
                  const exerciseDate = new Date(exercise.date);
                  const fromDate = new Date(from);
                  return exerciseDate >= fromDate;
                });
          }
          if(to){
            exercisesArray = exercisesArray.filter((exercise) => {
              const exerciseDate = new Date(exercise.date);
              const toDate = new Date(to);
              return exerciseDate <= toDate;
            });
          }
          if(limit){
            exercisesArray = exercisesArray.slice(0, limit)
          }
          //Count number of saved exercises.
          const count = exercisesArray.length
          
          res.json({
            _id: userId,
            username: foundUser[0].username,
            from: from,
            to: to,
            count: count,
            log: exercisesArray
          })
          }
         catch (error) {
            console.log(error);
        }
      }
  findUSerWithId()
})

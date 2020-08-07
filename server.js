require('dotenv').config()
const morgan = require('morgan')
const express = require('express')
const exphbs = require('express-handlebars')
// Requiring passport as we've configured it
// const passport = require('./config/passport')
// const session = require("express-session");
const session = require('cookie-session')
const db = require('./models')
const passport = require('./config/passport.js')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(morgan('dev'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static('public'))

console.log(__dirname)

// Handlebars
app.engine(
  'handlebars',
  exphbs({
    defaultLayout: 'main'
  })
)
app.set('view engine', 'handlebars')
// We need to use sessions to keep track of our user's login status
app.use(
  session({ secret: 'keyboard cat', resave: true, saveUninitialized: true })
)
app.use(passport.initialize())
app.use(passport.session())

app.get('/', function (req, res) {
  res.render('index', { user: req.user })
})

app.get('/login', function (req, res) {
  res.render('login')
})

app.get('/auth/github', passport.authenticate('github'))

app.get(
  '/dashboard',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    // res.redirect("/");
    db.Profile.findAll({}).then((dbResponse) => {
      res.json(dbResponse)
      // res.render("dashboard", dbResponse);
    })

    // https://blue-project-2.herokuapp.com/dashboard
  }
)

// Routes
require('./routes/apiRoutes')(app)
require('./routes/htmlRoutes')(app)

var syncOptions = { force: false }

// If running a test, set syncOptions.force to true
// clearing the `testdb`
if (process.env.NODE_ENV === 'test') {
  syncOptions.force = true
}

// Starting the server, syncing our models ------------------------------------/
db.sequelize.sync(syncOptions).then(function () {
  app.listen(PORT, function () {
    console.log(
      '==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.',
      PORT,
      PORT
    )
  })
})

module.exports = app

import express from "express"
import mongoose from "mongoose"
import path from "path"
const app = express()
const __dirname = process.cwd()
import { User } from "./models/User.js"
import session from "express-session"
import passport from "passport"
import MongoStore from "connect-mongo"
import { Strategy as LocalStrategy } from "passport-local"
import dotenv from "dotenv"

dotenv.config()

const dbUrl = process.env.DB_URL
const secret = process.env.SECRET

app.set("view engine", "ejs")
app.set("views", "views")
app.set(express.static(path.join(__dirname, "public")))
app.use(
  session({
    secret: "aqaqqa",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: "mongodb://localhost:27017/todo-test" }), //* sessionをDBに保存する
    cookie: {
      maxAge: 60 * 60 * 1000, // 1時間 (ミリ秒単位)
    },
  })
)

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate())) //* User.authenticate()　pluginが勝手にやってくれる
passport.serializeUser(User.serializeUser()) //* sessionの中にユーザーを設定する方法
passport.deserializeUser(User.deserializeUser())

app.use(express.json())

app.use(express.urlencoded({ extended: true }))

mongoose
  .connect("mongodb://localhost:27017/todo-test")
  .then(() => console.log("接続完了"))
  .catch((e) => console.log(e))

app.get("/", (req, res) => {
  res.render("index")
})

async function exsistingUser(username) {
  const user = await User.findOne({ username })
  if (user) {
    throw new Error("そのユーザー名は既に登録されています")
  } else {
    return false
  }
}

app.get("/signup", (req, res) => {
  res.render("signup")
})

app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body
    await exsistingUser(username)
    const user = new User({ username }) // ユーザーオブジェクトを作成しないと使えない
    await User.register(user, password) // パスワードを自動的にハッシュ化してユーザーを登録
    req.session.user = user
    res.redirect("/login")
  } catch (e) {
    console.log(e)
    res.status(400).json({ message: e.message })
  }
})

app.get("/login", (req, res) => {
  try {
    const { user } = req.session
    if (user) {
      console.dir(user)
      res.render("login", { user })
    } else {
      res.redirect("/signup")
    }
  } catch (e) {
    res.send(e.message)
  }
})

app.listen(3000, () => {
  console.log("http://localhost:3000")
})

import express from "express"
import mongoose from "mongoose"
import path from "path"
const app = express()
const __dirname = process.cwd()
import { User } from "./models/User.js"
import { Todo } from "./models/Todo.js"
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
app.use(express.static(path.join(__dirname, "public")))
app.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: dbUrl }), //* sessionをDBに保存する
    cookie: {
      maxAge: 60 * 60 * 1000, // 1時間 (ミリ秒単位)
    },
  })
)

app.use(passport.initialize())
app.use(passport.session())
passport.use(User.createStrategy()) //* passport-local-mongooseが提供するメソッド
passport.use(new LocalStrategy(User.authenticate())) //* User.authenticate()　pluginが勝手にやってくれる
passport.serializeUser(User.serializeUser()) //* sessionの中にユーザーを設定する方法
passport.deserializeUser(User.deserializeUser())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

mongoose
  .connect(dbUrl)
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

// 認証ミドルウェア
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect("/login")
}

app.get("/todo", isAuthenticated, async (req, res) => {
  const user = req.user // req.session.user ではなく req.user を使用
  await user.populate("todos") // todosフィールドをpopulate (objectIdしか紐づけてないから)
  const todos = user.todos // todosを定義
  res.render("todo", { user, todos })
})

app.post("/todo", isAuthenticated, async (req, res) => {
  const user = req.user
  const { title } = req.body
  const todo = new Todo({ title, isDone: false, user: user._id })
  await todo.save() // 新しいTodoをデータベースに保存
  user.todos.push(todo) // 新しいTodoをユーザーのtodos配列に追加
  await user.save() // ユーザーの変更をデータベースに保存
  res.redirect("/todo") // リダイレクト後に再度GETリクエストを処理
})

app.get("/signup", (req, res) => {
  res.render("signup")
})

app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body
    await exsistingUser(username)
    const user = new User({ username }) // ユーザーオブジェクトを作成しないと使えない
    await User.register(user, password) // パスワードを自動的にハッシュ化してユーザーを登録
    req.login(user, (err) => {
      if (err) {
        return next(err)
      }
      res.redirect("/todo")
    })
  } catch (e) {
    console.log(e)
    res.status(400).json({ message: e.message })
  }
})

app.get("/login", (req, res) => {
  res.render("login", { user: req.user })
})

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/todo",
    failureRedirect: "/login",
    failureFlash: true,
  })
)

app.listen(3000, () => {
  console.log("http://localhost:3000")
})

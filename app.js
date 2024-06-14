import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()
dotenv.config({
    path: './env'
})

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))
app.use(cookieParser())

import userRoutes from "./routes/user.routes.js"
import blogRoutes from "./routes/blog.routes.js"
import commentRoutes from "./routes/comment.routes.js"
import likesRoutes from "./routes/like.routes.js"

app.use("/api/v1/users",userRoutes)
app.use("/api/v1/blogs",blogRoutes)
app.use("/api/v1/comments",commentRoutes)
app.use("/api/v1/like",likesRoutes)

export { app }
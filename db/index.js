import mongoose from "mongoose";
import { DB_NAME } from "../constant.js"

const connectDB = async () => {
    try {
        
        const connectInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`Mongoose connect successfully!! DB host : ${connectInstance.connection.host}`)

    } catch (error) {
        console.log("MongoDB error : ",error)
        process.exit(1)
    }
}

export default connectDB
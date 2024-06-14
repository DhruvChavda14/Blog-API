import mongoose, {Schema} from "mongoose";

const blogSchema = new Schema({
    user_id :{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    content: {
        type: String,
        trim: true,
        default: ""
    },
    title: {
        type: String,
        require: true,
        trim: true
    }
}, { timestamps : true})

export const Blog = mongoose.model("Blog",blogSchema)
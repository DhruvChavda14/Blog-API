import mongoose, {Schema} from "mongoose"

const commentSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    blogId: {
        type: Schema.Types.ObjectId,
        ref: "Blog"
    },
    comment: {
        type: String
    }
},{timestamps: true})

export const Comment = mongoose.model("Comment",commentSchema)
import mongoose,{Schema} from "mongoose";

const likeSchema = new Schema({
    commentId :{
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    blogId: {
        type: Schema.Types.ObjectId,
        ref: "Blog"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true})

export const Likes = mongoose.model("Likes",likeSchema)
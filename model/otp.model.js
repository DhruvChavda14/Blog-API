import mongoose ,{Schema} from "mongoose";

const otpSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        require: true,
    },
    otp: {
        type: String,
        require: true,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now,
        set: (timestamp) => new Date(timestamp),
        get: (timestamp) => timestamp.getTime()
    }
})

export const Otp = mongoose.model("Otp",otpSchema)
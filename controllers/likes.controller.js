import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../model/user.model.js"
import { Likes } from "../model/likes.model.js";
import mongoose, { mongo } from "mongoose";

const toggleBlogLike = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    const { blogId } = req.params
    if (!userId)
        throw new ApiError(401, "Blog id is required")

    try {

        const user = await User.findById(userId)
        if (!user)
            throw new ApiError(401, "Sign in to like a blog")

        const likeCriteria = {
            blogId,
            likedBy: req.user?._id
        }
        const alreadyLiked = await Likes.findOne(likeCriteria)

        if (!alreadyLiked) {
            const newLike = await Likes.create(likeCriteria)
            if (!newLike)
                throw new ApiError(401, "Error in new Like")

            return res
                .status(201)
                .json(new ApiResponse(201, newLike, "Liked blog"))
        }

        const dislike = await Likes.deleteOne(likeCriteria)
        if (!dislike) {
            throw new ApiError(401, "Error in blog disliked")
        }
        return res.status(201).json(new ApiResponse(201, dislike, "Blog disliked"))

    } catch (error) {
        throw new ApiError(401, "Error in liking blog")
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const userId = req.user?._id
    if (!commentId)
        throw new ApiError(401, "Comment id is required")

    const user = await User.findById(userId)
    if (!user)
        throw new ApiError(401, "Sign is required to like a comment")

    const likeCriteria = {
        commentId,
        likedBy: userId
    }
    const alreadyLiked = await Likes.findOne(likeCriteria)
    if (alreadyLiked) {
        const dislike = await Likes.deleteOne(likeCriteria)
        if (!dislike)
            throw new ApiError(401, "Error in dislike")

        return res.status(201).json(new ApiResponse(201, dislike, "Comment disliked"))
    }

    const newLike = await Likes.create(likeCriteria)
    if (!newLike)
        throw new ApiError(401, "Error in new like")

    return res.status(201).json(new ApiResponse(201, newLike, "Comment liked"))
})

const getLikedComment = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    if (!userId)
        throw new ApiError(404, "Userid not found")

    const likeComment = await Likes.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        // Step 2: Lookup to join with comments collection
        {
            $lookup: {
                from: "comments", // Name of the comments collection
                localField: "commentId",
                foreignField: "_id",
                as: "likedComment"
            }
        },
        // Step 3: Unwind the likedComment array
        {
            $unwind: "$likedComment"
        },
        // Step 4: Group by commentId and count likes
        {
            $group: {
                _id: "$commentId",
                numberOfLikes: { $sum: 1 },
                likedComment: { $first: "$likedComment" }
            }
        },
        // Step 5: Project the required fields
        {
            $project: {
                _id: 0,
                commentId: "$_id",
                numberOfLikes: 1,
                likedComment: 1
            }
        },
        // Step 6: Sort by number of likes in descending order
        {
            $sort: { numberOfLikes: -1 }
        }
    ])
    if (!likeComment)
        throw new ApiError(401, "Error in getting liked comments")

    return res
        .status(201)
        .json(new ApiResponse(201, likeComment, "All liked comment fetched successfully!!"))
})

const getLikedBlog = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    if (!userId)
        throw new ApiError(401, "User id not found")

    const likedBlog = await Likes.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "blogs",
                localField: "blogId",
                foreignField: "_id",
                as: "likedBlog"
            }
        },
        {
            $unwind: "$likedBlog"
        },
        {
            $group: {
                _id: "$blogId",
                numberOfLikes: {$sum: 1},
                likedBlog: {$first : "$likedBlog"}
            }
        },
        {
            $project: {
                _id: 0,
                blogId: "$_id",
                numberOfLikes: 1,
                likedBlog: 1
            }
        },
        {
            $sort: { numberOfLikes: -1 }
        }
    ])
    if (!likedBlog)
        throw new ApiError(401, "Error in getting like blog")

    return res
        .status(201)
        .json(new ApiResponse(201, likedBlog, "Successfully fetched liked blogs"))
})

export {
    toggleBlogLike,
    toggleCommentLike,
    getLikedBlog,
    getLikedComment
}
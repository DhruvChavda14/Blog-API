import { Blog } from "../model/blog.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Comment } from "../model/comment.model.js"
import mongoose from "mongoose"

const addComment = asyncHandler(async (req, res) => {
    const { blogId } = req.params
    const { comment } = req.body

    if (!blogId || !comment)
        throw new ApiError(401, "All fields are required")

    const blog = await Blog.findById(blogId)
    if (!blog)
        throw new ApiError(404, "Blog not found")

    const newcomment = await Comment.create({
        comment,
        user_id: req.user?._id,
        blogId
    })

    if (!newcomment)
        throw new ApiError(401, "Comment not created")

    return res
        .status(201)
        .json(new ApiResponse(201, newcomment, "Comment created successfully!!"))
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { comment } = req.body
    if (!commentId || !comment)
        throw new ApiError(401, "All fields are required")

    const commentData = await Comment.findById(commentId)
    if (!(commentData.user_id.toString() === req.user?._id.toString())) {
        throw new ApiError(401, "Only login user can update")
    }

    try {
        const updatedComment = await Comment.findByIdAndUpdate(commentId,
            {
                $set: {
                    comment: comment,
                    user_id: req.user?._id
                }
            }, { new: true }
        )
        if (!updatedComment)
            throw new ApiError(401, "Comment not updated")

        return res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"))

    } catch (error) {
        throw new ApiError(401, "Error in updating comment")
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!commentId)
        throw new ApiError(401, "Comment id is required")

    console.log(comment.user_id.toString(), req.user?._id.toString())
    if ((comment.user_id.toString() !== req.user?._id.toString()))
        throw new ApiError(401,"Only login user can delete")
    const deletedcomment = await Comment.findByIdAndDelete(commentId)
    if (!deletedcomment)
        throw new ApiError(404, "Comment not found")

    return res.status(201).json(new ApiResponse(201, {}, "Comment deleted successfully"))
})

const getBlogComment = asyncHandler(async (req, res) => {
    const { blogId } = req.params
    if (!blogId)
        throw new ApiError(401, "Blog id is required")

    const blog = await Blog.findById(blogId)
    if (!blog)
        throw new ApiError(404, "Blog not found")

    const comment = await Comment.aggregate([
        {
            $match: {
                blogId: new mongoose.Types.ObjectId(blogId)
            }
        },
        {
            $lookup: {
                from: "blogs",
                localField: "blogId",
                foreignField: "_id",
                as: "blogComment",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$blogComment"
        },
        {
            $project: {
                _id: 1,
                user_id: 1,
                title: "$blogComment.title",
                comment: 1,
                createdAt: 1,
                updatedAt: 1,
                blogId: 1,
            }
        }
    ])
    if (!comment)
        throw new ApiError(401, "Comment not found")

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comments found successfully!!!"))
})

export {
    addComment,
    updateComment,
    deleteComment,
    getBlogComment,
}
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Blog } from "../model/blog.model.js"
import { User } from "../model/user.model.js"
import mongoose from "mongoose"

const createBlog = asyncHandler(async (req, res) => {
    const { user_id, content, title } = req.body
    if (!(user_id && content && title))
        throw new ApiError(401, "All fields are required")

    const newBlog = await Blog.create({
        user_id,
        content,
        title
    })

    if (!newBlog)
        throw new ApiError(401, "Blog not created")

    return res
        .status(201)
        .json(new ApiResponse(201, newBlog, "Blog created successfully!!"))

})

const updateBlog = asyncHandler(async (req, res) => {
    const { blogId } = req.params
    const { content, title } = req.body
    if (!content && !title)
        throw new ApiError(401, "Content or title is required")

    const blogData = await Blog.findByIdAndUpdate(blogId,
        {
            $set: {
                content: content,
                title: title
            }
        }, { new: true }
    )

    if (!blogData)
        throw new ApiError(401, "Blog not updated")

    return res
        .status(201)
        .json(new ApiResponse(201, blogData, "Blog updated successfully!!"))
})

const deleteBlog = asyncHandler(async (req, res) => {
    const { blogId } = req.params
    if (!blogId)
        throw new ApiError(401, "Blog id is required")

    const deleteBlog = await Blog.findByIdAndDelete(blogId)

    if (!deleteBlog)
        throw new ApiError(401, "Blog not deleted")

    return res
        .status(201)
        .json(new ApiResponse(201, deleteBlog , "Blog deleted successfully!!!"))
})

const getAllBlog = asyncHandler(async(req,res)=>{
    const {user_id} = req.params
    if(!user_id)
        throw new ApiError(401,"UserId is required")

    const pipeline = []
    const user = await User.findById(user_id)
    if(!user)
        throw new ApiError(404,"User not found")

    if (user_id) {
        pipeline.push(
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(user_id)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: {
                        $first: "$owner"
                    }
                }
            }
        );
    }

    Blog.aggregate(pipeline)
    .then(function(result){
        return res.status(201).json(new ApiResponse(201,result,"All Blogs Fetched"))
    })
    .catch(function(error){
        throw new ApiError(401,"Cannot fetch blogs")
    })
})

export {
    createBlog,
    updateBlog,
    deleteBlog,
    getAllBlog
}
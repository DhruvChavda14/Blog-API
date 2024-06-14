import { Router } from "express";
import {
    toggleBlogLike,
    toggleCommentLike,
    getLikedBlog,
    getLikedComment
} from "../controllers/likes.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJWT)

router.route("/toggleComment/:commentId").get(toggleCommentLike)
router.route("/toggleBlog/:blogId").get(toggleBlogLike)
router.route("/likedBlog").get(getLikedBlog)
router.route("/likedComment").get(getLikedComment)

export default router
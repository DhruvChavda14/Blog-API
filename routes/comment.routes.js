import { Router } from "express"
import {
    addComment,
    updateComment,
    deleteComment,
    getBlogComment
} from "../controllers/comments.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJWT)

router.route("/:blogId").post(addComment)
    .get(getBlogComment)

router.route("/update/:commentId").patch(updateComment)
router.route("/:commentId").delete(deleteComment)

export default router
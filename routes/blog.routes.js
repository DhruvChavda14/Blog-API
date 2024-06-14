import { Router } from "express";
import {
    createBlog,
    updateBlog,
    deleteBlog,
    getAllBlog
} from "../controllers/blog.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(verifyJWT)
router.route("/").post(createBlog)
router.route("/update/:blogId").patch(updateBlog)
router.route("/:blogId").delete(deleteBlog)
router.route("/get/:user_id").get(getAllBlog)

export default router
import { Router } from "express";
import {
    registerUser,
    loginUser,
    loggedOutUser,
    forgetPassword,
    refreshAccessToken,
    updateAccountDetails,
    resetPassword
} from '../controllers/user.controller.js'
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,loggedOutUser)
router.route("/forgetPass").post(verifyJWT,forgetPassword)
router.route("/refresh").post(verifyJWT,refreshAccessToken)
router.route("/resetPassword").post(verifyJWT,resetPassword)
router.route("/updateAccnt").patch(verifyJWT,updateAccountDetails)

export default router
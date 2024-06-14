import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../model/user.model.js'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { Otp } from '../model/otp.model.js'


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken

        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access or refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!(name || email || password)) {
        throw new ApiError(401, "All fields are required")
    }
    const existedUser = await User.findOne({
        $or: [{ name }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "Already user exists")
    }

    const user = await User.create({
        name,
        email,
        password
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if (!createdUser) {
        throw new ApiError(500, "User cannot be created")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "User created Successfully"))
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password)
        throw new ApiError(401, "Email or password required")

    const user = await User.findOne({ email })
    if (!user)
        throw new ApiError(404, "user not found")

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid)
        throw new ApiError(401, "Password is incorrect")

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(201, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"))
})

const loggedOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $unset: { refreshToken: 1 }
        }, {
        new: true
    })
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User loggedout Successfully!"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken)
        throw new ApiError(400, "Unauthorized request")

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)
        if (!user)
            throw new ApiError(401, "Invalid refresh token")

        if (incomingRefreshToken !== user?.refreshToken)
            throw new ApiError(401, "Refresh token expired or used")

        const { accessToken, newrefreshToken } = await generateAccessAndRefreshTokens(user?._id)
        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newrefreshToken }, "Access token refreshed successfully"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})


const updateAccountDetails = asyncHandler(async (req, res) => {
    const { name, email } = req.body
    if (!name || !email)
        throw new ApiError(401, "Name or Email is required")

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            name: name,
            email: email
        }
    }, { new: true }
    )
    if (!user)
        throw new ApiError(404, "User not found")

    return res
        .status(201)
        .json(new ApiResponse(201, user, "User updated successfully"))

})

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    requireTLS: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
    },
});

const sendMail = async (email, subject, content) => {
    try {

        let mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: subject,
            html: content
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error)
                console.log(error)

            console.log('Message sent: %s', info.messageId);
        })

    } catch (error) {
        throw new ApiError(400, "Error in sending mail")
    }
}

const checkIfOtpIsExpired = async (expiryDate) => {
    try {

        const nowDate = new Date()
        const timeDifference = nowDate.getTime() - expiryDate
        const dayDifference = Math.round(timeDifference / (3600 * 24 * 1000))
        if (dayDifference > 1)
            return true
        return false

    } catch (error) {
        throw new ApiError(400, "Error in otp is expired")
    }
}

const generateOtp = async () => {
    const otp = Math.floor(100000 + Math.random() * 900000)
    return otp.toString()
}

const forgetPassword = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body
        if (!email)
            throw new ApiError(401, "Email is required")

        const user = await User.findOne({ email })
        if (!user)
            throw new ApiError(404, "user not found")

        const g_otp = await generateOtp()
        if (!g_otp)
            throw new ApiError(400, "otp not generated")


        const cDate = new Date()
        await Otp.findOneAndUpdate(
            { user_id: user._id },
            { otp: g_otp, isVerified: false, timestamp: new Date(cDate.getTime()) },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        )
        const html = '<p>Hii ' + user.name + '<br>Your OTP is <b>' + g_otp + '</b></p>'
        sendMail(email, "Otp for password", html)

        return res
            .status(201)
            .json(new ApiResponse(201, { otpSent: true }, "Otp has been sent to your mail"))


    } catch (error) {

        throw new ApiError(400, "Error in forget Password")
    }
})

const resetPassword = asyncHandler(async (req, res) => {
    const { newPassword, userOtp, email, confirmPassword } = req.body
    if (!newPassword && !userOtp && !email && !confirmPassword)
        throw new ApiError(400, "All fields are required")

    const user = await User.findOne({ email })
    if(!user)
        throw new ApiError(404,"User not found")

    if (newPassword !== confirmPassword)
        throw new ApiError(401, "Password is not same")
    const otpData = await Otp.findOne({ user_id: user._id })
    if (userOtp == otpData.otp){
        otpData.isVerified = true
        otpData.save()
    }
    if (otpData.isVerified != false) {
        const isOtpExpired = await checkIfOtpIsExpired(otpData.timestamp)
        if (isOtpExpired)
            throw new ApiError(401, "Your otp is expired")
        
        user.password = newPassword
        user.save()
        return res.status(201)
            .json(new ApiResponse(201, { otpSent: true, otpVerified: true }, "Your password has been changed successfully"))

    }
    else {
        throw new ApiError(400, "Otp is invalid kindly recheck it")
    }

})

export {
    registerUser,
    loginUser,
    loggedOutUser,
    refreshAccessToken,
    updateAccountDetails,
    forgetPassword,
    resetPassword
}
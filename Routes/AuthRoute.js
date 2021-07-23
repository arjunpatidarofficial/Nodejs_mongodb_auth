const express = require("express");
const createError = require("http-errors");
const User = require("../Models/User.model");
const { authSchema } = require("../Helpers/validation_schema");
const { signAccessToken,signRefreshToken,verifyRefreshToken } = require("../Helpers/jwt_helper");
const router = express.Router();
const  client =require("../Helpers/redis")

router.post("/register", async (req, res, next) => {
	try {
		const result = await authSchema.validateAsync(req.body);

		const doesExist = await User.findOne({ email: result.email });

		if (doesExist)
			throw createError.Conflict(`${result.email}  is already registered`);

		const user = new User(result);
		const savedUser = await user.save();
		const accessToken = await signAccessToken(savedUser.id);
		const refreshToken = await signRefreshToken(savedUser.id);

		res.send({ accessToken, refreshToken });
	} catch (error) {
		if (error.isJoi === true) error.status = 442;
		next(error);
	}
});

router.post("/login", async (req, res, next) => {
	try {
		const result = await authSchema.validateAsync(req.body);
		const user = await User.findOne({ email: result.email });

		if (!user) throw createError.NotFound("User not registered");

		const isMatch = await user.isValidPassword(result.password);

		if (!isMatch) throw createError.Unauthorized("Username/password not valid");

		const accessToken = await signAccessToken(user.id);
		const refreshToken = await signRefreshToken(user.id);

		res.send({ accessToken ,refreshToken});
	} catch (error) {
		if (error.isJoi === true)
			return next(createError.BadRequest("Invalid username/password"));
		next(error);
	}
});

router.post("/refresh-token", async (req, res, next) => {

	try {
		const { refreshToken } =req.body;
		if(!refreshToken) throw  createError.BadRequest();
		const userId = await verifyRefreshToken(refreshToken)

		const newAccessToken = await signAccessToken(userId);
		const newRefreshToken = await signRefreshToken(userId);

		res.send({newAccessToken,newRefreshToken})

	}catch (err) {
	  next(err);
	}

	res.send("refresh-token route");
});

router.delete("/logout", async (req, res, next) => {
	try {
		const { refreshToken } = req.body
		if(!refreshToken) throw createError.BadRequest();
		const userId = await verifyRefreshToken(refreshToken)
		client.DEL(userId,(err,value) =>{
			if (err){
				console.log(err.message)
				throw  createError.InternalServerError();
			}
			console.log(value)
			res.sendStatus(204).send({message:"User successfully logout"});
		})

	} catch (err) {
		next(error)
	}
});

module.exports = router;

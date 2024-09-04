import mongoose from "mongoose"
import passportLocalMongoose from "passport-local-mongoose"
const { Schema } = mongoose

const userSchema = new Schema({
})

userSchema.plugin(passportLocalMongoose)

export const User = mongoose.model("User", userSchema)

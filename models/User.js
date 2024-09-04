import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
  todos: [
    {
      type: Schema.Types.ObjectId,
      ref: "Todo",
    },
  ],
});

userSchema.plugin(passportLocalMongoose);

export const User = mongoose.model("User", userSchema);
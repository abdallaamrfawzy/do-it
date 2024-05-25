const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["USER", "ADMIN"],
        default: "USER",
    },
    image: {
        type: String,
    },
    friends: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ]
    ,
    desires:
    {
        type: Array,
        ref: "User",
    },
    points: {
        type: Number,
    },
    loginStartTime: { type: Date },
    lastUpdatedTime: { type: Date }
});
userSchema.set("toJSON", {
    transform: (doc, result) => {
        const id = result._id;
        delete result._id;
        delete result.password;
        return {
            id,
            ...result,
        };
    },
});


module.exports = mongoose.model("User", userSchema);
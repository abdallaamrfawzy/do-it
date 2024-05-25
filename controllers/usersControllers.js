const User = require("../models/user.js");
const bcrypt = require("bcryptjs");
const generateJWT = require("../utils/generateJWT.js");
const asyncWrapper = require("../utils/asyncWrapper");
const appError = require("../utils/appError.js");
const {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} = require("firebase/storage");
const { firebaseConfig } = require("../config/firebase.js");
const firebase = require("firebase/app");
const initializeFirebase = () => {
    const app = firebase.initializeApp(firebaseConfig);
    return getStorage(app);
};
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({}, { "__v": false, "password": false })
        return res.json({ status: "Success", data: { users } })
    } catch (err) {
        console.log(err);
    }
}

const getUser = asyncWrapper(
    async (req, res, next) => {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (user) {
            return res.json({ "message": "Success", "user": user }).status(200);
        } else {
            const error = appError.create("invalid ID", 400, "FAIL");
            return next(error);
        }
    }
)

const register = asyncWrapper(
    async (req, res, next) => {
        const { username, email, password, desires } = req.body;

        const oldUser = await User.findOne({ email: email });
        if (oldUser) {
            return res.status(400).json({ message: "user already exists", status: "FAIL" });
        }
        const image = req.file;
        const storage = initializeFirebase();
        let imageUrl = "";
        if (image !== null) {
            try {
                const storageRef = ref(storage, image.originalname);
                await uploadBytes(storageRef, image.buffer);
                imageUrl = await getDownloadURL(storageRef);
            } catch (error) {
                console.error("Error uploading image:", error);
                // Handle upload error appropriately (e.g., return error response)
            }
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            desires,
            image: imageUrl,
        })
        const token = await generateJWT({ email: newUser.email, id: newUser._id });
        newUser.token = token;
        newUser.points = 0;
        await newUser.save();
        res.status(201).json({ status: "Success", data: { user: newUser } });
    }
)
const login = asyncWrapper(
    async (req, res, next) => {
        const { email, password } = req.body;
        if (!email || !password) {
            const error = appError.create("Email and password are required", 400, "FAIL");
            return next(error);
        }

        const user = await User.findOne({ email: email });
        if (!user) {
            const error = appError.create("User not found", 400, "FAIL");
            return next(error);
        }

        const matchedPassword = await bcrypt.compare(password, user.password);
        if (matchedPassword) {
            const currentTime = new Date();
            user.loginStartTime = currentTime;
            user.lastUpdatedTime = currentTime;
            await user.save();
            startLoginTimer(user._id);

            const token = await generateJWT({ email: user.email, id: user._id, role: user.role });
            return res.json({ status: "Success", data: { token, id: user._id } });
        } else {
            const error = appError.create("Invalid email or password", 400, "FAIL");
            return next(error);
        }
    }
);

function startLoginTimer(userId) {
    const interval = setInterval(async () => {
        const user = await User.findById(userId);
        if (!user) {
            clearInterval(interval);
            return;
        }

        const currentTime = new Date();
        const elapsedTime = (currentTime - user.loginStartTime) / 1000 / 60;
        if (elapsedTime >= 60) {
            clearInterval(interval);
            user.loginStartTime = null;
            user.lastUpdatedTime = null;
            await user.save();
        } else {
            user.lastUpdatedTime = currentTime;
            await user.save();
        }
    }, 60 * 1000);
}


const updateUser = asyncWrapper(
    async (req, res, next) => {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (user) {
            const storage = initializeFirebase();
            const image = req.file;

            let newImageUrl; // Store the new image URL here

            // Handle image upload if an image is present
            if (image) {
                const storageRef = ref(storage, image.originalname);
                await uploadBytes(storageRef, image.buffer);

                newImageUrl = await getDownloadURL(storageRef);
            }

            // Delete the old image if it exists and a new one was uploaded
            if (user.image && newImageUrl) {
                const oldImageRef = ref(storage, user.image);
                await deleteObject(oldImageRef);
            }

            // Update user data with the new image URL and other changes
            const updatedUser = await User.updateOne(
                { _id: userId },
                { $set: { image: newImageUrl, ...req.body } },
                { new: true }
            );

            return res.status(200).json({ message: "Profile updated Success", user: updatedUser });
        } else {
            const error = appError.create("Invalid ID", 400, "FAIL");
            return next(error);
        }
    }
);

const addFriend = asyncWrapper(
    async (req, res, next) => {
        const userId = req.params.idUser;
        const user = await User.findById(userId);
        if (user) {
            const idFriend = req.params.idFriend;
            const updatedUser = await User.updateOne({ _id: userId }, { $addToSet: { friends: idFriend } }, { new: true });
            return res.status(200).json({ "message": "Friend added Success", "user": updatedUser });
        } else {
            const error = appError.create("Invalid ID", 400, "FAIL");
            return next(error);
        }
    }
);

const getFriends = asyncWrapper(
    async (req, res, next) => {
        const id = req.params.id;
        const user = await User.findById(id).populate({
            path: 'friends',
            select: 'id username email loginStartTime image'
        });

        if (user) {
            const currentTime = new Date();
            const friendsWithLoginTime = user.friends.map(friend => {
                if (!friend.loginStartTime) {
                    return {
                        id: friend.id,
                        username: friend.username,
                        email: friend.email,
                        minutesSinceLogin: null,
                        image: friend.image,
                    };
                }
                const elapsedTime = (currentTime - friend.loginStartTime) / 1000 / 60;
                const minutesSinceLogin = Math.floor(elapsedTime);

                return {
                    id: friend.id,
                    username: friend.username,
                    email: friend.email,
                    minutesSinceLogin: minutesSinceLogin,
                    image: friend.image,
                };
            });
            return res.status(200).json({
                "message": "Friends",
                "friends": friendsWithLoginTime
            });
        } else {
            const error = appError.create("Invalid ID", 400, "FAIL");
            return next(error);
        }
    }
);



const randomDesire = asyncWrapper(
    async (req, res, next) => {
        const id = req.params.id;
        try {
            const user = await User.findById(id).populate({
                path: 'friends',
                select: 'desires username image'
            });

            if (!user) {
                const error = appError.create("invalid ID", 400, "FAIL");
                return next(error);
            }

            const friends = user.friends;
            if (friends.length === 0) {
                return res.status(200).json({ "message": "No friends available" });
            }

            const randomFriend = friends[Math.floor(Math.random() * friends.length)];

            if (randomFriend.desires.length === 0) {
                return res.status(200).json({ "message": "Random friend has no desires" });
            }

            const randomDesire = randomFriend.desires[Math.floor(Math.random() * randomFriend.desires.length)];

            const response = {
                "message": "Random friend and desire",
                "friend": {
                    "id": randomFriend._id,
                    "username": randomFriend.username,
                    "image": randomFriend.image,
                },
                "desire": randomDesire
            };

            return res.status(200).json(response);
        } catch (error) {
            return next(error);
        }
    }
);
const increasePoints = asyncWrapper(
    async (req, res, next) => {
        try {
            const userId = req.params.id;
            const user = await User.findById(userId);

            if (user) {
                user.points += 1;
                const updatedUser = await user.save();

                return res.status(200).json({ "message": "Points increased successfully", "user": updatedUser });
            } else {
                const error = appError.create("Invalid ID", 400, "FAIL");
                return next(error);
            }
        } catch (error) {
            return next(error);
        }
    }
);
const reducePoints = asyncWrapper(
    async (req, res, next) => {
        try {
            const userId = req.params.id;
            const user = await User.findById(userId);

            if (user) {
                user.points -= 1;
                const updatedUser = await user.save();

                return res.status(200).json({ "message": "Points increased successfully", "user": updatedUser });
            } else {
                const error = appError.create("Invalid ID", 400, "FAIL");
                return next(error);
            }
        } catch (error) {
            return next(error);
        }
    }
)



module.exports = {
    getAllUsers,
    register,
    login,
    getUser,
    updateUser,
    addFriend,
    getFriends,
    randomDesire,
    increasePoints,
    reducePoints,
};
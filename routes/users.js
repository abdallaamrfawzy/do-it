const express = require("express");
const router = express.Router();
const usersControllers = require("../controllers/usersControllers");
const verifyToken = require("../utils/verifyToken");
const authValidator = require("../utils/authValidator");
const upload = require("../utils/multer")

router.route("/")
    .get(verifyToken, usersControllers.getAllUsers);

router.route("/register")
    .post(upload.single('image'), authValidator.registerValidator, usersControllers.register)

router.route("/login")
    .post(authValidator.loginValidator, usersControllers.login)
router.route("/:id")
    .get(verifyToken, usersControllers.getUser);
router.route("/:id")
    .put(upload.single('image'), verifyToken, usersControllers.updateUser);
router.route("/addFriend/:idUser/:idFriend")
    .post(verifyToken, usersControllers.addFriend);
router.route("/friends/:id")
    .get(verifyToken, usersControllers.getFriends);
router.route("/randomDesire/:id")
    .get(verifyToken, usersControllers.randomDesire);
router.route("/increasePoints/:id")
    .post(verifyToken, usersControllers.increasePoints);
router.route("/reducePoints/:id")
    .post(verifyToken, usersControllers.reducePoints);

module.exports = router;
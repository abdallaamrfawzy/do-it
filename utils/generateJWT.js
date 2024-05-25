const jwt = require("jsonwebtoken");
module.exports = async (payload) => {
    const token = jwt.sign(
        payload,
        "41ca6d0bbf0aee90e1735846bb2e671c2a59771f82ecf8cae6a1ce189cf27fa3",
    );
    return token;
}
import userModel from "../Models/user-model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

let refreshtokens = [];

export const signUp = async (req, res) => {
  console.log(req.body)
  try {
    //check user already registered or not
    const existUser = await userModel.findOne({ Email: req.body.Email });
    if (existUser) {
      res.status(100).json({
        message: "Email already registered..!",
      });
    } else if (!existUser) {
      // Validate mobile number
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(req.body.MobileNumber)) {
        return res.status(401).json({
          message: "Invalid mobile number format 10 digits need",
        });
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.Email)) {
        return res.status(401).json({
          message: "Invalid email address",
        });
      }

      // Validate password (add your specific requirements)
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*[@#$&*])[A-Za-z\d@#$%&*]{8,}$/;
      if (!passwordRegex.test(req.body.Password)) {
        return res.status(401).json({
          message: "Invalid password format",
        });
      }

      //create custom unique user ID
      const prefix = "UID";
      const UID = prefix + (Date.now() % 1000000);
      //password hashing
      const Hash_password = await bcrypt.hash(req.body.Password, 10);
      const newUser = new userModel({
        UID: UID,
        FirstName: req.body.FirstName,
        LastName: req.body.LastName,
        MobileNumber: req.body.MobileNumber,
        Email: req.body.Email,
        Hash_password: Hash_password,
      });
      //save user details in database
      const newAccount = await newUser.save();
      if (newAccount) {
        res.status(201).json({
          message: "Registration successfull..!",
          payload: newAccount,
        });
      } else {
        res.status(400).json({
          message: "Something went wrong in creating account..!",
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      message: "SOmthing went wrong..!",
      error: error,
    });
  }
};

export const signin = async (req, res) => {
  try {
    //if check user registered user or not
    const registeredUser = await userModel.findOne({ Email: req.body.Email });
    if (registeredUser) {
      const enteredpwd = req.body.Password;
      const dbpwd = registeredUser.Hash_password;

      //compare database saved password and user entered password
      const checkPwd = await bcrypt.compare(enteredpwd, dbpwd);
      if (checkPwd) {
        const token = jwt.sign(
          { Email: req.body.Email },
          process.env.JWT_TOKEN_KEY,
          { expiresIn: "1h" }
        );
        const refreshtoken = jwt.sign(
          { Email: req.body.Email },
          process.env.REFRESH_TOKEN_KEY,
          { expiresIn: "24h" }
        );

        refreshtokens.push(refreshtoken);

        res.status(200).json({
          message: "Login sucessfull..!",
          token,
          refreshtoken,
          payload: {
            UID: registeredUser.UID,
            FirstName: registeredUser.FirstName,
            LastName: registeredUser.LastName,
            MobileNumber: registeredUser.MobileNumber,
            Email: registeredUser.Email,
          },
        });
      } else {
        res.status(401).json({
          message: "Password incorrect..!",
        });
      }
    } else if (!registeredUser) {
      res.status(404).json({
        message: "User not Exsist..!",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error..!",
      error: error,
    });
  }
};

/*signout function*/
export const signout = (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;
    refreshtokens = refreshtokens.filter((token) => token !== refreshToken);
    res.status(200).json({
      message: "Signout successful!",
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong!",
      error: error,
    });
  }
};

// this is the process that we increase the login time if refresh token still not expired it will issue new token
export const tokenRefresh = (req, res, next) => {
  const refreshToken = req.body.refreshToken;
  if (refreshToken == "") {
    res.status(401).json({
      message: "Unauthorized..!",
    });
  } else if (!refreshtokens.includes(refreshToken)) {
    res.status(403).json({
      message: "Forbidden..!",
    });
  } else {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, (err, user) => {
      if (err) {
        res.status(403).json({
          message: "Forbidden..!",
        });
      } else {
        const token = jwt.sign(
          { Email: req.body.Email },
          process.env.JWT_TOKEN_KEY,
          { expiresIn: "1h" }
        );
        res.status(201).json({
          message: "Session Extended..!",
          token,
        });
      }
    });
  }
};

export const userDetails = async (req, res, next) => {
  try {
    const details = await userModel.findOne({ Email: req.body.Email });
    if (details) {
      res.status(200).json({
        message: "User Details Fetched Success..!",
        payload: {
            _id:details._id,
            UID: details.UID,
            FirstName: details.FirstName,
            LastName: details.LastName,
            MobileNumber: details.MobileNumber,
            Email: details.Email,
          },
      });
    } else {
      res.status(404).json({
        message: "Fetch error..!",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Somthing went wrong..!",
    });
  }
};

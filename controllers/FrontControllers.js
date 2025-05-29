const CourseModel = require("../models/course");
const UserModel = require("../models/user");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");

cloudinary.config({
  cloud_name: "dozdcjvag",
  api_key: "379675216241941",
  api_secret: "V9W-6DjzUutmXVkZ4REcj11Wuzg",
});

class FrontController {
  static home = async (req, res) => {
    try {
      const { name, image, email, id } = req.userdata;
      const btech = await CourseModel.findOne({ user_id: id, course: "btech" });
      const bca = await CourseModel.findOne({ user_id: id, course: "bca" });
      const mca = await CourseModel.findOne({ user_id: id, course: "mca" });
      return res.render("home", {
        n: name,
        i: image,
        e: email,
        btech: btech,
        bca: bca,
        mca: mca,
      });
    } catch (error) {
      console.log(error);
    }
  };

  static about = async (req, res) => {
    try {
      const { name, image } = req.userdata;
      return res.render("about", { n: name, i: image });
    } catch (error) {
      console.log(error);
    }
  };

  static login = async (req, res) => {
    try {
      return res.render("login", {
        message: req.flash("success"),
        msg: req.flash("error"),
      });
    } catch (error) {
      console.log(error);
    }
  };

  static register = async (req, res) => {
    try {
      return res.render("register", {
        message: req.flash("error"),
        msg: req.flash("success"),
      });
    } catch (error) {
      console.log(error);
    }
  };

  static contact = async (req, res) => {
    try {
      const { name, image } = req.userdata;
      return res.render("contact", { n: name, i: image });
    } catch (error) {
      console.log(error);
    }
  };

  static insertstudent = async (req, res) => {
    try {
      const { name, email, password, confirmpassword } = req.body;
      if (!name || !email || !password || !confirmpassword) {
        req.flash("error", "All Filds are Require.");
        return res.redirect("/register");
      }

      const isEmail = await UserModel.findOne({ email });
      if (isEmail) {
        req.flash("error", "Email Already Exists");
        return res.redirect("/register");
      }

      if (password != confirmpassword) {
        req.flash("error", "password does not match");
        return res.redirect("/register");
      }

      const file = req.files.image;

      const imageUpload = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "userprofile",
      });

      const hashpassword = await bcrypt.hash(password, 10);
      const data = await UserModel.create({
        name,
        email,
        password: hashpassword,
        image: {
          public_id: imageUpload.public_id,
          url: imageUpload.secure_url,
        },
      });

      if (data) {
        let token = jwt.sign({ ID: data._id }, "Prakharbajpai@123");
        res.cookie("token", token);
        this.sendVerifymail(name, email, data._id);
        req.flash("success", "Your Registration has been successfully.Please verify your mail.");
        return res.redirect("/register");
      } else {
        req.flash("error", "Not Register.");
        return res.redirect("/register");
      }
    } catch (error) {
      console.log(error);
    }
  };

  static sendVerifymail = async (name, email, user_id) => {
    let transporter = await nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: "Prakharbajpai8264@gmail.com",
        pass: "gqht syfh arfh falx",
      },
    });
    let info = await transporter.sendMail({
      from: "test@gmail.com",
      to: email,
      subject: "For Verification mail",
      text: "heelo",
      html:
        "<p>Hii " +
        name +
        ',Please click here to <a href="https://admission-portal-bgkg.onrender.com/verify?id=' +
        user_id +
        '">Verify</a>Your mail</p>.',
    });
  };

  static verifyLogin = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await UserModel.findOne({ email: email });
      if (user != null) {
        const isMatched = await bcrypt.compare(password, user.password);
        if (isMatched) {
          if (user.role == "admin" && user.is_verified == 1) {
            const token = jwt.sign({ ID: user._id }, 'Prakharbajpai@123');
            res.cookie('token', token);
            return res.redirect('/admin/dashboard');
          } else if (user.role == "student" && user.is_verified == 1) {
            const token = jwt.sign({ ID: user._id }, 'Prakharbajpai@123');
            res.cookie('token', token);
            return res.redirect('/home');
          } else {
            req.flash("error", "Please verify your email.");
            return res.redirect('/');
          }
        } else {
          req.flash('error', 'Email or password is not valid');
          return res.redirect('/');
        }
      } else {
        req.flash('error', 'You are not a registered user');
        return res.redirect('/');
      }
    } catch (error) {
      console.log(error);
    }
  };

  static logout = async (req, res) => {
    try {
      res.clearCookie("token");
      return res.redirect("/");
    } catch (error) {
      console.log(error);
    }
  };

  static profile = async (req, res) => {
    try {
      const { name, image, email, id } = req.userdata;
      return res.render("profile", { n: name, i: image, e: email });
    } catch (error) {
      console.log(error);
    }
  };

  static changePassword = async (req, res) => {
    try {
      const { id } = req.userdata;
      const { op, np, cp } = req.body;
      if (op && np && cp) {
        const user = await UserModel.findById(id);
        const isMatched = await bcrypt.compare(op, user.password);
        if (!isMatched) {
          req.flash("error", "Current password is incorrect ");
          return res.redirect("/profile");
        }
        if (np != cp) {
          req.flash("error", "Password does not match");
          return res.redirect("/profile");
        }
        const newHashPassword = await bcrypt.hash(np, 10);
        await UserModel.findByIdAndUpdate(id, {
          password: newHashPassword,
        });
        req.flash("success", "Password Updated successfully ");
        return res.redirect("/logout");
      } else {
        req.flash("error", "ALL fields are required ");
        return res.redirect("/profile");
      }
    } catch (error) {
      console.log(error);
    }
  };

  static updateProfile = async (req, res) => {
    try {
      const { id } = req.userdata;
      const { name, email, role } = req.body;
      let data;
      if (req.files) {
        const user = await UserModel.findById(id);
        const imageID = user.image.public_id;
        await cloudinary.uploader.destroy(imageID);
        const imagefile = req.files.image;
        const imageupload = await cloudinary.uploader.upload(
          imagefile.tempFilePath,
          {
            folder: "userprofile",
          }
        );
        data = {
          name: name,
          email: email,
          image: {
            public_id: imageupload.public_id,
            url: imageupload.secure_url,
          },
        };
      } else {
        data = {
          name: name,
          email: email,
        };
      }
      await UserModel.findByIdAndUpdate(id, data);
      req.flash("success", "Update Profile successfully");
      return res.redirect("/logout");
    } catch (error) {
      console.log(error);
    }
  };

  static forgetPasswordVerify = async (req, res) => {
    try {
      const { email } = req.body;
      const userData = await UserModel.findOne({ email: email });
      if (userData) {
        const randomString = randomstring.generate();
        await UserModel.updateOne(
          { email: email },
          { $set: { token: randomString } }
        );
        this.sendEmail(userData.name, userData.email, randomString);
        req.flash("success", "Plz Check Your mail to reset Your Password!");
        return res.redirect("/");
      } else {
        req.flash("error", "You are not a registered Email");
        return res.redirect("/");
      }
    } catch (error) {
      console.log(error);
    }
  };

  static sendEmail = async (name, email, token) => {
    let transporter = await nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: "prakharbajpai264@gmail.com",
        pass: "gqht syfh arfh falx",
      },
    });
    let info = await transporter.sendMail({
      from: "test@gmail.com",
      to: email,
      subject: "Reset Password",
      text: "heelo",
      html:
        "<p>Hii " +
        name +
        ',Please click here to <a href="https://admission-portal-bgkg.onrender.com/reset-password?token=' +
        token +
        '">Reset</a>Your Password.',
    });
  };

  static verifyMail = async (req, res) => {
    try {
      const updateinfo = await UserModel.findByIdAndUpdate(req.query.id, {
        is_verified: 1,
      });
      if (updateinfo) {
        return res.redirect("/home");
      }
    } catch (error) {
      console.log(error);
    }
  };

  static reset_Password = async (req, res) => {
    try {
      const token = req.query.token;
      const tokenData = await UserModel.findOne({ token: token });
      if (tokenData) {
        return res.render("reset-password", { user_id: tokenData._id });
      } else {
        return res.render("404");
      }
    } catch (error) {
      console.log(error);
    }
  };

  static reset_Password1 = async (req, res) => {
    try {
      const { password, user_id } = req.body;
      const newHashPassword = await bcrypt.hash(password, 10);
      await UserModel.findByIdAndUpdate(user_id, {
        password: newHashPassword,
        token: "",
      });
      req.flash("success", "Reset Password Updated successfully ");
      return res.redirect("/");
    } catch (error) {
      console.log(error);
    }
  };
}

module.exports = FrontController;

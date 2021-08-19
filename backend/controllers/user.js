const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config_db");

exports.signup = function (req, res, next) {
  bcrypt
    .hash(req.body.password, 15)
    .then(function (hash) {
      const user = {
        firstName:
          req.body.firstName.charAt(0).toUpperCase() +
          req.body.firstName.slice(1),
        lastName:
          req.body.lastName.charAt(0).toUpperCase() +
          req.body.lastName.slice(1),
        email: req.body.email,
        password: hash,
        bio: req.body.bio,
      };
      db.query(`INSERT INTO user SET ?`, [user], function (error) {
        if (error) {
          res.status(400).json({ error });
        } else {
          res.status(201).json({ message: "Utilisateur créé." });
        }
      });
    })
    .catch(function (error) {
      res.status(500).json({ error });
    });
};

exports.login = function (req, res, next) {
  db.query(
    `SELECT id,password, isAdmin
    FROM user WHERE email = ?`,
    [req.body.email],
    function (error, result) {
      if (error) {
        throw error;
      } else {
        if (result.length === 0) {
          res.status(400).json({ message: "Utilisateur non trouvé." });
        } else {
          bcrypt
            .compare(req.body.password, result[0].password)
            .then(function (valid) {
              if (!valid) {
                return res
                  .status(401)
                  .json({ message: "Mot de passe incorrect" });
              } else {
                return res.status(200).json({
                  userId: result[0].id,
                  isAdmin: result[0].isAdmin,
                  message: "Utilisateur connecté !",

                  token: jwt.sign(
                    {
                      userId: result[0].id,
                    },
                    "6b9adNtSEFFY5ZID6rRFHZ4FWnOMVr",
                    { expiresIn: "8h" }
                  ),
                });
              }
            });
        }
      }
    }
  );
};

exports.getUser = function (req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  const decodedToken = jwt.verify(token, "6b9adNtSEFFY5ZID6rRFHZ4FWnOMVr");
  const userId = decodedToken.userId;

  db.query(
    `SELECT firstName, lastName, bio 
    FROM user 
    WHERE id = ?`,
    [userId],
    function (error, result) {
      if (error) {
        throw error;
      } else {
        return res.status(200).json(result[0]);
      }
    }
  );
};

exports.userUpdate = function (req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  const decodedToken = jwt.verify(token, "6b9adNtSEFFY5ZID6rRFHZ4FWnOMVr");
  const userId = decodedToken.userId;

  const user = {
    firstName:
      req.body.firstName.charAt(0).toUpperCase() + req.body.firstName.slice(1),
    lastName:
      req.body.lastName.charAt(0).toUpperCase() + req.body.lastName.slice(1),
    bio: req.body.bio,
  };

  db.query(
    `UPDATE user 
     SET ?
     WHERE id = ?`,
    [user, userId],
    function (error) {
      if (error) {
        res.status(400).json({ error });
      } else {
        res
          .status(201)
          .json({ message: "Votre profil a bien été mis à jour !" });
      }
    }
  );
};

exports.userDelete = function (req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  const decodedToken = jwt.verify(token, "6b9adNtSEFFY5ZID6rRFHZ4FWnOMVr");
  const userId = decodedToken.userId;

  db.query(
    `DELETE 
    FROM user
    WHERE id = ?`,
    [userId],
    function (error) {
      if (error) {
        res.status(400).json({ error });
      } else {
        res.status(201).json({ message: "Votre compte a bien été supprimé !" });
      }
    }
  );
};

exports.userArticles = function (req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  const decodedToken = jwt.verify(token, "6b9adNtSEFFY5ZID6rRFHZ4FWnOMVr");
  const userId = decodedToken.userId;

  db.query(
    `SELECT post.id, post.title, post.content, post.attachment, post.createdAt,   
      post.updatedAt, user.firstName, user.lastName
    FROM post
    JOIN user
    ON post.userId = user.id
    WHERE user.id = ?
    ORDER BY post.createdAt DESC`,
    [userId],
    function (error, result) {
      if (error) {
        res.status(400).json({ error });
      } else {
        res.status(201).json(result);
      }
    }
  );
};

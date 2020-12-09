/*
 * All routes for Users are defined here
 * Since this file is loaded in server.js into api/users,
 *   these routes are mounted onto /users
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const helpers = require('../db/helpers/user-help.js');
const shortID = require('../lib/shortID.js');

module.exports = (db) => {

  /*
  * Return JSON containing all users in database
  *
  */
  router.get('/', (req, res) => {
    helpers.getAllUsers()
      .then(users => {
        res.json({ users });
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  });

  // Simple login form
  router.get('/login', (req, res) => {
    // Check for ID query param
    let id = res.locals.user.id;
    if (id) {
      res.redirect(`/`);
    }
    res.render('login');
  });

  /*
  * Log user into app given the check of password/email against database, and set req.session.user_id cookie to the user's ID
  * Redirect to the index page upon successful login
  */
  router.post('/login/', (req, res) => {
    const { email, password } = req.body;
    return helpers.login(email, password)
      .then(data => {
        if (!data) {
          req.session.user_id = shortID.generateRandomInt(50);
          if(req.session.user_id === 14) req.session.user_id = 15; // Olga is MINE!!
        } else {
          req.session.user_id = data.id;
        }
        res.redirect('/');
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  });

  /*
  * Clear all cookies, logging user out from the system, redirecting back to index
  *
  */
  router.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
  });

  /*
  * User profile page
  */
  router.get('/:id', (req, res) => {
    // Only authenticated user can view profiles
    if(!res.locals.user.id){
      res.redirect('/user/login');
    }
    const user_id = res.locals.user.id;
    const profile_id = req.params.id; //Get the page user id

    //Get tips for this user
    const tipsQueryString =
    `SELECT *, r.id AS resource_id,
    (
      SELECT COUNT(*)
      FROM likes
      WHERE resource_id = r.id
    ) AS num_likes
    FROM resources AS r
    JOIN users AS u ON u.id = r.creator_id
    WHERE r.creator_id = $1
    ORDER BY r.created_at DESC;
    `;
    // @TODO Get is_liked, is_bookmarked to display??

    // If the req.param.id matches res.user.id get liked posts and bookmarked posts
    //const likesQueryString = 'SELECT * FROM resources AS r JOIN users AS u ON u.id = r.creator_id WHERE u.id = $1;';
    //const bookmarksQueryString = 'SELECT * FROM resources AS r JOIN users AS u ON u.id = r.creator_id WHERE u.id = $1;';
    // @TODO Get num_likes and display

    const userQuery = helpers.findUserByID(profile_id);
    const tipsQuery = db.query(tipsQueryString, [profile_id]);

    Promise.all([userQuery, tipsQuery])
      .then(result => {
        const data = result[0]; //Get user data of the req.param.id
        const tips = result[1].rows;
        res.render('user', { data, tips })
      }).catch(err => {
        res.status(500).json({ error: err.message });
      });
  });

  /*
  * Edit details of a given user. User must submit/reconfirm all details of their profile
  * Return user object with updated details as JSON
  */
  router.post('/edit/:id', (req, res) => {

    const { name, password, email } = req.body;
    const hashPassword = bcrypt.hashSync(password, 12);
    const userDetails = [name, hashPassword, email, req.params.id];

    helpers.editUser(userDetails)
      .then(user => {
        res.json({ user });
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  });

  /*
  * Create a new user in database, and set user_id cookie to the newly created user ID
  * Return new user object as JSON
  */
  router.post('/register', (req, res) => {
    const { name, password, email } = req.body;
    const hashPassword = bcrypt.hashSync(password, 12);
    const userDetails = [name, hashPassword, email];

    helpers.newUser(userDetails)
      .then(data => {
        req.session.user_id = data.id;
        res.json({ user });
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  });

  return router;
};

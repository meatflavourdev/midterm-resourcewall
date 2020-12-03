/*
 * All routes for Tips/Resources are defined here
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require('express');
const router = express.Router();
const tipHelp = require('../db/helpers/tip-help');

module.exports = (db) => {

  // New tip creation
  router.get("/", (req, res) => {
    res.render('test-new-tip');
  });

  // load tips data for an array of Tip IDs
  router.post("/", (req, res) => {
    const { tipsID } = req.body;
    tipHelp.getResourceFullData(tipsID, userID)
      .then((tips) => res.json(tips));
  });

  /*
  * render 'tip' EJS page, passing thru the given tipId
  *
  */
  router.get("/:tip_id", (req, res) => {
    const tip_id = req.params.tip_id;
    const tipQueryString = 'SELECT * FROM resources AS r JOIN users AS u ON u.id = r.creator_id WHERE r.id = $1;';
    const commentQueryString = 'SELECT * FROM comments AS c JOIN users AS u ON u.id = c.user_id WHERE c.resource_id = $1;';

    const tip = db.query(tipQueryString, [tip_id]);
    const comments = db.query(commentQueryString, [tip_id]);

    Promise.all([tip, comments]).then((result) => {
      const tip = result[0].rows[0];
      const comments = result[1].rows;
      res.render('tip', { tip_id, tip, comments });
    });
  });

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ bookmark routes ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  /*
  * POST req to mark a tip as bookmarked by the active user
  * user_id will come from login/cookie mechanism, not hardcoded once implemented
  */
  router.post("/:tip_id/bookmark", (req, res) => {

    const values = [res.locals.user.id, req.params.tip_id];

    tipHelp.setBookmark(values)
      .then(data => res.json({ success: true }))
      .catch(err => res.json({ success: false, error: err }));
  });

  /*
  * DELETE req to mark a tip as bookmarked by the active user
  * user_id will come from login/cookie mechanism, not hardcoded once implemented
  */
  router.delete("/:tip_id/bookmark", (req, res) => {

    const values = [res.locals.user.id, req.params.tip_id];

    tipHelp.unsetBookmark(values)
      .then(data => res.json({ success: true }))
      .catch(err => res.json({ success: false, error: err }));
  });

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ like routes ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  /*
  * POST req to add a new like boolean value to the given :tip_id
  * user_id will come from login/cookie mechanism, not hardcoded, once implemented
  */
  router.post("/:tip_id/like", (req, res) => {

    let values = [res.locals.user.id, req.params.tip_id];

    tipHelp.setLike(values)
      .then(data => res.json({ success: true }))
      .catch(err => res.json({ success: false, error: err }));
  });

  /*
  * POST req to add a new like boolean value to the given :tip_id
  * user_id will come from login/cookie mechanism, not hardcoded, once implemented
  */
  router.delete("/:tip_id/like", (req, res) => {

    let values = [res.locals.user.id, req.params.tip_id];

    tipHelp.setLike(values)
      .then(data => res.json({ success: true }))
      .catch(err => res.json({ success: false, error: err }));
  });

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ comment routes ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  /*
  * POST req to add a new comment associated with the given :tip_id
  * user_id will come from login/cookie mechanism, not body, once implemented
  */
  router.post('/:tip_id/comment', (req, res) => {

    const values = [res.locals.user.id, req.params.tip_id, req.body.comment];

    tipHelp.addComment(values)
      .then(data => res.json(data))
      .catch(err => res.json({ success: false, error: err }));
  });

  /*
  * (should be DELETE req) POST req to delete a comment with the selected id
  * must add user authentication !!!
  */
  router.post('/:tip_id/comment/:id/delete', (req, res) => {

    const values = [req.params.id, req.params.tip_id, req.session.user_id];

    tipHelp.deleteComment(values)
      .then(data => res.json({ success: true }))
      .catch(err => res.json({ success: false, error: err }));
  });

  /*
  * (should be PUT req) POST req to edit an existing comment, user can only edit the 'text' of the comment.
  * must add user authentication !!!
  */
  router.post('/:tip_id/comment/:id', (req, res) => {

    const values = [req.body.comment, req.params.id, req.params.tip_id, req.session.user_id];

    tipHelp.editComment(values)
      .then(data => res.json(data))
      .catch(err => res.json({ success: false, error: err }));
  });

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ edit/delete tip routes ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  /*
  * (should be DELETE) POST req to remove a tip from the resources table
  * must add user authentication !!!
  */
  router.post("/:tip_id/delete", (req, res) => {

    const values = [req.params.tip_id, req.session.user_id];

    tipHelp.deleteTip(values)
      .then(data => res.json({ success: true }))
      .catch(err => res.json({ success: false, error: err }));
  });



  /*
  * (should be PUT req) POST request to edit an existing tip, user can only edit title and description
  * must add user authentication !!!
  */
  router.post("/:tip_id", (req, res) => {
    const values = [req.body.title, req.body.description, req.params.tip_id, req.session.user_id];

    tipHelp.editTip(values)
      .then(data => res.json({ success: true }))
      .catch(err => res.json({ success: false, error: err.message }));
  });

  return router;
};

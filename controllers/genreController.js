const genre = require('../models/genre')
const book = require('../models/book');
const async = require('async');
const { check, body, validationResult } = require('express-validator')
//const { body, validationResult } = require('express-validator/check');
//const { sanitizeBody } = require('express-validator/filter');

// 显示完整的作者列表
exports.genre_list = (req, res, next) => {
    genre.find()
        .sort([['name', 'ascending']])
        .exec((err, genre_list) => {
            if (err) {
                return next(err);
            }
            return res.render('genre_list', { title: 'Genre List', genre_list: genre_list });
        });
};
// 为每位作者显示详细信息的页面
exports.genre_detail = (req, res, next) => {
    async.parallel({
        genre: (callback) => {
            genre.findById(req.params.id)
                .exec(callback);

        }, genre_books: (callback) => {
            book.find({ 'genre': req.params.id })
                .exec(callback);
        }
    }, (err, results) => {
        if (err) {
            return next(err);
        }
        if (results.genre == null) {
            let err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        res.render('genre_detail',
            { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books })
    });
};

// 由 GET 显示创建作者的表单
exports.genre_create_get = (req, res, next) => {
    res.render('genre_form', { title: 'Create Genre' });
};

// 由 POST 处理作者创建操作
exports.genre_create_post = [

    //Validate that the name field is not empty.
    check('name', 'Genre name required').isLength({ min: 1 }).trim(),

    //Sanitize (trim and escape) the name field.
    body('name').trim().escape(),

    // Process request after validation and sanitizatio
    (req, res, next) => {

        // Extract the validation errors from a request.

        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        let gre = new genre({
            name: req.body.name
        });

        if (!errors.isEmpty()) {
            res.render('genre_form', { title: 'Create Genre', genre: gre, errors: errors.array() });
            return;
        } else {
            genre.findOne({ 'name': req.body.name })
                .exec((err, found_genre) => {
                    if (err) {
                        return next(err);
                    }

                    if (found_genre) {
                        res.redirect(found_genre.url);
                    } else {
                        gre.save((err) => {
                            if (err) {
                                return next(err);
                            }
                            res.redirect(gre.url);
                        });
                    }
                });
        }
    }

];




// 由 GET 显示删除作者的表单
exports.genre_delete_get = (req, res, next) => {
    async.parallel({
        genre: (callback) => {
            genre.findById(req.params.id).exec(callback);
        },
        genre_books: (callback) => {
            book.find({ 'genre': req.params.id }).exec(callback);
        },
    }, (err, results) => {
        if (err) {
            return next(err);
        }
        if (genre == null) {
            res.render('/catalog/genres')
        }
        res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books });
    });
};

// 由 POST 处理作者删除操作
exports.genre_delete_post = (req, res, next) => {
    async.parallel({
        genre: (callback) => {
            genre.findById(req.body.id).exec(callback);
        },
        genre_books: (callback) => {
            book.find({ 'genre': req.body.id }).exec(callback);
        }
    }, (err, results) => {
        if (err) {
            return next(err);
        }
        if (results.genre_books.length > 0) {
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books });
            return;
        } else {
            genre.findByIdAndRemove(req.body.id, (err) => {
                if (err) {
                    return next(err);
                }
                res.redirect('/catalog/genres');
            });
        }

    });
};

// 由 GET 显示更新作者的表单
exports.genre_update_get = (req, res, next) => {
    genre.findById(req.params.id, (err, genre) => {
        if (err) {
            return next(err);
        }
        if (genre == null) { // No results.
            let err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        res.render('genre_form', { title: 'Update Genre', genre: genre });
    });
};

// 由 POST 处理作者更新操作
exports.genre_update_post = [
    check('name', 'Genre name must contain at least 3 characters').trim().isLength({ min: 3 }).escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        var gre = new genre({
            name: req.body.name,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {
            res.render('genre_form', { title: 'Update Genre', genre: genre, errors: errors.array() });
            return;
        }else{
            genre.findByIdAndUpdate(req.params.id,gre,{},(err,theGenre) =>{
                if(err){
                    return next(err);
                }
                res.redirect(theGenre.url);
            });
        }
    }
];
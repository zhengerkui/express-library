const Book = require('../models/book');
const Author = require('../models/author');
const BookInstance = require('../models/bookinstance')
const Genre = require('../models/genre');
const async = require('async');
const book = require('../models/book');
const { check, body, validationResult } = require('express-validator');



//首页加载页面
exports.index = (req, res) => {
    async.parallel({
        book_count: (callback) => {
            Book.count({}, callback);
        },
        book_instance_count: (callback) => {
            BookInstance.count({}, callback);
        },
        book_instance_available_count: (callback) => {
            BookInstance.count({ status: 'Available' }, callback);
        },
        author_count: (callback) => {
            Author.count({}, callback);
        },
        genre_count: (callback) => {
            Genre.count({}, callback);
        }
    }, (err, results) => {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};


exports.book_create_get = (req, res, next) => {
    async.parallel({
        authors: (callback) => {
            Author.find(callback);
        },
        genres: (callback) => {
            Genre.find(callback);
        }
    }, (err, results) => {
        if (err) {
            return next(err);
        }
        res.render('book_form', { title: 'Create book', authors: results.authors, genres: results.genres });
    });

};

exports.book_create_post = [
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined') {
                req.body.genre = [];
            } else {
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },

    check('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    check('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
    check('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    check('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

    body('*').trim().escape(),
    body('genre.*').escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        let book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: req.body.genre
            }
        );

        if (!errors.isEmpty) {
            async.parallel({
                authors: (callback) => {
                    Author.find(callback);
                },
                genres: (callback) => {
                    Genre.find(callback);
                },
            }, (err, results) => {
                if (err) {
                    return next(err);
                }

                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }

                }
                res.render('book_form',
                    {
                        title: 'Create book',
                        authors: results.authors,
                        genres: results.genres,
                        book: book,
                        errors: errors.array()
                    });

            });
        } else {
            book.save((err) => {
                res.redirect(book.url);
            });
        }
    }
];


exports.book_delete_get = (req, res, next) => {
    async.parallel({
        book: (callback) => {
            Book.findById(req.params.id).populate('author').populate('genre')
                .exec(callback);
        },
        book_bookinstances: (callback) => {
            BookInstance.find({ 'book': req.params.id }).exec(callback);
        },
    }, (err, results) => {
        if (err) {
            return next(err);
        }
        if (results.book == null) {
            res.redirect('/catalog/books');
        }
        res.render('book_delete', { title: 'Delete Book', book: results.book, book_instance: results.book_bookinstances });
    });
};

exports.book_delete_post = (req, res, next) => {
    async.params({
        book: (callback) => {
            Book.findById(req.body.id).populate('author').populate('genre').exec(callback);
        },
        book_bookinstances: (callback) => {
            BookInstance.find({ 'book': req.body.id }).exec(callback);
        }
    }, (err, results) => {
        if (err) {
            return next(err);
        }
        if (results.book_bookinstances.length > 0) {
            res.render('book_delete', { title: 'Delete Book', book: results.book, book_instance: results.book_bookinstances });
            return;
        } else {
            Book.findByIdAndRemove(req.body.id, (err) => {
                if (err) {
                    return next(err);
                }
                res.redirect('/catalog/books');
            });
        }
    });
};

exports.book_update_get = (req, res, next) => {
    async.parallel({
        book: (callback) => {
            Book.findById(req.params.id).populate('author')
                .populate('genre').exec(callback);
        },
        authors: (callback) => {
            Author.find(callback);
        },
        genres: (callback) => {
            Genre.find(callback);
        }
    }, (err, results) => {
        if (err) {
            return next(err);
        }
        if (results.book == null) {
            let err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // Mark our selected genres as checked.
        for (let all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
            for (let book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                if (results.genres[all_g_iter]._id.toString() == results.book.genre[book_g_iter]._id.toString()) {
                    results.genres[all_g_iter].checked = 'true';
                }
            }
        }

        res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book });

    });
};
exports.book_update_post = [
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genres === 'undefined') {
                req.body.genre = [];
            } else {
                req.body.genre = new Array(req.body.genres);
            }
        }
        next();
    },
    check('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    check('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
    check('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    check('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    body('title').trim().escape(),
    body('author').trim().escape(),
    body('summary').trim().escape(),
    body('isbn').trim().escape(),
    body('genre.*').trim().escape(),

    (req, res, next) => {
        const errors = validationResult(req);
        let bk = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre,
                _id: req.params.id
            }
        );

        if (!errors.isEmpty()) {

            async.parallel({
                authors: (callback) => {
                    Author.find(callback);
                },
                genres: (callback) => {
                    Genre.find(callback);
                }
            }, (err, results) => {
                if (err) {
                    return next(err);
                }

                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }

                res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            });

            return;

        } else {
            Book.findByIdAndUpdate(req.params.id, bk, {}, (err, theBook) => {
                if (err) {
                    return next(err);
                }
                res.redirect(theBook.url);
            });
        }
    }

];
exports.book_detail = (req, res, next) => {
    async.parallel({
        book: (callback) => {
            book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },
        book_instances: (callback) => {
            BookInstance.find({ 'book': req.params.id }).exec(callback);
        }
    }, (err, results) => {
        if (err) {
            return next(err);
        }
        if (results.book == null) {
            let err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        res.render('book_detail', { title: 'Title', book: results.book, book_instances: results.book_instances })
    });
};

//只查询title 和 author 两个字段，并且 获取author的整体信息
exports.book_list = (req, res, next) => {
    Book.find({}, 'title author')
        .populate('author')
        .exec((err, list_books) => {
            if (err) {
                return next(err);
            }
            res.render('book_list', { title: 'Book List', book_list: list_books });
        })
};

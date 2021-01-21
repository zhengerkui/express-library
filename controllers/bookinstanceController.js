const bookinstance = require('../models/bookinstance');
const Book = require('../models/book');
const { check, body, validationResult } = require('express-validator');
const async = require('async');

// 显示完整的图书副本列表
exports.bookinstance_list = (req, res, next) => {
    bookinstance.find()
        .populate('book')
        .exec((err, list_bookinstances) => {
            if (err) {
                return next(err);
            }
            res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances })

        });

};


// 为每位图书副本显示详细信息的页面
exports.bookinstance_detail = (req, res, next) => {
    bookinstance.findById(req.params.id).populate('book')
        .exec((err, bookinstance) => {
            if (err) {
                return next(err);
            }
            res.render('bookinstance_detail', { title: 'Book', bookinstance: bookinstance });

        });
};

// 由 GET 显示创建图书副本的表单
exports.bookinstance_create_get = (req, res, next) => {
    Book.find({}, 'title')
        .exec((err, books) => {
            if (err) {
                return next(err);
            }
            res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books });
        });
};

// 由 POST 处理图书副本创建操作
exports.bookinstance_create_post = [
    // Validate and sanitize fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),


    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bkinstance = new bookinstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back
            });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({}, 'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bkinstance.book._id, errors: errors.array(), bookinstance: bkinstance });
                });
            return;
        }
        else {
            // Data from form is valid
            bkinstance.save(function (err) {
                if (err) { return next(err); }
                // Successful - redirect to new record.
                res.redirect(bkinstance.url);
            });
        }
    }
];

// 由 GET 显示删除图书副本的表单
exports.bookinstance_delete_get = (req, res, next) => {
    bookinstance.findById(req.params.id).populate('book').exec((err, bookinstance) => {
        if (err) {
            return next(err);
        }
        if (bookinstance == null) {
            res.redirect('/catalog/bookinstances');
        }

        res.render('bookinstance_delete', { title: 'Delete BookInstance', bookinstance: bookinstance });
    });

};

// 由 POST 处理图书副本删除操作
exports.bookinstance_delete_post = (req, res, next) => {
    bookinstance.findByIdAndRemove(req.body.id, (err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/catalog/bookinstances');
    });
};

// 由 GET 显示更新图书副本的表单
exports.bookinstance_update_get = (req, res, next) => {
    async.parallel({
        bookinstance: (callback) => {
            bookinstance.findById(req.params.id).populate('book').exec(callback);
        },
        books: (callback) => {
            Book.find(callback);
        }
    }, (err, results) => {
        if (err) {
            return next(err);
        }
        if (results.bookinstance == null) {
            let err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }
        res.render('bookinstance_form',
            {
                title: 'Update BookInstance',
                book_list: results.books,
                selected_book: results.bookinstance.book._id,
                bookinstance: results.bookinstance
            }
        );
    });
};

// 由 POST 处理图书副本更新操作
exports.bookinstance_update_post = [
    check('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    check('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    check('status').escape(),
    check('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    (req, res, next) => {
        const errors = validationResult(req);

        let bkinstance = new bookinstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back,
                _id: req.params.id
            }
        );

        if (!errors.isEmpty()) {
            Book.find({}, 'title').exec((err, books) => {
                if (err) {
                    return next(err);
                }
                res.render('bookinstance_form', { title: 'Update BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        } else {
            bookinstance.findByIdAndUpdate(req.params.id, bkinstance, {}, (err, thebookinstance) => {
                if (err) {
                    return next(err);
                }
                res.redirect(thebookinstance.url);
            });
        }

    }
];
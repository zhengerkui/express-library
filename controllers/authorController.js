const author = require('../models/author');
const async = require('async');
const book = require('../models/book');
const { check, body, validationResult } = require('express-validator')



// 显示完整的作者列表
exports.author_list = (req, res, next) => {
    author.find().sort([['family_name', 'ascending']])
        .exec((err, list_authors) => {
            if (err) {
                return next(err);
            }
            res.render('author_list', { title: 'Author List', author_list: list_authors });

        });
};
// 为每位作者显示详细信息的页面
exports.author_detail = (req, res, next) => {
    async.parallel({
        author: (callback) => {
            author.findById(req.params.id).exec(callback);
        },
        author_books: (callback) => {
            book.find({ 'author': req.params.id }).exec(callback);
        }
    }, (err, results) => {
        if (err) {
            return next(err);
        }
        if (results.author == null) {
            let err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        res.render('author_detail',
            { title: 'Author Detail', author: results.author, author_books: results.author_books });
    });


};

// 由 GET 显示创建作者的表单
exports.author_create_get = (req, res, next) => {
    res.render('author_form', { title: 'Create Author' });
};

// 由 POST 处理作者创建操作
exports.author_create_post = [
    check('first_name').isLength({ min: 1 }).trim()
        .withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    check('family_name').isLength({ min: 1 }).trim()
        .withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    check('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    check('data_of_death', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),

    body('first_name').trim().escape(),
    body('family_name').trim().escape(),
    body('date_of_birth').toDate(),
    body('date_of_death').toDate(),


    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty) {
            res.render('author_form', { title: 'Create Author', author: req.body, errors: errors.array() });
            return;
        } else {
            let athor = new author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                }
            );

            athor.save((err) => {
                if (err) {
                    return next(err);
                }
                res.redirect(athor.url);
            });

        }
    }


];

// 由 GET 显示删除作者的表单
exports.author_delete_get = (req, res, next) => {
    async.parallel({
        author: (callback) => {
            author.findById(req.params.id).exec(callback)
        },
        authors_books: (callback) => {
            book.find({ 'author': req.params.id }).exec(callback)
        }
    }, (err, results) => {
        if (err) {
            return next(err);
        }
        if (results.author == null) {
            res.redirect('/catalog/authors');
        }
        res.render('author_delete',
            {
                title: 'Delete Author',
                author: results.author,
                authors_books: results.authors_books
            }
        );
    });
};

// 由 POST 处理作者删除操作
exports.author_delete_post = (req, res, next) => {
    async.parallel({
        author: (callback) => {
            author.findById(req.body.authorid).exec(callback);
        },
        authors_books: (callback) => {
            book.find({ 'author': req.body.authorid }).exec(callback);
        },
    }, (err, results) => {
        if (err) {
            return next(err);
        }
        if (results.authors_books.length > 0) {
            res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.author_books });
            return;
        } else {
            author.findByIdAndRemove(req.body.authorid, (err) => {
                if (err) {
                    return next(err);
                }
                res.redirect('/catalog/authors');
            });
        }
    });
};

// 由 GET 显示更新作者的表单
exports.author_update_get = (req, res, next) => {
    author.findById(req.params.id, (err, author) => {
        if (err) {
            return next(err);
        }
        if (author == null) {
            let err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        res.render('author_form', { title: 'Update Author', author: author });
    });
};

// 由 POST 处理作者更新操作
exports.author_update_post = [

    // Validate and santize fields.
    check('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    check('family_name').trim().isLength({ min: 1 }).escape().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    check('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),
    check('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601().toDate(),

    (req, res, next) => {
        const errors = validationResult(req);

        let aor = new author(
            {
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death,
                _id: req.params.id
            }
        );

        if (!errors.isEmpty) {
            res.render('author_form', { title: 'Update Author', author: author, errors: errors.array() });
            return;
        } else {
            author.findByIdAndUpdate(req.params.id, aor, {}, (err, theAuthor) => {
                if (err) {
                    return next(err);
                }
                res.redirect(theAuthor.url);
            });
        }



    }

];



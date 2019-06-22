const User = require('./model/user');

exports.get = async function(id) {
    if (!id) throw new Error("No id passed");
    try {
        const user = await User.findById(id);
        return user && user.id ? user : null;
    } catch (err) {
        throw err;
    }
}

exports.create = async function(args) {
    if (!args) throw new Error('No arguments passed');
    if (args) {
        let hasUsername, hasEmail, hasPassword;
        const keys = Object.keys(args);
        hasEmail = keys.includes('email');
        hasPassword = keys.includes('password');
        hasUsername = keys.includes('username');

        if (!hasEmail && !hasPassword) {
            throw new Error('Invalid args. Email and password are required.');
        }

        if (!hasUsername && !hasPassword) {
            throw new Error('Invalid args. Username and password are required.');
        }
        
        if (!hasUsername && !hasEmail) {
            throw new Error('Invalid args. Username and email are required.');
        }
        
        if (!hasEmail) {
            throw new Error('Invalid args. Email is required.');
        }
        
        if (!hasUsername) {
            throw new Error('Invalid args. Username is required.');
        }
        
        if (!hasPassword) {
            throw new Error('Invalid args. Password is required.');
        }

        const emailSlice = args['email'].split('@')[0];
        const password = args['password'];
        const username = args['username'];

        if (emailSlice === password || emailSlice.toLowerCase() === password || password.includes(emailSlice) || password.includes(emailSlice.toLowerCase())) {
            throw new Error('Invalid args. Password is invalid. Password cannot be part of your email.');
        }
        
        if (username === password || username.toLowerCase() === password || password.includes(username) || password.includes(username.toLowerCase())) {
            throw new Error('Invalid args. Password is invalid. Password cannot be part of your username.');
        }
    }

    try {
        const newUser = {
            ...args
        };

        delete newUser.password;

        const user = new User(newUser);
        await user.setPassword(args['password']);
        return user.save();
    } catch (error) {
        throw error;
    }
}

exports.delete = async function(id) {
    let user;
    if (!id) throw new Error('No id passed');
    try {
        user = await User.findById(id);
    } catch (error) {
        // TODO: Send to logger
        throw new Error('No User found');
    }
    try {
        user['deleted'] = true;
        user = await user.save();
        return user;
    } catch (error) {
        // TODO: Send to logger
        throw new Error('Could not save user');
    }
}

exports.list = async function(_deleted, _limit, _page) {
    const limit = _limit ? _limit : 10;
    const page = _page && _page > 0 ? _page - 1 : 0;
    const opts = {
        deleted: _deleted ? _deleted : false,
        ...paginate(_limit, _page)
    }
    let result, _count = 0;
    try {
        const query = await User.find(opts);
        
        result = query;
        _count = result ? result.length : 0 
    } catch (error) {
        
    }

    return {
        docs: result ? result : [],
        total: _count,
        page: page + 1,
        perPage: limit,
        pages: Math.ceil(_count / limit)
    }
}

function paginate(_limit, _page) {
    const limit = _limit ? _limit : 10;
    const page = _page && _page > 0 ? _page - 1 : 0;

    return {
        limit: limit,
        skip: limit * page
    }
}


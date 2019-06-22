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
        const user = new User(args);
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
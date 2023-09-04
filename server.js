const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('./config/passport-config')

const User = require('./models/User');
const Todo = require('./models/Todo');
const { generateHash } = require('./utils/authUtils');

const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/mern-todo', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('connected to DB'))
    .catch(console.error);

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(session({
    secret: 'your_secret_key', 
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 2 * 30 * 24 * 60 * 60 * 1000,
        httpOnly: true, 
        secure: false 
    }, 
}));

app.use(passport.initialize());
app.use(passport.session());

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!passwordSchema.validate(password)) {
            return res.status(400).json({ error: 'Password does not meet requirements.' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists.' });
        }

        const hashedPassword = await generateHash(password);

        const newUser = new User({ username, password: hashedPassword });

        await newUser.save();

        res.json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Registration failed:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/login', (req, res, next) => {
    passport.authenticate('local-with-bcrypt', (err, user, info) => {

        if (err) {
            console.error('Login failed:', err);
            return res.status(500).json({ error: 'Login failed' });
        }

        if (!user) {
            return res.status(400).json({ error: info.message });
        }
        req.session.user = { username: 'exampleUser' };

        req.login(user, (err) => {
            if (err) {
                console.error('Login failed:', err);
                return res.status(500).json({ error: 'Login failed' });
            }

            res.cookie('user_id', user._id, { maxAge: 2 * 30 * 24 * 60 * 60 * 1000, httpOnly: true, secure: false });

            return res.json({ message: 'Login successful', user: user });
        });

    })(req, res, next);

});

app.get('/check-session', (req, res) => {
    try {
        console.log('req.session:', req.session); 
        console.log('req.session4:', req.session);

        if (req.session) {
            res.json({ user: req.session.user });
        } else {
            res.json({ user: null });
        }
    } catch (error) {
        console.error('Error in /check-session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/todos', async (req, res) => {

    try {
        const todos = await Todo.find();
        res.json(todos);
    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/todo/new', (req, res) => {

    const todo = new Todo({
        text: req.body.text
    })

    todo.save();
    res.json(todo);
});

app.delete('/todo/delete/:id', async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);

        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        const result = await Todo.findByIdAndDelete(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting todo:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// app.delete('/todo/delete/:id', async (req, res) => {
//     const result = await Todo.findByIdAndDelete(req.params.id);
//     res.json(result);
// })

app.get('/todo/complete/:id', async (req, res) => {
    const todo = await Todo.findById(req.params.id);

    todo.complete = !todo.complete;

    todo.save();

    res.json(todo);
})

app.listen(3001, () => console.log('Server started on port 3001'))

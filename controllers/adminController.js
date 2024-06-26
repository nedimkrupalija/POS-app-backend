const bcrypt = require('bcryptjs');
const db = require('../config/db.js');

const { generateServerErrorResponse } = require('../utils/messages.js')

const User = db.user;

async function getUsers(req, res) {
    try {
        const users = await User.findAll(
            {where : { role: 'user' }}
        );
        
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json(generateServerErrorResponse(error));
    }  
}   

async function getAdministrators(req, res) {
    try {
        const admins = await User.findAll(
            { where: { role: 'admin' } }
        );
        
        return res.status(200).json(admins);    
    } catch (error) {
         res.status(500).json(generateServerErrorResponse(error));
    }
}

async function updateUser(req, res) {
    try {
        const user = await User.findOne(
            { where: { id: req.params.id } }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        req.body.password = await bcrypt.hash(req.body.password, 10);

        const updatedUser = await user.update(req.body);

        return res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json(generateServerErrorResponse(error));
    }
}

async function updateAdministrator(req, res) {
    try {
        const admin = await User.findOne(
            { where: { id: req.params.id } }
        );

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        req.body.password = await bcrypt.hash(req.body.password, 10);

        const updatedAdmin = await admin.update(req.body);

        return res.status(200).json(updatedAdmin);
    } catch (error) {
        res.status(500).json(generateServerErrorResponse(error));
    }
}

async function deleteUser(req,res){
    try {
        const user = await User.findOne(
            { where: { id: req.params.id } }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.destroy();

        return res.status(200).json({ message: 'User sucessfully deleted' });
    } catch (error) {
        res.status(500).json(generateServerErrorResponse(error));
    }
}

async function deleteAdministrator(req,res){
    try {
        const admin = await User.findOne(
            { where: { id: req.params.id } }
        );

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        await admin.destroy();

        return res.status(200).json({ message: 'Admin sucessfully deleted' });
    } catch (error) {
        res.status(500).json(generateServerErrorResponse(error));
    }
}

async function createUser(req, res) {
    try {
        req.body.password = await bcrypt.hash(req.body.password, 10);

        const user = await User.create(req.body);

        return res.status(201).json(user);
    } catch (error) {
        res.status(500).json(generateServerErrorResponse(error));
    }
}

async function createAdministrator(req, res) {
    try {
        req.body.password = await bcrypt.hash(req.body.password, 10);

        const admin = await User.create(req.body);

        return res.status(201).json(admin);
    } catch (error) {
        res.status(500).json(generateServerErrorResponse(error));
    }
}


module.exports = { getUsers, getAdministrators, updateUser, updateAdministrator, deleteUser, deleteAdministrator, createUser, createAdministrator };

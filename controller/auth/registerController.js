import Joi from 'joi';
import { RefreshToken, User } from '../../models';
import CustomErrorHandler from '../../services/CustomErrorHandler';
import bcrypt from 'bcrypt';
import JwtService from '../../services/JwtService';
import { REFRESH_SECRET } from '../../config';

const registerController = {
    async register(req,res,next){
        //logic for register

        // validation 
        const registerSchema  = Joi.object({
            name:Joi.string().min(3).max(30).required(),
            email: Joi.string().email().required(),
            password:Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
            repeat_password: Joi.ref('password')
        });
        
        const {error} = registerSchema.validate(req.body);

        if(error){
            return next(error)
        }

        //check if user is in the database already
        try {
            const existEmail = await User.exists({email:req.body.email})
            if(existEmail){
                return next(CustomErrorHandler.alreadyEmailExist('This email is already exists'));
            }
        } catch (err) {
            return next(err);
        }
        
        // hashed password
        const{name,email,password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = new User({name,email,password:hashedPassword});
        let access_token;
        let refresh_token;
        try {
            const result = await user.save();
            // token
            access_token = JwtService.sign({_id:result._id,role:result.role});
            refresh_token = JwtService.sign({_id:result._id,role:result.role},'1y',REFRESH_SECRET);

            //reresh token stroe in db

            await RefreshToken.create({token:refresh_token});
        } catch (error) {
            return next(error);
        }
        res.json({access_token,refresh_token});
    }
};

export default registerController;
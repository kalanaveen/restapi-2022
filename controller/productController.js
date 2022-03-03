import Joi from 'joi';
import multer from 'multer';
import { Product } from '../models';
import CustomErrorHandler from '../services/CustomErrorHandler';
import path from 'path';
import fs from 'fs';
import productSchema from '../validators/productValidator';

//set destination and unique filename for image 
const storage = multer.diskStorage({
    destination:(req,file,cb)=>cb(null,'uploads/'),
    filename:(req,file,cb)=>{
        const uniqueName = `${Date.now()}-${Math.round(
            Math.random() * 1e9
        )}${path.extname(file.originalname)}`;
        cb(null,uniqueName);
    },
});

//upload 5mb data
const handleMultipartData = multer({
    storage,
    limits:{fileSize:1000000 * 5},
}).single('image');

const productController = {
    //upload product
    async store(req,res,next){
        // multpart form data 
        handleMultipartData(req,res,async(err)=>{
            if(err){
                return next(CustomErrorHandler.serverError(err.message));
            }
            const filePath = req.file.path;

            //validation
            const { error } = productSchema.validate(req.body);
            if (error) {
                //delete uploade file if error
                fs.unlink(`${appRoot}/${filePath}`,(err)=>{
                   if(err){
                       return next(CustomErrorHandler.serverError(err.message))
                   };
                });
                return next(error);
            }
            const {name,price,size} = req.body;
            let document;
            try {
                document = await Product.create({
                    name,
                    price,
                    size,
                    image:filePath,
                });
            } catch (err) {
                return next(err);
            }
            res.status(201).json(document);
        });
    },
    // update product 
    update(req,res,next){
        handleMultipartData(req,res,async(err)=>{
            if(err){
                return next(CustomErrorHandler.serverError(err.message));
            }
            let filePath;
            if(req.file){
                filePath = req.file.path;
            }
            // validation
            const { error } = productSchema.validate(req.body);
            if(error){
                // Delete the uploaded file
                if(req.file){
                    fs.unlink(`${appRoot}/${filePath}`,(err)=>{
                        if(err){
                            return next(CustomErrorHandler.serverError(err.message));
                        }
                    });
                }
                return next(error);
            }
            const {name,price,size} = req.body;
            let document;
            try {
                document = await Product.findByIdAndUpdate({_id: req.params.id},{name,price,size,...(req.file && { image: filePath }),},{ new: true })
            } catch (error) {
                return next(error);
            }
            res.status(201).json(document);
        });
    },
    // delete product 
    async destroy(req,res,next){
        const document = await Product.findOneAndRemove({ _id: req.params.id });
        if (!document) {
            return next(new Error('Nothing to delete'));
        }
        // image delete
        const imagePath = document._doc.image;
        // http://localhost:5000/uploads/1616444052539-425006577.png
        fs.unlink(`${appRoot}/${imagePath}`,(err)=>{
            if (err) {
                return next(CustomErrorHandler.serverError());
            }
            return res.json(document);
        });
    },
    async index(req,res,next){
        let documents;
        try {
            documents = await Product.find().select('-updatedAt -__v').sort({ _id: -1 });
        } catch (error) {
            return next(CustomErrorHandler.serverError());
        }
        return res.json(documents);
    },
    async show(req,res,next){
        let document;
        try {
            document = await Product.findOne({ _id: req.params.id }).select('-updatedAt -__v');
        } catch (error) {
            return next(CustomErrorHandler.serverError());
        }
        return res.json(document);
    },
    async getProducts(req, res, next){
        let documents;
        try {
            documents = await Product.find({
                _id: { $in: req.body.ids },
            }).select('-updatedAt -__v');
        } catch (error) {
            return next(CustomErrorHandler.serverError());
        }
        return res.json(documents);
    },
};

export default productController;
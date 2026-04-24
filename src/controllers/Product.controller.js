const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const Product = require("../models/ProductSchema");
const { ResponseCodes } = require("../utils/constant");

module.exports = {
  addProduct: async (req, res) => {
    console.log("Add Product API.....");
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(ResponseCodes.BAD_REQUEST).json({
          status: ResponseCodes.BAD_REQUEST,
          data: {},
          errors: validationErrors.array(),
          message: "Validation failed",
        });
      }

      const { title, description } = req.body;

      const existingProduct = await Product.findOne({
        where: {
          title,
        },
        raw:true
      });

      if (existingProduct) {
        return res.status(ResponseCodes.CONFLICT).json({
          status: ResponseCodes.CONFLICT,
          data: {},
          error: "Product with same title already exists",
          message: "Product with same title already exists",
        });
      }

      const createdProduct = await Product.create({
        title,
        description,
        createdBy:req.user.id
      });

      return res.status(ResponseCodes.CREATED).json({
        status: ResponseCodes.CREATED,
        data: createdProduct,
        message: "Product added successfully",
      });
    } catch (error) {
      console.error("Error in Add Product:", error);
      return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseCodes.INTERNAL_SERVER_ERROR,
        data: {},
        error: error.message,
        message: "Server error",
      });
    }
  },

  getProductList: async (req, res) => {
    console.log("Get Product List API.....");
    try {
      let { page, limit, search } = req.query;
    //   page = parseInt(page) || 1;
    //   limit = parseInt(limit) || 10;
    //   const skip = (page - 1) * limit;

      let query = {isActive : true};
    //   if (!["admin", "superadmin"].includes(req.user?.role)) {
    //     query.isActive = true;
    //   }

      if (search) {
        query = {
          ...query,
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } },
          ],
        };
      }

      const products = await Product.findAll({
        where: query,
        // offset: skip,
        // limit,
        order: [["createdAt", "DESC"]],
        raw: true,
      });

    //   const count = await Product.count({
    //     where: query,
    //   });

      return res.status(ResponseCodes.SUCCESS).json({
        status: ResponseCodes.SUCCESS,
        data: products,
        message: "Product list fetched successfully",
      });
    } catch (error) {
      console.error("Error in Get Product List:", error);
      return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseCodes.INTERNAL_SERVER_ERROR,
        data: {},
        error: error.message,
        message: "Server error",
      });
    }
  },

  getProductById: async (req, res) => {
    console.log("Get Product By Id API.....");
    try {
      const { id } = req.params;
      const extraCondition = ["admin", "superadmin"].includes(req.user?.role)
        ? {}
        : { isActive: true };

      const product = await Product.findOne({
        where: {
          id,
          ...extraCondition,
        },
      });

      if (!product) {
        return res.status(ResponseCodes.NOT_FOUND).json({
          status: ResponseCodes.NOT_FOUND,
          data: {},
          message: "Product not found",
        });
      }

      return res.status(ResponseCodes.SUCCESS).json({
        status: ResponseCodes.SUCCESS,
        data: product,
        message: "Product fetched successfully",
      });
    } catch (error) {
      console.error("Error in Get Product By Id:", error);
      return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseCodes.INTERNAL_SERVER_ERROR,
        data: {},
        error: error.message,
        message: "Server error",
      });
    }
  },

  getProductByTitle: async (req, res) => {
    console.log("Get Product By Title API.....");
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(ResponseCodes.BAD_REQUEST).json({
          status: ResponseCodes.BAD_REQUEST,
          data: {},
          errors: validationErrors.array(),
          message: "Validation failed",
        });
      }

      const { title } = req.params;
      const extraCondition = ["admin", "superadmin"].includes(req.user?.role)
        ? {}
        : { isActive: true };

      const product = await Product.findOne({
        where: {
          ...extraCondition,
          title: {
            [Op.like]: title,
          },
        },
      });

      if (!product) {
        return res.status(ResponseCodes.NOT_FOUND).json({
          status: ResponseCodes.NOT_FOUND,
          data: {},
          message: "Product not found",
        });
      }

      return res.status(ResponseCodes.SUCCESS).json({
        status: ResponseCodes.SUCCESS,
        data: product,
        message: "Product fetched successfully",
      });
    } catch (error) {
      console.error("Error in Get Product By Title:", error);
      return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseCodes.INTERNAL_SERVER_ERROR,
        data: {},
        error: error.message,
        message: "Server error",
      });
    }
  },

  updateProduct: async (req, res) => {
    console.log("Update Product API.....");
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(ResponseCodes.BAD_REQUEST).json({
          status: ResponseCodes.BAD_REQUEST,
          data: {},
          errors: validationErrors.array(),
          message: "Validation failed",
        });
      }

      const { id, title, description, isActive } = req.body;

      const checkProduct = await Product.findOne({
        where: { id },
      });

      if (!checkProduct) {
        return res.status(ResponseCodes.NOT_FOUND).json({
          status: ResponseCodes.NOT_FOUND,
          data: {},
          error: "Product not found, invalid product id",
          message: "Product not found",
        });
      }

      if (title) {
        const existingProduct = await Product.findOne({
          where: {
            title,
            id: { [Op.ne]: id },
          },
        });

        if (existingProduct) {
          return res.status(ResponseCodes.CONFLICT).json({
            status: ResponseCodes.CONFLICT,
            data: {},
            error: "Product with same title already exists",
            message: "Product with same title already exists",
          });
        }
      }

      const updateData = {
        ...(title && { title }),
        ...(description && { description }),
        ...(isActive !== undefined && { isActive }),
        updatedBy:req.user.id
      };

      await Product.update(updateData, {
        where: { id },
      });

      const updatedProduct = await Product.findOne({
        where: { id },
        raw: true,
      });

      return res.status(ResponseCodes.SUCCESS).json({
        status: ResponseCodes.SUCCESS,
        data: updatedProduct,
        message: "Product updated successfully",
      });
    } catch (error) {
      console.error("Error in Update Product:", error);
      return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseCodes.INTERNAL_SERVER_ERROR,
        data: {},
        error: error.message,
        message: "Server error",
      });
    }
  },

  deleteProduct: async (req, res) => {
    console.log("Delete Product API.....");
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(ResponseCodes.BAD_REQUEST).json({
          status: ResponseCodes.BAD_REQUEST,
          data: {},
          errors: validationErrors.array(),
          message: "Validation failed",
        });
      }

      const { id } = req.body;

      const checkProduct = await Product.findOne({
        where: { id },
        raw: true,
      });

      if (!checkProduct) {
        return res.status(ResponseCodes.NOT_FOUND).json({
          status: ResponseCodes.NOT_FOUND,
          data: {},
          error: { message: "Product not found. Check id" },
          message: "Product not found",
        });
      }

      const deletedProduct = await Product.destroy({
        where: { id },
      });

      return res.status(ResponseCodes.SUCCESS).json({
        status: ResponseCodes.SUCCESS,
        data: deletedProduct,
        error: {},
        message: "Product deleted successfully.",
      });
    } catch (error) {
      console.error("Error in Delete Product:", error);
      return res.status(ResponseCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseCodes.INTERNAL_SERVER_ERROR,
        data: {},
        error: error.message,
        message: "Server error",
      });
    }
  },
  
};

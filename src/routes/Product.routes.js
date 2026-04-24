const router = require("express").Router();
const { body, param } = require("express-validator");
const ProductController = require("../controllers/Product.controller");
const auth = require("../middleware/auth");
const { authorize } = require("../middleware/roleMiddleware");

const addProductValidation = [
  body("title").trim().notEmpty().isString().withMessage("Product title is required"),
  body("description")
    .trim()
    .notEmpty()
    .isString()
    .withMessage("Product description is required"),
];

const updateProductValidation = [
  body("id").trim().notEmpty().withMessage("Product ID is required"),
  body("title").optional({ checkFalsy: true }).trim().isString().withMessage("Invalid product title"),
  body("description")
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .withMessage("Invalid product description"),
  body("isActive").optional().isBoolean().withMessage("Invalid product isActive value"),
];

const deleteProductValidation = [
  body("id").trim().notEmpty().withMessage("Product ID is required"),
];

const getProductByTitleValidation = [
  param("title")
    .trim()
    .notEmpty()
    .isString()
    .withMessage("Product title is required"),
];

router.post(
  "/add",
  auth,
  authorize("admin", "superadmin"),
  addProductValidation,
  ProductController.addProduct
);

router.get(
  "/list",
  // auth,
  // authorize("admin", "user", "superadmin"),
  ProductController.getProductList
);

router.get(
  "/getby/:id",
  auth,
  authorize("admin", "user", "superadmin"),
  ProductController.getProductById
);

router.get(
  "/getby-title/:title",
  auth,
  authorize("admin", "user", "superadmin"),
  getProductByTitleValidation,
  ProductController.getProductByTitle
);

router.put(
  "/update",
  auth,
  authorize("admin", "superadmin"),
  updateProductValidation,
  ProductController.updateProduct
);

router.post(
  "/delete",
  auth,
  authorize("admin", "superadmin"),
  deleteProductValidation,
  ProductController.deleteProduct
);

module.exports = router;

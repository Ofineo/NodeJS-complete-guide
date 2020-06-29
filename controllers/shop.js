const fs = require("fs");
const path = require("path");
const rootPath = require("../util/path");
const PDFDocument = require("pdfkit");

const Product = require("../models/product");
const Order = require("../models/order");
const product = require("../models/product");

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All products",
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/index",
        hasProducts: products.length > 0,
        activeShop: true,
        productCSS: true,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: user.cart.items,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;

  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        pageTitle: product.title,
        path: "/products",
        product: product,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        pageTitle: "Your Orders",
        path: "shop/orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postdeleteCartItem = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      console.log("ITEM DELETED FROM THE CART");
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then((result) => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// exports.getInvoice = (req, res, next) => {
//   const orderId = req.params.orderId;
//   Order.findById(orderId)
//     .then((order) => {
//       if (!order) return next(new Error("No order found"));
//       if (order.user.userId.toString() !== req.user._id.toString()) {
//         return next(new Error("Unauthorized"));
//       }

//       const invoiceName = `invoice-${orderId}.pdf`;
//       const invoicePath = path.join(rootPath, "data", "invoices", invoiceName);

//       const pdfDoc = new PDFDocument();

//       res.setHeader("Content-Type", "application/pdf");
//       res.setHeader(
//         "Content-Disposition",
//         "inline; filename='" + invoiceName + "'"
//       );

//       pdfDoc.pipe(fs.createWriteStream(invoicePath));
//       pdfDoc.pipe(res);

//       pdfDoc.fontSize(26).text("Invoice", { underline: true });
//       pdfDoc.text("------------------------------");

//       let totalPrice = 0;
//       order.products.forEach((product) => {
//         totalPrice += product.product.price * product.quantity;
//         pdfDoc
//           .fontSize(12)
//           .text(
//             product.product.title +
//               " - " +
//               product.quantity +
//               " x " +
//               "£" +
//               product.price
//           );

//       });
//       pdfDoc.fontSize(26).text(`Total Price: £ ${totalPrice}`);

//       pdfDoc.end();

//       //   fs.readFile(
//       //     path.join(rootPath, "data", "invoices", invoiceName),
//       //     (err, data) => {
//       //       if (err) return next(err);
//       //       res.setHeader("Content-Type", "application/pdf");
//       //       res.setHeader(
//       //         "Content-Disposition",
//       //         "inline; filename='" + invoiceName + "'"
//       //       );
//       //       res.send(data);
//       //     }
//       //   );

//       //send file in a stream of data instead of prealoading it in the memory
//       // const file = fs.createReadStream(
//       //   invoicePath      );
//       // res.setHeader("Content-Type", "application/pdf");
//       // res.setHeader(
//       //   "Content-Disposition",
//       //   "inline; filename='" + invoiceName + "'"
//       // );
//       // file.pipe(res);
//     })
//     .catch((err) => {
//       const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);
//     });
// };

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) return next(new Error("No order found"));
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }

      const invoiceName = `invoice-${orderId}.pdf`;
      const invoicePath = path.join(rootPath, "data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "inline; filename='" + invoiceName + "'"
      );

      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("Invoice", { underline: true });
      pdfDoc.text("------------------------------");

      let totalPrice = 0;

      order.products.forEach((product) => {
        totalPrice += product.product.price * product.quantity;
        pdfDoc
          .fontSize(12)
          .text(
            product.product.title +
              " - " +
              product.quantity +
              " x " +
              "£" +
              product.product.price
          );
      });
      pdfDoc.fontSize(26).text(`Total Price: £ ${totalPrice}`);

      pdfDoc.end();

      //   fs.readFile(
      //     path.join(rootPath, "data", "invoices", invoiceName),
      //     (err, data) => {
      //       if (err) return next(err);
      //       res.setHeader("Content-Type", "application/pdf");
      //       res.setHeader(
      //         "Content-Disposition",
      //         "inline; filename='" + invoiceName + "'"
      //       );
      //       res.send(data);
      //     }
      //   );

      //send file in a stream of data instead of prealoading it in the memory
      // const file = fs.createReadStream(
      //   invoicePath      );
      // res.setHeader("Content-Type", "application/pdf");
      // res.setHeader(
      //   "Content-Disposition",
      //   "inline; filename='" + invoiceName + "'"
      // );
      // file.pipe(res);
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

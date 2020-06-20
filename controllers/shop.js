const Product = require("../models/product");
const Cart = require("../models/cart");
const e = require("express");

exports.getProducts = (req, res, next) => {
  Product.fetchAll().then(([rows, fetchData]) => {
    res.render("shop/product-list", {
      prods: rows,
      pageTitle: "All products",
      path: "/products",
    });
  });
};

exports.getIndex = (req, res, next) => {
  Product.fetchAll().then(([rows, fieldData]) => {
    res.render("shop/index", {
      prods: rows,
      pageTitle: "Shop",
      path: "/index",
      hasProducts: rows.length > 0,
      activeShop: true,
      productCSS: true,
    });
  });
};

exports.getCart = (req, res, next) => {
  Cart.getCart((cart) => {
    Product.fetchAll((products) => {
      const cartProducts = [];
      for (product of products) {
        const cartProductData = cart.products.find(
          (prod) => prod.id === product.id
        );
        if (cartProductData) {
          cartProducts.push({ productData: product, qty: cartProductData.qty });
        }
      }
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: cartProducts,
      });
    });
  });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId, (product) => {
    Cart.addProduct(prodId, product.price);
  });
  res.redirect("/cart");
};

exports.getCheckout = (req, res, next) => {
  res.render("shop/checkout", {
    pageTitle: "Checkout",
    path: "/checkout",
  });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(([product, fieldData]) => {
      res.render("shop/product-detail", {
        pageTitle: product[0].title,
        path: "/products",
        product: product[0],
      });
    })
    .catch((err) => console.log(err));
};

exports.getOrders = (req, res, next) => {
  res.render("shop/orders", {
    pageTitle: "Your Orders",
    path: "shop/orders",
  });
};

exports.postdeleteCartItem = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId, (product) => {
    Cart.deleteFromCart(prodId, product.price);
    res.redirect("/cart");
  });
};

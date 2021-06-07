const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const bookSchema = new Schema({
  author: ObjectId,
  bookTitle: { type: String, required: true, unique: true },
  bookPrice: { type: Number },
  totalBooksAmount: { type: String },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const bookModel = mongoose.model("Book", bookSchema);
module.exports = bookModel;

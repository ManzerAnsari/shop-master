
import mongoose from 'mongoose'
const saleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // ISO Date String YYYY-MM-DD
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    unitPrice: { type: Number, required: true }, // Selling price at time of sale
    purchasePrice: { type: Number, required: true }, // For profit calc
    profit: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  totalProfit: { type: Number, required: true }
}, { timestamps: true })

export default mongoose.model('Sale', saleSchema)
